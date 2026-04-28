import {useState} from "react";
import {Marker, Popup} from "react-map-gl/maplibre";
import LocationFormModal from "./LocationFormModal.jsx";
import {useLocationStore} from "../../context/useLocationsStore.jsx";

export default function ClickedMarker({point, setPoint}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const fetchRoute = useLocationStore((state) => state.fetchRoute);

  if (!point) return null;

  const handleGetDirections = (e) => {
    e.stopPropagation();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const start = [pos.coords.longitude, pos.coords.latitude];
        const end = [point.lng, point.lat];
        fetchRoute(start, end);
      },
      () => {
        alert("Không thể lấy vị trí của bạn. Vui lòng cho phép quyền truy cập vị trí.");
      }
    );
  };

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
            <button
              onClick={handleGetDirections}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded-lg transition"
            >
              🚗 Chỉ đường
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
