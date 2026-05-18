// src/hooks/useNetworkStatus.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Web: use browser's online/offline events
    if (Platform.OS === 'web') {
      setIsOnline(navigator.onLine);
      const onOnline  = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online',  onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online',  onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }

    // Native: use NetInfo
    let unsub = () => {};
    import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
      NetInfo.fetch().then((s) => setIsOnline(!!s.isConnected));
      unsub = NetInfo.addEventListener((s) => {
        setIsOnline(s.isConnected && s.isInternetReachable !== false);
      });
    }).catch(() => setIsOnline(true));
    return () => unsub();
  }, []);

  return isOnline;
};
