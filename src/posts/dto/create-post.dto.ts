import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  title: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsUrl()
  image?: string;
}
