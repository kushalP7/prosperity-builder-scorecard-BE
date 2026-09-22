import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateWidgetDto } from './dto/create-widget.dto';

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('widgets')
  @ApiOperation({ summary: 'Get all analytics widgets' })
  async findAllWidgets() {
    const widgets = await this.analyticsService.findAllWidgets();
    return { success: true, data: widgets };
  }

  @Post('widgets')
  @ApiOperation({ summary: 'Create a new analytics widget' })
  async createWidget(@Body() dto: CreateWidgetDto) {
    const widget = await this.analyticsService.createWidget(dto);
    return { success: true, data: widget };
  }

  @Patch('widgets/:id')
  @ApiOperation({ summary: 'Update analytics widget configuration' })
  async updateWidget(@Param('id') id: string, @Body() dto: Partial<CreateWidgetDto>) {
    const widget = await this.analyticsService.updateWidget(id, dto);
    return { success: true, data: widget };
  }

  @Delete('widgets/:id')
  @ApiOperation({ summary: 'Delete analytics widget' })
  async deleteWidget(@Param('id') id: string) {
    await this.analyticsService.deleteWidget(id);
    return { success: true, message: 'Widget deleted successfully' };
  }

  @Get('project/:projectId/widget/:widgetId')
  @ApiOperation({ summary: 'Calculate data points for a widget on a specific project' })
  async evaluateProjectWidget(@Param('projectId') projectId: string, @Param('widgetId') widgetId: string) {
    const dataPoints = await this.analyticsService.evaluateProjectWidget(projectId, widgetId);
    return { success: true, data: dataPoints };
  }

  @Get('overall')
  @ApiOperation({ summary: 'Get multi-project overall analytics benchmarking and sector averages' })
  async getOverallAnalytics() {
    const overall = await this.analyticsService.getOverallAnalytics();
    return { success: true, data: overall };
  }
}
