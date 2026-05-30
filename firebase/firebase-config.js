// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKaoMe0t8N-XvQvfIoVT58R34IXjqY6bU",
  authDomain: "st-gomail.firebaseapp.com",
  projectId: "st-gomail",
  storageBucket: "st-gomail.appspot.com",
  messagingSenderId: "501733449757",
  appId: "1:501733449757:web:710ecf8b1ed9627125e6f4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Exporting to global scope for non-module compatibility or using as a script
window.fb = {
  auth,
  db,
  storage,
  FieldValue: firebase.firestore.FieldValue
};
