import { memo, useRef } from "react";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
  EyeIcon,
  LocateIcon,
  MinusIcon,
  PhotoIcon,
  PinIcon,
  PlusIcon,
  SpinnerIcon
} from "../../../shared/components/common/icons.jsx";

const MapControls = memo(({ 
  onLocate, 
  isLocating, 
  onPhotoUpload, 
  isExtractingPhoto, 
  viewMode, 
  setViewMode, 
  onZoomIn, 
  onZoomOut,
  fileInputRef
}) => {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:right-6 z-100 flex flex-col gap-3 sm:gap-4">
      <ActionButton
        variant="icon"
        onClick={() => setViewMode(prev => prev === 'mini' ? 'full' : 'mini')}
        className={viewMode === 'full' ? "bg-cyan-glow/20 border-cyan-glow" : "bg-obsidian"}
        title={viewMode === 'full' ? "Chế độ Thu nhỏ" : "Chế độ Đầy đủ"}
      >
        {viewMode === 'full' ? <PinIcon size={22} className="text-cyan-glow"/> : <EyeIcon size={22} className="text-text-primary"/>}
      </ActionButton>

      <ActionButton
        variant="icon"
        onClick={onLocate}
        disabled={isLocating}
        className="bg-obsidian"
      >
        {isLocating ? <SpinnerIcon size={22} className="text-cyan-glow animate-spin"/> :
          <LocateIcon size={22} className="text-cyan-glow"/>}
      </ActionButton>

      <ActionButton
        variant="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtractingPhoto}
        className="bg-obsidian"
      >
        {isExtractingPhoto ? <SpinnerIcon size={22} className="text-cyan-glow animate-spin"/> :
          <PhotoIcon size={22} className="text-cyan-glow"/>}
      </ActionButton>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="*"
        onChange={onPhotoUpload}
      />

      <div className="hidden sm:flex flex-col bg-obsidian gap-2 glass-panel p-2 rounded-2xl border-glass-border shadow-glass">
        <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={onZoomIn}>
          <PlusIcon size={22} className="text-text-primary"/>
        </ActionButton>
        <div className="h-px w-full bg-glass-border mx-auto" style={{width: '60%'}}></div>
        <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={onZoomOut}>
          <MinusIcon size={22} className="text-text-primary"/>
        </ActionButton>
      </div>
    </div>
  );
});

MapControls.displayName = "MapControls";

export default MapControls;
