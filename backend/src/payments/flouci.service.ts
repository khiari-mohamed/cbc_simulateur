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
  webhook?: string;
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

  async createPaymentOrder(quoteId: string, deliveryType: string, userId: string, effectiveDate?: string) {
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
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        pricingSnapshot: {
          ...(quote.pricingSnapshot as any),
          paymentId: payment.id,
          deliveryType,
          deliveryFee,
          totalWithDelivery: totalAmount,
        },
      },
    });

    const backendUrl = this.config.get('BACKEND_URL');
    
    const flouciRequest: FlouciPaymentRequest = {
      app_token: this.flouciAppToken,
      app_secret: this.flouciAppSecret,
      amount: Math.round(totalAmount * 1000), // Flouci uses millimes (max 9999999)
      accept_card: 'true',
      session_timeout_secs: 1200,
      success_link: `${this.config.get('FRONTEND_URL')}/payment/success?paymentId=${payment.id}&quoteId=${quoteId}`,
      fail_link: `${this.config.get('FRONTEND_URL')}/payment/cancel?paymentId=${payment.id}&quoteId=${quoteId}`,
      developer_tracking_id: orderId,
    };

    // Only add webhook if BACKEND_URL is configured and not localhost
    if (backendUrl && !backendUrl.includes('localhost')) {
      flouciRequest.webhook = `${backendUrl}/payments/webhook`;
    }

    // Validate amount doesn't exceed Flouci limit
    if (flouciRequest.amount > 9999999) {
      throw new BadRequestException(`Le montant ${totalAmount} DT dépasse la limite de Flouci (9999.999 DT)`);
    }

    console.log('🔍 Attempting Flouci API call with payload:', JSON.stringify(flouciRequest, null, 2));

    try {
      const response = await this.axiosInstance.post<FlouciPaymentResponse>(
        '/generate_payment',
        flouciRequest,
      );

      console.log('✅ Flouci API Response:', JSON.stringify(response.data, null, 2));

      if (!response.data?.result?.link) {
        console.error('❌ Invalid Flouci response structure:', response.data);
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
      console.error('❌ Flouci API Error Details:');
      console.error('  - Status:', error.response?.status);
      console.error('  - Status Text:', error.response?.statusText);
      console.error('  - Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('  - Error Message:', error.message);
      console.error('  - Error Code:', error.code);
      console.error('  - Full Error:', error);
      
      await this.auditService.log(
        userId,
        'PAYMENT_FAILED',
        'Payment',
        payment.id,
        null,
        {
          quoteId,
          error: error.response?.data || error.message,
          errorCode: error.code,
          errorStatus: error.response?.status,
        },
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      // Return more detailed error message
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new InternalServerErrorException(
        `Failed to initialize payment with Flouci: ${errorMsg}`,
      );
    }
  }

  async handleWebhookCallback(payload: FlouciWebhookPayload) {
    console.log('🔔 Webhook received from Flouci:', JSON.stringify(payload, null, 2));

    if (!payload.developer_tracking_id || !payload.payment_id) {
      console.error('❌ Invalid webhook payload - missing required fields');
      throw new BadRequestException('Invalid webhook payload');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: payload.developer_tracking_id },
    });

    if (!payment) {
      console.error('❌ Payment not found for order:', payload.developer_tracking_id);
      return { status: 'not_found' };
    }

    console.log('📦 Found payment:', payment.id, '- Current status:', payment.status);

    if (payload.status === 'SUCCESS' || payload.status === 'success') {
      console.log('✅ Payment successful - updating status to PAID');
      
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
        include: { user: true, company: true, simulation: true },
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

        // Reject all other quotes from the same simulation
        if (quote.simulationId) {
          await this.prisma.quote.updateMany({
            where: {
              simulationId: quote.simulationId,
              id: { not: quote.id },
              status: { in: ['GENERATED', 'SUBMITTED', 'VALIDATED'] },
            },
            data: {
              status: 'REJECTED',
              rejectionReason: 'Un autre devis de cette simulation a été transformé en contrat.',
            },
          });
        }

        await this.notificationsService.notifyContractCreated(
          quote.user.email,
          contractNumber,
        ).catch(err => console.error('Failed to send contract email:', err));

        console.log('🎉 Contract created successfully:', contractNumber);
      }

      return { status: 'success', paymentId: payment.id };
    } else {
      console.log('❌ Payment failed or cancelled - updating status to FAILED');
      
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

  async verifyPaymentWithFlouci(flouciPaymentId: string): Promise<{ verified: boolean; status?: string; data?: any }> {
    if (!this.flouciAppToken) {
      throw new BadRequestException('Payment gateway not configured');
    }

    console.log('🔍 Verifying payment with Flouci API:', flouciPaymentId);

    try {
      const response = await this.axiosInstance.get(`/verify_payment/${flouciPaymentId}`, {
        params: {
          app_token: this.flouciAppToken,
        },
        headers: {
          'apppublic': this.flouciAppToken,
          'appsecret': this.flouciAppSecret,
        },
      });

      console.log('✅ Flouci verification response:', JSON.stringify(response.data, null, 2));

      const status = response.data?.result?.status;
      const isSuccess = status === 'SUCCESS' || status === 'success';

      return {
        verified: isSuccess,
        status: status,
        data: response.data,
      };
    } catch (error: any) {
      console.error('❌ Failed to verify payment with Flouci:', error.message);
      console.error('Error details:', error.response?.data);
      return {
        verified: false,
        status: 'ERROR',
        data: error.response?.data,
      };
    }
  }

  async getPaymentsByQuote(quoteId: string) {
    return this.prisma.payment.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
