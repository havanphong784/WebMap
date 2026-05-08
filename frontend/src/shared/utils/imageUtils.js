import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
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
