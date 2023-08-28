import { IsDateString, IsInt, IsPositive } from 'class-validator';

export class CreatePublicationDto {
  @IsInt()
  @IsPositive()
  mediaId: number;

  @IsInt()
  @IsPositive()
  postId: number;

  @IsDateString()
  date: string;
}
