import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.3, // Even smaller for instant feel
    maxWidthOrHeight: 1280, // Optimized for mobile cards
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.7, // Focused on speed
  };



  try {
    const compressedFile = await imageCompression(file, options);
    const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return new File([compressedFile], `${newFileName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
};
