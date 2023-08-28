import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(createPostDto: CreatePostDto) {
    return this.prisma.post.create({ data: createPostDto });
  }

  findAll() {
    return this.prisma.post.findMany();
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  findByTitleAndText(title: string, text: string) {
    return this.prisma.post.findFirst({
      where: {
        title,
        text,
      },
    });
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({ data: updatePostDto, where: { id } });
  }

  remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }
}
