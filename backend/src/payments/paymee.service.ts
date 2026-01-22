import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface PaymeePaymentRequest {
  amount: number;
  order_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  description: string;
  return_url: string;
  reject_url: string;
  api_token: string;
}

interface PaymeeWebhookPayload {
  amount: number;
  transaction_id: string;
  order_id: string;
  status: string;
  token?: string;
  amount_millimes?: number;
}

@Injectable()
export class PaymeeService {
  private axiosInstance: AxiosInstance;
  private readonly paymeeUrl: string;
  private readonly paymeeApiToken: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {
    this.paymeeUrl = this.config.get<string>('PAYMEE_URL') || 'https://api.paymee.tn/api';
    this.paymeeApiToken = this.config.get<string>('PAYMEE_API_TOKEN') || '';

    if (!this.paymeeApiToken) {
      console.warn('⚠️ PAYMEE_API_TOKEN not configured. Payment functionality disabled.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.paymeeUrl,
      timeout: 10000,
    });
  }

  /**
   * Create a payment order in Paymee
   * @param quoteId Quote ID to create payment for
   * @param deliveryType Home delivery or agency pickup
   * @param userId User ID creating the payment
   * @returns Payment initialization response with Paymee redirect URL
   */
  async createPaymentOrder(quoteId: string, deliveryType: string, userId: string) {
    if (!this.paymeeApiToken) {
      throw new BadRequestException('Payment gateway not configured');
    }

    // Fetch quote with all required data
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

    // Calculate total with delivery fee
    const deliveryFee = deliveryType === 'HOME_DELIVERY' ? 10 : 0;
    const totalAmount = Number(quote.totalAPayer) + deliveryFee;

    // Generate unique order ID
    const orderId = `Q-${quote.quoteNumber}-${Date.now()}`;

    // Create payment record in database
    const payment = await this.prisma.payment.create({
      data: {
        contractId: '', // Will be updated after quote validation
        amount: new (require('@prisma/client').Decimal)(totalAmount),
        method: 'PAYMEE',
        status: 'PENDING',
      },
    });

    // Store payment metadata for later retrieval
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

    // Prepare Paymee payment request
    const paymeeRequest: PaymeePaymentRequest = {
      amount: Math.round(totalAmount * 1000), // Paymee uses millimes
      order_id: orderId,
      first_name: quote.user.firstName,
      last_name: quote.user.lastName,
      email: quote.user.email,
      phone: quote.user.phone || '',
      description: `Devis d'assurance automobile - ${quote.quoteNumber} - ${quote.company.name}`,
      return_url: `${this.config.get('FRONTEND_URL')}/payment/success?paymentId=${payment.id}&quoteId=${quoteId}`,
      reject_url: `${this.config.get('FRONTEND_URL')}/payment/cancel?paymentId=${payment.id}&quoteId=${quoteId}`,
      api_token: this.paymeeApiToken,
    };

    try {
      // Call Paymee API to initialize payment
      const response = await this.axiosInstance.post('/checkout/create-order', paymeeRequest);

      if (!response.data || !response.data.token) {
        throw new InternalServerErrorException('Invalid Paymee API response');
      }

      // Log payment initiation
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
          paymeeOrderId: response.data.order_id,
        },
      );

      return {
        paymentId: payment.id,
        quoteId,
        amount: totalAmount,
        paymeeToken: response.data.token,
        paymeeUrl: `https://app.paymee.tn/?token=${response.data.token}`,
        orderId,
      };
    } catch (error: any) {
      // Log payment error
      await this.auditService.log(
        userId,
        'PAYMENT_FAILED',
        'Payment',
        payment.id,
        null,
        {
          quoteId,
          error: error.message,
        },
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      throw new InternalServerErrorException(
        `Failed to initialize payment with Paymee: ${error.message}`,
      );
    }
  }

  /**
   * Handle Paymee webhook callback for successful payment
   * Creates contract and sends confirmation email
   */
  async handleWebhookCallback(payload: PaymeeWebhookPayload) {
    if (!payload.order_id || !payload.transaction_id) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // Find payment by order reference
    const payment = await this.prisma.payment.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    });

    if (!payment) {
      console.error('❌ Payment record not found for webhook:', payload.order_id);
      return { status: 'not_found' };
    }

    // Handle different payment statuses
    if (payload.status === 'completed' || payload.status === 'success') {
      // Payment successful
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          reference: payload.transaction_id,
          paidAt: new Date(),
        },
        include: { contract: { include: { quote: true, user: true } } },
      });

      // Activate contract if it exists
      if (updatedPayment.contractId) {
        await this.prisma.contract.update({
          where: { id: updatedPayment.contractId },
          data: { status: 'ACTIVE' },
        });

        // Send payment confirmation email
        const contract = updatedPayment.contract;
        if (contract && contract.user) {
          await this.notificationsService.notifyPaymentConfirmed(
            contract.user.email,
            contract.contractNumber,
            Number(updatedPayment.amount),
          ).catch(err => console.error('Failed to send payment confirmation email:', err));
        }
      }

      return { status: 'success', paymentId: payment.id };
    } else {
      // Payment failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return { status: 'failed', paymentId: payment.id };
    }
  }

  /**
   * Get payment status and details
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            quote: { include: { company: true } },
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      reference: payment.reference,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      contract: payment.contract,
    };
  }

  /**
   * Check payment status with Paymee
   */
  async verifyPaymentWithPaymee(orderId: string): Promise<boolean> {
    if (!this.paymeeApiToken) {
      throw new BadRequestException('Payment gateway not configured');
    }

    try {
      const response = await this.axiosInstance.get(`/checkout/verify-order`, {
        params: {
          order_id: orderId,
          api_token: this.paymeeApiToken,
        },
      });

      return response.data?.status === 'completed' || response.data?.status === 'success';
    } catch (error: any) {
      console.error('Failed to verify payment with Paymee:', error.message);
      return false;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { contract: { include: { user: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PAID') {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    if (!payment.reference) {
      throw new BadRequestException('No transaction reference for refund');
    }

    try {
      // Call Paymee refund API
      await this.axiosInstance.post('/checkout/refund', {
        transaction_id: payment.reference,
        reason,
        api_token: this.paymeeApiToken,
      });

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });

      // Send refund notification
      if (payment.contract && payment.contract.user) {
        await this.notificationsService.notifyPaymentRefunded(
          payment.contract.user.email,
          payment.reference,
          Number(payment.amount),
          reason,
        ).catch(err => console.error('Failed to send refund email:', err));
      }

      return { status: 'refunded', paymentId };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to refund payment: ${error.message}`,
      );
    }
  }
}
