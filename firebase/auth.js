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

      // Generate E2EE Key Pair
      const keyPair = await window.cryptoService.generateKeyPair();

      // Create Real World Email Bridge (for receiving external OTPs)
      const domains1sec = ["1secmail.com", "1secmail.org", "1secmail.net"];
      const randomDomain = domains1sec[Math.floor(Math.random() * domains1sec.length)];
      const prefix = email.split('@')[0];
      const realAlias = `${prefix}@${randomDomain}`;

      // Store extra data in Firestore
      await window.fb.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        displayName: displayName,
        username: username,
        publicKey: keyPair.publicKey,
        realAlias: realAlias, // Standard real-world email bridge
        createdAt: window.fb.FieldValue.serverTimestamp(),
        settings: {
          theme: 'poteuxx-classic',
          language: 'en'
        }
      });

      // Store Private Key securely (In this demo, we'll store it in localStorage 
      // but in production it should be encrypted with a key derived from password)
      localStorage.setItem(`stgo_priv_${email}`, keyPair.privateKey);

      // Send Welcome Message
      await authService.sendWelcomeMessage(email, displayName);

      // Safety Sync: Wait for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 800));

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
      let finalEmail = email.trim();
      if (!finalEmail.includes('@')) {
        // Search for username/displayName in firestore (Case-Insensitive)
        const snapshot = await window.fb.db.collection('users').get();
        const found = snapshot.docs.find(doc => {
            const d = doc.data();
            return (d.username && d.username.toLowerCase() === finalEmail.toLowerCase()) || 
                   (d.displayName && d.displayName.toLowerCase() === finalEmail.toLowerCase());
        });

        if (!found) {
          throw new Error("User not found in secure directory");
        }
        finalEmail = found.data().email;
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
  },

  // Send Welcome Message
  sendWelcomeMessage: async (email, displayName) => {
    try {
      const welcomeBody = `Hello ${displayName},\n\nWelcome to StGo-Mail! Your account has been successfully created with End-to-End Encryption enabled.\n\nYour communication is now secure and private. Our Pulsar Edition (2.1) brings you multi-language support and a faster experience.\n\nBest regards,\nThe StGo-Mail Team`;
      
      // Since it's the first message, we can send it unencrypted from system or encrypt it if we have the public key
      // Let's use the mailService to send it.
      await window.mailService.sendEmail({
        from: 'system@stgo.mail',
        fromName: 'StGo System',
        to: email,
        subject: 'Welcome to the Future of Mail',
        body: welcomeBody,
        isSystem: true // Flag to skip encryption check for system messages if needed
      });
    } catch (error) {
      console.error("Welcome message error:", error);
    }
  }
};

window.authService = authService;
