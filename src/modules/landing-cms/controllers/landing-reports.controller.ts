import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LandingReportsService } from '../services/landing-reports.service';
import { CreateLandingReportDto } from '../dto/create-landing-report.dto';
import { UpdateLandingReportDto } from '../dto/update-landing-report.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Landing CMS Reports')
@Controller(['api/v1/landing-cms/reports', 'landing-cms/reports'])
export class LandingReportsController {
  constructor(private readonly reportsService: LandingReportsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all landing page reports (public)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('year') year?: string,
    @Query('type') type?: string,
  ) {
    const featuredOnly = featured === 'true';
    return this.reportsService.findAll({
      status,
      featuredOnly,
      search,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
      sortBy,
      year,
      type,
    });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get report details by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.reportsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID (public)' })
  async findById(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new landing page report' })
  async create(@Body() dto: CreateLandingReportDto) {
    return this.reportsService.create(dto);
  }

  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing landing page report' })
  async update(@Param('id') id: string, @Body() dto: UpdateLandingReportDto) {
    return this.reportsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a landing page report' })
  async delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
