import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import { Order, OrderStatus, PackageType } from './entities/order.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { SettingsService } from '../settings/settings.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../integrations/email/email.service';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { projectSlotsForPackage } from '../../common/package-allowance';
import { timelineStepFromProjectStatus } from '../../common/order-timeline';
import { getErrorMessage } from '../../common/errors';
import { getFrontendBaseUrl } from '../../common/frontend-url';
import {
  buildInvoiceIssuedTemplate,
  buildInvoiceIssuedText,
  buildPaymentReceivedTemplate,
  buildPaymentReceivedText,
  buildPaymentReminderTemplate,
  buildPaymentReminderText,
  buildScorecardReportDeliveredTemplate,
  buildScorecardReportDeliveredText,
} from '../../common/email-templates';
import { buildInvoicePdf } from '../../common/invoice-pdf';
import { buildReceiptPdf } from '../../common/receipt-pdf';

type AuthUser = { id: string; email?: string; name?: string; role?: string };

const STAFF_ROLES = new Set(['super_admin', 'project_lead']);

const PACKAGE_META: Record<PackageType, { name: string; priceKey: 'reportPrice' | 'subscriptionPrice' | 'combinedPrice'; description: string }> = {
  scorecard_only: {
    name: 'Scorecard Only',
    priceKey: 'reportPrice',
    description: 'One-time certified municipal scorecard assessment',
  },
  subscription: {
    name: 'Scorecard Subscription',
    priceKey: 'subscriptionPrice',
    description: 'Ongoing scorecard platform access and updates',
  },
  combined: {
    name: 'Combined Package',
    priceKey: 'combinedPrice',
    description: 'Scorecard plus subscription bundle',
  },
};

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(PaymentAttempt) private readonly attemptModel: typeof PaymentAttempt,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /** Checkout is invoice / mail-check only (no Stripe or stub card). */
  getPaymentConfig() {
    return {
      provider: 'invoice' as const,
      requested: 'invoice' as const,
      stripeConfigured: false,
      stubAllowed: false,
      message: 'Offline Invoice / mail check only. Super admin marks orders paid after payment is received.',
    };
  }

  private isStaff(user?: AuthUser | null) {
    return !!user?.role && STAFF_ROLES.has(user.role);
  }

  private assertOwner(order: Order, user: AuthUser) {
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (this.isStaff(user)) return;
    if (order.customerUserId !== user.id) {
      throw new ForbiddenException('You do not have access to this order.');
    }
  }

  async onModuleInit() {
    try {
      await this.backfillProjectOrderLinks();
    } catch (err: unknown) {
      this.logger.warn(`Project↔Order backfill soft-failed: ${getErrorMessage(err)}`);
    }
  }

  async syncTimelineForProject(_projectId: string, _projectStatus?: string): Promise<void> {
    return;
  }

  async getPackages() {
    const settings = await this.settingsService.getSettings();
    const prices = settings.planPrices || {
      reportPrice: 15000,
      subscriptionPrice: 36000,
      combinedPrice: 48000,
    };

    return (Object.keys(PACKAGE_META) as PackageType[]).map((key) => {
      const meta = PACKAGE_META[key];
      return {
        id: key,
        packageType: key,
        name: meta.name,
        description: meta.description,
        amount: Number(prices[meta.priceKey] ?? 0),
        currency: 'USD',
      };
    });
  }

  private async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    // Use max existing suffix (not row count) so gaps/deletes don't collide on unique orderNumber.
    const latest = await this.orderModel.findOne({
      where: { orderNumber: { [Op.like]: `${prefix}%` } },
      order: [['orderNumber', 'DESC']],
      attributes: ['orderNumber'],
    });
    let next = 1;
    if (latest?.orderNumber) {
      const suffix = Number(String(latest.orderNumber).slice(prefix.length));
      if (Number.isFinite(suffix) && suffix >= next) next = suffix + 1;
    }
    return `${prefix}${String(next).padStart(3, '0')}`;
  }


  async createOrder(dto: CreateOrderDto, user: AuthUser) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedException('Authentication required to start checkout.');
    }

    const packages = await this.getPackages();
    const selected = packages.find((p) => p.packageType === dto.packageType);
    if (!selected || !selected.amount) {
      throw new BadRequestException('Invalid package or price not configured in Settings.');
    }

    const email = String(user.email).trim().toLowerCase();
    const name = (dto.customerName || user.name || '').trim();
    if (name.length < 2) {
      throw new BadRequestException('Customer name is required.');
    }
    const organization = dto.organization?.trim() || null;
    const customerUserId = user.id;
    const provider = 'invoice';

    const existing = await this.orderModel.findOne({
      where: {
        packageType: dto.packageType,
        status: { [Op.in]: ['pending', 'failed'] },
        [Op.or]: [{ customerUserId }, { customerEmail: email }],
      },
      order: [['updatedAt', 'DESC']],
    });

    let order: Order;
    if (existing) {
      await existing.update({
        packageName: selected.name,
        amountDue: selected.amount,
        amountPaid: 0,
        status: 'pending' as OrderStatus,
        customerName: name,
        customerEmail: email,
        organization,
        customerUserId,
        provider,
        stripePaymentIntentId: null,
      });
      order = existing;
    } else {
      order = await this.orderModel.create({
        orderNumber: await this.nextOrderNumber(),
        packageType: dto.packageType,
        packageName: selected.name,
        amountDue: selected.amount,
        amountPaid: 0,
        status: 'pending' as OrderStatus,
        customerName: name,
        customerEmail: email,
        organization,
        customerUserId,
        provider,
      } as any);
    }

    await this.sendInvoiceEmail(order);
    const formatted = this.formatOrder(order);
    return {
      ...formatted,
      invoiceSent: true,
      message:
        'Invoice emailed. Order stays pending until Rose Associates records payment.',
    };
  }

  async findOneForUser(id: string, user: AuthUser) {
    const order = await this.orderModel.findByPk(id, {
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertOwner(order, user);
    const [formatted] = await this.formatOrdersWithCustomerProjects([order]);
    return formatted;
  }

  async getCustomerProjectAllowance(opts: { customerUserId?: string | null; customerEmail?: string | null; }) {
    if (opts.customerUserId) {
      return this.projectsService.getCustomerAllowance(
        opts.customerUserId,
        opts.customerEmail || undefined,
      );
    }
    if (!opts.customerEmail) {
      return { maxProjects: 0, usedProjects: 0, remaining: 0, paidPackages: [] as any[] };
    }

    const paidOrders = await this.orderModel.findAll({
      where: { status: 'paid', customerEmail: String(opts.customerEmail).toLowerCase() },
      order: [['paidAt', 'ASC']],
    });
    const maxProjects = paidOrders.reduce((sum, o) => sum + projectSlotsForPackage(o.packageType), 0);
    const orderIds = paidOrders.map((o) => o.id);
    const usedProjects = orderIds.length > 0 ? await this.projectModel.count({ where: { orderId: { [Op.in]: orderIds }, deleted: { [Op.ne]: true } }, }) : 0;
    const paidPackages = [];
    for (const o of paidOrders) {
      const slots = projectSlotsForPackage(o.packageType);
      const usedSlots = await this.projectsService.countForOrder(o.id);
      paidPackages.push({
        orderId: o.id,
        orderNumber: o.orderNumber,
        packageType: o.packageType,
        packageName: o.packageName,
        slots,
        usedSlots,
        remainingSlots: Math.max(0, slots - usedSlots),
        paidAt: o.paidAt,
        amountPaid: Number(o.amountPaid),
      });
    }
    return {
      maxProjects,
      usedProjects,
      remaining: Math.max(0, maxProjects - usedProjects),
      paidPackages,
    };
  }

  async findForCustomer(opts: { customerUserId?: string; customerEmail?: string }) {
    const where: any = {};
    if (opts.customerUserId && opts.customerEmail) {
      where[Op.or] = [
        { customerUserId: opts.customerUserId },
        { customerEmail: String(opts.customerEmail).toLowerCase() },
      ];
    } else if (opts.customerUserId) {
      where.customerUserId = opts.customerUserId;
    } else if (opts.customerEmail) {
      where.customerEmail = String(opts.customerEmail).toLowerCase();
    } else {
      return [];
    }
    const orders = await this.orderModel.findAll({
      where,
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
      order: [['createdAt', 'DESC']],
    });
    return this.formatOrdersWithCustomerProjects(orders);
  }

  async findAll(options?: { status?: string; search?: string; page?: number; limit?: number; }) {
    const where: any = {};
    const allowedStatuses = new Set(['pending', 'paid', 'failed', 'refunded']);
    if (options?.status && options.status !== 'all' && allowedStatuses.has(options.status)) {
      where.status = options.status;
    }
    if (options?.search?.trim()) {
      const s = `%${options.search.trim()}%`;
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: s } },
        { customerName: { [Op.iLike]: s } },
        { customerEmail: { [Op.iLike]: s } },
        { organization: { [Op.iLike]: s } },
        { packageName: { [Op.iLike]: s } },
      ];
    }

    const pageNum = Math.max(1, Number(options?.page) || 1);
    const limitNum = Math.max(1, Number(options?.limit) || 5);
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await this.orderModel.findAndCountAll({
      where,
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const data = await this.formatOrdersWithCustomerProjects(rows);
    const summary = await this.buildOrdersSummary(options?.search);

    return {
      data,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum) || 1,
      summary,
    };
  }

  private async buildOrdersSummary(search?: string) {
    const where: any = {};
    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: s } },
        { customerName: { [Op.iLike]: s } },
        { customerEmail: { [Op.iLike]: s } },
        { organization: { [Op.iLike]: s } },
        { packageName: { [Op.iLike]: s } },
      ];
    }

    const orders = await this.orderModel.findAll({
      where,
      attributes: ['status', 'amountDue', 'amountPaid'],
    });

    let totalCollected = 0;
    let totalRemaining = 0;
    let contractValue = 0;
    const counts = { pending: 0, paid: 0, failed: 0, refunded: 0 };

    for (const o of orders) {
      const due = Number(o.amountDue || 0);
      const paidAmt = Number(o.amountPaid || 0);
      contractValue += due;
      totalCollected += paidAmt;
      totalRemaining += Math.max(0, due - paidAmt);
      const st = String(o.status || 'pending') as keyof typeof counts;
      if (st in counts) counts[st] += 1;
    }

    return {
      totalCount: orders.length,
      pendingCount: counts.pending,
      paidCount: counts.paid,
      failedCount: counts.failed,
      refundedCount: counts.refunded,
      totalCollected,
      totalRemaining,
      contractValue,
    };
  }

  async findOne(id: string) {
    const order = await this.orderModel.findByPk(id, {
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    const [formatted] = await this.formatOrdersWithCustomerProjects([order]);
    return formatted;
  }

  /** Attach projects that belong to each order via Projects.orderId. */
  private async formatOrdersWithCustomerProjects(orders: Order[]) {
    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const projects = await this.projectModel.findAll({
      where: {
        deleted: { [Op.ne]: true },
        orderId: { [Op.in]: orderIds },
      },
      attributes: [
        'id',
        'name',
        'status',
        'year',
        'county',
        'state',
        'customerUserId',
        'clientEmail',
        'clientName',
        'orderId',
        'initialReportUrl',
        'initialReportFileName',
        'initialReportGeneratedAt',
        'certifiedReportUrl',
        'certifiedReportFileName',
        'certifiedReportUploadedAt',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'ASC']],
    });

    const byOrderId = new Map<string, typeof projects>();
    for (const p of projects) {
      if (!p.orderId) continue;
      const list = byOrderId.get(p.orderId) || [];
      list.push(p);
      byOrderId.set(p.orderId, list);
    }

    return orders.map((order) => {
      const base = this.formatOrder(order);
      const packageSlots = projectSlotsForPackage(order.packageType);
      const paid = order.status === 'paid';
      const linked = byOrderId.get(order.id) || [];

      const customerProjects = linked.map((p, idx) => {
        const timelineStep = timelineStepFromProjectStatus(p.status, paid);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          year: p.year,
          county: p.county,
          state: p.state,
          clientName: p.clientName,
          orderId: p.orderId || order.id,
          timelineStep,
          initialReportUrl: p.initialReportUrl,
          initialReportFileName: p.initialReportFileName,
          initialReportGeneratedAt: p.initialReportGeneratedAt,
          certifiedReportUrl: p.certifiedReportUrl,
          certifiedReportFileName: p.certifiedReportFileName,
          certifiedReportUploadedAt: p.certifiedReportUploadedAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          isPrimary: idx === 0,
        };
      });

      const timelineStep = customerProjects.length > 0 ? Math.max(...customerProjects.map((p) => p.timelineStep)) : paid ? 2 : 1;
      const first = customerProjects[0];

      return {
        ...base,
        packageSlots,
        projectsUsed: customerProjects.length,
        customerProjects,
        timelineStep,
        projectName: first?.name || order.packageName,
        countyOrState: [first?.county, first?.state].filter(Boolean).join(', ') || null,
        year: first?.year || null,
      };
    });
  }


  async backfillProjectOrderLinks(): Promise<{ linkedFromSlots: number }> {
    let linkedFromSlots = 0;
    const paidOrders = await this.orderModel.findAll({
      where: { status: 'paid' },
      order: [
        ['paidAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    for (const order of paidOrders) {
      const slots = projectSlotsForPackage(order.packageType);
      if (slots <= 0) continue;
      let used = await this.projectsService.countForOrder(order.id);
      if (used >= slots) continue;

      const unlinkedWhere: any = {
        orderId: null,
        deleted: { [Op.ne]: true },
      };
      if (order.customerUserId && order.customerEmail) {
        unlinkedWhere[Op.or] = [
          { customerUserId: order.customerUserId },
          { clientEmail: String(order.customerEmail).toLowerCase() },
        ];
      } else if (order.customerUserId) {
        unlinkedWhere.customerUserId = order.customerUserId;
      } else if (order.customerEmail) {
        unlinkedWhere.clientEmail = String(order.customerEmail).toLowerCase();
      } else {
        continue;
      }

      const open = slots - used;
      const candidates = await this.projectModel.findAll({
        where: unlinkedWhere,
        order: [['createdAt', 'ASC']],
        limit: open,
      });

      for (const project of candidates) {
        await project.update({ orderId: order.id });
        linkedFromSlots += 1;
        used += 1;
      }
    }

    this.logger.log(`Project↔Order backfill: slot-fill=${linkedFromSlots}`);
    return { linkedFromSlots };
  }

  async finalizePaidOrder( orderId: string, meta: { provider: string; method: string; reference: string; cardLast4?: string | null; } ) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status === 'paid') {
      const existingProject = await this.projectModel.findOne({
        where: { orderId: order.id, deleted: { [Op.ne]: true } },
        order: [['createdAt', 'ASC']],
      });
      return {
        order: await this.findOne(order.id),
        project: existingProject ? await this.projectsService.findOne(existingProject.id) : null,
        paymentAttempt: null,
        message: 'Order already paid.',
      };
    }

    if (order.status === 'refunded') {
      throw new BadRequestException('Order was refunded and cannot be charged again.');
    }

    const priorSuccess = await this.attemptModel.findOne({
      where: { orderId: order.id, status: 'succeeded', reference: meta.reference },
    });

    let attempt = priorSuccess;
    if (!attempt) {
      attempt = await this.attemptModel.create({
        orderId: order.id,
        amount: order.amountDue,
        status: 'succeeded',
        provider: meta.provider,
        method: meta.method,
        cardLast4: meta.cardLast4 || null,
        reference: meta.reference,
      } as any);
    }

    await order.update({
      status: 'paid' as OrderStatus,
      amountPaid: order.amountDue,
      paidAt: new Date(),
      provider: meta.provider,
    });

    let ownerUserId = order.customerUserId || null;
    try {
      const entitled = await this.usersService.activateSubscriptionByEmail(
        order.customerEmail,
        order.packageType,
        order.customerUserId,
      );
      if (entitled) {
        ownerUserId = entitled.id;
        if (!order.customerUserId) {
          await order.update({ customerUserId: entitled.id });
        }
      }
    } catch (err: unknown) {
      this.logger.warn(`Subscription entitlement soft-failed for ${order.customerEmail}: ${getErrorMessage(err)}`);
    }

    let project: any = null;
    let projectSkippedReason: string | null = null;
    try {
      const slots = projectSlotsForPackage(order.packageType);
      const usedOnOrder = await this.projectsService.countForOrder(order.id);
      if (usedOnOrder === 0 && slots > 0) {
        const seedName = order.organization?.trim()
          ? order.organization.trim()
          : `${order.packageName} - ${order.customerName}`;
        let seedJurisdiction: 'CITY' | 'COUNTY' = 'COUNTY';
        if (ownerUserId) {
          try {
            const owner = await this.usersService.findById(ownerUserId);
            if (String(owner?.jurisdictionType || '').toUpperCase() === 'CITY') {
              seedJurisdiction = 'CITY';
            } else if (String(owner?.leadRole || '').toLowerCase() === 'city') {
              seedJurisdiction = 'CITY';
            }
          } catch {
            /* soft — default COUNTY */
          }
        }

        project = await this.projectsService.create({
          name: seedName,
          clientName: order.customerName,
          year: new Date().getFullYear(),
          customerUserId: ownerUserId || undefined,
          clientEmail: order.customerEmail,
          packageType: order.packageName,
          orderId: order.id,
          jurisdictionType: seedJurisdiction,
          locationConfirmed: false,
        } as any);

        await this.projectsService.update(project.id, {
          packageType: order.packageName,
          clientEmail: order.customerEmail,
          customerUserId: ownerUserId || undefined,
          orderId: order.id,
          bypassPayments: false,
          status: ProjectStatus.INTAKE_PENDING,
        } as any);

        project = await this.projectsService.findOne(project.id);
      } else if (usedOnOrder >= slots && slots > 0) {
        projectSkippedReason = `Project slot limit reached for ${order.orderNumber} (${usedOnOrder}/${slots}). Payment recorded.`;
        this.logger.warn(projectSkippedReason);
      } else if (usedOnOrder > 0) {
        const existing = await this.projectModel.findOne({
          where: { orderId: order.id, deleted: { [Op.ne]: true } },
          order: [['createdAt', 'ASC']],
        });
        if (existing) {
          project = await this.projectsService.findOne(existing.id);
        }
      }
    } catch (err: unknown) {
      this.logger.error(`Failed to create project after payment for order ${order.id}: ${getErrorMessage(err)}`);
    }

    this.sendPaymentReceivedEmail(order, attempt).catch((err: unknown) => {
      this.logger.warn(`Payment email soft-failed for ${order.customerEmail}: ${getErrorMessage(err)}`);
    });

    return {
      order: await this.findOne(order.id),
      project,
      paymentAttempt: attempt.toJSON(),
      message: projectSkippedReason || 'Full payment received. Project created successfully.',
    };
  }

  /** Owner or staff: branded PDF receipt for a payment attempt. */
  async getPaymentReceiptPdf(orderId: string, attemptId: string, user: AuthUser) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    this.assertOwner(order, user);

    const attempt =
      (order.paymentAttempts || []).find((a) => a.id === attemptId) ||
      (await this.attemptModel.findOne({ where: { id: attemptId, orderId } }));
    if (!attempt) {
      throw new NotFoundException(`Payment attempt ${attemptId} not found for this order.`);
    }

    const method = `${attempt.method || 'Payment'}${
      attempt.cardLast4 ? ` •••• ${attempt.cardLast4}` : ''
    }`;
    const paidAt = attempt.createdAt
      ? new Date(attempt.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';
    const statusRaw = String(attempt.status || '').toLowerCase();
    const status =
      statusRaw === 'succeeded' ? 'Succeeded' : statusRaw === 'refunded' ? 'Refunded' : attempt.status || '—';

    const buffer = await buildReceiptPdf({
      orderNumber: order.orderNumber,
      paidAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      packageName: order.packageName,
      method,
      reference: attempt.reference || '—',
      status,
      amountPaid: Number(attempt.amount),
    });

    return {
      buffer,
      filename: `Receipt-${order.orderNumber}.pdf`,
    };
  }

  /** Super admin only: record offline Invoice / mail check as paid (same unlock as card). */
  async markPaid(orderId: string, user: AuthUser) {
    if (user?.role !== 'super_admin') {
      throw new ForbiddenException('Only a super admin can mark an invoice order as paid.');
    }

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid in full.');
    }
    if (order.status === 'refunded') {
      throw new BadRequestException('Order was refunded and cannot be marked paid.');
    }
    if (order.status !== 'pending' && order.status !== 'failed') {
      throw new BadRequestException(`Order cannot be marked paid (status: ${order.status}).`);
    }

    // Offline-only product: any unpaid order can be settled manually as invoice / mail check.
    return this.finalizePaidOrder(orderId, {
      provider: 'invoice',
      method: 'Invoice / mail check',
      reference: `MANUAL-${order.orderNumber}`,
    });
  }

  async refund(orderId: string) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [{ model: PaymentAttempt, as: 'paymentAttempts' }],
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.status !== 'paid') {
      throw new BadRequestException('Only paid orders can be refunded.');
    }

    const reference = `REFUND-${Date.now().toString(36).toUpperCase()}`;
    await this.attemptModel.create({
      orderId: order.id,
      amount: order.amountPaid,
      status: 'refunded',
      provider: order.provider || 'invoice',
      method: 'Full refund',
      reference,
    } as any);

    await order.update({
      status: 'refunded' as OrderStatus,
      amountPaid: 0,
      refundedAt: new Date(),
    });

    const otherPaid = await this.orderModel.count({
      where: {
        customerEmail: order.customerEmail,
        status: 'paid',
        id: { [Op.ne]: order.id },
      },
    });
    try {
      await this.usersService.syncSubscriptionAfterRefund(order.customerEmail, otherPaid > 0);
    } catch (err: unknown) {
      this.logger.warn(`Subscription cancel sync soft-failed for ${order.customerEmail}: ${getErrorMessage(err)}`);
    }

    return this.findOne(order.id);
  }

  /** Flattened ledger for Payments module (paginated). */
  async listPaymentLedger(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    const statusKey = String(options?.status || 'all').toLowerCase();
    // FE filter keys map to PaymentAttempt.status
    if (statusKey === 'paid') where.status = 'succeeded';
    else if (statusKey === 'failed' || statusKey === 'issue') where.status = 'failed';
    else if (statusKey === 'refunded') where.status = 'refunded';
    else if (statusKey !== 'all') {
      // Unknown / legacy keys (partial, hold) → empty result set
      where.status = '__none__';
    }

    const orderWhere: any = {};
    if (options?.search?.trim()) {
      const s = `%${options.search.trim()}%`;
      orderWhere[Op.or] = [
        { orderNumber: { [Op.iLike]: s } },
        { customerName: { [Op.iLike]: s } },
        { customerEmail: { [Op.iLike]: s } },
        { packageName: { [Op.iLike]: s } },
      ];
    }

    const pageNum = Math.max(1, Number(options?.page) || 1);
    const limitNum = Math.max(1, Number(options?.limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await this.attemptModel.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          required: Object.keys(orderWhere).length > 0,
          where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const data = rows.map((a) => {
      const order = (a as any).order as Order | undefined;
      return {
        id: a.id,
        orderId: a.orderId,
        orderNumber: order?.orderNumber,
        customerName: order?.customerName,
        customerEmail: order?.customerEmail,
        projectName: order?.packageName,
        paymentType: order?.packageName,
        paidAmount: Number(a.amount),
        totalAmount: Number(order?.amountDue || a.amount),
        status: this.mapAttemptToLedgerStatus(a.status, order?.status),
        method: a.method,
        reference: a.reference,
        cardLast4: a.cardLast4,
        provider: a.provider,
        date: a.createdAt,
      };
    });

    const summary = await this.buildPaymentLedgerSummary(options?.search);

    return {
      data,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum) || 1,
      summary,
    };
  }

  private async buildPaymentLedgerSummary(search?: string) {
    const orderWhere: any = {};
    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      orderWhere[Op.or] = [
        { orderNumber: { [Op.iLike]: s } },
        { customerName: { [Op.iLike]: s } },
        { customerEmail: { [Op.iLike]: s } },
        { packageName: { [Op.iLike]: s } },
      ];
    }

    const attempts = await this.attemptModel.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          required: Object.keys(orderWhere).length > 0,
          where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
          attributes: ['packageName', 'packageType'],
        },
      ],
      attributes: ['status', 'amount'],
    });

    let totalCollected = 0;
    let paidCount = 0;
    let failedCount = 0;
    let refundedCount = 0;
    let scorecardOnlyCount = 0;
    let subscriptionCount = 0;
    let combinedCount = 0;

    for (const a of attempts) {
      const order = (a as any).order as Order | undefined;
      if (a.status === 'succeeded') {
        paidCount += 1;
        totalCollected += Number(a.amount || 0);
      } else if (a.status === 'failed') {
        failedCount += 1;
      } else if (a.status === 'refunded') {
        refundedCount += 1;
      }
      const pkg = String(order?.packageName || order?.packageType || '').toLowerCase();
      if (pkg.includes('combined')) combinedCount += 1;
      else if (pkg.includes('subscription')) subscriptionCount += 1;
      else if (pkg.includes('scorecard')) scorecardOnlyCount += 1;
    }

    return {
      totalCount: attempts.length,
      paidCount,
      failedCount,
      refundedCount,
      totalCollected,
      scorecardOnlyCount,
      subscriptionCount,
      combinedCount,
    };
  }

  private mapAttemptToLedgerStatus(attemptStatus: string, orderStatus?: string) {
    if (attemptStatus === 'succeeded') return 'Paid';
    if (attemptStatus === 'refunded') return 'Refunded';
    if (attemptStatus === 'failed') return 'Failed';
    return orderStatus || attemptStatus;
  }

  private formatOrder(order: Order) {
    const json = typeof (order as any).toJSON === 'function' ? order.toJSON() : order;
    return {
      ...json,
      amountDue: Number(json.amountDue),
      amountPaid: Number(json.amountPaid),
      reminderSentCount: Number(json.reminderSentCount || 0),
      paymentAttempts: (json.paymentAttempts || []).map((a: any) => ({
        ...a,
        amount: Number(a.amount),
      })),
    };
  }

  /** Staff: soft-nudge payment reminder to order.customerEmail. */
  async sendPaymentReminder(orderId: string) {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const status = String(order.status || '').toLowerCase();
    if (status === 'paid') {
      throw new BadRequestException('This order is already paid in full.');
    }
    if (status === 'refunded') {
      throw new BadRequestException('Cannot send a payment reminder for a refunded order.');
    }

    const to = String(order.customerEmail || '').trim().toLowerCase();
    if (!to) {
      throw new BadRequestException('Order has no customer email.');
    }

    const amountDue = Number(order.amountDue || 0);
    const amountPaid = Number(order.amountPaid || 0);
    const remaining = Math.max(0, amountDue - amountPaid);
    if (remaining <= 0) {
      throw new BadRequestException('Nothing remaining due on this order.');
    }

    const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const frontendBase = getFrontendBaseUrl(this.configService);
    const loginUrl = `${frontendBase}/login`;

    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', }) : null;

    const templateData = {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      packageName: order.packageName,
      amountDueFormatted: money(amountDue),
      amountPaidFormatted: money(amountPaid),
      remainingDueFormatted: money(remaining),
      orderDate,
      loginUrl,
    };

    const { logoUrl, attachments } = this.resolveEmailLogo();

    await this.emailService.sendEmail({
      to,
      subject: `Payment reminder - ${order.packageName} (${order.orderNumber})`,
      html: buildPaymentReminderTemplate(templateData, logoUrl),
      text: buildPaymentReminderText(templateData),
      attachments,
    });

    const nextCount = Number(order.reminderSentCount || 0) + 1;
    await order.update({ reminderSentCount: nextCount });

    return {
      to,
      reminderSentCount: nextCount,
      remainingDue: remaining,
      message: `Payment reminder emailed to ${to}.`,
    };
  }

 
  async sendCertifiedReportEmail(
    projectId: string,
    opts: {
      isResend?: boolean;
      orderId?: string;
      /** initial = publish PDF; detailed = admin-uploaded certified report (default) */
      reportKind?: 'initial' | 'detailed';
    } = {},
  ): Promise<{ sent: boolean; skipped?: boolean; reason?: string; to?: string }> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project || project.deleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (!project.orderId) {
      this.logger.log(
        `Skipping scorecard report email for project ${projectId}: no linked order (admin-only).`,
      );
      return { sent: false, skipped: true, reason: 'no_order' };
    }

    if (opts.orderId && String(opts.orderId) !== String(project.orderId)) {
      throw new BadRequestException('Project does not belong to this order.');
    }

    const reportKind: 'initial' | 'detailed' =
      opts.reportKind === 'initial' ? 'initial' : 'detailed';
    const downloadUrl =
      reportKind === 'initial'
        ? String(project.initialReportUrl || '').trim()
        : String(project.certifiedReportUrl || '').trim();
    if (!downloadUrl) {
      throw new BadRequestException(
        reportKind === 'initial'
          ? 'Initial scorecard PDF is required before sending the delivery email.'
          : 'Detailed report PDF is required before sending the delivery email.',
      );
    }

    const order = await this.orderModel.findByPk(project.orderId);
    if (!order) {
      this.logger.warn(`Skipping scorecard report email for project ${projectId}: order ${project.orderId} missing.`);
      return { sent: false, skipped: true, reason: 'order_missing' };
    }

    const to = String(order.customerEmail || project.clientEmail || '').trim().toLowerCase();
    if (!to) {
      throw new BadRequestException('No customer email on order or project - cannot send report delivery email.');
    }

    const customerName = String(order.customerName || project.clientName || 'Customer').trim() || 'Customer';
    const reportFileName =
      reportKind === 'initial'
        ? String(project.initialReportFileName || '').trim() || 'Initial-Scorecard-Report.pdf'
        : String(project.certifiedReportFileName || '').trim() || 'Detailed-Scorecard-Report.pdf';
    const isResend = Boolean(opts.isResend);

    const templateData = {
      customerName,
      orderNumber: order.orderNumber,
      projectName: project.name,
      reportFileName,
      downloadUrl,
      isResend,
      reportKind,
    };

    const { logoUrl, attachments } = this.resolveEmailLogo();
    const subject =
      reportKind === 'initial'
        ? isResend
          ? `Updated initial scorecard - ${project.name} (${order.orderNumber})`
          : `Your initial scorecard is ready - ${project.name} (${order.orderNumber})`
        : isResend
          ? `Updated detailed scorecard report - ${project.name} (${order.orderNumber})`
          : `Your detailed scorecard report is ready - ${project.name} (${order.orderNumber})`;

    await this.emailService.sendEmail({
      to,
      subject,
      html: buildScorecardReportDeliveredTemplate(templateData, logoUrl),
      text: buildScorecardReportDeliveredText(templateData),
      attachments,
    });

    return { sent: true, to };
  }

  async sendProjectReportForOrder(orderId: string, projectId: string) {
    const project = await this.projectModel.findByPk(projectId);
    if (!project || project.deleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    const reportKind: 'initial' | 'detailed' = String(project.certifiedReportUrl || '').trim()
      ? 'detailed'
      : 'initial';
    const result = await this.sendCertifiedReportEmail(projectId, {
      isResend: true,
      orderId,
      reportKind,
    });
    if (result.skipped) {
      throw new BadRequestException(
        'This project is not linked to a customer order, so the report email was not sent.',
      );
    }
    return {
      ...result,
      message: `Scorecard report emailed to ${result.to}.`,
    };
  }

  private async sendInvoiceEmail(order: Order) {
    const amountDueFormatted = Number(order.amountDue).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    const invoiceDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const frontendBase = getFrontendBaseUrl(this.configService);
    const loginUrl = `${frontendBase}/login`;

    const templateData = {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      packageName: order.packageName,
      amountDueFormatted,
      invoiceDate,
      loginUrl,
    };

    const pdf = await buildInvoicePdf({
      orderNumber: order.orderNumber,
      invoiceDate,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      organization: order.organization,
      packageName: order.packageName,
      amountDue: Number(order.amountDue),
    });

    const { logoUrl, attachments } = this.resolveEmailLogo();

    await this.emailService.sendEmail({
      to: order.customerEmail,
      subject: `Invoice - ${order.packageName} (${order.orderNumber})`,
      html: buildInvoiceIssuedTemplate(templateData, logoUrl),
      text: buildInvoiceIssuedText(templateData),
      attachments: [
        ...attachments,
        {
          filename: `Invoice-${order.orderNumber}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private resolveEmailLogo(): { logoUrl: string; attachments: Array<{ filename: string; path: string; cid: string }>; } {
    const configuredLogoUrl = this.configService.get<string>('APP_LOGO_URL');
    const localLogoPath = path.resolve(process.cwd(), 'assets', 'logo.png');
    const hasLocalLogo = fs.existsSync(localLogoPath);
    const logoUrl = configuredLogoUrl || (hasLocalLogo ? 'cid:roselogo' : '/logo.png');
    const attachments =
      !configuredLogoUrl && hasLocalLogo
        ? [
            {
              filename: 'logo.png',
              path: localLogoPath,
              cid: 'roselogo',
            },
          ]
        : [];
    return { logoUrl, attachments };
  }

  private async sendPaymentReceivedEmail(order: Order, attempt: PaymentAttempt) {
    const amountFormatted = Number(order.amountDue).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const frontendBase = getFrontendBaseUrl(this.configService);
    const loginUrl = `${frontendBase}/login`;

    const paidAt = order.paidAt
      ? new Date(order.paidAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

    const templateData = {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      packageName: order.packageName,
      amountFormatted,
      reference: attempt.reference,
      paidAt,
      loginUrl,
    };

    const { logoUrl, attachments } = this.resolveEmailLogo();

    await this.emailService.sendEmail({
      to: order.customerEmail,
      subject: `Payment received - ${order.packageName} (${order.orderNumber})`,
      html: buildPaymentReceivedTemplate(templateData, logoUrl),
      text: buildPaymentReceivedText(templateData),
      attachments,
    });
  }
}
