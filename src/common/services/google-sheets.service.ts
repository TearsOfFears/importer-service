import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import { loadServiceAccountCredentials } from '../utils/google-credentials';
import { IGoogleSheetsService } from './google-sheets.service.interface';

@Injectable()
export class GoogleSheetsService implements IGoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private readonly sheets: sheets_v4.Sheets;

  constructor(private readonly config: ConfigService) {
    const credentials = loadServiceAccountCredentials();
    this.logger.log('Google service account credentials loaded');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async *streamSheetRows(
    spreadsheetId: string,
    sheetName: string,
  ): AsyncGenerator<string[]> {
    const chunkSize = 50;
    const escaped = sheetName.replace(/'/g, "''");

    let startRow = 1;

    while (true) {
      const endRow = startRow + chunkSize - 1;
      const range = `'${escaped}'!A${startRow}:Z${endRow}`;

      this.logger.log(`Fetching range ${range}`);

      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = (res.data.values ?? []) as string[][];

      if (rows.length === 0) break;

      for (const row of rows) {
        yield row;
      }

      if (rows.length < chunkSize) break;

      startRow += chunkSize;
    }
  }
}
