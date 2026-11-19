// import { GOOGLE_MAP_STYLE_ID } from '../config/site';

// /* One script tag, shared across mounts. A styling Map ID, if one is
//    configured, is preloaded with the script so mounting the vector map
//    never triggers a second fetch. */
// let mapsPromise = null;

// export function loadMaps(key) {
//   if (mapsPromise) return mapsPromise;
//   mapsPromise = new Promise((res, rej) => {
//     if (typeof window === 'undefined') return rej(new Error('No browser window.'));
//     if (window.google && window.google.maps) return res(window.google.maps);
//     if (!key) {
//       return rej(new Error(
//         'Add VITE_GOOGLE_MAPS_API_KEY to your .env file, and enable the Maps JavaScript API on that key.',
//       ));
//     }
//     const cb = '__chicholiMapsReady';
//     window[cb] = () => res(window.google.maps);
//     const s = document.createElement('script');
//     s.src = 'https://maps.googleapis.com/maps/api/js'
//       + `?key=${encodeURIComponent(key)}`
//       + '&v=weekly'
//       + (GOOGLE_MAP_STYLE_ID ? `&map_ids=${encodeURIComponent(GOOGLE_MAP_STYLE_ID)}` : '')
//       + `&callback=${cb}`;
//     s.async = true;
//     s.onerror = () => rej(new Error(
//       'Google Maps did not load. Check the key, that the Maps JavaScript API is enabled, and that this origin is an allowed referrer.',
//     ));
//     document.head.appendChild(s);
//     return undefined;
//   });
//   return mapsPromise;
// }










// import { GOOGLE_MAP_STYLE_ID } from '../config/site';

// /* One script tag, shared across mounts. A styling Map ID, if one is
//    configured, is preloaded with the script so mounting the vector map
//    never triggers a second fetch.

//    Loading the script is free. Billing happens in `new maps.Map()`,
//    which PlanMap now calls once per page session. */
// let mapsPromise = null;

// export function loadMaps(key) {
//   if (mapsPromise) return mapsPromise;

//   mapsPromise = new Promise((res, rej) => {
//     if (typeof window === 'undefined') {
//       mapsPromise = null;
//       return rej(new Error('No browser window.'));
//     }

//     /* already on the page (HMR, or another bundle loaded it) */
//     if (window.google?.maps?.Map) return res(window.google.maps);

//     if (!key) {
//       mapsPromise = null;
//       return rej(new Error(
//         'Add VITE_GOOGLE_MAPS_API_KEY to your .env file, and enable the Maps JavaScript API on that key.',
//       ));
//     }

//     /* a tag from an earlier module instance is still loading: wait on it
//        instead of injecting a second script */
//     const existing = document.querySelector('script[data-plan-maps]');
//     if (existing) {
//       const poll = setInterval(() => {
//         if (window.google?.maps?.Map) {
//           clearInterval(poll);
//           res(window.google.maps);
//         }
//       }, 50);
//       existing.addEventListener('error', () => {
//         clearInterval(poll);
//         mapsPromise = null;
//         rej(new Error('Google Maps did not load.'));
//       });
//       return undefined;
//     }

//     const cb = '__chicholiMapsReady';
//     window[cb] = () => res(window.google.maps);

//     const s = document.createElement('script');
//     s.dataset.planMaps = '1';
//     s.src = 'https://maps.googleapis.com/maps/api/js'
//       + `?key=${encodeURIComponent(key)}`
//       + '&v=weekly'
//       + (GOOGLE_MAP_STYLE_ID ? `&map_ids=${encodeURIComponent(GOOGLE_MAP_STYLE_ID)}` : '')
//       + `&callback=${cb}`;
//     s.async = true;
//     s.onerror = () => {
//       mapsPromise = null;   // allow a retry on the next mount
//       s.remove();           // drop the dead tag so a retry doesn't stack scripts
//       rej(new Error(
//         'Google Maps did not load. Check the key, that the Maps JavaScript API is enabled, and that this origin is an allowed referrer.',
//       ));
//     };
//     document.head.appendChild(s);
//     return undefined;
//   });

//   return mapsPromise;
// }







import { GOOGLE_MAP_STYLE_ID } from '../config/site';

/* One script tag, shared across mounts. Loading the script is free;
   billing happens in `new maps.Map()`, which PlanMap now calls once per
   page session. */
let mapsPromise = null;

/* DEV ONLY: counts every `new google.maps.Map()`.
   Read the total any time in the console with:  window.__MAP_LOADS__  */
function instrument(maps) {
  if (!import.meta.env.DEV || maps.__counted) return maps;
  try {
    const Orig = maps.Map;
    maps.Map = new Proxy(Orig, {
      construct(target, args, newTarget) {
        window.__MAP_LOADS__ = (window.__MAP_LOADS__ || 0) + 1;
        // eslint-disable-next-line no-console
        console.warn(`🗺️ new Map() #${window.__MAP_LOADS__} (each one is a billed load)`);
        // eslint-disable-next-line no-console
        console.trace();
        return Reflect.construct(target, args, newTarget);
      },
    });
    maps.__counted = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Map counter could not be installed:', err);
  }
  return maps;
}

export function loadMaps(key) {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((res, rej) => {
    if (typeof window === 'undefined') {
      mapsPromise = null;
      return rej(new Error('No browser window.'));
    }

    /* already on the page (HMR, or another bundle loaded it) */
    if (window.google?.maps?.Map) return res(instrument(window.google.maps));

    if (!key) {
      mapsPromise = null;
      return rej(new Error(
        'Add VITE_GOOGLE_MAPS_API_KEY to your .env file, and enable the Maps JavaScript API on that key.',
      ));
    }

    /* a tag from an earlier module instance is still loading: wait on it
       instead of injecting a second script */
    const existing = document.querySelector('script[data-plan-maps]');
    if (existing) {
      const poll = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(poll);
          res(instrument(window.google.maps));
        }
      }, 50);
      existing.addEventListener('error', () => {
        clearInterval(poll);
        mapsPromise = null;
        rej(new Error('Google Maps did not load.'));
      });
      return undefined;
    }

    const cb = '__chicholiMapsReady';
    window[cb] = () => res(instrument(window.google.maps));

    const s = document.createElement('script');
    s.dataset.planMaps = '1';
    s.src = 'https://maps.googleapis.com/maps/api/js'
      + `?key=${encodeURIComponent(key)}`
      + '&v=weekly'
      + (GOOGLE_MAP_STYLE_ID ? `&map_ids=${encodeURIComponent(GOOGLE_MAP_STYLE_ID)}` : '')
      + `&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      mapsPromise = null;   // allow a retry on the next mount
      s.remove();           // drop the dead tag so a retry doesn't stack scripts
      rej(new Error(
        'Google Maps did not load. Check the key, that the Maps JavaScript API is enabled, and that this origin is an allowed referrer.',
      ));
    };
    document.head.appendChild(s);
    return undefined;
  });

  return mapsPromise;
}