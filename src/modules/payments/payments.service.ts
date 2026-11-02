import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentMilestone, MilestoneType, PaymentStatus } from './entities/payment-milestone.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentMilestone) private milestoneModel: typeof PaymentMilestone,
    @InjectModel(Project) private projectModel: typeof Project,
    @Optional()
    @Inject(forwardRef(() => OrdersService))
    private ordersService?: OrdersService,
  ) { }

  async createDefaultMilestones(projectId: string, totalAmount = 5000): Promise<PaymentMilestone[]> {
    const existing = await this.milestoneModel.findAll({ where: { projectId } });
    if (existing.length > 0) return existing;

    const initialAmount = Number((totalAmount * 0.40).toFixed(2));
    const midAmount = Number((totalAmount * 0.30).toFixed(2));
    const finalAmount = Number((totalAmount * 0.30).toFixed(2));

    const milestones = await this.milestoneModel.bulkCreate([
      {
        projectId,
        milestoneType: MilestoneType.INITIAL_40,
        amountDue: initialAmount,
        percentage: 40,
        status: PaymentStatus.BYPASSED, // auto-bypassed for current phase
        paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
        provider: 'MANUAL',
        transactionReference: `BYPASS-INIT-${Date.now().toString().slice(-6)}`,
        clearedAt: new Date(),
      },
      {
        projectId,
        milestoneType: MilestoneType.MID_30,
        amountDue: midAmount,
        percentage: 30,
        status: PaymentStatus.PENDING,
        paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
        provider: 'MANUAL',
      },
      {
        projectId,
        milestoneType: MilestoneType.FINAL_30,
        amountDue: finalAmount,
        percentage: 30,
        status: PaymentStatus.PENDING,
        paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
        provider: 'MANUAL',
      },
    ]);

    return milestones;
  }

  async getProjectMilestones(projectId: string): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let milestones = await this.milestoneModel.findAll({
      where: { projectId },
      order: [['createdAt', 'ASC']],
    });

    if (milestones.length === 0) {
      milestones = await this.createDefaultMilestones(projectId, 5000);
    }

    const totalDue = milestones.reduce((sum, m) => sum + Number(m.amountDue), 0);
    const totalPaid = milestones
      .filter((m) => m.status === PaymentStatus.PAID || m.status === PaymentStatus.BYPASSED)
      .reduce((sum, m) => sum + Number(m.amountDue), 0);

    return {
      projectId,
      bypassPayments: project.bypassPayments,
      totalDue,
      totalPaid,
      balanceRemaining: Number((totalDue - totalPaid).toFixed(2)),
      isFullySettled: totalPaid >= totalDue,
      milestones,
    };
  }

  async advanceMilestone(projectId: string, milestoneType: MilestoneType): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let milestone = await this.milestoneModel.findOne({
      where: { projectId, milestoneType },
    });

    if (!milestone) {
      await this.createDefaultMilestones(projectId, 5000);
      milestone = await this.milestoneModel.findOne({ where: { projectId, milestoneType } });
    }

    if (!milestone) throw new NotFoundException(`Milestone ${milestoneType} not found`);

    // In current bypass mode, auto-advance without external gateway block
    const newStatus = project.bypassPayments ? PaymentStatus.BYPASSED : PaymentStatus.PAID;
    await milestone.update({
      status: newStatus,
      clearedAt: new Date(),
      transactionReference: `BYPASS-${milestoneType}-${Date.now().toString().slice(-6)}`,
    });

    // Advance project status if applicable (full package path; MID_30 no longer changes status —
    // questionnaire sets INTAKE_SUBMITTED; ingestion sets CALCULATED).
    let nextStatus: ProjectStatus | null = null;
    if (
      milestoneType === MilestoneType.INITIAL_40 &&
      (project.status === ProjectStatus.INTAKE_PENDING || String(project.status) === 'ONBOARDING')
    ) {
      nextStatus = ProjectStatus.INTAKE_PENDING;
    } else if (milestoneType === MilestoneType.FINAL_30) {
      nextStatus = ProjectStatus.PUBLISHED;
    }

    if (nextStatus && project.status !== nextStatus) {
      await project.update({ status: nextStatus });
      await this.ordersService?.syncTimelineForProject(projectId, nextStatus);
    }

    return this.getProjectMilestones(projectId);
  }

  async toggleBypass(projectId: string, bypass: boolean): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    await project.update({ bypassPayments: bypass });
    return { projectId, bypassPayments: bypass };
  }
}
