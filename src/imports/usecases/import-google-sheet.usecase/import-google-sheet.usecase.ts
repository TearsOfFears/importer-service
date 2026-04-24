import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { resolveResultsCsvPath } from '../../../common/utils/safe-output-path';
import { basename, dirname } from 'path';
import { CatRow, CatRowParsed, validateCatRow } from './cat-validation';
import { ImportGoogleSheetUseCaseOutput } from './import-google-sheet.usecase.output';
import {
  GOOGLE_SHEETS_SERVICE,
  IGoogleSheetsService,
} from '../../../common/services/google-sheets.service.interface';
import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable, Transform, Writable } from 'stream';
import { ImportGoogleSheetUseCaseInput } from './import-google-sheet.usecase.input';
import { CsvBatchWriterUtil } from '../../../common/utils/csv-batch-write.util';

interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

@Injectable()
export class ImportGoogleSheetUseCase {
  private readonly logger = new Logger(ImportGoogleSheetUseCase.name);
  private readonly baseUrl = this.config.getOrThrow<string>('BASE_URL');
  constructor(
    @Inject(GOOGLE_SHEETS_SERVICE)
    private readonly googleSheets: IGoogleSheetsService,
    private readonly config: ConfigService,
  ) {}

  async execute({
    outputFileName,
  }: ImportGoogleSheetUseCaseInput): Promise<ImportGoogleSheetUseCaseOutput> {
    const ctx = this.buildContext(outputFileName);

    try {
      const stats = await this.runPipeline(ctx);

      this.logger.log(
        `Import complete: total=${stats.totalRows}, valid=${stats.validRows}, invalid=${stats.invalidRows}`,
      );

      return {
        success: true,
        ...stats,
        outputFile: ctx.relativeOutput,
        assetUrl: ctx.assetUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      this.logger.error(`Google Sheet read failed: ${message}`);
      ctx.writer.destroy();

      throw new BadGatewayException(`Failed to read Google Sheet: ${message}`);
    }
  }

  private buildContext(outputFileName: string) {
    const { outputPath, relativeOutput, assetUrl } =
      this.resolveOutput(outputFileName);

    const { spreadsheetId, sheetName } = this.getSheetConfig();

    mkdirSync(dirname(outputPath), { recursive: true });

    const writer = new CsvBatchWriterUtil(outputPath);

    return {
      spreadsheetId,
      sheetName,
      writer,
      relativeOutput,
      assetUrl,
    };
  }

  private async runPipeline(ctx: {
    spreadsheetId: string;
    sheetName: string;
    writer: CsvBatchWriterUtil;
  }) {
    this.logger.log('Streaming rows from Google Sheet (pipeline mode)');

    const stats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };

    const readable = this.createReadableStream(
      ctx.spreadsheetId,
      ctx.sheetName,
    );

    const transform = this.createTransformStream(stats);
    const writable = this.createWritableStream(ctx.writer);

    await pipeline(readable, transform, writable);

    return stats;
  }
  private createReadableStream(spreadsheetId: string, sheetName: string) {
    const iterator = this.googleSheets.streamSheetRows(
      spreadsheetId,
      sheetName,
    );

    return Readable.from(iterator);
  }

  private transformRow(
    row: string[],
    headerIndex: Map<string, number>,
    claimedCatIds: Set<string>,
  ): { valid: boolean; row?: CatRow } {
    const get = (key: string): string => {
      const idx = headerIndex.get(key);
      const val = idx === undefined ? undefined : row[idx];
      return val == null ? '' : String(val).trim();
    };

    const parsed: CatRowParsed = {
      catId: get('catId'),
      name: get('name'),
      breed: get('breed'),
      ageYears: get('ageYears'),
      weightKg: get('weightKg'),
      color: get('color'),
      vaccinated: get('vaccinated'),
      notes: get('notes'),
    };

    return validateCatRow(parsed, claimedCatIds);
  }

  private buildHeaderIndex(row: string[]) {
    const map = new Map<string, number>();

    row.forEach((h, i) => {
      map.set(String(h).trim(), i);
    });

    return map;
  }

  private resolveOutput(outputFileName: string) {
    const cwd = process.cwd();
    const localDir = this.config.get<string>('LOCAL_STORAGE_PATH', 'results');

    let outputPath: string;

    try {
      outputPath = resolveResultsCsvPath(cwd, localDir, outputFileName);
    } catch {
      throw new InternalServerErrorException('Invalid outputFileName');
    }

    const safeName = basename(outputFileName);
    const relativeOutput = `${localDir}/${safeName}`;

    const assetsPrefix = this.config
      .get<string>('ASSETS_URL_PATH', '/assets')
      .replace(/\/$/, '');

    const assetUrl = `${this.baseUrl}${assetsPrefix}/${safeName}`;

    return {
      outputPath,
      relativeOutput,
      assetUrl,
    };
  }

  private getSheetConfig() {
    return {
      spreadsheetId: this.config.getOrThrow<string>('GOOGLE_SPREADSHEET_ID'),
      sheetName:
        this.config.get<string>('GOOGLE_CATS_SHEET_NAME') ?? 'CatsData',
    };
  }

  private createWritableStream(writer: CsvBatchWriterUtil) {
    return new Writable({
      objectMode: true,

      write: async (row: CatRow, _, callback) => {
        try {
          writer.write(row);
          callback();
        } catch (err) {
          callback(err);
        }
      },

      final: async (callback) => {
        try {
          await writer.close();
          callback();
        } catch (err) {
          callback(err);
        }
      },
    });
  }

  private createTransformStream(stats: ImportStats) {
    let headerIndex: Map<string, number> | null = null;
    const claimedCatIds = new Set<string>();

    return new Transform({
      objectMode: true,

      transform: (row: string[], _, callback) => {
        try {
          if (!headerIndex) {
            headerIndex = this.buildHeaderIndex(row);
            return callback(); // skip header
          }

          stats.totalRows++;

          const result = this.transformRow(row, headerIndex, claimedCatIds);

          if (!result.valid) {
            stats.invalidRows++;
            return callback();
          }

          stats.validRows++;
          callback(null, result.row);
        } catch (err) {
          callback(err);
        }
      },
    });
  }
}
