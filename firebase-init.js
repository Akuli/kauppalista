firebase.initializeApp({
  apiKey: 'AIzaSyCbXhC4bh7jN28FJhp9EDjPmdQERzdHROM',
  authDomain: 'kauppalista-857c5.firebaseapp.com',
  projectId: 'kauppalista-857c5'
});

/*
Firestore rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}*/
