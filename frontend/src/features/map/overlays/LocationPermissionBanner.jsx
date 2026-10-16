export default function LocationPermissionBanner({permission, onRetry}) {
  if (["checking", "granted"].includes(permission)) return null;

  return (
    <div className="absolute left-1/2 top-[calc(5rem+var(--app-safe-top))] z-30 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-cyan-glow/30 bg-white/95 p-3 text-xs text-text-primary shadow-floating backdrop-blur-xl">
      <p>{permission === "denied"
        ? "Aether cần quyền vị trí để hiển thị bạn trên bản đồ. Bạn vẫn có thể dùng bản đồ khi chưa cấp quyền."
        : "Chưa thể đọc GPS. Hãy bật dịch vụ vị trí rồi thử lại."}</p>
      <button type="button" onClick={onRetry} className="mt-2 font-bold text-cyan-glow">
        {permission === "denied" ? "Cấp quyền / thử lại" : "Thử lại GPS"}
      </button>
    </div>
  );
}
