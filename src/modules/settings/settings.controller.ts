import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Settings')
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application profile settings and score rating bands' })
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return { success: true, data: settings };
  }

  @Put()
  @ApiOperation({ summary: 'Update company profile and rating bands' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const updated = await this.settingsService.updateSettings(dto);
    return { success: true, data: updated };
  }
}
