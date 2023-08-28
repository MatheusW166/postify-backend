import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  private readonly fkPublicationsErrorCode: string = 'P2003';

  async create(createPostDto: CreatePostDto) {
    return this.postsRepository.create(createPostDto);
  }

  async findAll() {
    return this.postsRepository.findAll();
  }

  async findOne(id: number) {
    const post = await this.postsRepository.findOne(id);
    if (!post) throw new NotFoundException();
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    await this.findOne(id);
    return this.postsRepository.update(id, updatePostDto);
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.postsRepository.remove(id);
    } catch (error) {
      if (error.code === this.fkPublicationsErrorCode) {
        throw new ForbiddenException();
      }
      throw error;
    }
  }
}
