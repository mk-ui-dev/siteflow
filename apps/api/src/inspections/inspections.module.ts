import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { InspectionsPhotosService } from './inspections-photos.service';
import { InspectionsPhotosController } from './inspections-photos.controller';

@Module({
  controllers: [InspectionsController, InspectionsPhotosController],
  providers: [InspectionsService, InspectionsPhotosService],
  exports: [InspectionsService, InspectionsPhotosService],
})
export class InspectionsModule {}
