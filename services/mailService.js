// Mail Service - Handles all email operations
const mailService = {
  // Send a new email
  sendEmail: async (data) => {
    try {
      // 1. Get Recipient Public Key
      let encryptedBody = data.body;
      let isEncrypted = false;
      let encryptionMetadata = null;

      if (!data.isSystem) {
        const recipientSnapshot = await window.fb.db.collection('users').where('email', '==', data.to).get();
        if (!recipientSnapshot.empty) {
          const recipientData = recipientSnapshot.docs[0].data();
          if (recipientData.publicKey) {
            const encryptedData = await window.cryptoService.encrypt(data.body, recipientData.publicKey);
            encryptedBody = encryptedData.content;
            encryptionMetadata = {
                iv: encryptedData.iv,
                encryptedKey: encryptedData.encryptedKey
            };
            isEncrypted = true;
          }
        }
      }

      const emailObj = {
        from: data.from || window.fb.auth.currentUser.email,
        fromName: data.fromName || window.fb.auth.currentUser.displayName,
        to: data.to,
        subject: data.subject || "(No Subject)",
        body: encryptedBody,
        isEncrypted: isEncrypted,
        encryptionMetadata: encryptionMetadata,
        timestamp: window.fb.FieldValue.serverTimestamp(),
        read: false,
        folder: 'inbox',
        starred: false,
        trash: false,
        spam: false,
        attachments: data.attachments || []
      };

      await window.fb.db.collection('mails').add(emailObj);
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

    return query.orderBy('timestamp', 'desc').onSnapshot(async snapshot => {
      const mails = [];
      const user = window.fb.auth.currentUser;
      const privKey = localStorage.getItem(`stgo_priv_${user.email}`);

      for (const doc of snapshot.docs) {
        const mailData = doc.data();
        let decryptedBody = mailData.body;

        if (mailData.isEncrypted && privKey && mailData.to === user.email) {
            decryptedBody = await window.cryptoService.decrypt({
                content: mailData.body,
                iv: mailData.encryptionMetadata.iv,
                encryptedKey: mailData.encryptionMetadata.encryptedKey
            }, privKey);
        }

        mails.push({ id: doc.id, ...mailData, body: decryptedBody });
      }
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
  },

  // Real World Mail Bridge - Fetch from 1secmail
  syncExternalMails: async (realAlias) => {
    if (!realAlias) return;
    try {
        const [login, domain] = realAlias.split('@');
        const listUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
        const response = await fetch(listUrl);
        const messages = await response.json();

        for (const msg of messages) {
            // Check if we already processed this message
            const exists = await window.fb.db.collection('mails')
                .where('externalId', '==', msg.id)
                .where('to', '==', window.fb.auth.currentUser.email)
                .get();

            if (exists.empty) {
                // Fetch full content
                const contentUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`;
                const contentRes = await fetch(contentUrl);
                const fullMail = await contentRes.json();

                // Save to Firestore as a native mail
                await window.fb.db.collection('mails').add({
                    from: fullMail.from,
                    fromName: "External Bridge",
                    to: window.fb.auth.currentUser.email,
                    subject: fullMail.subject,
                    body: fullMail.textBody || fullMail.body,
                    timestamp: window.fb.FieldValue.serverTimestamp(),
                    read: false,
                    folder: 'inbox',
                    externalId: msg.id,
                    isExternal: true, // Special flag for UI
                    isSystem: true // System messages aren't E2EE usually unless preset
                });
                
                console.log(`Bridge: Received real email from ${fullMail.from}`);
                window.notif.info(`New World Bridge mail from ${fullMail.from}`);
            }
        }
    } catch (error) {
        console.error("Mail Bridge Error:", error);
    }
  }
};

window.mailService = mailService;
