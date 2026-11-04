import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CalculatorService, CertifiedReportPayload } from './calculator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller(['api/v1/calibration', 'calibration'])
@UseGuards(JwtAuthGuard)
export class CalibrationController {
  constructor(private readonly calculatorService: CalculatorService) {}

  private assertStaff(role?: string) {
    const r = String(role || '').toLowerCase();
    if (r === 'customer' || r === 'subscriber' || r === 'client_viewer' || r === 'viewer') {
      throw new ForbiddenException('Customers cannot access calibration or publish controls.');
    }
  }

  private assertSuperAdmin(role?: string) {
    if (String(role || '').toLowerCase() !== 'super_admin') {
      throw new ForbiddenException('Only a super admin can download this report.');
    }
  }

  @Get('project/:projectId/rollup')
  async getRollup(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
  ) {
    // Customers may view rollup scores on executive scorecard; block write actions only
    return this.calculatorService.getRollup(projectId);
  }

  @Get('project/:projectId/top-low-pdf')
  async downloadTopLowPdf(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    this.assertSuperAdmin(user?.role);
    const { buffer, filename } = await this.calculatorService.getTopLowPerformingPdf(projectId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }

  @Post('project/:projectId/calculate')
  async recalculate(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
  ) {
    this.assertStaff(user?.role);
    return this.calculatorService.calculateProjectScorecard(projectId);
  }

  @Post('project/:projectId/override')
  async applyCalibration(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
    @Body('overrides') overrides: Record<string, any>,
    @Body('notes') notes: string,
  ) {
    this.assertStaff(user?.role);
    return this.calculatorService.applyCalibration(projectId, overrides || {}, notes);
  }

  @Post('project/:projectId/publish')
  async publishScorecard(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
  ) {
    this.assertStaff(user?.role);
    // Initial PDF is auto-generated; no certified upload required at publish.
    return this.calculatorService.publishScorecard(projectId);
  }

  @Post('project/:projectId/report')
  async replaceCertifiedReport(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
    @Body() body: CertifiedReportPayload,
  ) {
    this.assertStaff(user?.role);
    return this.calculatorService.replaceCertifiedReport(projectId, body);
  }
}
