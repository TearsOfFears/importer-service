export const GOOGLE_SHEETS_SERVICE = Symbol('GOOGLE_SHEETS_SERVICE');

export interface IGoogleSheetsService {
  streamSheetRows(
    spreadsheetId: string,
    sheetName: string,
  ): AsyncGenerator<string[]>;
}
