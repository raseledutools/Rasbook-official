// functions/index.js
// Firebase Cloud Function — FCM high-priority call notification
// App killed থাকলেও এটা দিয়ে call screen আসবে

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// ── HTTP Function: caller এটা call করলে FCM যাবে ───────────────────────────
exports.sendCallNotification = functions.https.onCall(async (data, context) => {
  const { calleeUid, callerName, callType, callId } = data;

  if (!calleeUid || !callerName || !callId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  // Firestore থেকে callee-র FCM token নাও
  const userDoc = await admin.firestore().doc(`users/${calleeUid}`).get();
  const userData = userDoc.data();

  if (!userData) {
    throw new functions.https.HttpsError("not-found", "User not found");
  }

  const fcmToken = userData.fcmToken || userData.expoPushToken;

  if (!fcmToken) {
    throw new functions.https.HttpsError("not-found", "No FCM token for this user");
  }

  // ── FCM data-only message (high priority) ───────────────────────────────
  // data-only মানে notification bar-এ কিছু দেখায় না,
  // সরাসরি background handler-কে জাগায় → CallKeep screen দেখায়
  const message = {
    token: fcmToken,
    data: {
      type: "incoming_call",
      callerName: String(callerName),
      callType: String(callType || "audio"),
      callId: String(callId),
    },
    android: {
      priority: "high",          // ← এইটাই app-কে জাগায় killed state থেকে
      ttl: 30 * 1000,            // 30 seconds — call miss হলে notification সরে যাক
    },
    apns: {
      headers: {
        "apns-priority": "10",   // iOS high priority
        "apns-push-type": "voip",
      },
      payload: {
        aps: {
          "content-available": 1, // iOS background fetch trigger
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("FCM sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("FCM send failed:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ── Firestore Trigger (বিকল্প): call document তৈরি হলে automatically পাঠাও ──
// এটা use করলে client থেকে function call করতে হবে না
exports.onCallCreated = functions.firestore
  .document("calls/{callId}")
  .onCreate(async (snap, context) => {
    const callData = snap.data();
    const { callee, caller, callerName, type: callType } = callData;
    const callId = context.params.callId;

    if (!callee || !callerName) return null;

    // Callee-র token নাও
    const userDoc = await admin.firestore().doc(`users/${callee}`).get();
    const fcmToken = userDoc.data()?.fcmToken || userDoc.data()?.expoPushToken;

    if (!fcmToken) return null;

    const message = {
      token: fcmToken,
      data: {
        type: "incoming_call",
        callerName: String(callerName),
        callType: String(callType || "audio"),
        callId: String(callId),
      },
      android: {
        priority: "high",
        ttl: 30 * 1000,
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "voip",
        },
        payload: {
          aps: { "content-available": 1 },
        },
      },
    };

    try {
      await admin.messaging().send(message);
      console.log(`Call notification sent to ${callee} for call ${callId}`);
    } catch (e) {
      console.error("FCM error:", e.message);
    }

    return null;
  });
