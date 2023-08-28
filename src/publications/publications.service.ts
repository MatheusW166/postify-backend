import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationsRepository } from './publications.repository';
import { MediasService } from '@/medias/medias.service';
import { PostsService } from '@/posts/posts.service';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly publicationRepository: PublicationsRepository,
    private readonly mediasService: MediasService,
    private readonly postsService: PostsService,
  ) {}

  async create(createPublicationDto: CreatePublicationDto) {
    const { mediaId, postId } = createPublicationDto;

    await this.mediasService.findOne(mediaId);
    await this.postsService.findOne(postId);

    return this.publicationRepository.create(createPublicationDto);
  }

  async findAll(published?: boolean, after?: Date) {
    return this.publicationRepository.findAll(published, after);
  }

  async findOne(id: number) {
    const pub = await this.publicationRepository.findOne(id);
    if (!pub) throw new NotFoundException();
    return pub;
  }

  async update(id: number, updatePublicationDto: UpdatePublicationDto) {
    const publication = await this.findOne(id);
    const isPublished = publication.date.getTime() < Date.now();
    if (isPublished) throw new ForbiddenException();

    const { mediaId, postId } = updatePublicationDto;
    await this.mediasService.findOne(mediaId);
    await this.postsService.findOne(postId);

    return this.publicationRepository.update(id, updatePublicationDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.publicationRepository.remove(id);
  }
}
