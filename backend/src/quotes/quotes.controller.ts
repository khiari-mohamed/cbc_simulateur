import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post('generate')
  async generate(@Body() data: { simulationId: string; companyId: string }) {
    try {
      console.log('Generating quote for simulation:', data.simulationId, 'company:', data.companyId);
      const result = await this.quotesService.generate(data.simulationId, data.companyId);
      console.log('Quote generated successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error generating quote:', error.message);
      // Surface a clear error to client without swallowing details
      throw new BadRequestException(error.message || 'Erreur dans la génération de la prime');
    }
  }

  @Get()
  findMine(@Request() req: any) {
    // If gestionnaire or admin, return ALL quotes for dashboards and management
    if (req.user.role === Role.GESTIONNAIRE_VALIDATION_ARS || req.user.role === Role.ADMINISTRATEUR_ARS) {
      return this.quotesService.findAll();
    }
    // Otherwise return only the caller's quotes
    return this.quotesService.findByUser(req.user.id);
  }

  @Get('all/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  async getAllForStats() {
    // Return ALL quotes for dashboard stats calculation
    return this.quotesService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  findPending() {
    return this.quotesService.findPendingValidation();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const quote = await this.quotesService.findById(id);
    if (!quote || (quote.userId !== req.user.id && req.user.role !== Role.ADMINISTRATEUR_ARS && req.user.role !== Role.GESTIONNAIRE_VALIDATION_ARS)) {
      throw new Error('Quote not found or access denied');
    }
    return quote;
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req: any) {
    return this.quotesService.submit(id, req.user.id);
  }

  @Post(':id/validate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS)
  validate(@Param('id') id: string, @Request() req: any) {
    return this.quotesService.validate(id, req.user.id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS, Role.GESTIONNAIRE_VALIDATION_ARS)
  reject(@Param('id') id: string, @Body() data: { reason?: string }, @Request() req: any) {
    return this.quotesService.reject(id, data.reason, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    if (data.modificationNote) {
      return this.quotesService.updateWithNote(id, data, data.modificationNote, req.user.id);
    }
    return this.quotesService.update(id, data, req.user.id);
  }

  @Post(':id/modify')
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  modifyQuote(
    @Param('id') id: string,
    @Body() data: { modifications: any; note: string },
    @Request() req: any,
  ) {
    return this.quotesService.modifyQuote(id, data.modifications, data.note, req.user.id);
  }

  @Get(':id/download')
  async downloadPdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const quote = await this.quotesService.findById(id);
    if (!quote || !quote.pdfPath) {
      throw new Error('PDF not available');
    }
    if (quote.userId !== req.user.id && req.user.role !== Role.ADMINISTRATEUR_ARS && req.user.role !== Role.GESTIONNAIRE_VALIDATION_ARS) {
      throw new Error('Access denied');
    }
    return res.download(quote.pdfPath);
  }
}
