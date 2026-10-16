import { memo } from "react";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
  CloudIcon,
  EyeIcon,
  LocateIcon,
  MinusIcon,
  PhotoIcon,
  PinIcon,
  PlusIcon,
  SpinnerIcon
} from "../../../shared/components/common/icons.jsx";
import {cn} from "../../../shared/utils/classNames.js";

const MapControls = memo(({
  onLocate,
  isLocating,
  onPhotoUpload,
  isExtractingPhoto,
  viewMode,
  setViewMode,
  onZoomIn,
  onZoomOut,
  fileInputRef,
  isVisible,
  onToggleWeather
}) => {
  const controlButton = "border-glass-border-bright bg-white/90 shadow-glass backdrop-blur-2xl";
  const activeButton = "border-cyan-glow/40 bg-cyan-glow/15 text-cyan-glow";

  return (
    <div className="absolute right-[calc(0.75rem+var(--app-safe-right))] top-[calc(10rem+var(--app-safe-top))] z-30 flex flex-col gap-2 sm:right-[calc(1.5rem+var(--app-safe-right))] sm:top-1/2 sm:-translate-y-1/2 sm:gap-3">
      <ActionButton
        variant="icon"
        size="icon"
        onClick={() => setViewMode(prev => prev === 'mini' ? 'full' : 'mini')}
        className={cn(controlButton, viewMode === 'full' && activeButton)}
        title={viewMode === 'full' ? "Thu gọn marker" : "Hiện marker đầy đủ"}
        aria-label={viewMode === 'full' ? "Chuyển marker sang dạng thu gọn" : "Chuyển marker sang dạng đầy đủ"}
      >
        {viewMode === 'full'
          ? <PinIcon size={20} className="text-cyan-glow"/>
          : <EyeIcon size={20} className="text-text-primary"/>}
      </ActionButton>

      <ActionButton
        variant="icon"
        size="icon"
        onClick={onToggleWeather}
        className={cn(controlButton, isVisible && activeButton)}
        title="Bật/tắt thời tiết"
        aria-label="Bật tắt lớp thời tiết"
      >
        <CloudIcon size={20} className={isVisible ? "text-cyan-glow" : "text-text-muted"} />
      </ActionButton>

      <ActionButton
        variant="icon"
        size="icon"
        onClick={onLocate}
        disabled={isLocating}
        className={controlButton}
        aria-label="Định vị vị trí của bạn"
      >
        {isLocating
          ? <SpinnerIcon size={20} className="text-cyan-glow animate-spin"/>
          : <LocateIcon size={20} className="text-cyan-glow"/>}
      </ActionButton>

      <ActionButton
        variant="icon"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtractingPhoto}
        className={controlButton}
        aria-label="Tải ảnh để lấy vị trí GPS"
      >
        {isExtractingPhoto
          ? <SpinnerIcon size={20} className="text-cyan-glow animate-spin"/>
          : <PhotoIcon size={20} className="text-cyan-glow"/>}
      </ActionButton>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={onPhotoUpload}
      />

      <div className="hidden flex-col gap-1 rounded-2xl border border-glass-border bg-white/90 p-1.5 shadow-glass backdrop-blur-2xl sm:flex">
        <ActionButton
          variant="ghost"
          size="iconSm"
          className="shadow-none"
          onClick={onZoomIn}
          aria-label="Phóng to bản đồ"
        >
          <PlusIcon size={20} className="text-text-primary"/>
        </ActionButton>
        <div className="mx-auto h-px w-6 bg-glass-border"></div>
        <ActionButton
          variant="ghost"
          size="iconSm"
          className="shadow-none"
          onClick={onZoomOut}
          aria-label="Thu nhỏ bản đồ"
        >
          <MinusIcon size={20} className="text-text-primary"/>
        </ActionButton>
      </div>
    </div>
  );
});

MapControls.displayName = "MapControls";

export default MapControls;
