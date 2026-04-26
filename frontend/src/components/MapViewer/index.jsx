import Map, {GeolocateControl, NavigationControl} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "./ClickedMarker.jsx";
import {useRef, useState} from "react";
import {getAddress} from "../../utils/Map.jsx";
import MapStyleSwitcher from "./MapStyleSwitcher.jsx";
import SearchBox from "./SearchBox.jsx";

export default function MapViewer() {
  const mapRef = useRef();
  const [infoClicked, setInfoClicked] = useState(null);
  const [activeStyle, setActiveStyle] = useState("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json");


  const handleClick = async (e) => {
    const {lng, lat} = e.lngLat;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 0,
      bearing: 90,
      duration: 2000
    });
    setInfoClicked({lng, lat, address: "Đang tìm địa chỉ..."});
    const diachi = await getAddress(lat, lng);

    setInfoClicked({lng, lat, address: diachi});
  }

  const handleSearchSelect = (lng, lat, addressName) => {
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      duration: 2500
    });
    setInfoClicked({lng, lat, address: addressName});
  };

  return (
    <div className="h-screen w-full relative bg-gray-900">
      <Map ref={mapRef}
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
          position="bottom-right" // Đặt ở góc dưới bên phải (Chuẩn UX Mobile)
          trackUserLocation={true} // Tự động cập nhật vị trí khi người dùng di chuyển (Lái xe/Đi bộ)
          showUserHeading={true} // Hiển thị "cái nón" ánh sáng báo hiệu hướng điện thoại đang quay về đâu
          showAccuracyCircle={true} // Hiển thị vòng tròn sai số của GPS
          style={{marginBottom: '40px', marginRight: '20px'}} // Đẩy nhẹ nó lên để không dính sát lề
        />
        <NavigationControl position="top-right"/>
        <ClickedMarker point={infoClicked} setPoint={setInfoClicked}/>
        <SearchBox onSelectLocation={handleSearchSelect}/>
        <MapStyleSwitcher
          currentStyleUrl={activeStyle}
          onStyleChange={(newStyle) => setActiveStyle(newStyle)}
        />
      </Map>
    </div>
  );
}
