import {useMapStore} from "../../context/useMapStore.jsx";
import {Marker, Popup} from "react-leaflet";
import {pointStartIcon} from "../Icons/pointStart.jsx";
import {pointEndIcon} from "../Icons/pointEnd.jsx";

export default function RoutingMarker() {
  const startPoint = useMapStore(state => state.startPoint);
  const endPoint = useMapStore(state => state.endPoint);

  return <>
    {startPoint && (
      <Marker position={[startPoint.lat, startPoint.lng]} icon={pointStartIcon}>
        <Popup>
          <div className="font-bold text-blue-600">📍 Điểm Xuất Phát</div>
          <div className="text-sm text-gray-600">{startPoint.address.display_name}</div>
        </Popup>
      </Marker>
    )}
    {endPoint && (
      <Marker position={[endPoint.lat, endPoint.lng]} icon={pointEndIcon}>
        <Popup>
          <div className="font-bold text-red-600">🎯 Điểm Đích</div>
          <div className="text-sm text-gray-600">{endPoint.address.display_name}</div>
        </Popup>
      </Marker>
    )}
  </>
}