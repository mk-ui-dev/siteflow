import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.usersService.findOne(id, tenantId);
  }
}
