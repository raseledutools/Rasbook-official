// src/hooks/useNetworkStatus.js
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    // initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  return isOnline;
};
