import {Marker, Popup, useMap, useMapEvent} from "react-leaflet";
import {getAddress} from "../../utils/Map.jsx";
import {pointIcon} from "../Icons/point.jsx";
import {useRef} from "react";


export default function MapHandleClick({clickedPoint, setClickedPoint}) {
  const blockedClick = useRef(false);
  const map = useMap();
  useMapEvent('click', async (e) => {
    if (blockedClick.current) return;
    blockedClick.current = true;

    const {lat, lng} = e.latlng;
    map.flyTo(e.latlng, 18, {duration: 1.5});
    setClickedPoint({lat, lng, address: "Đang tải..."});

    const result = await getAddress(lat, lng);
    setClickedPoint({lat, lng, address: result});

    setTimeout(() => {
      blockedClick.current = false;
    }, 2000);
  })
  return <>
    {
      clickedPoint && (
        <>
          <Marker position={[clickedPoint.lat, clickedPoint.lng]} icon={pointIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-gray-800 mb-1">Thông tin vị trí</p>
                <p className="text-gray-600 mb-2">{clickedPoint.address}</p>
                <div className="bg-gray-100 p-2 rounded border border-gray-200 text-xs text-gray-500 font-mono">
                  Tọa độ: {clickedPoint.lat.toFixed(6)}, {clickedPoint.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        </>
      )
    }
  </>
}