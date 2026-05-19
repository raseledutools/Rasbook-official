# Firestore Rules — নতুন Collections এর জন্য

নিচের collections গুলো Firebase Console > Firestore > Rules এ add করুন:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing rules...
    match /users/{uid} { allow read, write: if request.auth != null; }
    match /posts/{postId} { allow read, write: if request.auth != null; }
    match /notifications/{id} { allow read, write: if request.auth != null; }

    // ✅ নতুন — Company Ads
    match /companyAds/{adId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.companyId;
    }

    // ✅ নতুন — Orders
    match /orders/{orderId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.buyerUid ||
         request.auth.uid == resource.data.companyId);
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.companyId;
    }

    // ✅ নতুন — Waitlist
    match /waitlist/{id} {
      allow read: if request.auth != null && request.auth.uid == resource.data.companyId;
      allow create: if request.auth != null;
    }
  }
}
```
