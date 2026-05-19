# RasBook — Fixed Version

## ✅ What was fixed

### 1. 🔐 LoginScreen — Google Sign In + Name field
- Added **Google Sign In** button (web uses Firebase popup, native needs `@react-native-google-signin/google-signin`)
- Added **Name field** on registration — so display name is always set
- `updateProfile()` called immediately after register
- User saved to Firestore `users` collection on signup
- Beautiful **tab-based UI** (Log In / Sign Up)
- Password show/hide toggle
- Card design with shadow

### 2. 💬 MessengerScreen — Real name + Online status
- **Name bug fixed**: on login, real `displayName` written to Firestore messenger collection
- **Online indicator** (green dot) shown for users active within 2 minutes
- Chat unsubscribe properly on contact switch (no memory leak)
- `senderName` shown in bubble for received messages
- Cleaner empty state UI

### 3. 📞 Call Permission Fix
- **Replaced `navigator.mediaDevices` with Expo permissions** on native
- `Audio.requestPermissionsAsync()` and `Camera.requestCameraPermissionsAsync()` called before starting a call
- Clear error messages if permission denied
- Note: Full native WebRTC calling requires `react-native-webrtc` package

### 4. 👤 ProfileScreen — Updates everywhere
- Profile save now updates **both** Firestore `users` AND `messenger` presence
- So name change reflects instantly in Messenger
- Camera permission requested before photo pick
- Redesigned with cover photo, camera badge, card layout

### 5. 🏠 HomeScreen — Facebook-style header
- Added proper header with logo + search + notification icons + avatar
- Better empty state

### 6. 🎬 ReelsScreen — Permission + Web video fix
- Permission requested before picking video
- Web uses native `<video>` element instead of expo-av (which crashes on web)
- Upload button with loading state

### 7. 🧭 AppNavigator
- Reels tab added
- iOS safe area height fix for tab bar

---

## 🚀 Setup

```bash
# Install dependencies
npm install

# For Google Sign In on native, also run:
npm install @react-native-google-signin/google-signin

# Start
npx expo start
```

## 🔴 One manual step for Google Sign In (Native)

In `src/screens/LoginScreen.js`, replace:
```js
webClientId: 'YOUR_WEB_CLIENT_ID',
```
With your actual Web Client ID from:
**Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration → Web client ID**

---

## 📁 Files Changed
- `src/screens/LoginScreen.js` ← Google Sign In, Name field, new UI
- `src/screens/MessengerScreen.js` ← Name fix, permission fix, online dots
- `src/screens/ProfileScreen.js` ← Updates Firestore + Messenger on save
- `src/screens/HomeScreen.js` ← Facebook-style header
- `src/screens/ReelsScreen.js` ← Permission + web video fix
- `src/navigation/AppNavigator.js` ← Reels tab, iOS height fix
