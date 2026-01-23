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
    @Body() data: { quoteId: string; deliveryType: string },
    @Request() req: any,
  ) {
    return this.flouciService.createPaymentOrder(
      data.quoteId,
      data.deliveryType,
      req.user.id,
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

  @Get(':paymentId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Param('paymentId') paymentId: string) {
    const isVerified = await this.flouciService.verifyPaymentWithFlouci(paymentId);
    return { verified: isVerified };
  }
}
