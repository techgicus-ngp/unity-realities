/* Site settings. Everything here is read from .env at build time. */

/* "{a,b,c}" or "a, b, c"  ->  ['a','b','c']. A missing variable gives []
   instead of crashing the whole app. */
const toList = (v) => String(v || '')
  .replace(/[{}]/g, '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/** Sanctioned and not-sanctioned map ids. They are paired by position:
    the 1st sanctioned map goes with the 1st not-sanctioned map, and so on. */
export const SANCTIONED_IDS = toList(import.meta.env.VITE_SANCTIONED_MAP_IDS);
export const NOT_SANCTIONED_IDS = toList(import.meta.env.VITE_NOT_SANCTIONED_MAP_IDS);

/** The normal maps. Every id listed in VITE_MAP_ID is shown on the home
    page and opens as a single, complete layout, even if the same id is
    also in the sanctioned / not-sanctioned lists. */
export const MAP_ID = toList(import.meta.env.VITE_MAP_ID);

/** Sanctioned / not-sanctioned ids that are NOT listed in VITE_MAP_ID are
    restricted: they open only from /sanctioned, behind its own sign-in.
    An id you also list in VITE_MAP_ID is open to every signed-in user. */
export const PROTECTED_MAP_IDS = new Set(
  [...SANCTIONED_IDS, ...NOT_SANCTIONED_IDS].filter((id) => !MAP_ID.includes(id)),
);
export const isProtectedMap = (id) => PROTECTED_MAP_IDS.has(id);

/** The single id that code with no explicit map falls back to.
    MAP_ID is a LIST, so it must never be used where one id is expected. */
export const DEFAULT_MAP_ID = MAP_ID[0] || SANCTIONED_IDS[0] || '';

/** Where the plots of a map are kept. The listener attaches to this at
 *  once; discovery in mapRepo only runs if it comes back empty.
 *
 *  kind: 'collection' -> { name }       maps/<id>/<name>
 *        'query'      -> { col, field } <col> where <field> == <id>
 *        'embedded'   -> { key }        maps/<id>.<key>[]
 */
export const PLOT_SOURCE = {
  kind: 'collection',
  name: 'plots',
  label: `maps/${DEFAULT_MAP_ID || '<id>'}/plots`,
};

/** Where the camera starts, before any plot data has arrived. */
export const HOME_VIEW = {
  center: { lat: 21.190375, lng: 78.983383 },
  zoom: 18,
};

/** Maps JavaScript API key. */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** Cloud-console Map ID. It must be a VECTOR map for turning and tilting. */
export const GOOGLE_MAP_STYLE_ID = import.meta.env.VITE_GOOGLE_MAP_STYLE_ID;

/** How far past the plan's edge the drawing window may reach (metres),
    and the largest texture asked of a browser on any one side. */
export const PAD = 40;
export const MAX_SHEET = 4096;
