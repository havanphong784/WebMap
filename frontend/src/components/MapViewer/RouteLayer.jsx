import {Layer, Source} from "react-map-gl/maplibre";
import {useLocationStore} from "../../context/useLocationsStore";

export default function RouteLayer() {
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
        layout={{"line-join": "round", "line-cap": "round"}}
        paint={{
          "line-color": "#3b82f6",
          "line-width": 5,
          "line-opacity": 0.8
        }}
      />
    </Source>
  );
}
