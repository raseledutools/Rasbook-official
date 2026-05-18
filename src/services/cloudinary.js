// src/services/cloudinary.js

const CLOUD_NAME = 'de2w78yxh';
const UPLOAD_PRESET = 'ml_default';

export const uploadToCloudinary = async (uri, type = 'image') => {
  const formData = new FormData();

  const filename = uri.split('/').pop();
  const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';

  formData.append('file', { uri, name: filename, type: mimeType });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
};
