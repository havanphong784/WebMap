import {Marker, Popup, useMap, useMapEvent} from "react-leaflet";
import {getAddress} from "../../utils/Map.jsx";
import {pointIcon} from "../Icons/point.jsx";
import {useRef} from "react";
import {useMapStore} from "../../context/useMapStore.jsx";


export default function MapHandleClick({clickedPoint, setClickedPoint}) {
  const blockedClick = useRef(false);
  const map = useMap();
  const setStartPoint = useMapStore(state => state.setStartPoint);
  const setEndPoint = useMapStore(state => state.setEndPoint);
  const startPoint = useMapStore(state => state.startPoint);
  const endPoint = useMapStore(state => state.endPoint);
  const clearRoute = useMapStore(state => state.clearRoute);

  useMapEvent('click', async (e) => {
    if (blockedClick.current) return;
    blockedClick.current = true;

    if (startPoint && endPoint) {
      clearRoute();
    }

    const {lat, lng} = e.latlng;
    map.flyTo(e.latlng, 18, {duration: 1.5});
    setClickedPoint({lat, lng, address: {display_name: "Dang tai ..."}});

    const result = await getAddress(lat, lng);
    setClickedPoint({lat, lng, address: result});

    setTimeout(() => {
      blockedClick.current = false;
    }, 1000);
  })

  return <>
    {
      clickedPoint && (
        <>
          <Marker position={[clickedPoint.lat, clickedPoint.lng]} icon={pointIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-gray-800 mb-1">Thông tin vị trí</p>
                <p className="text-gray-600 mb-2">{clickedPoint.address.display_name}</p>
                <div className="bg-gray-100 p-2 rounded border border-gray-200 text-xs text-gray-500 font-mono">
                  Tọa độ: {clickedPoint.lat.toFixed(6)}, {clickedPoint.lng.toFixed(6)}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setStartPoint(clickedPoint)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold w-full transition"
                  >
                    📍 Điểm Đi
                  </button>

                  <button
                    onClick={() => setEndPoint(clickedPoint)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold w-full transition"
                  >
                    🎯 Điểm Đến
                  </button>
                </div>

              </div>
            </Popup>
          </Marker>
        </>
      )
    }
  </>
}