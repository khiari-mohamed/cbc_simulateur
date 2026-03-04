import { Module } from '@nestjs/common';
import { ClientOrganizationsController } from './client-organizations.controller';
import { ClientOrganizationsService } from './client-organizations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ClientOrganizationsController],
  providers: [ClientOrganizationsService],
  exports: [ClientOrganizationsService],
})
export class ClientOrganizationsModule {}
