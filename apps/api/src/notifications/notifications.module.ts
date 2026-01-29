import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  controllers: [NotificationsController, WebhooksController],
  providers: [NotificationsService, WebhooksService],
  exports: [NotificationsService, WebhooksService],
})
export class NotificationsModule {}
