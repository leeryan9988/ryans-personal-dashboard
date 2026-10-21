import { githubUsageEditions } from '../lib/github-usage-data.ts';

const latest = githubUsageEditions[0];
if (!latest || latest.rising.length !== 5 || latest.established.length !== 5) {
  throw new Error('Latest GitHub usage edition must contain exactly 5 rising and 5 established projects.');
}
const urls = [...latest.rising, ...latest.established].map((pick) => pick.url);
if (new Set(urls).size !== 10) {
  throw new Error('Latest GitHub usage edition contains duplicate repositories.');
}
console.log('Latest GitHub usage edition: 5 rising + 5 established, no duplicates.');
