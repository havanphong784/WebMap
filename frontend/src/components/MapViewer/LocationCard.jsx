import {Marker} from "react-map-gl/maplibre";

export default function LocationCard({location, onClick}) {
  return (
    <Marker
      longitude={Number(location.lng)}
      latitude={Number(location.lat)}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(location);
      }}
    >
      {/* Container: Tăng độ tương phản cực đại bằng viền trắng và bóng đổ đa lớp */}
      <div
        className="bg-zinc-950 border-2 border-white/60 rounded-xl p-1.5 w-48 cursor-pointer transition-all duration-300 hover:scale-110 hover:border-white shadow-[0_15px_30px_rgba(0,0,0,0.8),_0_0_15px_rgba(255,255,255,0.15)] group">

        {/* Hình ảnh: Thêm border nhẹ để tách ảnh khỏi nền card */}
        {location.image_url && (
          <div className="overflow-hidden rounded-lg mb-2 border border-white/10">
            <img
              src={location.image_url}
              alt={location.name}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Nội dung */}
        <div className="px-1">
          <h4 className="text-sm font-bold text-white leading-tight truncate drop-shadow-md" title={location.name}>
            {location.name}
          </h4>
          <div className="flex items-center mt-1">
            <span className="text-xs text-yellow-400 font-bold drop-shadow-sm">
              {"★".repeat(location.rating)}
            </span>
          </div>
        </div>

        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 border-r-2 border-b-2 border-white/60 rotate-45"></div>
      </div>
    </Marker>
  );
}