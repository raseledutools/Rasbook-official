// src/services/callKeepService.js
import { Platform } from 'react-native';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

const isNative = Platform.OS !== 'web';
let RNCallKeep = null;
let callKeepReady = false;

export const setupCallKeep = async () => {
  if (!isNative) return;
  try {
    const mod = require('react-native-callkeep');
    RNCallKeep = mod.default || mod;
    if (!RNCallKeep || !RNCallKeep.setup) {
      console.warn('[CallKeep] Module loaded but setup not available');
      return;
    }
    await RNCallKeep.setup({
      ios: {
        appName: 'RasBook',
        supportsVideo: true,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
        includesCallsInRecents: true,
      },
      android: {
        alertTitle: 'Permissions Required',
        alertDescription: 'RasBook needs phone account permissions to show incoming calls.',
        cancelButton: 'Cancel',
        okButton: 'Allow',
        imageName: 'ic_launcher_round',
        additionalPermissions: ['android.permission.READ_PHONE_STATE'],
        foregroundService: {
          channelId: 'rasbook_call',
          channelName: 'RasBook Calls',
          notificationTitle: 'RasBook call in progress',
          notificationIcon: 'ic_launcher_round',
        },
      },
    });
    callKeepReady = true;
    console.log('[CallKeep] Ready');
  } catch (e) {
    console.warn('[CallKeep] Setup failed (non-fatal):', e?.message || e);
    callKeepReady = false;
  }
};

export const showIncomingCall = (callerName, callId, isVideo = false) => {
  if (!callKeepReady || !RNCallKeep) return null;
  try {
    const callUUID = callId || generateUUID();
    RNCallKeep.displayIncomingCall(callUUID, callerName, callerName, 'generic', isVideo);
    return callUUID;
  } catch (e) {
    console.warn('[CallKeep] showIncomingCall failed:', e?.message);
    return null;
  }
};

export const endCallKeep = (callUUID) => {
  if (!callKeepReady || !RNCallKeep || !callUUID) return;
  try { RNCallKeep.endCall(callUUID); } catch (e) {}
};

export const registerCallKeepListeners = (onAnswer, onReject) => {
  if (!callKeepReady || !RNCallKeep) return () => {};
  try {
    RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      try { RNCallKeep.setCurrentCallActive(callUUID); } catch (e) {}
      onAnswer && onAnswer(callUUID);
    });
    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      onReject && onReject(callUUID);
    });
    return () => {
      try {
        RNCallKeep.removeEventListener('answerCall');
        RNCallKeep.removeEventListener('endCall');
      } catch (e) {}
    };
  } catch (e) {
    console.warn('[CallKeep] Listener registration failed:', e?.message);
    return () => {};
  }
};
