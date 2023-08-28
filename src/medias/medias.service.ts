import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediasRepository } from './medias.repository';

@Injectable()
export class MediasService {
  constructor(private readonly mediasRepository: MediasRepository) {}

  private readonly fkPublicationsErrorCode: string = 'P2003';

  async create(createMediaDto: CreateMediaDto) {
    const { title, username } = createMediaDto;
    const mediaFound = await this.mediasRepository.findByTitleAndUsername(
      title,
      username,
    );
    if (mediaFound) throw new ConflictException();

    return this.mediasRepository.create(createMediaDto);
  }

  async findAll() {
    return this.mediasRepository.findAll();
  }

  async findOne(id: number) {
    const media = await this.mediasRepository.findOne(id);
    if (!media) throw new NotFoundException();
    return media;
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    const { title, username } = updateMediaDto;
    const conflictingMedia = await this.mediasRepository.findByTitleAndUsername(
      title,
      username,
    );
    if (conflictingMedia) throw new ConflictException();

    await this.findOne(id);

    return this.mediasRepository.update(id, updateMediaDto);
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.mediasRepository.remove(id);
    } catch (error) {
      if (error.code === this.fkPublicationsErrorCode) {
        throw new ForbiddenException();
      }
      throw error;
    }
  }
}
