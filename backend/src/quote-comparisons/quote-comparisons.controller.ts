import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { QuoteComparisonsService } from './quote-comparisons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quote-comparisons')
@UseGuards(JwtAuthGuard)
export class QuoteComparisonsController {
  constructor(private quoteComparisonsService: QuoteComparisonsService) {}

  @Post()
  create(@Request() req: any, @Body() data: { quoteIds: string[] }) {
    return this.quoteComparisonsService.create(req.user.id, data.quoteIds);
  }

  @Get()
  findMine(@Request() req: any) {
    return this.quoteComparisonsService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const comparison = await this.quoteComparisonsService.findById(id);
    if (comparison.userId !== req.user.id) {
      throw new Error('Access denied');
    }
    return comparison;
  }
}
