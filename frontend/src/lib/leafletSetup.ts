/**
 * Safe Leaflet initializer and defensive monkey-patch for Next.js / React 18
 * Prevents "TypeError: Cannot read properties of undefined (reading '_leaflet_pos')"
 * caused by zoom transition races during component unmount or map teardown.
 */

export function initSafeLeaflet(L: any) {
  if (!L || typeof window === 'undefined') return;

  if (!(L as any).__isLexportPatched) {
    (L as any).__isLexportPatched = true;

    // 1. Guard DomUtil.getPosition against null/undefined el
    if (L.DomUtil) {
      const origGetPosition = L.DomUtil.getPosition;
      L.DomUtil.getPosition = function (el: any) {
        if (!el || typeof el !== 'object') {
          return new L.Point(0, 0);
        }
        try {
          return origGetPosition(el) || new L.Point(0, 0);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }

    // 2. Guard Map.prototype._getMapPanePos against unmounted _mapPane
    if (L.Map && L.Map.prototype) {
      const origGetMapPanePos = L.Map.prototype._getMapPanePos;
      L.Map.prototype._getMapPanePos = function () {
        if (!this._mapPane) {
          return new L.Point(0, 0);
        }
        try {
          return origGetMapPanePos.call(this) || new L.Point(0, 0);
        } catch {
          return new L.Point(0, 0);
        }
      };

      // 3. Guard Map.prototype._onZoomTransitionEnd against teardown during active transition
      const origOnZoomTransitionEnd = L.Map.prototype._onZoomTransitionEnd;
      L.Map.prototype._onZoomTransitionEnd = function () {
        if (!this._mapPane) {
          this._animatingZoom = false;
          return;
        }
        try {
          return origOnZoomTransitionEnd.call(this);
        } catch {
          this._animatingZoom = false;
        }
      };
    }

    // 4. Fix standard marker icon URLs
    if (L.Icon && L.Icon.Default) {
      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      } catch {
        // Ignore if already set
      }
    }
  }

  (window as any).L = L;
  return L;
}

export function safeDestroyMap(map: any) {
  if (!map) return;
  try {
    map.stop();
    map.off();
    map.remove();
  } catch (err) {
    // Suppress unmount transition races
    console.debug('Safe map disposal suppressed error:', err);
  }
}
