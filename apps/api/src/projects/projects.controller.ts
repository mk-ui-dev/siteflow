import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('projects')
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PROJECT_VIEW)
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.projectsService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROJECT_VIEW)
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.projectsService.findOne(id, tenantId);
  }
}
