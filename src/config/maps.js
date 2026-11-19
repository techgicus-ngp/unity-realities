import { SANCTIONED_IDS, NOT_SANCTIONED_IDS } from './site';

/* Optional names, one per pair, in the same order as the ids. */
const names = String(import.meta.env.VITE_MAP_PAIR_NAMES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const nameOf = (i) => names[i] || `Layout ${i + 1}`;

/** Sanctioned map i is paired with not-sanctioned map i. Incomplete
    pairs are dropped. */
export const PAIRS = SANCTIONED_IDS
  .map((aId, i) => ({ name: nameOf(i), aId, bId: NOT_SANCTIONED_IDS[i] }))
  .filter((p) => p.aId && p.bId);

/** The pair a map belongs to (as either side), or undefined. */
export const pairOf = (mapId) => PAIRS.find((p) => p.aId === mapId || p.bId === mapId);


if (import.meta.env.DEV && SANCTIONED_IDS.length !== NOT_SANCTIONED_IDS.length) {
  // eslint-disable-next-line no-console
  console.warn(
    `Map lists differ in length: ${SANCTIONED_IDS.length} sanctioned, `
    + `${NOT_SANCTIONED_IDS.length} not sanctioned. Only complete pairs are used.`,
  );
}
