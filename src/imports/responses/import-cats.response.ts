import { ApiProperty } from '@nestjs/swagger';

export class ImportCatsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 120,
    description: 'Total rows read from Google Sheet',
  })
  totalRows: number;

  @ApiProperty({ example: 100, description: 'Rows that passed validation' })
  validRows: number;

  @ApiProperty({ example: 20, description: 'Rows that failed validation' })
  invalidRows: number;

  @ApiProperty({
    example: 'results/cats_export.csv',
    description: 'Relative path of the generated CSV under the working directory',
  })
  outputFile: string;

  @ApiProperty({
    example: '/assets/cats_export.csv',
    description:
      'URL path to download the file via the static assets route (prepend your server origin)',
  })
  assetUrl: string;
}
