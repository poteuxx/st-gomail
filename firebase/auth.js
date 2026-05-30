// Firebase Authentication Service
const authService = {
  // Register new user
  register: async (email, password, displayName, username) => {
    try {
      const userCredential = await window.fb.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile
      await user.updateProfile({
        displayName: displayName
      });

      // Store extra data in Firestore
      await window.fb.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        displayName: displayName,
        username: username,
        createdAt: window.fb.FieldValue.serverTimestamp(),
        settings: {
          theme: 'poteuxx-classic',
          language: 'en'
        }
      });

      return user;
    } catch (error) {
      console.error("Registration Error:", error);
      throw error;
    }
  },

  // Login existing user
  login: async (email, password) => {
    try {
      // Check if input is a username instead of email
      let finalEmail = email;
      if (!email.includes('@')) {
        // Search for username in firestore
        const snapshot = await window.fb.db.collection('users').where('username', '==', email).get();
        if (snapshot.empty) {
          throw new Error("User not found");
        }
        finalEmail = snapshot.docs[0].data().email;
      }

      const userCredential = await window.fb.auth.signInWithEmailAndPassword(finalEmail, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
          throw new Error("This domain is not authorized in Firebase Console. Please add 'poteuxx.github.io' to Authorized Domains.");
      }
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    await window.fb.auth.signOut();
    window.location.href = 'login.html';
  },

  // Get current user data
  getCurrentUserData: async () => {
    const user = window.fb.auth.currentUser;
    if (!user) return null;
    
    const doc = await window.fb.db.collection('users').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
  },

  // Check auth state
  onAuthStateInit: (callback) => {
    window.fb.auth.onAuthStateChanged(callback);
  }
};

window.authService = authService;
