import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CalculatorService } from './calculator.service';

@Controller(['api/v1/calibration', 'calibration'])
export class CalibrationController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Get('project/:projectId/rollup')
  async getRollup(@Param('projectId') projectId: string) {
    return this.calculatorService.getRollup(projectId);
  }

  @Post('project/:projectId/calculate')
  async recalculate(@Param('projectId') projectId: string) {
    return this.calculatorService.calculateProjectScorecard(projectId);
  }

  @Post('project/:projectId/override')
  async applyCalibration(
    @Param('projectId') projectId: string,
    @Body('overrides') overrides: Record<string, any>,
    @Body('notes') notes: string,
  ) {
    return this.calculatorService.applyCalibration(projectId, overrides || {}, notes);
  }

  @Post('project/:projectId/publish')
  async publishScorecard(@Param('projectId') projectId: string) {
    return this.calculatorService.publishScorecard(projectId);
  }
}
