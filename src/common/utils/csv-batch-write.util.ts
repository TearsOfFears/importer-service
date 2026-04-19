import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { toCsvLine } from './csv';
import { CatRow } from '../../imports/usecases/import-google-sheet.usecase/cat-validation';
import { CSV_CAT_HEADERS } from '../../imports/constants/csv-cat-headers.constant';

export class CsvBatchWriterUtil {
  private stream: NodeJS.WritableStream;
  private buffer: string[] = [];
  private readonly BATCH_SIZE = 50;

  constructor(outputPath: string) {
    this.stream = createWriteStream(outputPath, { encoding: 'utf8' });
    this.stream.write(toCsvLine(CSV_CAT_HEADERS) + '\n');
  }

  write(row: CatRow) {
    this.buffer.push(
      toCsvLine([
        row.catId,
        row.name,
        row.breed,
        String(row.ageYears),
        String(row.weightKg),
        row.color,
        row.vaccinated,
        row.notes ?? '',
      ]) + '\n',
    );

    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  private flush() {
    this.stream.write(this.buffer.join(''));
    this.buffer = [];
  }

  async close() {
    if (this.buffer.length) {
      this.flush();
    }

    await new Promise<void>((resolve, reject) => {
      this.stream.once('finish', resolve);
      this.stream.once('error', reject);
      this.stream.end();
    });
  }

  destroy() {
    this.stream.end();
  }
}
