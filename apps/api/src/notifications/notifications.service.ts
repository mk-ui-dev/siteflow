import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, tenantId: string, filters?: { unreadOnly?: boolean }) {
    const where: any = {
      userId,
      user: { tenantId },
    };

    if (filters?.unreadOnly) {
      where.readAt = null;
    }

    return this.prisma.notifications.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50
    });
  }

  async findOne(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: {
        id,
        userId,
        user: { tenantId },
      },
    });

    if (!notification) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Notification not found',
        404,
      );
    }

    return notification;
  }

  async markAsRead(id: string, userId: string, tenantId: string) {
    // Verify notification
    await this.findOne(id, userId, tenantId);

    return this.prisma.notifications.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, tenantId: string) {
    const result = await this.prisma.notifications.updateMany({
      where: {
        userId,
        user: { tenantId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    };
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.notifications.create({
      data,
    });
  }

  // Helper method to create notifications for events
  async notifyEvent(
    eventType: string,
    userIds: string[],
    data: {
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    const notifications = userIds.map(userId => ({
      userId,
      title: data.title,
      message: data.message,
      type: eventType,
      entityType: data.entityType,
      entityId: data.entityId,
    }));

    await this.prisma.notifications.createMany({
      data: notifications,
    });
  }
}
