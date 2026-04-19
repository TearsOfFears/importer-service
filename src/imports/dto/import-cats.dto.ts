import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ImportCatsDto {
  @ApiProperty({
    example: 'cats.csv',
    description:
      'Output basename ending in .csv (letters, digits, ., _, - only)',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+\.csv$/, {
    message:
      'outputFileName must be a basename ending in .csv (letters, digits, ., _, - only)',
  })
  outputFileName: string;
}
