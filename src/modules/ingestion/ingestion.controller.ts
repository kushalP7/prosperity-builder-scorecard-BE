import { Controller, Get, Post, Param } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller(['api/v1/ingestion', 'ingestion'])
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get('project/:projectId')
  async getStagedData(@Param('projectId') projectId: string) {
    return this.ingestionService.getStagedData(projectId);
  }

  @Post('project/:projectId/trigger')
  async triggerIngestion(@Param('projectId') projectId: string) {
    return this.ingestionService.triggerIngestion(projectId);
  }
}
