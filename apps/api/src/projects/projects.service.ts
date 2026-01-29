import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.projects.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        members: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    return project;
  }
}
