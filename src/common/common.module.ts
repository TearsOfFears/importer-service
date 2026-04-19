import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GOOGLE_SHEETS_SERVICE } from './services/google-sheets.service.interface';
import { GoogleSheetsService } from './services/google-sheets.service';
import { envValidationSchema } from '../../env-validation.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: GOOGLE_SHEETS_SERVICE,
      useClass: GoogleSheetsService,
    },
  ],
  exports: [GOOGLE_SHEETS_SERVICE],
})
export class CommonModule {
  static forRoot(): DynamicModule {
    return {
      module: CommonModule,
      global: true,
    };
  }
}
