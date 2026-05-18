// src/hooks/useDarkMode.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then((val) => {
      if (val === 'enabled') setIsDark(true);
    });
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('darkMode', next ? 'enabled' : 'disabled');
  };

  return { isDark, toggleDark };
};
