import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.config.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.config.get('AWS_S3_BUCKET') || 'siteflow-files';
  }

  async upload(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    data: {
      projectId: string;
      entityType?: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION';
      entityId?: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify project
    const project = await this.prisma.projects.findFirst({
      where: {
        id: data.projectId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    // Generate unique S3 key
    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${tenantId}/${data.projectId}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to upload file to S3',
        500,
        error,
      );
    }

    // Save to database
    return this.prisma.files.create({
      data: {
        projectId: data.projectId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Key,
        entityType: data.entityType as any,
        entityId: data.entityId,
        uploadedBy: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      projectId?: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    const where: any = {
      project: { tenantId, deletedAt: null },
      deletedAt: null,
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;

    return this.prisma.files.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const file = await this.prisma.files.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        project: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'File not found',
        404,
      );
    }

    return file;
  }

  async getDownloadUrl(id: string, tenantId: string) {
    const file = await this.findOne(id, tenantId);

    // Generate presigned URL (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.s3Key,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      url,
      fileName: file.fileName,
      expiresIn: 3600,
    };
  }

  async update(
    id: string,
    data: {
      fileName?: string;
    },
    tenantId: string,
  ) {
    // Verify file
    const file = await this.prisma.files.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!file) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'File not found',
        404,
      );
    }

    return this.prisma.files.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const file = await this.findOne(id, tenantId);

    // Delete from S3
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: file.s3Key,
        }),
      );
    } catch (error) {
      // Log error but continue with DB deletion
      console.error('Failed to delete from S3:', error);
    }

    // Soft delete in database
    await this.prisma.files.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'File deleted' };
  }

  async attach(
    id: string,
    data: {
      entityType: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION';
      entityId: string;
    },
    tenantId: string,
  ) {
    // Verify file
    const file = await this.prisma.files.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!file) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'File not found',
        404,
      );
    }

    // Verify entity exists (basic check - could be enhanced)
    let entityExists = false;
    switch (data.entityType) {
      case 'TASK':
        entityExists = !!(await this.prisma.tasks.findFirst({
          where: { id: data.entityId, deletedAt: null },
        }));
        break;
      case 'INSPECTION':
        entityExists = !!(await this.prisma.inspections.findFirst({
          where: { id: data.entityId, deletedAt: null },
        }));
        break;
      case 'ISSUE':
        entityExists = !!(await this.prisma.issues.findFirst({
          where: { id: data.entityId, deletedAt: null },
        }));
        break;
      case 'DELIVERY':
        entityExists = !!(await this.prisma.deliveries.findFirst({
          where: { id: data.entityId, deletedAt: null },
        }));
        break;
      case 'DECISION':
        entityExists = !!(await this.prisma.decisions.findFirst({
          where: { id: data.entityId, deletedAt: null },
        }));
        break;
    }

    if (!entityExists) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        `${data.entityType} not found`,
        404,
      );
    }

    // Update file with entity reference
    return this.prisma.files.update({
      where: { id },
      data: {
        entityType: data.entityType as any,
        entityId: data.entityId,
      },
    });
  }

  async findByEntity(
    entityType: 'TASK' | 'INSPECTION' | 'ISSUE' | 'DELIVERY' | 'DECISION',
    entityId: string,
    tenantId: string,
  ) {
    return this.prisma.files.findMany({
      where: {
        entityType: entityType as any,
        entityId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }
}
