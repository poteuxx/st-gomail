// Mail Service - Handles all email operations
const mailService = {
  // Send a new email
  sendEmail: async (data) => {
    try {
      const emailObj = {
        from: window.fb.auth.currentUser.email,
        fromName: window.fb.auth.currentUser.displayName,
        to: data.to,
        subject: data.subject || "(No Subject)",
        body: data.body,
        timestamp: window.fb.FieldValue.serverTimestamp(),
        read: false,
        folder: 'inbox', // Default folder for recipient
        starred: false,
        trash: false,
        spam: false,
        attachments: data.attachments || []
      };

      // 1. Add to recipient's inbox (In a real app, you'd find the recipient's UID)
      // For this demo, we store everything in a central 'mails' collection
      await window.fb.db.collection('mails').add(emailObj);

      // 2. Add to sender's 'sent' folder (In a real app, this might be a separate record or a flag)
      // We'll mark the same document or create a copy for the sender's sent box
      // For simplicity in this project, we'll just query based on 'from' and 'to'
      
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },

  // Get emails for a specific folder
  getEmails: (folder, callback) => {
    const userEmail = window.fb.auth.currentUser.email;
    let query = window.fb.db.collection('mails');

    if (folder === 'inbox') {
      query = query.where('to', '==', userEmail).where('trash', '==', false).where('spam', '==', false);
    } else if (folder === 'sent') {
      query = query.where('from', '==', userEmail);
    } else if (folder === 'trash') {
      query = query.where('to', '==', userEmail).where('trash', '==', true);
    } else if (folder === 'starred') {
      query = query.where('to', '==', userEmail).where('starred', '==', true);
    }

    return query.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
      const mails = [];
      snapshot.forEach(doc => mails.push({ id: doc.id, ...doc.data() }));
      callback(mails);
    });
  },

  // Mark email as read/unread
  toggleRead: async (mailId, status) => {
    return await window.fb.db.collection('mails').doc(mailId).update({ read: status });
  },

  // Toggle starred status
  toggleStar: async (mailId, status) => {
    return await window.fb.db.collection('mails').doc(mailId).update({ starred: status });
  },

  // Move to trash
  moveToTrash: async (mailId) => {
    return await window.fb.db.collection('mails').doc(mailId).update({ trash: true });
  }
};

window.mailService = mailService;
