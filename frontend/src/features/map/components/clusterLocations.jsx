import { useMemo, memo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useLocationStore } from "../store/useLocationsStore.jsx";

const ClusterLocations = memo(() => {
  const locations = useLocationStore(state => state.locations);

  const geoJsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: locations.map(loc => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(loc.lng), Number(loc.lat)] },
      properties: {
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        category: loc.category,
        address: loc.address,
        image_url: loc.image_url,
        user_id: loc.user_id,
        created_at: loc.created_at,
        rating: loc.rating || 5
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
      clusterMaxZoom={13}
      clusterRadius={50}
    >
      <Layer
        id="clusters"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#06b6d4', // Cyan 500
            5,
            '#0891b2', // Cyan 600
            15,
            '#0e7490'  // Cyan 700
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            5,
            24,
            15,
            30
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.2)',
          'circle-blur': 0.1,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13.5, 1,
            14, 0 // Hide clusters at zoom 14
          ]
        }}
      />

      <Layer
        id="cluster-count"
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Roboto Bold'],
          'text-size': 12
        }}
        paint={{
          'text-color': '#ffffff',
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13.5, 1,
            14, 0 // Hide cluster count at zoom 14
          ]
        }}
      />


      <Layer
        id="unclustered-point"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': '#06b6d4',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 1,
            14, 0 // Hide circles at zoom 14 when images appear
          ]
        }}
      />

      <Layer
        id="unclustered-label"
        type="symbol"
        filter={['!', ['has', 'point_count']]}
        minzoom={13}
        layout={{
          'text-field': ['get', 'name'],
          'text-font': ['Roboto Regular'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-max-width': 8
        }}
        paint={{
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.8)',
          'text-halo-width': 1,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 0,
            13.5, 1,
            14, 0 // Hide labels at zoom 14 when images appear
          ]
        }}
      />

    </Source>
  );
});

ClusterLocations.displayName = "ClusterLocations";

export default ClusterLocations;
