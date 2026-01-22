import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ConventionsModule } from './conventions/conventions.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SimulationsModule } from './simulations/simulations.module';
import { PricingEngineModule } from './pricing-engine/pricing-engine.module';
import { QuotesModule } from './quotes/quotes.module';
import { ContractsModule } from './contracts/contracts.module';
import { GuaranteesModule } from './guarantees/guarantees.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { DriverProfilesModule } from './driver-profiles/driver-profiles.module';
import { QuoteComparisonsModule } from './quote-comparisons/quote-comparisons.module';
import { PdfModule } from './pdf/pdf.module';
import { ReportingModule } from './reporting/reporting.module';
import { PricingRulesModule } from './pricing-rules/pricing-rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ConventionsModule,
    VehiclesModule,
    SimulationsModule,
    PricingEngineModule,
    QuotesModule,
    ContractsModule,
    GuaranteesModule,
    DocumentsModule,
    PaymentsModule,
    NotificationsModule,
    AuditModule,
    DriverProfilesModule,
    QuoteComparisonsModule,
    PdfModule,
    ReportingModule,
    PricingRulesModule,
  ],
})
export class AppModule {}
