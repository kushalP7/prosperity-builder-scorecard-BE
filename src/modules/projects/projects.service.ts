import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { TemplateCategory } from '../templates/entities/template-category.entity';
import { TemplateGroup } from '../templates/entities/template-group.entity';
import { TemplateColumn } from '../templates/entities/template-column.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DataUpdateItemDto } from './dto/update-project-data.dto';

import { Inject, forwardRef, Optional } from '@nestjs/common';
import { ScorecardCalcService } from '../engine/scorecard-calc.service';
import { ScorecardRollup } from '../engine/entities/scorecard-rollup.entity';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { projectSlotsForPackage } from '../../common/package-allowance';
import { isValidSeFips, resolveSeFips } from '../../common/se-counties';
import { isValidSePlace, resolveSePlace } from '../../common/se-places';
import { getErrorMessage } from '../../common/errors';
import { LICENSED_SOURCE_LABELS, LicensedProvider, resolveMetricFillPolicy } from '../../common/metric-source-policy';
import { LicensedImportDto } from './dto/licensed-import.dto';

export type ActorUser = { id: string; email?: string; role?: string };

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(TemplateSection) private templateSectionModel: typeof TemplateSection,
    @InjectModel(Order) private orderModel: typeof Order,
    private sequelize: Sequelize,
    @Inject(forwardRef(() => ScorecardCalcService))
    private scorecardCalcService: ScorecardCalcService,
    @Optional()
    @Inject(forwardRef(() => OrdersService))
    private ordersService?: OrdersService,
  ) { }

  private formatProject(project: Project): any {
    const json = project.toJSON() as any;
    const dataMap: Record<string, Record<string, any>> = {};

    if (project.records) {
      for (const rec of project.records) {
        if (!dataMap[rec.nodeId]) {
          dataMap[rec.nodeId] = {};
        }
        dataMap[rec.nodeId][rec.columnId] = {
          value: rec.value,
          source: rec.source,
          notes: rec.notes,
          scoreValue: rec.scoreValue,
        };
      }
    }

    json.data = dataMap;
    json.assignedSections = json.assignedSections || [];
    json.enabledWidgets = json.enabledWidgets || [];
    json.rollup = project.rollup ? (typeof (project.rollup as any).toJSON === 'function' ? (project.rollup as any).toJSON() : project.rollup) : null;
    return json;
  }

  private formatProjectSummary(project: Project): any {
    const json = project.toJSON() as any;
    delete json.records;

    const rawSections = Array.isArray(json.assignedSections) ? json.assignedSections : [];
    json.assignedSections = rawSections.map((s: any) => ({
      id: s.id,
      label: s.label || s.name || '',
      name: s.label || s.name || '',
    }));

    json.data = {};
    json.enabledWidgets = json.enabledWidgets || [];
    json.rollup = project.rollup ? (typeof (project.rollup as any).toJSON === 'function' ? (project.rollup as any).toJSON() : project.rollup) : null;
    return json;
  }

  private isCustomerRole(role?: string) {
    const r = String(role || '').toLowerCase();
    return r === 'customer' || r === 'subscriber' || r === 'client_viewer' || r === 'viewer';
  }

  assertCustomerCanAccessProject(project: Project | any, actor?: ActorUser | null) {
    if (!actor || !this.isCustomerRole(actor.role)) return;
    const ownerId = project.customerUserId;
    const email = String(actor.email || '').toLowerCase();
    const clientEmail = String(project.clientEmail || '').toLowerCase();
    if (ownerId && ownerId === actor.id) return;
    if (!ownerId && email && clientEmail && email === clientEmail) return;
    throw new ForbiddenException('You do not have access to this project.');
  }

  async countForCustomer(customerUserId: string): Promise<number> {
    return this.projectModel.count({
      where: {
        customerUserId,
        deleted: { [Op.ne]: true },
      },
    });
  }

  async countForOrder(orderId: string): Promise<number> {
    if (!orderId) return 0;
    return this.projectModel.count({
      where: {
        orderId,
        deleted: { [Op.ne]: true },
      },
    });
  }

  private async findPaidOrdersForCustomer(customerUserId: string, customerEmail?: string) {
    const where: any = { status: 'paid' };
    if (customerEmail) {
      where[Op.or] = [
        { customerUserId },
        { customerEmail: String(customerEmail).toLowerCase() },
      ];
    } else {
      where.customerUserId = customerUserId;
    }
    return this.orderModel.findAll({
      where,
      order: [
        ['paidAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }


  async findOrderWithOpenSlot(customerUserId: string, customerEmail?: string): Promise<Order | null> {
    const paidOrders = await this.findPaidOrdersForCustomer(customerUserId, customerEmail);
    for (const order of paidOrders) {
      const slots = projectSlotsForPackage(order.packageType);
      if (slots <= 0) continue;
      const used = await this.countForOrder(order.id);
      if (used < slots) return order;
    }
    return null;
  }

  async getCustomerAllowance(customerUserId: string, customerEmail?: string) {
    const paidOrders = await this.findPaidOrdersForCustomer(customerUserId, customerEmail);
    const orderIds = paidOrders.map((o) => o.id);
    const maxProjects = paidOrders.reduce(
      (sum, o) => sum + projectSlotsForPackage(o.packageType),
      0,
    );

    let usedProjects = 0;
    if (orderIds.length > 0) {
      usedProjects = await this.projectModel.count({
        where: {
          deleted: { [Op.ne]: true },
          [Op.or]: [
            { orderId: { [Op.in]: orderIds } },
            { orderId: null, customerUserId },
          ],
        },
      });
    } else {
      usedProjects = await this.countForCustomer(customerUserId);
    }

    const paidPackages: Array<{ orderId: string; orderNumber: string; packageType: string; packageName: string; slots: number; usedSlots: number; remainingSlots: number; }> = [];
    for (const o of paidOrders) {
      const slots = projectSlotsForPackage(o.packageType);
      const usedSlots = await this.countForOrder(o.id);
      paidPackages.push({
        orderId: o.id,
        orderNumber: o.orderNumber,
        packageType: o.packageType,
        packageName: o.packageName,
        slots,
        usedSlots,
        remainingSlots: Math.max(0, slots - usedSlots),
      });
    }

    return {
      maxProjects,
      usedProjects,
      remaining: Math.max(0, maxProjects - usedProjects),
      paidPackages,
    };
  }

  async assertCustomerCanCreateProject(actor: ActorUser) {
    if (!this.isCustomerRole(actor.role)) return;
    const allowance = await this.getCustomerAllowance(actor.id, actor.email);
    if (allowance.maxProjects <= 0) {
      throw new ForbiddenException('Purchase a package before creating a scorecard project.');
    }
    if (allowance.remaining <= 0) {
      throw new BadRequestException(`Project limit reached (${allowance.usedProjects}/${allowance.maxProjects}) for your subscription.`);
    }
    const open = await this.findOrderWithOpenSlot(actor.id, actor.email);
    if (!open) {
      throw new BadRequestException(`No open project slots on your paid packages (${allowance.usedProjects}/${allowance.maxProjects}).`);
    }
  }

  async resolveOrderIdForCustomerCreate( actor: ActorUser, requestedOrderId?: string | null ): Promise<string> {
    if (requestedOrderId) {
      const order = await this.orderModel.findByPk(requestedOrderId);
      if (!order || order.status !== 'paid') {
        throw new BadRequestException('Selected order is not a paid package.');
      }
      const owns =
        order.customerUserId === actor.id ||
        (actor.email &&
          String(order.customerEmail || '').toLowerCase() === String(actor.email).toLowerCase());
      if (!owns) {
        throw new ForbiddenException('You cannot create a project on this order.');
      }
      const slots = projectSlotsForPackage(order.packageType);
      const used = await this.countForOrder(order.id);
      if (used >= slots) {
        throw new BadRequestException(`Order ${order.orderNumber} has no open project slots (${used}/${slots}).`);
      }
      return order.id;
    }

    const open = await this.findOrderWithOpenSlot(actor.id, actor.email);
    if (!open) {
      throw new BadRequestException('No open project slots on your paid packages.');
    }
    return open.id;
  }

  async findAll( options?: { search?: string; page?: number; limit?: number; customerUserId?: string; status?: string; } | string ): Promise<any> {
    let search: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;
    let customerUserId: string | undefined;
    let status: string | undefined;

    if (typeof options === 'object' && options !== null) {
      search = options.search;
      page = options.page;
      limit = options.limit;
      customerUserId = options.customerUserId;
      status = options.status;
    } else if (typeof options === 'string') {
      search = options;
    }

    const where: any = {
      deleted: { [Op.ne]: true },
    };
    if (customerUserId) {
      where.customerUserId = customerUserId;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: s } },
        { clientName: { [Op.iLike]: s } },
        { county: { [Op.iLike]: s } },
        { state: { [Op.iLike]: s } },
      ];
    }

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 9);
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await this.projectModel.findAndCountAll({
        where,
        include: [
          { model: ScorecardRollup, as: 'rollup' },
        ],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true,
      });

      return {
        data: rows.map((p) => this.formatProjectSummary(p)),
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      };
    }

    const projects = await this.projectModel.findAll({
      where,
      include: [
        { model: ScorecardRollup, as: 'rollup' },
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });

    return projects.map((p) => this.formatProjectSummary(p));
  }

  private normalizeProjectGeo(dto: {
    state?: string;
    county?: string;
    city?: string;
    stateFips?: string;
    countyFips?: string;
    placeFips?: string;
    jurisdictionType?: string;
    locationConfirmed?: boolean;
  }): Record<string, any> {
    const jurisdiction = String(dto.jurisdictionType || 'COUNTY').toUpperCase() === 'CITY' ? 'CITY' : 'COUNTY';

    const hasLocationFields = dto.state != null || dto.county != null || dto.city != null || dto.stateFips != null || dto.countyFips != null || dto.placeFips != null;

    if (!hasLocationFields) {
      const partial: Record<string, any> = {};
      if (dto.jurisdictionType != null) partial.jurisdictionType = jurisdiction;
      if (dto.locationConfirmed !== undefined) partial.locationConfirmed = dto.locationConfirmed;
      return partial;
    }

    const confirmed =
      dto.locationConfirmed !== undefined ? dto.locationConfirmed : true;

    if (jurisdiction === 'CITY') {
      const resolved =
        dto.state && dto.city ? resolveSePlace(dto.state, dto.city) : null;
      const stateFips = (resolved?.stateFips || dto.stateFips || '').trim().padStart(2, '0');
      const placeFips = (resolved?.placeFips || dto.placeFips || '').trim().padStart(5, '0');
      const state = resolved?.stateName || dto.state;
      const city = resolved?.placeName || dto.city;

      if (!stateFips || !placeFips || !isValidSePlace(stateFips, placeFips)) {
        throw new BadRequestException( 'Select a valid Southeast state and city/place (NC, SC, GA, TN, FL, AL, MS, VA).');
      }

      return {
        jurisdictionType: 'CITY',
        state,
        city,
        stateFips,
        placeFips,
        locationConfirmed: confirmed,
      };
    }

    const resolved =
      dto.state && dto.county ? resolveSeFips(dto.state, dto.county) : null;

    const stateFips = (resolved?.stateFips || dto.stateFips || '').trim().padStart(2, '0');
    const countyFips = (resolved?.countyFips || dto.countyFips || '').trim().padStart(3, '0');
    const state = resolved?.state.name || dto.state;
    const county = resolved?.county.name || dto.county;

    if (!stateFips || !countyFips || !isValidSeFips(stateFips, countyFips)) {
      throw new BadRequestException('Select a valid Southeast state and county (NC, SC, GA, TN, FL, AL, MS, VA).');
    }

    return {
      jurisdictionType: 'COUNTY',
      state,
      county,
      stateFips,
      countyFips,
      city: dto.city || null,
      placeFips: null,
      locationConfirmed: confirmed,
    };
  }

  async create(dto: CreateProjectDto): Promise<any> {
    const geo = this.normalizeProjectGeo(dto);
    const project = await this.projectModel.create({
      ...dto,
      ...geo,
      locationConfirmed: geo.locationConfirmed !== undefined ? geo.locationConfirmed : dto.locationConfirmed === true,
      assignedSections: [],
      enabledWidgets: [],
      deleted: false,
      deletedAt: null,
    } as any);
    await this.scorecardCalcService.calculateAllRowsForProject(project.id).catch((err: unknown) => {
      console.error('Error calculating scorecard for new project:', getErrorMessage(err));
    });
    return this.findOne(project.id);
  }

  async findOne(id: string, actor?: ActorUser | null): Promise<any> {
    const project = await this.projectModel.findOne({
      where: {
        id,
        deleted: { [Op.ne]: true },
      },
      include: [
        { model: ProjectDataRecord, as: 'records', separate: true },
        { model: ScorecardRollup, as: 'rollup' },
      ],
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    this.assertCustomerCanAccessProject(project, actor);
    return this.formatProject(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<any> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    const geo = this.normalizeProjectGeo(dto);
    await projectModel.update({ ...dto, ...geo } as any);
    if (dto.assignedSections) {
      await this.scorecardCalcService.calculateAllRowsForProject(id).catch((err: unknown) => {
        console.error('Error calculating scorecard after updating assigned sections:', getErrorMessage(err));
      });
    }
    return this.findOne(id);
  }

  async assignSections(projectId: string, sectionIds: string[]): Promise<any> {
    const projectModel = await this.projectModel.findByPk(projectId);
    if (!projectModel) throw new NotFoundException(`Project ${projectId} not found`);

    if (!sectionIds || sectionIds.length === 0) {
      return this.findOne(projectId);
    }

    const sectionTemplates = await this.templateSectionModel.findAll({
      where: {
        id: sectionIds,
      },
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
        },
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
            },
          ],
        },
      ],
    });

    if (!sectionTemplates || sectionTemplates.length === 0) {
      throw new NotFoundException(`No template sections found for the provided IDs`);
    }

    let assignedSections: any[] = [...(projectModel.assignedSections || [])];

    for (const sectionTemplate of sectionTemplates) {
      const clonedSection = JSON.parse(JSON.stringify(sectionTemplate.toJSON()));
      const existingIndex = assignedSections.findIndex(
        (s: any) =>
          s.id === clonedSection.id ||
          (clonedSection.versionGroupId && s.versionGroupId === clonedSection.versionGroupId) ||
          (s.label && clonedSection.label && s.label.trim().toLowerCase() === clonedSection.label.trim().toLowerCase()),
      );

      if (existingIndex >= 0) {
        assignedSections[existingIndex] = clonedSection;
      } else {
        assignedSections.push(clonedSection);
      }
    }

    await projectModel.update({ assignedSections });

    await this.scorecardCalcService.calculateAllRowsForProject(projectId).catch((err: unknown) => {
      console.error('Error calculating scorecard after assigning sections:', getErrorMessage(err));
    });

    return this.findOne(projectId);
  }

  async assignSection(projectId: string, sectionId: string): Promise<any> {
    return this.assignSections(projectId, [sectionId]);
  }

  async updateData(projectId: string, updates: DataUpdateItemDto[]): Promise<void> {
    const transaction = await this.sequelize.transaction();
    let hasBaseUpdate = false;
    try {
      for (const update of updates) {
        if (update.columnId === '__base__') {
          hasBaseUpdate = true;
        }
        await this.recordModel.upsert(
          {
            projectId,
            nodeId: update.nodeId,
            columnId: update.columnId,
            value: update.data.value,
            source: update.data.source,
            notes: update.data.notes,
            scoreValue: update.data.scoreValue,
          },
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error: unknown) {
      await transaction.rollback();
      throw error;
    }

    if (this.scorecardCalcService) {
      this.scorecardCalcService.calculateAllRowsForProject(projectId).catch((err: unknown) => {
        console.error('Error during automatic scorecard recalculation:', getErrorMessage(err));
      });
    }
  }

  async recalculate(id: string): Promise<any> {
    if (this.scorecardCalcService) {
      await this.scorecardCalcService.calculateAllRowsForProject(id);
    }
    const project = await this.projectModel.findByPk(id);
    if (project && project.status !== ProjectStatus.PUBLISHED) {
      await project.update({ status: ProjectStatus.CALCULATED });
      await this.ordersService?.syncTimelineForProject(id, ProjectStatus.CALCULATED);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update({
      deleted: true,
      deletedAt: new Date(),
    });
  }

  async restore(id: string): Promise<any> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update({
      deleted: false,
      deletedAt: null,
    });
    return this.findOne(id);
  }

  async listLicensedEmptyMetrics(projectId: string) {
    const project = await this.findOne(projectId);
    const data = project.data || {};
    const empty: Array<{
      nodeId: string;
      label: string;
      category: string;
      section: string;
      expectedProvider: string | null;
      mode: string;
    }> = [];

    for (const section of project.assignedSections || []) {
      for (const cat of section.categories || []) {
        const nodes = cat.groups?.length ? cat.groups : [cat];
        for (const node of nodes) {
          const label = String(node.label || '');
          const policy = resolveMetricFillPolicy(label);
          if (policy.mode !== 'ADMIN_EMPTY') continue;
          const rec = data[node.id]?.['__base__'];
          const val = rec?.value;
          const blank = val === undefined || val === null || String(val).trim() === '';
          if (!blank) continue;
          empty.push({
            nodeId: node.id,
            label,
            category: cat.label || '',
            section: section.label || section.name || '',
            expectedProvider: policy.provider || null,
            mode: policy.mode,
          });
        }
      }
    }

    return {
      projectId,
      emptyCount: empty.length,
      empty,
    };
  }

  async importLicensedData(projectId: string, dto: LicensedImportDto, actorEmail?: string) {
    const project = await this.findOne(projectId);
    const provider = dto.provider as LicensedProvider;
    const sourceLabel = LICENSED_SOURCE_LABELS[provider];
    const labelIndex = new Map<string, string>();

    for (const section of project.assignedSections || []) {
      for (const cat of section.categories || []) {
        const nodes = cat.groups?.length ? cat.groups : [cat];
        for (const node of nodes) {
          const key = String(node.label || '').trim().toLowerCase();
          if (key) labelIndex.set(key, node.id);
        }
      }
    }

    const matched: Array<{ nodeId: string; label: string; value: any }> = [];
    const skipped: Array<{ row: any; reason: string }> = [];

    for (const row of dto.rows || []) {
      let nodeId = row.nodeId?.trim();
      const rawLabel = String(row.metricLabel || '').trim();
      if (!nodeId && rawLabel) {
        nodeId = labelIndex.get(rawLabel.toLowerCase());
      }
      if (!nodeId) {
        skipped.push({ row, reason: 'No matching scorecard node for metricLabel/nodeId' });
        continue;
      }

      const nodeLabel = [...labelIndex.entries()].find(([, id]) => id === nodeId)?.[0] || rawLabel;
      const policy = resolveMetricFillPolicy(nodeLabel);
      if (policy.mode === 'ADMIN_EMPTY' && policy.provider && policy.provider !== provider) {
        skipped.push({ row, reason: `Metric expects ${policy.provider}, import provider is ${provider}`, });
        continue;
      }

      const rawVal = String(row.value ?? '').trim();
      if (rawVal === '') {
        skipped.push({ row, reason: 'Empty value' });
        continue;
      }
      const numVal = Number(rawVal);
      const value = Number.isFinite(numVal) && rawVal !== '' ? numVal : rawVal;

      matched.push({ nodeId, label: rawLabel || nodeLabel, value });
      await this.recordModel.upsert({
        projectId,
        nodeId,
        columnId: '__base__',
        value,
        source: sourceLabel,
        notes:
          row.notes ||
          `Licensed import (${sourceLabel}) by ${actorEmail || 'staff'} at ${new Date().toISOString()}`,
        scoreValue: typeof value === 'number' ? value : null,
      } as any);
    }

    if (matched.length > 0) {
      await this.scorecardCalcService.calculateAllRowsForProject(projectId).catch((err: unknown) => {
        console.error('Error calculating scorecard after licensed import:', getErrorMessage(err));
      });
    }

    return {
      provider,
      sourceLabel,
      matchedCount: matched.length,
      skippedCount: skipped.length,
      matched,
      skipped,
    };
  }
}
