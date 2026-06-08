// Inbox UI Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    window.authService.onAuthStateInit(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Load user info
        const userData = await window.authService.getCurrentUserData();
        if (userData) {
            document.getElementById('userName').innerText = userData.displayName;
            
            // Show Real Alias in dropdown header
            const emailFull = document.getElementById('userEmail');
            emailFull.innerHTML = `${userData.email}<br><span style="color:var(--secondary); font-size:0.75rem">Bridge: ${userData.realAlias}</span>`;

            if (userData.avatar) {
                document.getElementById('userAvatar').src = userData.avatar;
            }

            // Start Real World Sync
            startMailBridge(userData.realAlias);
        }

        // Initialize Inbox
        loadFolder('inbox');
        updateStats();
        setupRealTimeNotifications();

        window.addEventListener('localeChanged', () => {
            loadFolder(currentFolder);
        });
    });

    function startMailBridge(realAlias) {
        // Initial sync
        window.mailService.syncExternalMails(realAlias);
        // Sync every 20 seconds
        setInterval(() => {
            window.mailService.syncExternalMails(realAlias);
        }, 20000);
    }

    // 2. UI Elements & State
    const mailList = document.getElementById('mailList');
    const viewTitle = document.getElementById('viewTitle');
    const composer = document.getElementById('composer');
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');
    const searchInput = document.querySelector('.search-bar input');
    
    let allMails = []; // Store current view's mails for search

    // 3. Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const folder = item.getAttribute('data-folder');
            
            if (['inbox', 'sent', 'drafts', 'starred', 'trash'].includes(folder)) {
                switchView('inboxView');
                document.querySelector('.nav-item.active').classList.remove('active');
                item.classList.add('active');
                loadFolder(folder);
            } else if (folder === 'contacts') {
                switchView('contactsView');
            }
        });
    });

    // Topbar Actions
    document.querySelector('.topbar-actions .fa-cog').parentElement.onclick = () => switchView('settingsView');
    document.getElementById('userName').onclick = () => switchView('settingsView');

    function switchView(viewId) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        
        // Update title
        const titles = {
            'inboxView': currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1),
            'contactsView': 'Contacts',
            'settingsView': 'Settings'
        };
        viewTitle.innerText = titles[viewId] || 'StGo-Mail';
    }

    function loadFolder(folder) {
        currentFolder = folder;
        viewTitle.innerText = folder.charAt(0).toUpperCase() + folder.slice(1);
        
        // Show loading
        mailList.innerHTML = `
            <div class="skeleton-item" style="height: 60px; margin: 10px; background: rgba(255,255,255,0.05); border-radius: 10px;"></div>
            <div class="skeleton-item" style="height: 60px; margin: 10px; background: rgba(255,255,255,0.05); border-radius: 10px;"></div>
            <div class="skeleton-item" style="height: 60px; margin: 10px; background: rgba(255,255,255,0.05); border-radius: 10px;"></div>
        `;

        if (unsubscribe) unsubscribe();

        unsubscribe = window.mailService.getEmails(folder, (mails) => {
            allMails = mails;
            renderMails(mails);
            updateInboxCount(mails);
        });
    }

    function updateInboxCount(mails) {
        if (currentFolder === 'inbox') {
            const unreadCount = mails.filter(m => !m.read).length;
            document.getElementById('inboxCount').innerText = unreadCount;
        }
    }

    // Advanced Search Engine
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (!term) {
            renderMails(allMails);
            return;
        }

        const filtered = allMails.filter(m => 
            m.subject.toLowerCase().includes(term) || 
            m.body.toLowerCase().includes(term) || 
            m.from.toLowerCase().includes(term)
        );
        renderMails(filtered);
    });

    // Real-time Notifications for NEW Mail
    function setupRealTimeNotifications() {
        // Listen for new mail while app is open
        const userEmail = window.fb.auth.currentUser.email;
        window.fb.db.collection('mails')
            .where('to', '==', userEmail)
            .where('timestamp', '>', new Date()) // Only new ones
            .onSnapshot(snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const m = change.doc.data();
                        window.notif.success(`New mail from ${m.fromName || m.from}`);
                    }
                });
            });
    }

    // Dashboard Statistics
    async function updateStats() {
        const userEmail = window.fb.auth.currentUser.email;
        // Total Emails
        const allSnap = await window.fb.db.collection('mails').where('to', '==', userEmail).get();
        // Sent Emails
        const sentSnap = await window.fb.db.collection('mails').where('from', '==', userEmail).get();
        
        console.log(`Stats: ${allSnap.size} received, ${sentSnap.size} sent`);
        // We could display these in a dashboard view
    }

    function renderMails(mails) {
        if (mails.length === 0) {
            mailList.innerHTML = `
                <div style="text-align:center; padding: 100px 20px; color: var(--text-dim);">
                    <i class="fas fa-inbox" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.2;"></i>
                    <p>No messages found in ${currentFolder}.</p>
                </div>
            `;
            return;
        }

        mailList.innerHTML = '';
        mails.forEach(mail => {
            const time = mail.timestamp ? new Date(mail.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...';
            
            const encryptionBadge = mail.isEncrypted ? `<span class="e2ee-tag" title="End-to-End Encrypted"><i class="fas fa-lock"></i></span>` : '';
            const systemBadge = mail.isSystem ? `<span class="system-tag">${mail.isExternal ? 'BRIDGE' : 'SYSTEM'}</span>` : '';
            const starColor = mail.starred ? '#ffcc00' : 'var(--text-dim)';
            const starClass = mail.starred ? 'fas fa-star' : 'far fa-star';

            const item = document.createElement('div');
            item.className = `mail-item ${!mail.read ? 'unread' : ''} animate-slide-in`;
            item.innerHTML = `
                <div class="mail-star" onclick="event.stopPropagation(); toggleMailStar('${mail.id}', ${!mail.starred})">
                    <i class="${starClass}" style="color: ${starColor}"></i>
                </div>
                <div class="from">${systemBadge}${mail.fromName || mail.from}</div>
                <div class="subject-row">
                    <span class="subject">${encryptionBadge}${mail.subject}</span>
                    <span class="preview"> - ${mail.body.substring(0, 100).replace(/<[^>]*>?/gm, '')}...</span>
                </div>
                <div class="time">${time}</div>
            `;

            item.onclick = () => openMail(mail);
            mailList.appendChild(item);
        });
    }

    window.toggleMailStar = async (id, status) => {
        try {
            await window.mailService.toggleStar(id, status);
            // Snapshot will update the UI automatically
        } catch (e) {
            console.error("Star toggle failed", e);
        }
    };

    // 4. Composer Logic
    document.getElementById('openCompose').onclick = () => composer.classList.remove('hidden');
    document.getElementById('closeCompose').onclick = () => composer.classList.add('hidden');
    
    document.getElementById('sendBtn').onclick = async () => {
        const to = document.getElementById('mailTo').value;
        const subject = document.getElementById('mailSubject').value;
        const body = document.getElementById('mailBody').value;
        const btn = document.getElementById('sendBtn');

        if (!to || !body) {
            window.notif.error("Recipient and message are required.");
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            await window.mailService.sendEmail({ to, subject, body });
            
            closeComposer();
            window.notif.success("Message transmitted successfully!");
        } catch (error) {
            window.notif.error("Transmission failed: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Send</span> <i class="fas fa-paper-plane"></i>';
        }
    };

    function closeComposer() {
        composer.classList.add('hidden');
        document.getElementById('mailTo').value = '';
        document.getElementById('mailSubject').value = '';
        document.getElementById('mailBody').value = '';
    }

    document.getElementById('openCompose').onclick = () => {
        composer.classList.remove('hidden');
        document.getElementById('mailTo').focus();
    };

    // 5. User Dropdown
    userProfile.onclick = (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    };

    document.onclick = () => userDropdown.classList.add('hidden');

    document.getElementById('logoutBtn').onclick = () => window.authService.logout();

    function openMail(mail) {
        // Create an overlay for reading if it doesn't exist
        let reader = document.getElementById('mailReader');
        if (!reader) {
            reader = document.createElement('div');
            reader.id = 'mailReader';
            reader.className = 'mail-reader-overlay glass-panel';
            document.body.appendChild(reader);
        }

        const timeFull = mail.timestamp ? new Date(mail.timestamp.seconds * 1000).toLocaleString() : 'Pending...';
        const encryptionStatus = mail.isEncrypted ? `<div class="encryption-notice"><i class="fas fa-shield-halved"></i> ${window.i18n.t('inbox.reader.encryptedNotice')}</div>` : '';

        reader.innerHTML = `
            <div class="reader-card animate-fade">
                <div class="reader-header">
                    <button class="back-btn" onclick="closeMailReader()" title="${window.i18n.t('inbox.reader.back')}"><i class="fas fa-arrow-left"></i></button>
                    <div class="reader-actions">
                        <button onclick="toggleMailStar('${mail.id}', ${!mail.starred})" title="Star"><i class="${mail.starred ? 'fas' : 'far'} fa-star" style="color: ${mail.starred ? '#ffcc00' : 'inherit'}"></i></button>
                        <button onclick="deleteMail('${mail.id}')" title="${window.i18n.t('inbox.reader.delete')}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="reader-content">
                    <h1 class="mail-title-big">${mail.subject}</h1>
                    ${encryptionStatus}
                    <div class="sender-info">
                        <img src="https://ui-avatars.com/api/?name=${mail.fromName || mail.from}&background=6c8cff&color=fff" class="avatar-sm">
                        <div class="sender-details">
                            <div class="top-row">
                                <p class="name">${mail.fromName || mail.from}</p>
                                <span class="full-time">${timeFull}</span>
                            </div>
                            <p class="email">${mail.from} &lt;to me&gt;</p>
                        </div>
                    </div>
                    <div class="mail-body-content">
                        ${mail.body.replace(/\n/g, '<br>')}
                    </div>
                    <div class="reader-footer">
                         <button class="btn btn-ghost"><i class="fas fa-reply"></i> ${window.i18n.t('inbox.reader.reply')}</button>
                         <button class="btn btn-ghost"><i class="fas fa-share"></i> ${window.i18n.t('inbox.reader.forward')}</button>
                    </div>
                </div>
            </div>
        `;
        reader.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!mail.read) {
            window.mailService.toggleRead(mail.id, true);
        }
    }

    window.closeMailReader = () => {
        const reader = document.getElementById('mailReader');
        if (reader) {
            reader.classList.remove('active');
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 300);
        }
    };

    window.deleteMail = async (id) => {
        if (confirm("Move this message to trash?")) {
            await window.mailService.moveToTrash(id);
            closeMailReader();
        }
    };
});
