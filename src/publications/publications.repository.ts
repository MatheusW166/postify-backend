import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PublicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(createPublicationtDto: CreatePublicationDto) {
    return this.prisma.publication.create({ data: createPublicationtDto });
  }

  findAll(published?: boolean, after?: Date) {
    const options = {};
    if (published) {
      options['lte'] = new Date();
    }
    if (after) {
      options['gt'] = after;
    }
    return this.prisma.publication.findMany({
      where: { date: options },
    });
  }

  findOne(id: number) {
    return this.prisma.publication.findUnique({ where: { id } });
  }

  update(id: number, updatePublicationtDto: UpdatePublicationDto) {
    return this.prisma.publication.update({
      data: updatePublicationtDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.publication.delete({ where: { id } });
  }
}
