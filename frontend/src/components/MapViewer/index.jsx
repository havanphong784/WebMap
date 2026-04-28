import Map, {GeolocateControl, NavigationControl} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "./ClickedMarker.jsx";
import {useCallback, useRef, useState} from "react";
import {getAddress} from "../../utils/Map.jsx";
import MapStyleSwitcher from "./MapStyleSwitcher.jsx";
import SearchBox from "./SearchBox.jsx";
import {useLocationStore} from "../../context/useLocationsStore.jsx";
import {useAuthStore} from "../../context/AuthContext.jsx";
import ClusterLocations from "./ClusterLocations.jsx";
import LocationCard from "./LocationCard.jsx";
import LocationSidebar from "../SideBar/Posts.jsx";
import RouteLayer from "./RouteLayer.jsx";

export default function MapViewer() {
  const mapRef = useRef(null);
  const [infoClicked, setInfoClicked] = useState(null);
  const [activeStyle, setActiveStyle] = useState("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json");
  const fetchLocations = useLocationStore(state => state.fetchLocations);
  const locations = useLocationStore(state => state.locations);
  const {user} = useAuthStore();
  const [currentZoom, setCurrentZoom] = useState(10);
  const [activeLocation, setActiveLocation] = useState(null);


  const handleClick = async (e) => {
    const {lng, lat} = e.lngLat;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2000
    });
    setInfoClicked({lng, lat, address: "Đang tìm địa chỉ..."});
    const diachi = await getAddress(lat, lng);

    setInfoClicked({lng, lat, address: diachi});
  }

  const handleSearchSelect = async (lng, lat, addressName) => {
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2500
    });
    setInfoClicked({lng, lat, address: addressName});
    const diachi = await getAddress(lat, lng);
    setInfoClicked({lng, lat, address: diachi});
  };

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      fetchLocations(user?.uid, bounds);
      setCurrentZoom(mapRef.current.getZoom());
    }
  }, [user, fetchLocations]);

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
           style={{width: '100%', height: '100%'}}
           mapStyle={activeStyle}
           onClick={handleClick}
      >
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={true}
          showUserHeading={true}
          showAccuracyCircle={true}
          style={{marginBottom: '40px', marginRight: '20px'}}
        />
        <NavigationControl position="top-right"/>
        <ClickedMarker point={infoClicked} setPoint={setInfoClicked}/>
        <SearchBox onSelectLocation={handleSearchSelect}/>
        <ClusterLocations/>
        <RouteLayer/>
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
