import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Inquiries')
@Controller(['api/v1/inquiries', 'api/inquiries', 'inquiries'])
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Submit an enterprise customer inquiry',
    description:
      'Captures prospect information, stores in database, sends admin alert to info@roseassociates.com, and sends an acknowledgement email to the customer.',
  })
  @ApiResponse({
    status: 201,
    description: 'Inquiry successfully submitted and queued for email dispatch.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on submitted fields.',
  })
  async createInquiry(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createInquiry(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customer inquiries (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all submitted customer inquiries.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Super Admin access required.',
  })
  async getInquiries() {
    return this.inquiriesService.findAll();
  }
}
