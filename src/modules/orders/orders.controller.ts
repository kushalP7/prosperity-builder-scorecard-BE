import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

type AuthUser = { id: string; email?: string; name?: string; role?: string };

@ApiTags('Orders & Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(['api/v1/orders', 'orders'])
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Get('packages')
  @ApiOperation({ summary: 'List subscription packages with live prices from Settings' })
  async getPackages() {
    const data = await this.ordersService.getPackages();
    return { success: true, data };
  }

  @Public()
  @Get('payment-config')
  @ApiOperation({
    summary: 'Checkout mode (invoice / mail check only)',
  })
  async paymentConfig() {
    const data = this.ordersService.getPaymentConfig();
    return { success: true, data };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Orders for the logged-in customer (Profile)' })
  async myOrders(@CurrentUser() user: AuthUser) {
    const data = await this.ordersService.findForCustomer({
      customerUserId: user.id,
      customerEmail: user.email,
    });
    return { success: true, data };
  }

  @Get('mine/allowance')
  @ApiOperation({ summary: 'Project slot allowance for the logged-in customer (Option A)' })
  async myAllowance(@CurrentUser() user: AuthUser) {
    const data = await this.ordersService.getCustomerProjectAllowance({
      customerUserId: user.id,
      customerEmail: user.email,
    });
    return { success: true, data };
  }

  @Get('mine/payments')
  @ApiOperation({ summary: 'Payment history for the logged-in customer (Profile)' })
  async myPayments(@CurrentUser() user: AuthUser) {
    const orders = await this.ordersService.findForCustomer({
      customerUserId: user.id,
      customerEmail: user.email,
    });
    const data = (orders || []).flatMap((o: any) =>
      (o.paymentAttempts || []).map((a: any) => ({
        id: a.id,
        orderId: o.id,
        orderNumber: o.orderNumber,
        packageName: o.packageName,
        packageType: o.packageType,
        amount: Number(a.amount),
        status: a.status,
        method: a.method,
        cardLast4: a.cardLast4,
        reference: a.reference,
        provider: a.provider,
        date: a.createdAt,
        projectName: o.packageName,
      })),
    );
    return { success: true, data };
  }

  @Get('payments')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'project_lead')
  @ApiOperation({ summary: 'Payment ledger for Payments module (shared Orders API)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPayments(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.ordersService.listPaymentLedger({
      status,
      search,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
    });
    return { success: true, data };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'project_lead')
  @ApiOperation({ summary: 'List all orders (Orders module)' })
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
    const data = await this.ordersService.findAll({
      status,
      search,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
    });
    return { success: true, data };
  }

  @Get(':id/receipts/:attemptId')
  @ApiOperation({ summary: 'Download branded PDF payment receipt (owner or staff)' })
  async downloadReceipt(
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const { buffer, filename } = await this.ordersService.getPaymentReceiptPdf(
      id,
      attemptId,
      user,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (owner or staff)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.ordersService.findOneForUser(id, user);
    return { success: true, data };
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Start offline checkout: create/reuse pending invoice order and email PDF (no entitlement until mark-paid)',
  })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const data = await this.ordersService.createOrder(dto, user);
    return {
      success: true,
      data,
      message:
        data?.message ||
        'Invoice emailed. Order stays pending until a super admin marks it paid.',
    };
  }

  @Post(':id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Mark Invoice / mail check order as paid (super_admin only). Unlocks package.',
  })
  async markPaid(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const data = await this.ordersService.markPaid(id, user);
    return { success: true, data, message: data.message };
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Refund a fully paid order (super_admin)' })
  async refund(@Param('id') id: string) {
    const data = await this.ordersService.refund(id);
    return { success: true, data, message: 'Order refunded successfully.' };
  }

  @Post(':id/send-reminder')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'project_lead')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Email a soft payment reminder to the order customer (pending / unpaid)',
  })
  async sendPaymentReminder(@Param('id') id: string) {
    const data = await this.ordersService.sendPaymentReminder(id);
    return { success: true, data, message: data.message };
  }

  @Post(':id/projects/:projectId/send-report')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'project_lead')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Email certified scorecard PDF download link to the customer (Orders send/resend)',
  })
  async sendProjectReport(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.ordersService.sendProjectReportForOrder(id, projectId);
    return { success: true, data, message: data.message };
  }
}
