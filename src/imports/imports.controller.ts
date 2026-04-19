import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportCatsDto } from './dto/import-cats.dto';

import { ImportCatsResponse } from './responses/import-cats.response';
import { ImportGoogleSheetUseCase } from './usecases/import-google-sheet.usecase/import-google-sheet.usecase';

@ApiTags('imports')
@Controller('imports')
export class ImportsController {
  private readonly logger = new Logger(ImportsController.name);

  constructor(
    private readonly importGoogleSheetUseCase: ImportGoogleSheetUseCase,
  ) {}

  @Post('cats')
  @HttpCode(200)
  @ApiOkResponse({ type: ImportCatsResponse })
  @ApiOperation({
    summary: 'Import cats from the configured Google Sheet into a CSV file',
  })
  async importCats(
    @Body() importCatsDto: ImportCatsDto,
  ): Promise<ImportCatsResponse> {
    this.logger.log(
      `Starting cats import (outputFileName=${importCatsDto.outputFileName})`,
    );
    return this.importGoogleSheetUseCase.execute(importCatsDto);
  }
}
