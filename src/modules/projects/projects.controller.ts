import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, AssignSectionDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectDataDto } from './dto/update-project-data.dto';
import { LicensedImportDto } from './dto/licensed-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  private isCustomer(role?: string) {
    const r = String(role || '').toLowerCase();
    return r === 'customer' || r === 'subscriber' || r === 'client_viewer' || r === 'viewer';
  }

  @Get()
  @ApiOperation({ summary: 'Get projects (customers: own projects only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by project status (e.g. PUBLISHED)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.projectsService.findAll({
      search,
      status,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
      customerUserId: this.isCustomer(user?.role) ? user.id : undefined,
    });
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project (customers: within package slot allowance)' })
  async create(
    @CurrentUser() user: { id: string; email?: string; role?: string; name?: string },
    @Body() dto: CreateProjectDto,
  ) {
    if (this.isCustomer(user?.role)) {
      const actor = { id: user.id, email: user.email, role: user.role };
      await this.projectsService.assertCustomerCanCreateProject(actor);
      const orderId = await this.projectsService.resolveOrderIdForCustomerCreate(
        actor,
        dto.orderId,
      );
      const project = await this.projectsService.create({
        ...dto,
        customerUserId: user.id,
        clientEmail: dto.clientEmail || user.email,
        orderId,
      });
      return { success: true, data: project };
    }
    const project = await this.projectsService.create(dto);
    return { success: true, data: project };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID with assigned sections and data matrix' })
  async findOne(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
  ) {
    const project = await this.projectsService.findOne(id, user);
    return { success: true, data: project };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project settings or layout (customers: own projects, metadata only)' })
  async update(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    // Ownership enforced inside findOne for customers
    await this.projectsService.findOne(id, user);
    if (this.isCustomer(user?.role)) {
      // Customers may edit display metadata on their own projects only
      const allowed = [
        'name',
        'clientName',
        'year',
        'image',
        'state',
        'county',
        'city',
        'stateFips',
        'countyFips',
        'placeFips',
        'jurisdictionType',
        'locationConfirmed',
        'clientEmail',
      ] as const;
      const safe: Record<string, unknown> = {};
      for (const key of allowed) {
        if ((dto as any)[key] !== undefined) safe[key] = (dto as any)[key];
      }
      const project = await this.projectsService.update(id, safe as UpdateProjectDto);
      return { success: true, data: project };
    }
    const project = await this.projectsService.update(id, dto);
    return { success: true, data: project };
  }

  @Post(':id/sections')
  @ApiOperation({
    summary: 'Assign published template section snapshot(s) to project',
    description: 'Staff: any project. Customers: own projects only (catalog assign, no Section Maker edits).',
  })
  async assignSection(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
    @Body() dto: AssignSectionDto,
  ) {
    // Ownership enforced inside findOne for customers
    await this.projectsService.findOne(id, user);
    const sectionIds: string[] = dto.sectionIds && dto.sectionIds.length > 0
      ? dto.sectionIds
      : (dto.sectionId ? [dto.sectionId] : []);
    const project = await this.projectsService.assignSections(id, sectionIds);
    return { success: true, data: project };
  }

  @Patch(':id/data')
  @ApiOperation({ summary: 'Batch update data records for a project matrix' })
  async updateData(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDataDto,
  ) {
    await this.projectsService.findOne(id, user);
    if (this.isCustomer(user?.role)) {
      throw new ForbiddenException('Customers cannot edit scorecard matrix data.');
    }
    await this.projectsService.updateData(id, dto.updates);
    return { success: true, message: 'Project data updated successfully' };
  }

  @Get(':id/licensed-empty')
  @ApiOperation({
    summary: 'List Master Sources admin-empty metrics still blank (ESRI/CoStar/Moody’s/staff)',
  })
  async licensedEmpty(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
  ) {
    if (this.isCustomer(user?.role)) {
      throw new ForbiddenException('Staff only.');
    }
    await this.projectsService.findOne(id, user);
    const data = await this.projectsService.listLicensedEmptyMetrics(id);
    return { success: true, data };
  }

  @Post(':id/licensed-import')
  @ApiOperation({
    summary: 'Import licensed seat data (ESRI / CoStar / Moody’s CRE) into empty matrix cells',
  })
  async licensedImport(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
    @Body() dto: LicensedImportDto,
  ) {
    if (this.isCustomer(user?.role)) {
      throw new ForbiddenException('Staff only — licensed seats are Rose retrieve & enter.');
    }
    await this.projectsService.findOne(id, user);
    const data = await this.projectsService.importLicensedData(id, dto, user?.email);
    return { success: true, data, message: `Imported ${data.matchedCount} row(s) from ${data.sourceLabel}` };
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate project scorecard and return fresh project data' })
  async recalculate(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
  ) {
    if (this.isCustomer(user?.role)) {
      throw new ForbiddenException('Customers cannot trigger recalculation / live API sync.');
    }
    await this.projectsService.findOne(id, user);
    const project = await this.projectsService.recalculate(id);
    return { success: true, data: project, message: 'Project scorecard recalculated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete project' })
  async remove(
    @CurrentUser() user: { id: string; email?: string; role?: string },
    @Param('id') id: string,
  ) {
    if (this.isCustomer(user?.role)) {
      throw new ForbiddenException('Customers cannot delete projects.');
    }
    await this.projectsService.findOne(id, user);
    await this.projectsService.remove(id);
    return { success: true, message: 'Project deleted' };
  }
}
