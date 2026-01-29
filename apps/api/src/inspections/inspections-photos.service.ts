import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, InspectionStatus } from '@siteflow/shared';

@Injectable()
export class InspectionsPhotosService {
  constructor(private prisma: PrismaService) {}

  async uploadPhoto(
    inspectionId: string,
    data: {
      answerId: string;
      fileId: string;
      caption?: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        checklistRun: {
          include: {
            answers: {
              where: { id: data.answerId },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.DRAFT) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only upload photos in DRAFT status',
        400,
      );
    }

    // Verify answer exists
    if (inspection.checklistRun.answers.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Answer not found',
        404,
      );
    }

    // Verify file exists
    const file = await this.prisma.files.findFirst({
      where: {
        id: data.fileId,
        uploadedBy: userId, // Security: only attach own files
      },
    });

    if (!file) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'File not found or unauthorized',
        404,
      );
    }

    // Create photo record
    return this.prisma.checklistRunPhotos.create({
      data: {
        answerId: data.answerId,
        fileId: data.fileId,
        caption: data.caption,
        uploadedBy: userId,
      },
      include: {
        file: true,
      },
    });
  }

  async listPhotos(inspectionId: string, tenantId: string) {
    // Verify inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        checklistRun: true,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    // Get all photos for this inspection's checklist run
    return this.prisma.checklistRunPhotos.findMany({
      where: {
        answer: {
          runId: inspection.checklistRun.id,
        },
      },
      include: {
        file: true,
        answer: {
          include: {
            templateItem: {
              select: {
                id: true,
                questionText: true,
                requiresPhoto: true,
              },
            },
          },
        },
        uploadedByUser: {
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

  async deletePhoto(
    inspectionId: string,
    photoId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.DRAFT) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only delete photos in DRAFT status',
        400,
      );
    }

    // Verify photo exists and belongs to this inspection
    const photo = await this.prisma.checklistRunPhotos.findFirst({
      where: {
        id: photoId,
        answer: {
          run: {
            inspections: {
              some: {
                id: inspectionId,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Photo not found',
        404,
      );
    }

    // Delete photo
    await this.prisma.checklistRunPhotos.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted' };
  }
}
