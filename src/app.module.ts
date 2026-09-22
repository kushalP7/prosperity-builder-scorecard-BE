import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EngineModule } from './modules/engine/engine.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SeedModule } from './modules/seed/seed.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { LandingCmsModule } from './modules/landing-cms/landing-cms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    SettingsModule,
    TemplatesModule,
    ProjectsModule,
    EngineModule,
    AnalyticsModule,
    SeedModule,
    UploadsModule,
    LandingCmsModule,
  ],
})
export class AppModule {}
