import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async create(
    data: {
      projectId: string;
      url: string;
      eventTypes: string[];
      secret?: string;
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

    return this.prisma.webhooks.create({
      data: {
        projectId: data.projectId,
        url: data.url,
        eventTypes: data.eventTypes,
        secret: data.secret,
        createdBy: userId,
      },
    });
  }

  async findAll(projectId: string, tenantId: string) {
    // Verify project
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
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

    return this.prisma.webhooks.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      url?: string;
      eventTypes?: string[];
      secret?: string;
      isActive?: boolean;
    },
    tenantId: string,
  ) {
    // Verify webhook
    const webhook = await this.prisma.webhooks.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!webhook) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Webhook not found',
        404,
      );
    }

    return this.prisma.webhooks.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    // Verify webhook
    const webhook = await this.prisma.webhooks.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!webhook) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Webhook not found',
        404,
      );
    }

    await this.prisma.webhooks.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Webhook deleted' };
  }

  // Helper method to trigger webhooks for events
  async triggerWebhooks(
    projectId: string,
    eventType: string,
    payload: any,
  ) {
    const webhooks = await this.prisma.webhooks.findMany({
      where: {
        projectId,
        isActive: true,
        eventTypes: { has: eventType },
        deletedAt: null,
      },
    });

    const promises = webhooks.map(webhook => 
      this.sendWebhook(webhook, eventType, payload)
    );

    await Promise.allSettled(promises);
  }

  private async sendWebhook(
    webhook: any,
    eventType: string,
    payload: any,
  ) {
    try {
      const body = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (webhook.secret) {
        headers['X-Webhook-Secret'] = webhook.secret;
      }

      await firstValueFrom(
        this.httpService.post(webhook.url, body, { headers, timeout: 5000 })
      );

      // Update last triggered
      await this.prisma.webhooks.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
        },
      });
    } catch (error) {
      // Log error but don't throw
      console.error(`Webhook ${webhook.id} failed:`, error);
    }
  }
}
