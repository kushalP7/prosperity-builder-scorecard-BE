import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Inquiry } from './entities/inquiry.entity';
import { User } from '../users/entities/user.entity';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { PricingBrochureService } from './pricing-brochure.service';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Inquiry, User]),
    AuthModule,
    UploadsModule,
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService, PricingBrochureService],
  exports: [InquiriesService],
})
export class InquiriesModule {}
