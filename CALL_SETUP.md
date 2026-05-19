# 📞 WhatsApp-Style Call Setup Guide

## কী কী করতে হবে (একবারের কাজ)

---

## ১. Firebase Console থেকে google-services.json নামাও

1. https://console.firebase.google.com → তোমার project
2. Project Settings → Your Apps → Android app
3. `google-services.json` download করো
4. **project root-এ রাখো** (App.js-এর পাশে)

iOS-এর জন্য:
- `GoogleService-Info.plist` download করো
- **project root-এ রাখো**

---

## ২. EAS-এ google-services.json আপলোড করো (CI/CD-এর জন্য)

```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

তারপর `eas.json`-এ add করো:
```json
{
  "build": {
    "preview": {
      "android": {
        "googleServicesFile": "$GOOGLE_SERVICES_JSON"
      }
    }
  }
}
```

---

## ৩. Android CallKeep — Phone Account Permission

App install করার পর প্রথমবার:
- Settings → Apps → RasBook → Permissions → Phone → Allow

অথবা app নিজেই popup দেখাবে।

---

## কীভাবে কাজ করে

```
Caller presses call button
        ↓
Firestore-এ call document তৈরি
        ↓
FCM/Expo Push → Callee-র ফোনে পৌঁছায়
        ↓
App killed?  →  Background FCM handler জাগে  →  CallKeep.displayIncomingCall()
App open?   →  FCM onMessage → CallKeep.displayIncomingCall()
        ↓
Native Phone-Style Screen (lock screen-এর উপরে)
[Answer] [Decline]
        ↓
Answer tap → App খোলে → Messenger screen → call শুরু
```

---

## Call States

| State | কী হয় |
|-------|--------|
| App open (foreground) | Native call screen ভেসে ওঠে |
| App background | Native call screen ভেসে ওঠে |
| App killed | FCM background handler জাগায়, তারপর native screen |
| Screen locked | Lock screen-এর উপরে call screen দেখায় |
| Do Not Disturb | CallKeep bypass করে (phone call হিসেবে treat) |
