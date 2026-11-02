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
// CommonJS-safe import (tsconfig has no esModuleInterop; default import breaks at runtime)
import Stripe = require('stripe');
import { Order, OrderStatus, PackageType } from './entities/order.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { StubPayDto } from './dto/stub-pay.dto';
import { SettingsService } from '../settings/settings.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../integrations/email/email.service';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { projectSlotsForPackage } from '../../common/package-allowance';
import { timelineStepFromProjectStatus } from '../../common/order-timeline';
import { getErrorMessage } from '../../common/errors';
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

  private stripe: Stripe | null = null;

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
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.');
    }
    return this.stripe;
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private requestedPaymentProvider(): 'stripe' | 'stub' {
    const raw = String(this.configService.get<string>('PAYMENT_PROVIDER') || '')
      .trim()
      .toLowerCase();
    if (raw === 'stripe' || raw === 'stub') return raw;
    return this.isProduction() ? 'stripe' : 'stub';
  }

  private activePaymentProvider(): 'stripe' | 'stub' {
    if (this.requestedPaymentProvider() === 'stripe' && this.stripe) return 'stripe';
    return 'stub';
  }

  private isStripeMode(): boolean {
    return this.activePaymentProvider() === 'stripe';
  }

  private stubPayAllowed(): boolean {
    // Explicit stub mode always allows fake-card /pay (including NODE_ENV=production).
    if (this.activePaymentProvider() === 'stub') return true;
    // Stripe mode: allow admin stub only when opt-in (works in prod for staging/demo EC2).
    return String(this.configService.get<string>('ALLOW_STUB_PAY') || '').toLowerCase() === 'true';
  }

  getPaymentConfig() {
    const requested = this.requestedPaymentProvider();
    const provider = this.activePaymentProvider();
    const stripeConfigured = !!this.stripe;
    let message: string | undefined;
    if (requested === 'stripe' && !stripeConfigured) {
      message = 'PAYMENT_PROVIDER=stripe but STRIPE_SECRET_KEY is missing — falling back to stub checkout.';
    } else if (provider === 'stub') {
      message = this.isProduction()
        ? 'Stub/fake card checkout (PAYMENT_PROVIDER=stub). Switch to stripe + keys for live card payments.'
        : 'Stub/fake card checkout (local). Set PAYMENT_PROVIDER=stripe with keys to use Stripe.';
    }
    return {
      provider,
      requested,
      stripeConfigured,
      stubAllowed: this.stubPayAllowed(),
      message,
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
    const count = await this.orderModel.count();
    return `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
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
    const isInvoice = dto.checkoutMethod === 'invoice';
    const provider = isInvoice ? 'invoice' : this.activePaymentProvider();

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
        ...(isInvoice ? { stripePaymentIntentId: null } : {}),
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

    if (isInvoice) {
      await this.sendInvoiceEmail(order);
      const formatted = this.formatOrder(order);
      return {
        ...formatted,
        invoiceSent: true,
        message:
          'Invoice emailed. Order stays pending until a super admin marks it paid.',
      };
    }

    return this.formatOrder(order);
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

  async createPaymentIntent(orderId: string, user: AuthUser) {
    if (!this.isStripeMode()) {
      throw new BadRequestException(
        'Stripe checkout is not active. Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY, or use stub pay.',
      );
    }

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    this.assertOwner(order, user);

    if (String(order.provider || '').toLowerCase() === 'invoice') {
      throw new BadRequestException(
        'This order is set to Invoice / mail check. A super admin must mark it paid after payment is received.',
      );
    }

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid in full.');
    }
    if (order.status === 'refunded') {
      throw new BadRequestException('Order was refunded and cannot be charged again.');
    }
    if (order.status !== 'pending' && order.status !== 'failed') {
      throw new BadRequestException(`Order cannot be paid (status: ${order.status}).`);
    }

    const stripe = this.getStripe();
    const amountCents = Math.round(Number(order.amountDue) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      throw new BadRequestException('Order amount is invalid for Stripe checkout.');
    }

    const reusableStatuses = new Set(['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing']);

    if (order.stripePaymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (existing.status === 'succeeded') {
          throw new BadRequestException('Payment already completed. Refresh to see order status.');
        }
        if (reusableStatuses.has(existing.status)) {
          if (existing.amount !== amountCents) {
            await stripe.paymentIntents.update(existing.id, { amount: amountCents });
          }
          return {
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
            amount: Number(order.amountDue),
            currency: 'usd',
          };
        }
      } catch (err: unknown) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`Could not reuse PaymentIntent ${order.stripePaymentIntentId}: ${getErrorMessage(err)}`);
      }
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        packageType: order.packageType,
      },
      receipt_email: order.customerEmail,
      automatic_payment_methods: { enabled: true },
    });

    await order.update({
      stripePaymentIntentId: pi.id,
      provider: 'stripe',
      status: 'pending' as OrderStatus,
    });

    return {
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      amount: Number(order.amountDue),
      currency: 'usd',
    };
  }


  async confirmStripePayment(orderId: string, user: AuthUser) {
    if (!this.isStripeMode()) {
      throw new BadRequestException(
        'Stripe confirm is not active. Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY.',
      );
    }

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    this.assertOwner(order, user);

    if (order.status === 'paid') {
      return this.finalizePaidOrder(order.id, {
        provider: 'stripe',
        method: 'Card (Stripe)',
        reference: order.stripePaymentIntentId || `already-paid-${order.id}`,
      });
    }

    if (!order.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe PaymentIntent on this order.');
    }

    const stripe = this.getStripe();
    const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ['latest_charge', 'payment_method'],
    });

    if (pi.status !== 'succeeded') {
      throw new BadRequestException(
        `Payment not completed yet (status: ${pi.status}). If you were charged, wait a moment and refresh.`,
      );
    }

    const charge = typeof pi.latest_charge === 'string' ? null : (pi.latest_charge as Stripe.Charge | null);
    const cardLast4 = charge?.payment_method_details?.card?.last4 || (pi.payment_method && typeof pi.payment_method !== 'string' ? (pi.payment_method as Stripe.PaymentMethod).card?.last4 : null) || null;

    return this.finalizePaidOrder(order.id, {
      provider: 'stripe',
      method: 'Card (Stripe)',
      reference: pi.id,
      cardLast4,
    });
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.getStripe();
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured.');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: unknown) {
      this.logger.warn(`Stripe webhook signature failed: ${getErrorMessage(err)}`);
      throw new UnauthorizedException('Invalid Stripe webhook signature.');
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      let order: Order | null = null;
      if (orderId) {
        order = await this.orderModel.findByPk(orderId);
      }
      if (!order && pi.id) {
        order = await this.orderModel.findOne({ where: { stripePaymentIntentId: pi.id } });
      }
      if (!order) {
        this.logger.warn(`Stripe PI ${pi.id} succeeded but no matching order was found.`);
        return { handled: false, reason: 'order_not_found' };
      }

      const charge = typeof pi.latest_charge === 'string' ? null : (pi.latest_charge as Stripe.Charge | null);
      const cardLast4 = charge?.payment_method_details?.card?.last4 || (pi.payment_method && typeof pi.payment_method !== 'string' ? (pi.payment_method as Stripe.PaymentMethod).card?.last4 : null) || null;

      await this.finalizePaidOrder(order.id, {
        provider: 'stripe',
        method: 'Card (Stripe)',
        reference: pi.id,
        cardLast4,
      });
      return { handled: true, orderId: order.id, event: event.type };
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      let order: Order | null = null;
      if (orderId) order = await this.orderModel.findByPk(orderId);
      if (!order && pi.id) {
        order = await this.orderModel.findOne({ where: { stripePaymentIntentId: pi.id } });
      }
      if (!order) return { handled: false, reason: 'order_not_found' };
      if (order.status === 'paid') return { handled: true, skipped: 'already_paid' };

      await this.attemptModel.create({
        orderId: order.id,
        amount: order.amountDue,
        status: 'failed',
        provider: 'stripe',
        method: 'Card (Stripe)',
        cardLast4: null,
        reference: pi.id,
        failureReason: pi.last_payment_error?.message || 'Payment failed.',
      } as any);
      await order.update({ status: 'pending' as OrderStatus, amountPaid: 0 });
      return { handled: true, orderId: order.id, event: event.type };
    }

    return { handled: false, event: event.type };
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
      attributes: [ 'id', 'name', 'status', 'year', 'county', 'state', 'customerUserId', 'clientEmail', 'clientName', 'orderId', 'certifiedReportUrl', 'certifiedReportFileName', 'createdAt', 'updatedAt', ],
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
          certifiedReportUrl: p.certifiedReportUrl,
          certifiedReportFileName: p.certifiedReportFileName,
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
        const seedName = order.organization?.trim() ? `${order.organization.trim()} Scorecard` : `${order.packageName} - ${order.customerName}`;
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
          clientName: order.organization || order.customerName,
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

    if (String(order.provider || '').toLowerCase() !== 'invoice') {
      throw new BadRequestException('Only Invoice / mail check orders can be marked paid manually.');
    }
    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid in full.');
    }
    if (order.status === 'refunded') {
      throw new BadRequestException('Order was refunded and cannot be marked paid.');
    }
    if (order.status !== 'pending' && order.status !== 'failed') {
      throw new BadRequestException(`Order cannot be marked paid (status: ${order.status}).`);
    }

    return this.finalizePaidOrder(orderId, {
      provider: 'invoice',
      method: 'Invoice / mail check',
      reference: `MANUAL-${order.orderNumber}`,
    });
  }

  async stubPay(orderId: string, dto: StubPayDto, user: AuthUser) {
    if (!this.stubPayAllowed()) {
      throw new ForbiddenException('Stub payments are disabled. Set PAYMENT_PROVIDER=stub for local fake-card checkout, or ALLOW_STUB_PAY=true for admin stub while using Stripe.');
    }

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (String(order.provider || '').toLowerCase() === 'invoice') {
      throw new BadRequestException(
        'This order uses Invoice / mail check. Use Mark as paid (super admin) instead of card payment.',
      );
    }
    this.assertOwner(order, user);

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid in full.');
    }
    if (order.status === 'refunded') {
      throw new BadRequestException('Order was refunded and cannot be charged again.');
    }
    if (order.status !== 'pending' && order.status !== 'failed') {
      throw new BadRequestException(`Order cannot be paid (status: ${order.status}).`);
    }

    const digits = String(dto.cardNumber || '').replace(/\D/g, '');
    if (digits.length < 13) {
      throw new BadRequestException('Card number must be 13–19 digits.');
    }
    const last4 = digits.slice(-4);
    const decline = dto.forceFail === true || digits.endsWith('0002');
    const reference = `STUB-${Date.now().toString(36).toUpperCase()}-${last4}`;

    if (decline) {
      await this.attemptModel.create({
        orderId: order.id,
        amount: order.amountDue,
        status: 'failed',
        provider: 'stub',
        method: 'Card (Stub)',
        cardLast4: last4,
        reference,
        failureReason: 'Your card was declined. Please try another card.',
      } as any);

      await order.update({ status: 'pending' as OrderStatus, amountPaid: 0 });

      throw new BadRequestException({
        success: false,
        message: 'Payment failed: card declined. Your order is still open - try another card to complete payment.',
        data: await this.findOne(order.id),
      });
    }

    return this.finalizePaidOrder(order.id, {
      provider: 'stub',
      method: 'Card (Stub)',
      reference,
      cardLast4: last4,
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
      provider: order.provider || 'stub',
      method: 'Full refund (Stub)',
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

    const frontendBase = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(/\/+$/, '');
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

 
  async sendCertifiedReportEmail( projectId: string, opts: { isResend?: boolean; orderId?: string } = {}, ): Promise<{ sent: boolean; skipped?: boolean; reason?: string; to?: string }> {
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

    const downloadUrl = String(project.certifiedReportUrl || '').trim();
    if (!downloadUrl) {
      throw new BadRequestException('Certified report PDF is required before sending the delivery email.');
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
    const reportFileName = String(project.certifiedReportFileName || '').trim() || 'Certified-Scorecard-Report.pdf';
    const isResend = Boolean(opts.isResend);

    const templateData = {
      customerName,
      orderNumber: order.orderNumber,
      projectName: project.name,
      reportFileName,
      downloadUrl,
      isResend,
    };

    const { logoUrl, attachments } = this.resolveEmailLogo();
    const subject = isResend ? `Updated scorecard report - ${project.name} (${order.orderNumber})` : `Your scorecard report is ready - ${project.name} (${order.orderNumber})`;

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
    const result = await this.sendCertifiedReportEmail(projectId, {
      isResend: true,
      orderId,
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
    const frontendBase = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/+$/, '');
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

    const frontendBase = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/+$/, '');
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
