// plugins/withCallKeep.js
// react-native-callkeep এর নিজস্ব expo config plugin নেই
// এই custom plugin AndroidManifest.xml এ CallKeep-এর জন্য দরকারি
// permissions + service + receiver যোগ করে
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCallKeep(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // ── Permissions ──────────────────────────────────────────────────────
    const neededPermissions = [
      'android.permission.READ_PHONE_STATE',
      'android.permission.CALL_PHONE',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.MANAGE_OWN_CALLS',
      'android.permission.USE_FULL_SCREEN_INTENT',
    ];

    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    const existingPerms = manifest['uses-permission'].map(p => p.$?.['android:name']);
    neededPermissions.forEach(perm => {
      if (!existingPerms.includes(perm)) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    });

    // ── Application block ────────────────────────────────────────────────
    const app = manifest.application[0];

    // ConnectionService (CallKeep uses this for phone calls on Android 8+)
    if (!app.service) app.service = [];
    const hasConnSvc = app.service.some(
      s => s.$?.['android:name'] === 'io.wazo.callkeep.VoiceConnectionService'
    );
    if (!hasConnSvc) {
      app.service.push({
        $: {
          'android:name': 'io.wazo.callkeep.VoiceConnectionService',
          'android:label': 'RasBook',
          'android:permission': 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
          'android:foregroundServiceType': 'microphone',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.telecom.ConnectionService' } }],
          },
        ],
      });
    }

    return config;
  });
};
