import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MilestoneType } from './entities/payment-milestone.entity';

@Controller(['api/v1/payments', 'payments'])
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('project/:projectId')
  async getProjectMilestones(@Param('projectId') projectId: string) {
    return this.paymentsService.getProjectMilestones(projectId);
  }

  @Post('project/:projectId/advance')
  async advanceMilestone(
    @Param('projectId') projectId: string,
    @Body('milestoneType') milestoneType: MilestoneType,
  ) {
    return this.paymentsService.advanceMilestone(projectId, milestoneType);
  }

  @Post('project/:projectId/toggle-bypass')
  async toggleBypass(
    @Param('projectId') projectId: string,
    @Body('bypass') bypass: boolean,
  ) {
    return this.paymentsService.toggleBypass(projectId, bypass);
  }
}
