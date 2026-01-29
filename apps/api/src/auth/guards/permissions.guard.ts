import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new AppError(
        ErrorCode.AUTH_UNAUTHORIZED,
        'User not authenticated',
        401,
      );
    }

    // Get user permissions via tenant roles
    const userRoles = await this.prisma.userTenantRoles.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissionCodes = userRoles.flatMap((ur) =>
      ur.role.permissions.map((p) => p.permission.code),
    );

    const hasPermission = requiredPermissions.some((perm) =>
      userPermissionCodes.includes(perm),
    );

    if (!hasPermission) {
      throw new AppError(
        ErrorCode.AUTH_FORBIDDEN,
        'Insufficient permissions',
        403,
      );
    }

    return true;
  }
}
