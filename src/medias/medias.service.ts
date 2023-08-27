import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediasRepository } from './medias.repository';

@Injectable()
export class MediasService {
  constructor(private readonly mediasRepository: MediasRepository) {}

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

    //TODO: Checar se a media não faz parte de nenhuma publicação (403)
    return this.mediasRepository.remove(id);
  }
}
