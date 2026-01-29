import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, ChecklistItemType } from '@siteflow/shared';

@Injectable()
export class ChecklistTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: { discipline?: string; isActive?: boolean }) {
    const where: any = {
      tenantId,
    };

    if (filters?.discipline) where.discipline = filters.discipline;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.checklistTemplates.findMany({
      where,
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const template = await this.prisma.checklistTemplates.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!template) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Checklist template not found',
        404,
      );
    }

    return template;
  }

  async create(
    data: {
      name: string;
      discipline: string;
      items: Array<{
        questionText: string;
        itemType: ChecklistItemType;
        isRequired: boolean;
        requiresPhoto: boolean;
        optionsJson?: any;
        order: number;
      }>;
    },
    userId: string,
    tenantId: string,
  ) {
    // Check if template with same name exists
    const existing = await this.prisma.checklistTemplates.findFirst({
      where: {
        tenantId,
        name: data.name,
        isActive: true,
      },
    });

    if (existing) {
      throw new AppError(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        'Template with this name already exists',
        409,
      );
    }

    // Create template with items
    return this.prisma.checklistTemplates.create({
      data: {
        tenantId,
        name: data.name,
        discipline: data.discipline,
        version: 1,
        isActive: true,
        createdBy: userId,
        items: {
          create: data.items.map((item) => ({
            questionText: item.questionText,
            itemType: item.itemType,
            isRequired: item.isRequired,
            requiresPhoto: item.requiresPhoto,
            optionsJson: item.optionsJson,
            order: item.order,
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      discipline?: string;
      isActive?: boolean;
    },
    tenantId: string,
  ) {
    // Verify template exists
    const template = await this.prisma.checklistTemplates.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Template not found',
        404,
      );
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== template.name) {
      const existing = await this.prisma.checklistTemplates.findFirst({
        where: {
          tenantId,
          name: data.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError(
          ErrorCode.RESOURCE_ALREADY_EXISTS,
          'Template with this name already exists',
          409,
        );
      }
    }

    return this.prisma.checklistTemplates.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async addItem(
    templateId: string,
    data: {
      questionText: string;
      itemType: ChecklistItemType;
      isRequired: boolean;
      requiresPhoto: boolean;
      optionsJson?: any;
      order: number;
    },
    tenantId: string,
  ) {
    // Verify template
    const template = await this.prisma.checklistTemplates.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Template not found',
        404,
      );
    }

    return this.prisma.checklistTemplateItems.create({
      data: {
        templateId,
        ...data,
      },
    });
  }

  async updateItem(
    templateId: string,
    itemId: string,
    data: {
      questionText?: string;
      isRequired?: boolean;
      requiresPhoto?: boolean;
      optionsJson?: any;
      order?: number;
    },
    tenantId: string,
  ) {
    // Verify template and item
    const template = await this.prisma.checklistTemplates.findFirst({
      where: { id: templateId, tenantId },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!template || template.items.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Template or item not found',
        404,
      );
    }

    return this.prisma.checklistTemplateItems.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteItem(templateId: string, itemId: string, tenantId: string) {
    // Verify template and item
    const template = await this.prisma.checklistTemplates.findFirst({
      where: { id: templateId, tenantId },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!template || template.items.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Template or item not found',
        404,
      );
    }

    await this.prisma.checklistTemplateItems.delete({
      where: { id: itemId },
    });

    return { message: 'Item deleted' };
  }
}
