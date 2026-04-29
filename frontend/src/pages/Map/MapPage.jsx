import Map, { GeolocateControl, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "../../components/Map/ClickedMarker.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAddress } from "../../utils/geocoding.js";
import { debounce } from "../../utils/performance.js";
import MapStyleSwitcher from "../../components/Map/MapStyleSwitcher.jsx";
import SearchBox from "../../components/Map/SearchBox.jsx";
import { useLocationStore } from "../../store/useLocationsStore.jsx";
import { useAuthStore } from "../../context/AuthContext.jsx";
import ClusterLocations from "../../components/Map/ClusterLocations.jsx";
import LocationCard from "../../components/Map/LocationCard.jsx";
import LocationSidebar from "../../components/Map/LocationSidebar.jsx";
import RouteLayer from "../../components/Map/RouteLayer.jsx";

export default function MapPage() {
  const mapRef = useRef(null);
  const [infoClicked, setInfoClicked] = useState(null);
  const [activeStyle, setActiveStyle] = useState("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json");
  const fetchLocations = useLocationStore(state => state.fetchLocations);
  const locations = useLocationStore(state => state.locations);
  const routeData = useLocationStore(state => state.routeData);
  const { user } = useAuthStore();
  const [currentZoom, setCurrentZoom] = useState(10);
  const [activeLocation, setActiveLocation] = useState(null);

  useEffect(() => {
    const coordinates = routeData?.coordinates;

    if (!mapRef.current || !coordinates?.length) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      duration: 1200,
      essential: true,
    });
  }, [routeData]);


  const handleClick = async (e) => {
    const { lng, lat } = e.lngLat;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2000
    });
    setInfoClicked({ lng, lat, address: "Đang tìm địa chỉ..." });
    const diachi = await getAddress(lat, lng);

    setInfoClicked({ lng, lat, address: diachi });
  }

  const handleSearchSelect = async (lng, lat, addressName) => {
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2500
    });
    setInfoClicked({ lng, lat, address: addressName });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  };

  const debouncedFetch = useRef(
    debounce((uid, bounds) => {
      fetchLocations(uid, bounds);
    }, 400)
  ).current;

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      setCurrentZoom(zoom);
      debouncedFetch(user?.uid, bounds);
    }
  }, [user, debouncedFetch]);


  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      <Map ref={mapRef}
        onLoad={handleMapChange}
        onMoveEnd={handleMapChange}
        mapLib={maplibregl}
        antialias={true}
        initialViewState={{
          longitude: 105.804817,
          latitude: 21.028511,
          zoom: 13,
          pitch: 45,
          bearing: 0
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={activeStyle}
        onClick={handleClick}
      >
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={true}
          showUserHeading={true}
          showAccuracyCircle={true}
          style={{ marginBottom: '40px', marginRight: '20px' }}
        />
        <NavigationControl position="top-right" />
        <ClickedMarker point={infoClicked} setPoint={setInfoClicked} />
        <SearchBox onSelectLocation={handleSearchSelect} />
        <ClusterLocations />
        <RouteLayer />
        {currentZoom >= 13 && locations.map(loc => (
          <LocationCard
            key={loc.id}
            location={loc}
            onClick={(locData) => setActiveLocation(locData)}
          />
        ))}
        <MapStyleSwitcher
          currentStyleUrl={activeStyle}
          onStyleChange={(newStyle) => setActiveStyle(newStyle)}
        />
      </Map>

      {activeLocation && (
        <LocationSidebar
          location={activeLocation}
          onClose={() => setActiveLocation(null)}
        />
      )}
    </div>
  );
}
