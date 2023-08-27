import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MediasModule } from './medias/medias.module';
import { PostsModule } from './posts/posts.module';
import { PublicationsModule } from './publications/publications.module';

@Module({
  imports: [MediasModule, PostsModule, PublicationsModule],
  controllers: [AppController],
})
export class AppModule {}
