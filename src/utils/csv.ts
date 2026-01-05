import fs from 'node:fs';
import { parse } from 'csv-parse';

export async function* streamCsvRows(
  filePath: string,
): AsyncIterable<string[]> {
  const rs = fs.createReadStream(filePath);

  const parser = parse({
    columns: false,
    relax_column_count: true,
    trim: true,
    skip_empty_lines: true,
  });

  // IMPORTANT: make stream errors reject the async iteration
  rs.on('error', (err) => {
    parser.destroy(err);
  });

  const piped = rs.pipe(parser);

  for await (const record of piped as AsyncIterable<string[]>) {
    yield record;
  }
}
