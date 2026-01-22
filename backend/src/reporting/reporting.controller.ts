import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATEUR_ARS)
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('statistics')
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportingService.getStatistics(start, end);
  }

  @Get('revenue')
  getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportingService.getRevenueReport(start, end);
  }

  @Get('top-performers')
  getTopPerformers() {
    return this.reportingService.getTopPerformers();
  }

  @Get('by-convention')
  getByConvention(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportingService.getStatisticsByConvention(start, end);
  }
}
