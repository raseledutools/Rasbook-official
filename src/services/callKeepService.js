// src/services/callKeepService.js
// WhatsApp-style incoming call — works even when app is killed
import { Platform } from 'react-native';
// uuid — built-in, no package needed
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

// ── Setup CallKeep (call once at app start) ──────────────────────────────────
export const setupCallKeep = async () => {
  if (!isNative) return;
  try {
    RNCallKeep = (await import('react-native-callkeep')).default;

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
        // Makes the incoming call show as full-screen even when phone is locked
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
    console.log('CallKeep ready');
  } catch (e) {
    console.warn('CallKeep setup failed:', e.message);
  }
};

// ── Show incoming call screen (full-screen, even if app is killed) ───────────
export const showIncomingCall = (callerName, callId, isVideo = false) => {
  if (!callKeepReady || !RNCallKeep) return;
  const callUUID = callId || generateUUID();
  RNCallKeep.displayIncomingCall(callUUID, callerName, callerName, 'generic', isVideo);
  return callUUID;
};

// ── End a call ────────────────────────────────────────────────────────────────
export const endCallKeep = (callUUID) => {
  if (!callKeepReady || !RNCallKeep || !callUUID) return;
  try {
    RNCallKeep.endCall(callUUID);
  } catch (e) {}
};

// ── Register answer/reject listeners ─────────────────────────────────────────
// onAnswer: () => void, onReject: () => void
export const registerCallKeepListeners = (onAnswer, onReject) => {
  if (!callKeepReady || !RNCallKeep) return () => {};

  RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
    RNCallKeep.setCurrentCallActive(callUUID);
    onAnswer(callUUID);
  });

  RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
    onReject(callUUID);
  });

  RNCallKeep.addEventListener('didPerformDTMFAction', () => {});

  return () => {
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('endCall');
  };
};
