import {memo, useMemo} from "react";
import {Layer, Source} from "react-map-gl/maplibre";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {LAYER_IDS, SOURCE_IDS} from "../config/mapConfig.js";

const RouteLayer = memo(() => {
  const routeData = useLocationStore((state) => state.routeData);

  const featureData = useMemo(() => (
    routeData
      ? {type: "Feature", properties: {}, geometry: routeData}
      : null
  ), [routeData]);

  if (!featureData) return null;

  return (
    <Source id={SOURCE_IDS.ROUTE} type="geojson" data={featureData}>
      <Layer
        id={LAYER_IDS.ROUTE}
        type="line"
        layout={{"line-join": "round", "line-cap": "round"}}
        paint={{
          "line-color": "#3903fe",
          "line-width": 6,
          "line-opacity": 0.8,
          "line-blur": 1,
        }}
      />
    </Source>
  );
});

RouteLayer.displayName = "RouteLayer";

export default RouteLayer;
