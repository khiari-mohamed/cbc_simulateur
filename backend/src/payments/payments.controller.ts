import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymeeService } from './paymee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymeeService: PaymeeService) {}

  /**
   * Initialize payment for a validated quote
   * POST /payments/init
   * Body: { quoteId: string, deliveryType: 'HOME_DELIVERY' | 'AGENCY_PICKUP' }
   */
  @Post('init')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initializePayment(
    @Body() data: { quoteId: string; deliveryType: string },
    @Request() req: any,
  ) {
    return this.paymeeService.createPaymentOrder(
      data.quoteId,
      data.deliveryType,
      req.user.id,
    );
  }

  /**
   * Webhook endpoint for Paymee callbacks
   * POST /payments/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    return this.paymeeService.handleWebhookCallback(payload);
  }

  /**
   * Get payment status
   * GET /payments/:id/status
   */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('id') id: string) {
    return this.paymeeService.getPaymentStatus(id);
  }

  /**
   * Verify payment with Paymee
   * GET /payments/:orderId/verify
   */
  @Get(':orderId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Param('orderId') orderId: string) {
    const isVerified = await this.paymeeService.verifyPaymentWithPaymee(orderId);
    return { verified: isVerified };
  }

  /**
   * Refund a payment
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() data: { reason: string },
    @Request() req: any,
  ) {
    return this.paymeeService.refundPayment(paymentId, data.reason);
  }
}
