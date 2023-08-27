import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MediasModule } from './medias/medias.module';
import { PostsModule } from './posts/posts.module';
import { PublicationsModule } from './publications/publications.module';
import { ConfigModule } from '@nestjs/config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? `.env.${ENV}` : '.env',
    }),
    MediasModule,
    PostsModule,
    PublicationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
