import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('files')
@Controller('files')
@ApiBearerAuth()
export class FilesController {
  constructor(private service: FilesService) {}

  @Post('upload')
  @RequirePermissions(PERMISSIONS.FILE_UPLOAD)
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      projectId: string;
      entityType?: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION';
      entityId?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.upload(file, body, userId, tenantId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.FILE_VIEW)
  @ApiOperation({ summary: 'List files with filters' })
  findAll(
    @Query('projectId') projectId: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, {
      projectId,
      entityType,
      entityId,
    });
  }

  @Get('entity/:type/:id')
  @RequirePermissions(PERMISSIONS.FILE_VIEW)
  @ApiOperation({ summary: 'Get files for entity' })
  findByEntity(
    @Param('type') type: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION',
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findByEntity(type, id, tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.FILE_VIEW)
  @ApiOperation({ summary: 'Get file details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Get(':id/download')
  @RequirePermissions(PERMISSIONS.FILE_VIEW)
  @ApiOperation({ summary: 'Get presigned download URL' })
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getDownloadUrl(id, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.FILE_EDIT)
  @ApiOperation({ summary: 'Update file metadata' })
  update(
    @Param('id') id: string,
    @Body() body: { fileName?: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Post(':id/attach')
  @RequirePermissions(PERMISSIONS.FILE_EDIT)
  @ApiOperation({ summary: 'Attach file to entity' })
  attach(
    @Param('id') id: string,
    @Body()
    body: {
      entityType: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION';
      entityId: string;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.attach(id, body, tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.FILE_DELETE)
  @ApiOperation({ summary: 'Delete file' })
  delete(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.delete(id, tenantId);
  }
}
