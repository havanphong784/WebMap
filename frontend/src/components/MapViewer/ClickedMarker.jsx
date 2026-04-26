import {Marker, Popup} from "react-map-gl/maplibre";

export default function ClickedMarker({point, setPoint}) {
  if (!point) return null;
  return (
    <>
      <Marker
        longitude={point.lng}
        latitude={point.lat}
        color="#F59E0B"
      />
      <Popup
        longitude={point.lng}
        latitude={point.lat}
        anchor="bottom"
        offset={40}
        closeOnClick={false}
      >
        <div className="text-sm min-w-[200px]">
          <p className="font-bold text-gray-800 mb-1">📍 Thông tin vị trí</p>
          <p className="text-gray-600 mb-3">
            {typeof point.address === 'string'
              ? point.address
              : point.address?.display_name || "Không xác định"}
          </p>
        </div>
      </Popup>
    </>
  );
}
