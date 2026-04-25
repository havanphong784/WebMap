import {MapContainer, TileLayer} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {useState} from "react";
import MapStyleSwitcher from "./MapStyleSwitcher";
import {MapStyles} from "./MapStyles.jsx";
import MapHandleClick from "./MapHandleClick.jsx";
import RoutingMarker from "./RoutingMarkers.jsx";

export default function MapViewer() {
  const [activeStyle, setActiveStyle] = useState(MapStyles[0]);
  const [clickedPoint, setClickedPoint] = useState(null);

  return (
    <div className="h-screen w-full relative bg-gray-900">
      <MapContainer
        center={[21.028511, 105.804817]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution={activeStyle.attribution}
          url={activeStyle.url}
        />
        <RoutingMarker/>
        <MapHandleClick clickedPoint={clickedPoint} setClickedPoint={setClickedPoint}/>


      </MapContainer>

      <MapStyleSwitcher
        currentStyleUrl={activeStyle.url}
        onStyleChange={(newStyle) => setActiveStyle(newStyle)}
      />

    </div>
  );
}
