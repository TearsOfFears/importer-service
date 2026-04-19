import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';

import { ImportGoogleSheetUseCase } from './usecases/import-google-sheet.usecase/import-google-sheet.usecase';

@Module({
  controllers: [ImportsController],
  providers: [ImportGoogleSheetUseCase],
})
export class ImportsModule {}
