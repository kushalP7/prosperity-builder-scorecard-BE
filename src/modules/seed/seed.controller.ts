import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Sample Data Seed')
@Controller('api/v1/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('sample-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Populate sample projects, standard 12 sections, and default metrics (Triggered by Load Sample Data button in UI)' })
  async loadSampleData() {
    await this.seedService.populateSampleData();
    return { success: true, message: 'Sample data populated successfully' };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all database tables back to clean initial sample state' })
  async resetDatabase() {
    await this.seedService.resetAndSeed();
    return { success: true, message: 'Database reset to sample state successfully' };
  }
}
