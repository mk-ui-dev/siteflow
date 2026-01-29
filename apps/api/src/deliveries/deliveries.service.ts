import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, DeliveryStatus } from '@siteflow/shared';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: {
      projectId?: string;
      status?: DeliveryStatus;
      expectedDateFrom?: Date;
      expectedDateTo?: Date;
    },
  ) {
    const where: any = {
      project: { tenantId, deletedAt: null },
      deletedAt: null,
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.expectedDateFrom || filters?.expectedDateTo) {
      where.expectedDeliveryDate = {};
      if (filters.expectedDateFrom) {
        where.expectedDeliveryDate.gte = filters.expectedDateFrom;
      }
      if (filters.expectedDateTo) {
        where.expectedDeliveryDate.lte = filters.expectedDateTo;
      }
    }

    return this.prisma.deliveries.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        expectedDeliveryDate: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          include: {
            changedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    return delivery;
  }

  async create(
    data: {
      projectId: string;
      supplier: string;
      expectedDeliveryDate: Date;
      notes?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit: string;
      }>;
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

    // Create delivery with items
    return this.prisma.deliveries.create({
      data: {
        projectId: data.projectId,
        supplier: data.supplier,
        expectedDeliveryDate: data.expectedDeliveryDate,
        notes: data.notes,
        status: DeliveryStatus.REQUESTED,
        requestedBy: userId,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      supplier?: string;
      expectedDeliveryDate?: Date;
      notes?: string;
    },
    tenantId: string,
  ) {
    // Verify delivery
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    return this.prisma.deliveries.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });
  }

  async addItem(
    deliveryId: string,
    data: {
      description: string;
      quantity: number;
      unit: string;
    },
    tenantId: string,
  ) {
    // Verify delivery
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id: deliveryId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    if (delivery.status !== DeliveryStatus.REQUESTED && delivery.status !== DeliveryStatus.SCHEDULED) {
      throw new AppError(
        ErrorCode.DELIVERY_INVALID_STATE,
        'Can only add items to REQUESTED or SCHEDULED deliveries',
        400,
      );
    }

    return this.prisma.deliveryItems.create({
      data: {
        deliveryId,
        ...data,
      },
    });
  }

  async updateItem(
    deliveryId: string,
    itemId: string,
    data: {
      description?: string;
      quantity?: number;
      unit?: string;
    },
    tenantId: string,
  ) {
    // Verify delivery and item
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id: deliveryId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!delivery || delivery.items.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery or item not found',
        404,
      );
    }

    return this.prisma.deliveryItems.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteItem(
    deliveryId: string,
    itemId: string,
    tenantId: string,
  ) {
    // Verify delivery and item
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id: deliveryId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!delivery || delivery.items.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery or item not found',
        404,
      );
    }

    await this.prisma.deliveryItems.delete({
      where: { id: itemId },
    });

    return { message: 'Item deleted' };
  }

  async receive(
    id: string,
    actualDeliveryDate: Date,
    userId: string,
    tenantId: string,
  ) {
    // Verify delivery
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    if (delivery.status !== DeliveryStatus.IN_TRANSIT && delivery.status !== DeliveryStatus.SCHEDULED) {
      throw new AppError(
        ErrorCode.DELIVERY_INVALID_STATE,
        'Can only receive IN_TRANSIT or SCHEDULED deliveries',
        400,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.deliveries.update({
        where: { id },
        data: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate,
        },
      }),
      this.prisma.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          fromStatus: delivery.status,
          toStatus: DeliveryStatus.DELIVERED,
          changedBy: userId,
        },
      }),
    ]);

    return updated;
  }

  async confirm(
    id: string,
    notes: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify delivery
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new AppError(
        ErrorCode.DELIVERY_INVALID_STATE,
        'Can only confirm DELIVERED deliveries',
        400,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.deliveries.update({
        where: { id },
        data: {
          status: DeliveryStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedBy: userId,
          confirmNotes: notes,
        },
      }),
      this.prisma.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          fromStatus: DeliveryStatus.DELIVERED,
          toStatus: DeliveryStatus.CONFIRMED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    // Remove DELIVERY blocks related to this delivery
    await this.prisma.taskBlocks.updateMany({
      where: {
        refEntityType: 'DELIVERY',
        refEntityId: id,
        isActive: true,
      },
      data: {
        isActive: false,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });

    return updated;
  }

  async getStatusHistory(id: string, tenantId: string) {
    // Verify delivery
    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!delivery) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Delivery not found',
        404,
      );
    }

    return this.prisma.deliveryStatusHistory.findMany({
      where: { deliveryId: id },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
  }
}
