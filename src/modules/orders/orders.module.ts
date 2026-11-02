import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SettingsModule } from '../settings/settings.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../integrations/email/email.module';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, PaymentAttempt, Project]),
    SettingsModule,
    forwardRef(() => ProjectsModule),
    UsersModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [OrdersController, StripeWebhookController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
