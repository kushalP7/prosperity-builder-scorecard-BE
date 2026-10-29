import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LandingPartnersService } from '../services/landing-partners.service';
import { CreateLandingPartnerDto } from '../dto/create-landing-partner.dto';
import { UpdateLandingPartnerDto } from '../dto/update-landing-partner.dto';
import { MoveLandingPartnerDto } from '../dto/move-landing-partner.dto';

@ApiTags('Landing CMS Partners')
@Controller(['api/v1/landing-cms/partners', 'landing-cms/partners'])
export class LandingPartnersController {
  constructor(private readonly partnersService: LandingPartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all landing project partners' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.findAll({
      status,
      search,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landing partner by ID' })
  async findById(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new landing partner' })
  async create(@Body() dto: CreateLandingPartnerDto) {
    return this.partnersService.create(dto);
  }

  @Put(':id/move')
  @ApiOperation({ summary: 'Move a partner up or down in display order' })
  async move(@Param('id') id: string, @Body() dto: MoveLandingPartnerDto) {
    return this.partnersService.move(id, dto.direction);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing landing partner' })
  async update(@Param('id') id: string, @Body() dto: UpdateLandingPartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a landing partner' })
  async delete(@Param('id') id: string) {
    return this.partnersService.delete(id);
  }
}
