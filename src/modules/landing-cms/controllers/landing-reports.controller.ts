import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LandingReportsService } from '../services/landing-reports.service';
import { CreateLandingReportDto } from '../dto/create-landing-report.dto';
import { UpdateLandingReportDto } from '../dto/update-landing-report.dto';

@ApiTags('Landing CMS Reports')
@Controller('landing-cms/reports')
export class LandingReportsController {
  constructor(private readonly reportsService: LandingReportsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all landing page reports' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('status') status?: string, @Query('featured') featured?: string, @Query('search') search?: string) {
    const featuredOnly = featured === 'true';
    return this.reportsService.findAll(status, featuredOnly, search);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get report details by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.reportsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID' })
  async findById(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new landing page report' })
  async create(@Body() dto: CreateLandingReportDto) {
    return this.reportsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing landing page report' })
  async update(@Param('id') id: string, @Body() dto: UpdateLandingReportDto) {
    return this.reportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a landing page report' })
  async delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
