import {useCallback} from "react";

/**
 * Wrapper cho map.flyTo của MapLibre.
 * Trả về callback ổn định, có thể đưa vào deps mà không tạo loop.
 *
 * @param {React.RefObject} mapRef - Ref tới react-map-gl Map
 * @param {boolean} mobile - Có pad sidebar bên trái không
 */
export default function useFlyTo(mapRef, mobile = false) {
  return useCallback(
    (lng, lat, zoom = 17, duration = 1600, withPadding = false) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom,
        pitch: 45,
        bearing: 0,
        duration,
        essential: true,
        padding: withPadding
          ? {left: mobile ? 0 : 460, top: 0, right: 0, bottom: 0}
          : {left: 0, top: 0, right: 0, bottom: 0},
      });
    },
    [mapRef, mobile]
  );
}
