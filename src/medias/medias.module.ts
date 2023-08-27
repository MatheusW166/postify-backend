import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { PrismaService } from '@/src/prisma/prisma.service';

@Module({
  imports: [PrismaService],
  controllers: [MediasController],
  providers: [MediasService],
})
export class MediasModule {}
