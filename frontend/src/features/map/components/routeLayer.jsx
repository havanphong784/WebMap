import { Layer, Source } from "react-map-gl/maplibre";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { memo } from "react";

const RouteLayer = memo(() => {
  const routeData = useLocationStore(state => state.routeData);

  if (!routeData) return null;

  const data = {
    type: 'Feature',
    properties: {},
    geometry: routeData
  };

  return (
    <Source id="route-source" type="geojson" data={data}>
      <Layer
        id="route-layer"
        type="line"
        layout={{ "line-join": "round", "line-cap": "round" }}
        paint={{
          "line-color": "#3903feff",
          "line-width": 6,
          "line-opacity": 0.8,
          "line-blur": 1
        }}
      />
    </Source>
  );
});

RouteLayer.displayName = "RouteLayer";

export default RouteLayer;

