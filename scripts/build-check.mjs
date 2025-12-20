import fs from 'node:fs';
import path from 'node:path';

function assertExists(p) {
  if (!fs.existsSync(p)) {
    const err = new Error(
      [
        '❌ Build output is missing.',
        '',
        'Expected file:',
        `  ${p}`,
        '',
        'Fix:',
        '  yarn build',
        '',
      ].join('\n'),
    );
    err.code = 'BUILD_OUTPUT_MISSING';
    throw err;
  }
}

function main() {
  const distDir = path.resolve('dist');

  // Basic checks
  assertExists(distDir);

  assertExists(path.join(distDir, 'index.js'));
  assertExists(path.join(distDir, 'index.cjs'));
  assertExists(path.join(distDir, 'index.d.ts'));
  assertExists(path.join(distDir, 'index.js.map'));
  assertExists(path.join(distDir, 'index.cjs.map'));

  // eslint-disable-next-line no-console
  console.log('build:check passed (dist/ looks good)');
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(String(err?.message ?? err));
  process.exitCode = 1;
}
