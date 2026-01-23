import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import axios, { AxiosInstance } from 'axios';

interface FlouciPaymentRequest {
  app_token: string;
  app_secret: string;
  amount: number;
  accept_card: string;
  session_timeout_secs: number;
  success_link: string;
  fail_link: string;
  developer_tracking_id: string;
}

interface FlouciPaymentResponse {
  result: {
    link: string;
    payment_id: string;
  };
}

interface FlouciWebhookPayload {
  payment_id: string;
  developer_tracking_id: string;
  amount: number;
  status: string;
}

@Injectable()
export class FlouciService {
  private axiosInstance: AxiosInstance;
  private readonly flouciUrl: string;
  private readonly flouciAppToken: string;
  private readonly flouciAppSecret: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {
    this.flouciUrl = this.config.get<string>('FLOUCI_URL') || 'https://developers.flouci.com/api';
    this.flouciAppToken = this.config.get<string>('FLOUCI_APP_TOKEN') || '';
    this.flouciAppSecret = this.config.get<string>('FLOUCI_APP_SECRET') || '';

    if (!this.flouciAppToken || !this.flouciAppSecret) {
      console.warn('⚠️ FLOUCI credentials not configured. Payment functionality disabled.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.flouciUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createPaymentOrder(quoteId: string, deliveryType: string, userId: string) {
    if (!this.flouciAppToken || !this.flouciAppSecret) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: true,
        simulation: true,
        company: true,
        items: { include: { guarantee: true } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.userId !== userId) {
      throw new BadRequestException('Unauthorized to create payment for this quote');
    }

    if (quote.status !== 'VALIDATED') {
      throw new BadRequestException('Quote must be validated before payment');
    }

    const deliveryFee = deliveryType === 'HOME_DELIVERY' ? 10 : 0;
    const totalAmount = Number(quote.totalAPayer) + deliveryFee;
    const orderId = `ARS-${quote.quoteNumber}-${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        quoteId,
        orderId,
        amount: new (require('@prisma/client').Decimal)(totalAmount),
        method: 'FLOUCI',
        status: 'PENDING',
      },
    });

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        pricingSnapshot: {
          ...(quote.pricingSnapshot as any),
          paymentId: payment.id,
          deliveryType,
          deliveryFee,
          totalWithDelivery: totalAmount,
        },
      },
    });

    const flouciRequest: FlouciPaymentRequest = {
      app_token: this.flouciAppToken,
      app_secret: this.flouciAppSecret,
      amount: Math.round(totalAmount * 1000), // Flouci uses millimes
      accept_card: 'true',
      session_timeout_secs: 1200,
      success_link: `${this.config.get('FRONTEND_URL')}/payment/success?paymentId=${payment.id}&quoteId=${quoteId}`,
      fail_link: `${this.config.get('FRONTEND_URL')}/payment/cancel?paymentId=${payment.id}&quoteId=${quoteId}`,
      developer_tracking_id: orderId,
    };

    try {
      const response = await this.axiosInstance.post<FlouciPaymentResponse>(
        '/generate_payment',
        flouciRequest,
      );

      if (!response.data?.result?.link) {
        throw new InternalServerErrorException('Invalid Flouci API response');
      }

      await this.auditService.log(
        userId,
        'PAYMENT_INITIATED',
        'Payment',
        payment.id,
        null,
        {
          quoteId,
          amount: totalAmount,
          deliveryType,
          flouciPaymentId: response.data.result.payment_id,
        },
      );

      return {
        paymentId: payment.id,
        quoteId,
        amount: totalAmount,
        flouciPaymentId: response.data.result.payment_id,
        flouciUrl: response.data.result.link,
        orderId,
      };
    } catch (error: any) {
      await this.auditService.log(
        userId,
        'PAYMENT_FAILED',
        'Payment',
        payment.id,
        null,
        {
          quoteId,
          error: error.response?.data || error.message,
        },
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      throw new InternalServerErrorException(
        `Failed to initialize payment with Flouci: ${error.message}`,
      );
    }
  }

  async handleWebhookCallback(payload: FlouciWebhookPayload) {
    if (!payload.developer_tracking_id || !payload.payment_id) {
      throw new BadRequestException('Invalid webhook payload');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: payload.developer_tracking_id },
    });

    if (!payment) {
      console.error('❌ Payment not found for order:', payload.developer_tracking_id);
      return { status: 'not_found' };
    }

    if (payload.status === 'SUCCESS') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          reference: payload.payment_id,
          paidAt: new Date(),
        },
      });

      const quote = await this.prisma.quote.findUnique({
        where: { id: payment.quoteId },
        include: { user: true, company: true },
      });

      if (quote) {
        const contractNumber = `C${new Date().getFullYear()}${String(
          await this.prisma.contract.count() + 1,
        ).padStart(6, '0')}`;

        const pricingSnapshot = quote.pricingSnapshot as any;
        const deliveryType = pricingSnapshot?.deliveryType || 'AGENCY_PICKUP';
        const deliveryFee = pricingSnapshot?.deliveryFee || 0;

        await this.prisma.contract.create({
          data: {
            contractNumber,
            quoteId: quote.id,
            userId: quote.userId,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            deliveryType,
            deliveryFee: new (require('@prisma/client').Decimal)(deliveryFee),
            createdById: quote.userId,
          },
        });

        await this.prisma.quote.update({
          where: { id: quote.id },
          data: { status: 'TRANSFORMED_TO_CONTRACT' },
        });

        await this.notificationsService.notifyContractCreated(
          quote.user.email,
          contractNumber,
        ).catch(err => console.error('Failed to send contract email:', err));
      }

      return { status: 'success', paymentId: payment.id };
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return { status: 'failed', paymentId: payment.id };
    }
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: payment.quoteId },
      include: { company: true, user: true, contract: true },
    });

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      reference: payment.reference,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      quote,
      contract: quote?.contract,
    };
  }

  async verifyPaymentWithFlouci(paymentId: string): Promise<boolean> {
    if (!this.flouciAppToken) {
      throw new BadRequestException('Payment gateway not configured');
    }

    try {
      const response = await this.axiosInstance.get(`/verify_payment/${paymentId}`, {
        params: {
          app_token: this.flouciAppToken,
        },
      });

      return response.data?.result?.status === 'SUCCESS';
    } catch (error: any) {
      console.error('Failed to verify payment with Flouci:', error.message);
      return false;
    }
  }
}
