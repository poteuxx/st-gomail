// User Service - Handles Profile and Settings Updates
const userService = {
    // Update user display profile
    updateProfile: async (data) => {
        const user = window.fb.auth.currentUser;
        if (!user) throw new Error("Authentication required.");

        try {
            // 1. Update Firebase Auth Profile
            if (data.displayName) {
                await user.updateProfile({
                    displayName: data.displayName,
                    photoURL: data.avatar || user.photoURL
                });
            }

            // 2. Update Firestore Doc
            const updateObj = {};
            if (data.displayName) updateObj.displayName = data.displayName;
            if (data.avatar) updateObj.avatar = data.avatar;
            if (data.theme) updateObj['settings.theme'] = data.theme;
            if (data.language) updateObj['settings.language'] = data.language;

            await window.fb.db.collection('users').doc(user.uid).update(updateObj);
            
            return true;
        } catch (error) {
            console.error("Profile update failed:", error);
            throw error;
        }
    }
};

window.userService = userService;
