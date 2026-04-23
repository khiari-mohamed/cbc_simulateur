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
import { FlouciService } from './flouci.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private flouciService: FlouciService) {}

  @Post('init')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initializePayment(
    @Body() data: { quoteId: string; deliveryType: string; effectiveDate?: string },
    @Request() req: any,
  ) {
    return this.flouciService.createPaymentOrder(
      data.quoteId,
      data.deliveryType,
      req.user.id,
      data.effectiveDate,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    return this.flouciService.handleWebhookCallback(payload);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('id') id: string) {
    return this.flouciService.getPaymentStatus(id);
  }

  @Post(':id/verify-with-flouci')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPaymentWithFlouci(
    @Param('id') paymentId: string,
    @Body() body: { flouciPaymentId?: string },
    @Request() req: any,
  ) {
    console.log('🔍 Manual verification requested for payment:', paymentId);
    console.log('   Flouci Payment ID from body:', body.flouciPaymentId);

    // Get payment from DB
    const payment = await this.flouciService.getPaymentStatus(paymentId);
    
    if (!payment) {
      console.error('❌ Payment not found:', paymentId);
      return { 
        verified: false, 
        error: 'Payment not found' 
      };
    }

    // Use Flouci payment ID from body or from payment reference
    const flouciPaymentId = body.flouciPaymentId || payment.reference;
    
    if (!flouciPaymentId) {
      console.error('❌ No Flouci payment ID available');
      return { 
        verified: false, 
        error: 'No Flouci payment ID available' 
      };
    }

    console.log('   Verifying with Flouci payment ID:', flouciPaymentId);

    // Verify with Flouci API
    const verification = await this.flouciService.verifyPaymentWithFlouci(flouciPaymentId);
    
    console.log('   Verification result:', verification);

    // If verified as successful but our DB shows pending, update it via webhook
    if (verification.verified && payment.status === 'PENDING') {
      console.log('   Payment verified! Triggering webhook to update status...');
      
      // Find the order ID from payment
      if (payment.quote) {
        const orderPayment = await this.flouciService.getPaymentsByQuote(payment.quote.id);
        const targetPayment = orderPayment.find(p => p.id === paymentId);
        
        if (targetPayment) {
          await this.flouciService.handleWebhookCallback({
            payment_id: flouciPaymentId,
            developer_tracking_id: targetPayment.orderId,
            amount: Number(payment.amount) * 1000,
            status: 'SUCCESS',
          });
        }
      }
    }

    return verification;
  }

  @Get(':paymentId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Param('paymentId') paymentId: string) {
    const isVerified = await this.flouciService.verifyPaymentWithFlouci(paymentId);
    return { verified: isVerified };
  }

  @Get('quote/:quoteId')
  @UseGuards(JwtAuthGuard)
  async getPaymentsByQuote(@Param('quoteId') quoteId: string) {
    return this.flouciService.getPaymentsByQuote(quoteId);
  }
}
