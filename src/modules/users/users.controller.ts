import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users Management (RBAC)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('super_admin', 'project_lead')
  @ApiOperation({ summary: 'List all team members and assigned roles' })
  async findAll(@Query('search') search?: string) {
    const data = await this.usersService.findAll(search);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('super_admin', 'project_lead')
  @ApiOperation({ summary: 'Get single user profile by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create user with assigned role (Super Admin only)' })
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, data, message: 'User created successfully' };
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update user permissions or details (Super Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, data, message: 'User updated successfully' };
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remove user account (Super Admin only)' })
  async delete(@Param('id') id: string) {
    const res = await this.usersService.delete(id);
    return res;
  }
}
