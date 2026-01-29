import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.users.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404,
      );
    }

    return user;
  }
}
