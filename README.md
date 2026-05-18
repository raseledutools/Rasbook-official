# RasBook 📘

A Facebook-style social media app built with **React Native + Expo**, powered by **Firebase** & **Cloudinary**.

## 🚀 Features
- 🔐 Login / Register / Forgot Password (Firebase Auth)
- 📖 News Feed with real-time updates
- 📸 Create posts with Photo / Video
- 👍 Like, 💬 Comment, ✏️ Edit, 🗑️ Delete posts
- 📺 Stories (auto-expire 24h)
- 🔔 Notifications (like & comment)
- 🔍 Search Users
- 👤 Edit Profile (name + photo)
- 🌙 Dark Mode
- 🌐 Web support (react-native-web)

## 📦 Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React Native + Expo |
| Navigation | React Navigation v6 |
| Auth | Firebase Auth |
| Database | Firestore |
| Storage | Cloudinary |
| CI/CD | GitHub Actions + EAS |
| Web | react-native-web |

## ⚡ Quick Start

```bash
# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/rasbook.git
cd rasbook

# 2. Install dependencies
npm install

# 3. Start development
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on Web
npx expo start --web
```

## 🔧 GitHub Secrets Setup (for CI/CD)

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Description |
|---|---|
| `EXPO_TOKEN` | Get from https://expo.dev/accounts/[user]/settings/access-tokens |
| `VERCEL_TOKEN` | Get from https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |

## 📁 Project Structure
```
RasBook/
├── App.js                        # Root entry
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD
└── src/
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── HomeScreen.js
    │   ├── ProfileScreen.js
    │   ├── NotificationsScreen.js
    │   └── SearchScreen.js
    ├── components/
    │   ├── PostCard.js
    │   ├── CreatePost.js
    │   ├── StoriesBar.js
    │   └── Header.js
    ├── navigation/
    │   └── AppNavigator.js
    ├── hooks/
    │   ├── useAuth.js
    │   └── useDarkMode.js
    ├── services/
    │   ├── firebase.js
    │   └── cloudinary.js
    └── utils/
        └── theme.js
```

## 🏗️ Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```
