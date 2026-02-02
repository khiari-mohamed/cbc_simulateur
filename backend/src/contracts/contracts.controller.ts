import { Controller, Get, Post, Body, UseGuards, Request, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, DeliveryType } from '@prisma/client';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  create(@Body() data: { quoteId: string; deliveryType?: DeliveryType }, @Request() req: any) {
    return this.contractsService.createFromQuote(data.quoteId, req.user.id, data.deliveryType);
  }

  @Post('manual/:quoteId')
  @UseGuards(RolesGuard)
  @Roles(Role.GESTIONNAIRE_VALIDATION_ARS, Role.ADMINISTRATEUR_ARS)
  createManually(
    @Param('quoteId') quoteId: string,
    @Body() data: { deliveryType?: DeliveryType },
    @Request() req: any,
  ) {
    return this.contractsService.createManualContract(quoteId, req.user.id, data.deliveryType);
  }

  @Get()
  findMine(@Request() req: any) {
    return this.contractsService.findByUser(req.user.id);
  }

  @Get(':contractNumber')
  async findByContractNumber(@Param('contractNumber') contractNumber: string) {
    return this.contractsService.findByContractNumber(contractNumber);
  }

  @Get(':id/download')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const contract = await this.contractsService.findById(id);
    if (!contract || !contract.pdfPath) {
      throw new Error('PDF not available');
    }
    return res.download(contract.pdfPath);
  }
}
