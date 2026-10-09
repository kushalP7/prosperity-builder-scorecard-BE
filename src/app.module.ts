import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { IntakeModule } from './modules/intake/intake.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { EngineModule } from './modules/engine/engine.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SeedModule } from './modules/seed/seed.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { LandingCmsModule } from './modules/landing-cms/landing-cms.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { EmailModule } from './integrations/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    TemplatesModule,
    ProjectsModule,
    PaymentsModule,
    IntakeModule,
    IngestionModule,
    EngineModule,
    AnalyticsModule,
    SeedModule,
    UploadsModule,
    LandingCmsModule,
    InquiriesModule,
  ],
})
export class AppModule {}
