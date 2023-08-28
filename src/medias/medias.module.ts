import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { MediasRepository } from './medias.repository';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  exports: [MediasService],
  controllers: [MediasController],
  providers: [MediasService, MediasRepository],
})
export class MediasModule {}
