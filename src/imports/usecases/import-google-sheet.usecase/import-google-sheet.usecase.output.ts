export interface ImportGoogleSheetUseCaseOutput {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  outputFile: string;
  assetUrl: string;
}
