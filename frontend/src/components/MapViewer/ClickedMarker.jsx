import {useState} from "react";
import {Marker, Popup} from "react-map-gl/maplibre";
import LocationFormModal from "./LocationFormModal.jsx";

export default function ClickedMarker({point, setPoint}) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!point) return null;

  return (
    <>
      <Marker longitude={point.lng} latitude={point.lat} color="red"/>

      {!isFormOpen && (
        <Popup
          longitude={point.lng}
          latitude={point.lat}
          anchor="bottom"
          offset={30}
          onClose={() => setPoint(null)}
          className="z-50"
        >
          <div className="w-48 text-center p-1">
            <p className="text-sm font-medium text-gray-800 mb-2">
              {point.address.display_name || "Chưa xác định địa chỉ"}
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-blue-600 text-white text-sm py-1.5 rounded-md hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              + Thêm địa điểm này
            </button>
          </div>
        </Popup>
      )}

      {isFormOpen && (
        <LocationFormModal
          point={point}
          onClose={() => {
            setIsFormOpen(false);
            setPoint(null);
          }}
        />
      )}
    </>
  );
}
