import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InspectionsPhotosService } from './inspections-photos.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('inspections')
@Controller('inspections')
@ApiBearerAuth()
export class InspectionsPhotosController {
  constructor(private service: InspectionsPhotosService) {}

  @Post(':id/photos')
  @RequirePermissions(PERMISSIONS.INSPECTION_EDIT)
  @ApiOperation({ summary: 'Upload photo for checklist answer' })
  uploadPhoto(
    @Param('id') inspectionId: string,
    @Body()
    body: {
      answerId: string;
      fileId: string;
      caption?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.uploadPhoto(inspectionId, body, userId, tenantId);
  }

  @Get(':id/photos')
  @RequirePermissions(PERMISSIONS.INSPECTION_VIEW)
  @ApiOperation({ summary: 'List all photos for inspection' })
  listPhotos(
    @Param('id') inspectionId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.listPhotos(inspectionId, tenantId);
  }

  @Delete(':id/photos/:photoId')
  @RequirePermissions(PERMISSIONS.INSPECTION_EDIT)
  @ApiOperation({ summary: 'Delete photo from inspection' })
  deletePhoto(
    @Param('id') inspectionId: string,
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.deletePhoto(inspectionId, photoId, userId, tenantId);
  }
}
