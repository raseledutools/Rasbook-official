// src/services/fileUploadService.js
// WhatsApp-style file upload — image, video, document, audio
// Uses Cloudinary for storage (already configured in cloudinary.js)

import { Platform, Alert } from 'react-native';

const CLOUD_NAME = 'de2w78yxh';
const UPLOAD_PRESET = 'ml_default';

// ── File type detector ─────────────────────────────────────────────────────
export const getFileType = (uri, mimeType) => {
  const lower = (uri || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|bmp)/.test(lower)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|3gp)/.test(lower)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)/.test(lower)) return 'audio';
  return 'document'; // pdf, doc, xlsx, zip, etc.
};

// ── Upload to Cloudinary ───────────────────────────────────────────────────
export const uploadFile = async (uri, mimeType, fileName, onProgress) => {
  const fileType = getFileType(uri, mimeType);

  const formData = new FormData();
  formData.append('file', { uri, name: fileName || 'file', type: mimeType || 'application/octet-stream' });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  // Resource type: video handles audio+video, image handles images, raw handles documents
  let resourceType = 'auto';
  if (fileType === 'document') resourceType = 'raw';

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');

    return {
      url: data.secure_url,
      fileType,
      fileName: fileName || data.original_filename || 'file',
      fileSize: data.bytes || 0,
      mimeType: mimeType || '',
      duration: data.duration || null, // for audio/video
      width: data.width || null,
      height: data.height || null,
      thumbnail: fileType === 'video'
        ? data.secure_url.replace('/upload/', '/upload/so_0,f_jpg/').replace(/\.[^.]+$/, '.jpg')
        : null,
    };
  } catch (e) {
    throw new Error('File upload failed: ' + e.message);
  }
};

// ── Format file size ───────────────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ── File icon by type ──────────────────────────────────────────────────────
export const getFileIcon = (mimeType, fileType) => {
  if (fileType === 'image') return 'image';
  if (fileType === 'video') return 'film';
  if (fileType === 'audio') return 'music';
  const m = (mimeType || '').toLowerCase();
  if (m.includes('pdf')) return 'file-pdf';
  if (m.includes('word') || m.includes('doc')) return 'file-word';
  if (m.includes('sheet') || m.includes('excel') || m.includes('xlsx')) return 'file-excel';
  if (m.includes('zip') || m.includes('rar') || m.includes('tar')) return 'file-zipper';
  return 'file';
};

// ── Pick file (native) ─────────────────────────────────────────────────────
export const pickFile = async (type = 'all') => {
  // type: 'image' | 'video' | 'audio' | 'document' | 'all'
  try {
    if (type === 'image' || type === 'video') {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo/video access in Settings.');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : type === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize,
      };
    } else {
      // Document / audio / all — use expo-document-picker
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'audio'
          ? ['audio/*']
          : type === 'document'
          ? ['application/*', 'text/*']
          : ['*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || 'application/octet-stream',
        fileName: asset.name,
        fileSize: asset.size,
      };
    }
  } catch (e) {
    console.warn('File pick error:', e.message);
    return null;
  }
};

// ── Take photo / record video ──────────────────────────────────────────────
export const takeMedia = async (type = 'image') => {
  try {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access in Settings.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: type === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      mimeType: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
      fileName: asset.fileName || asset.uri.split('/').pop(),
      fileSize: asset.fileSize,
    };
  } catch (e) {
    Alert.alert('Camera error', e.message);
    return null;
  }
};
