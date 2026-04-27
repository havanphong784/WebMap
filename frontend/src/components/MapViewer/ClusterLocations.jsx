import {useMemo} from "react";
import {Layer, Source} from "react-map-gl/maplibre";
import {useLocationStore} from "../../context/useLocationsStore";

export default function ClusterLocations() {
  const locations = useLocationStore(state => state.locations);

  const geoJsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: locations.map(loc => ({
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [Number(loc.lng), Number(loc.lat)]},
      properties: {
        id: loc.id,
        name: loc.name,
        category: loc.category
      }
    }))
  }), [locations]);

  if (locations.length === 0) return null;

  return (
    <Source
      id="saved-locations-source"
      type="geojson"
      data={geoJsonData}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={40}
    >
      <Layer
        id="clusters"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }}
      />

      <Layer
        id="cluster-count"
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': '{point_count_abbreviated}',
          'text-size': 12
        }}
      />

      <Layer
        id="unclustered-point"
        type="circle"
        maxzoom={14}
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': '#10b981',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }}
      />
    </Source>
  );
}
