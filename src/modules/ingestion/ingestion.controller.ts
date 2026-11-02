import { Controller, Get, Post, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller(['api/v1/ingestion', 'ingestion'])
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  private assertStaff(role?: string) {
    const r = String(role || '').toLowerCase();
    if (r === 'customer' || r === 'subscriber' || r === 'client_viewer' || r === 'viewer') {
      throw new ForbiddenException('Customers cannot run 3rd-party data ingestion.');
    }
  }

  @Get('project/:projectId')
  async getStagedData(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
  ) {
    this.assertStaff(user?.role);
    return this.ingestionService.getStagedData(projectId);
  }

  @Post('project/:projectId/trigger')
  async triggerIngestion(
    @CurrentUser() user: { role?: string },
    @Param('projectId') projectId: string,
  ) {
    this.assertStaff(user?.role);
    return this.ingestionService.triggerIngestion(projectId);
  }
}
