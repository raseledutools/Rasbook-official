// src/components/VideoPlayerNative.js
import React from 'react';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPlayerNative({ uri }) {
  return (
    <Video
      source={{ uri }}
      style={{ width: '100%', height: 300, backgroundColor: '#000' }}
      useNativeControls
      resizeMode={ResizeMode.COVER}
    />
  );
}
