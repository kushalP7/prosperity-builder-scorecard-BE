import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { IntakeModule } from './modules/intake/intake.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { EngineModule } from './modules/engine/engine.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { LandingCmsModule } from './modules/landing-cms/landing-cms.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { EmailModule } from './integrations/email/email.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    TemplatesModule,
    ProjectsModule,
    PaymentsModule,
    OrdersModule,
    IntakeModule,
    IngestionModule,
    EngineModule,
    AnalyticsModule,
    UploadsModule,
    LandingCmsModule,
    InquiriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // All routes require JWT unless marked @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
