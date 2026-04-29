import {Layer, Source} from "react-map-gl/maplibre";
import {useLocationStore} from "../../store/useLocationsStore.jsx";

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
          "line-color": "#09a719",
          "line-width": 5,
          "line-opacity": 1
        }}
      />
    </Source>
  );
}
