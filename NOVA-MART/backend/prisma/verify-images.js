/**
 * Verifies that every product image referenced by the seed catalogue is
 * reachable. Run with `npm run db:verify-images`.
 *
 * Failing images are reported and the process exits with code 1 so the check
 * can be used in CI.
 */
import { products } from './data/index.js';

const urls = [...new Set(products.flatMap((product) => product.images))];

async function checkUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const type = response.headers.get('content-type') || '';
    if (!response.ok) return { url, ok: false, reason: `HTTP ${response.status}` };
    if (!type.startsWith('image/')) return { url, ok: false, reason: `unexpected content-type ${type}` };
    return { url, ok: true };
  } catch (error) {
    return { url, ok: false, reason: error.message };
  }
}

const results = [];
const concurrency = 8;

for (let index = 0; index < urls.length; index += concurrency) {
  const batch = urls.slice(index, index + concurrency);
  results.push(...(await Promise.all(batch.map(checkUrl))));
}

const failures = results.filter((result) => !result.ok);

console.log(`Checked ${results.length} image URLs for ${products.length} products.`);

if (failures.length) {
  console.error(`\n${failures.length} image URL(s) are not reachable:`);
  for (const failure of failures) {
    console.error(`  - ${failure.url} (${failure.reason})`);
  }
  process.exitCode = 1;
} else {
  console.log('All product images are reachable.');
}
