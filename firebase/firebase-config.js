// Firebase Configuration - Senior Refined Version
const firebaseConfig = {
  apiKey: "AIzaSyDKaoMe0t8N-XvQvfIoVT58R34IXjqY6bU",
  authDomain: "st-gomail.firebaseapp.com",
  projectId: "st-gomail",
  storageBucket: "st-gomail.appspot.com",
  messagingSenderId: "501733449757",
  appId: "1:501733449757:web:710ecf8b1ed9627125e6f4"
};

// Initialize Firebase with safety check
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🚀 StGo-Mail: Firebase initialized successfully.");
  }
} catch (error) {
  console.error("❌ StGo-Mail: Firebase initialization failed:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Global Access Bridge
window.fb = {
  auth,
  db,
  storage,
  FieldValue: firebase.firestore.FieldValue
};
