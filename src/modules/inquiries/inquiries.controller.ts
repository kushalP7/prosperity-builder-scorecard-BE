import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Inquiries')
@Controller(['api/v1/inquiries', 'api/inquiries', 'inquiries'])
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Submit an enterprise customer inquiry' })
  async createInquiry(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createInquiry(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List inquiries (paginated) — Super Admin only' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'leadRole', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDir', required: false })
  async getInquiries(
    @Query('search') search?: string,
    @Query('leadRole') leadRole?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.inquiriesService.findAll({
      search,
      leadRole,
      status,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
      sortBy,
      sortDir,
    });
  }

  @Post(':id/send-portal-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invite County/City lead to set password and access portal' })
  @ApiResponse({ status: 200, description: 'Invite or already-registered reminder sent' })
  async sendPortalAccess(@Param('id', ParseUUIDPipe) id: string) {
    return this.inquiriesService.sendPortalAccess(id);
  }

  @Post(':id/resend-login')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend login reminder (or re-invite if still pending)' })
  async resendLogin(@Param('id', ParseUUIDPipe) id: string) {
    return this.inquiriesService.resendLogin(id);
  }
}
