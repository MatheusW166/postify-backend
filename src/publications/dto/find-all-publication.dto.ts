import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class FindAllPublicationDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsDateString()
  after?: string;
}
