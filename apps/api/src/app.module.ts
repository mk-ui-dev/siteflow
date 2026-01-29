import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskBlocksModule } from './task-blocks/task-blocks.module';
import { TaskDependenciesModule } from './task-dependencies/task-dependencies.module';
import { InspectionsModule } from './inspections/inspections.module';
import { IssuesModule } from './issues/issues.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { DecisionsModule } from './decisions/decisions.module';
import { FilesModule } from './files/files.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    TasksModule,
    TaskBlocksModule,
    TaskDependenciesModule,
    InspectionsModule,
    IssuesModule,
    DeliveriesModule,
    DecisionsModule,
    FilesModule,
    CommentsModule,
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
