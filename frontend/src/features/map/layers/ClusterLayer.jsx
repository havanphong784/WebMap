import {memo, useEffect, useMemo} from "react";
import {Layer, Source, useMap} from "react-map-gl/maplibre";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {LAYER_IDS, MAP_LIMITS, MARKER_ZOOM, SOURCE_IDS} from "../config/mapConfig.js";

/**
 * Layer cluster cho saved locations.
 * Toàn bộ logic gom nhóm/click expansion zoom đều dùng MapLibre native API.
 *
 * Zoom <= 13: hiện cluster (bubble cyan + count) hoặc unclustered point dot
 * Zoom 14+: cluster ngừng gom, MapLibre tự bung point. LocationCard React Marker
 *           sẽ phủ overlay UI lên các point này (xem markers/LocationMarkers.jsx).
 */
const buildGeoJson = (locations) => ({
  type: "FeatureCollection",
  features: locations
    .filter((loc) => Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng)))
    .map((loc) => ({
      type: "Feature",
      geometry: {type: "Point", coordinates: [Number(loc.lng), Number(loc.lat)]},
      properties: {
        id: loc.id,
        name: loc.name,
        category: loc.category,
        rating: loc.rating || 5,
      },
    })),
});

const ClusterLayer = memo(({onPointClick}) => {
  const locations = useLocationStore((state) => state.locations);
  const {current: mapRef} = useMap();

  const geoJsonData = useMemo(() => buildGeoJson(locations), [locations]);

  /**
   * Native MapLibre handlers — đặt trong useEffect vì react-map-gl không expose
   * onClick/onMouseEnter ở component <Layer />.
   */
  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap?.();
    if (!map) return;

    const handleClusterClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {layers: [LAYER_IDS.CLUSTERS]});
      const cluster = features[0];
      if (!cluster) return;

      const source = map.getSource(SOURCE_IDS.LOCATIONS);
      if (!source?.getClusterExpansionZoom) return;

      source.getClusterExpansionZoom(cluster.properties.cluster_id, (err, expandZoom) => {
        if (err) return;
        map.easeTo({
          center: cluster.geometry.coordinates,
          zoom: Math.min(expandZoom + 0.5, MAP_LIMITS.maxZoom),
          duration: 600,
        });
      });
    };

    const handlePointClick = (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      e.originalEvent?.stopPropagation?.();
      onPointClick?.({
        id: feature.properties.id,
        name: feature.properties.name,
        category: feature.properties.category,
        rating: feature.properties.rating,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      });
    };

    const setPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const resetCursor = () => { map.getCanvas().style.cursor = ""; };

    map.on("click", LAYER_IDS.CLUSTERS, handleClusterClick);
    map.on("click", LAYER_IDS.UNCLUSTERED_POINT, handlePointClick);
    map.on("click", LAYER_IDS.UNCLUSTERED_LABEL, handlePointClick);
    map.on("mouseenter", LAYER_IDS.CLUSTERS, setPointer);
    map.on("mouseleave", LAYER_IDS.CLUSTERS, resetCursor);
    map.on("mouseenter", LAYER_IDS.UNCLUSTERED_POINT, setPointer);
    map.on("mouseleave", LAYER_IDS.UNCLUSTERED_POINT, resetCursor);

    return () => {
      map.off("click", LAYER_IDS.CLUSTERS, handleClusterClick);
      map.off("click", LAYER_IDS.UNCLUSTERED_POINT, handlePointClick);
      map.off("click", LAYER_IDS.UNCLUSTERED_LABEL, handlePointClick);
      map.off("mouseenter", LAYER_IDS.CLUSTERS, setPointer);
      map.off("mouseleave", LAYER_IDS.CLUSTERS, resetCursor);
      map.off("mouseenter", LAYER_IDS.UNCLUSTERED_POINT, setPointer);
      map.off("mouseleave", LAYER_IDS.UNCLUSTERED_POINT, resetCursor);
    };
  }, [mapRef, onPointClick]);

  if (locations.length === 0) return null;

  return (
    <Source
      id={SOURCE_IDS.LOCATIONS}
      type="geojson"
      data={geoJsonData}
      cluster
      clusterMaxZoom={MARKER_ZOOM.CLUSTER_BREAK - 1}
      clusterRadius={50}
    >
      <Layer
        id={LAYER_IDS.CLUSTERS}
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": [
            "step", ["get", "point_count"],
            "#06b6d4",
            5, "#0891b2",
            15, "#0e7490",
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            18,
            5, 24,
            15, 30,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.2)",
          "circle-blur": 0.1,
        }}
      />
      <Layer
        id={LAYER_IDS.CLUSTER_COUNT}
        type="symbol"
        filter={["has", "point_count"]}
        layout={{
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Roboto Bold"],
          "text-size": 12,
        }}
        paint={{"text-color": "#ffffff"}}
      />
      <Layer
        id={LAYER_IDS.UNCLUSTERED_POINT}
        type="circle"
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-color": "#06b6d4",
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": [
            "interpolate", ["linear"], ["zoom"],
            13, 1,
            MARKER_ZOOM.CARD_VISIBLE, 0,
          ],
        }}
      />
      <Layer
        id={LAYER_IDS.UNCLUSTERED_LABEL}
        type="symbol"
        filter={["!", ["has", "point_count"]]}
        minzoom={13}
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Roboto Regular"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-max-width": 8,
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1,
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            13, 0,
            13.5, 1,
            MARKER_ZOOM.CARD_VISIBLE, 0,
          ],
        }}
      />
    </Source>
  );
});

ClusterLayer.displayName = "ClusterLayer";

export default ClusterLayer;
