// Inbox UI Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Core State
    let currentFolder = 'inbox';
    let unsubscribe = null;
    let allMails = [];
    const mailList = document.getElementById('mailList');
    const viewTitle = document.getElementById('viewTitle');
    const composer = document.getElementById('composer');
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');

    // 2. Auth Initialization
    window.authService.onAuthStateInit(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const userData = await window.authService.getCurrentUserData();
        if (userData) {
            document.getElementById('userName').innerText = userData.displayName;
            document.getElementById('displayEmail').innerText = userData.email;
            
            const emailFull = document.getElementById('userEmail');
            emailFull.innerHTML = `${userData.email}<br><span style="color:var(--secondary); font-size:0.75rem">Bridge: ${userData.realAlias}</span>`;

            if (userData.avatar) {
                document.getElementById('userAvatar').src = userData.avatar;
            }
            startMailBridge(userData.realAlias);
        }

        loadFolder('inbox');
        setupRealTimeStats();

        window.addEventListener('localeChanged', () => {
            if (currentFolder !== 'contacts' && currentFolder !== 'settings') {
                loadFolder(currentFolder);
            }
        });
    });

    // 3. Stats & Bridge
    function setupRealTimeStats() {
        if (!window.fb.auth.currentUser) return;
        const email = window.fb.auth.currentUser.email;
        
        window.fb.db.collection('mails')
            .where('to', '==', email)
            .where('read', '==', false)
            .onSnapshot(snap => {
                const count = snap.size;
                const counter = document.getElementById('inboxCount');
                if (counter) {
                    counter.innerText = count;
                    counter.style.display = count > 0 ? 'inline-block' : 'none';
                }
            });

        window.fb.db.collection('mails')
            .where('to', '==', email)
            .onSnapshot(snap => {
                const total = snap.size;
                const usedMB = (total * 0.15).toFixed(2);
                const percent = Math.min(Math.round((usedMB / 500) * 100), 100);
                
                const storageLabel = document.querySelector('.storage-label span:last-child');
                const progressBar = document.querySelector('.progress');
                if (storageLabel) storageLabel.innerText = `${percent}%`;
                if (progressBar) progressBar.style.width = `${percent}%`;
            });
    }

    function startMailBridge(realAlias) {
        window.mailService.syncExternalMails(realAlias);
        setInterval(() => window.mailService.syncExternalMails(realAlias), 20000);
    }

    // 4. Navigation & View Switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            const folder = item.getAttribute('data-folder');
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            switch (folder) {
                case 'contacts':
                    showView('contactsView', 'Contacts');
                    loadContacts();
                    break;
                case 'settings':
                    showView('settingsView', 'Settings');
                    populateSettings();
                    break;
                default:
                    showView('inboxView', folder.charAt(0).toUpperCase() + folder.slice(1));
                    loadFolder(folder);
                    break;
            }
        };
    });

    function showView(viewId, title) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        viewTitle.innerText = title;
    }

    // Topbar & Profile Actions
    const topSettingsBtn = document.querySelector('.topbar-actions .fa-cog')?.parentElement;
    if (topSettingsBtn) {
        topSettingsBtn.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            showView('settingsView', 'Settings');
            populateSettings();
        };
    }

    // Link dropdown items
    const dropdownProfileLink = document.querySelector('#userDropdown a:nth-of-type(1)');
    const dropdownSecurityLink = document.querySelector('#userDropdown a:nth-of-type(2)');
    
    if (dropdownProfileLink) dropdownProfileLink.onclick = (e) => { 
        e.preventDefault(); 
        showView('settingsView', 'Settings'); 
        populateSettings(); 
    };
    if (dropdownSecurityLink) dropdownSecurityLink.onclick = (e) => { 
        e.preventDefault(); 
        showView('settingsView', 'Settings'); 
        populateSettings(); 
    };

    async function populateSettings() {
        const userData = await window.authService.getCurrentUserData();
        if (userData) {
            document.getElementById('editDisplayName').value = userData.displayName || '';
            document.getElementById('editAvatarURL').value = userData.avatar || '';
        }
    }

    document.getElementById('saveProfileBtn').onclick = async () => {
        const name = document.getElementById('editDisplayName').value;
        const avatar = document.getElementById('editAvatarURL').value;
        const btn = document.getElementById('saveProfileBtn');

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            await window.userService.updateProfile({ displayName: name, avatar: avatar });
            
            // Refresh Header UI
            document.getElementById('userName').innerText = name;
            document.getElementById('userAvatar').src = avatar || `https://ui-avatars.com/api/?name=${name}&background=6c8cff&color=fff`;
            
            window.notif.success("Identity updated successfully.");
        } catch (e) {
            window.notif.error("Failed to update profile: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span data-i18n="settings.save">Save Changes</span> <i class="fas fa-save"></i>';
        }
    };

    function loadFolder(folder) {
        currentFolder = folder;
        mailList.innerHTML = '<div class="mail-item skeleton"></div><div class="mail-item skeleton"></div>';

        if (unsubscribe) unsubscribe();
        unsubscribe = window.mailService.getEmails(folder, (mails) => {
            allMails = mails;
            renderMails(mails);
        });
    }

    function renderMails(mails) {
        if (mails.length === 0) {
            mailList.innerHTML = `<div style="text-align:center; padding: 100px 20px; color: var(--text-dim);">
                <i class="fas fa-inbox" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.2;"></i>
                <p>No messages found in ${currentFolder}.</p>
            </div>`;
            return;
        }

        mailList.innerHTML = '';
        mails.forEach(mail => {
            const time = mail.timestamp ? new Date(mail.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
            const item = document.createElement('div');
            item.className = `mail-item ${!mail.read ? 'unread' : ''} animate-slide-in`;
            const encryptionBadge = mail.isEncrypted ? `<span class="e2ee-tag"><i class="fas fa-lock"></i></span>` : '';
            const systemBadge = mail.isSystem ? `<span class="system-tag">${mail.isExternal ? 'BRIDGE' : 'SYSTEM'}</span>` : '';
            
            item.innerHTML = `
                <div class="mail-star" onclick="event.stopPropagation(); toggleMailStar('${mail.id}', ${!mail.starred})">
                    <i class="${mail.starred ? 'fas' : 'far'} fa-star" style="color: ${mail.starred ? '#ffcc00' : 'var(--text-dim)'}"></i>
                </div>
                <div class="from">${systemBadge}${mail.fromName || mail.from}</div>
                <div class="subject-row">
                    <span class="subject">${encryptionBadge}${mail.subject}</span>
                    <span class="preview"> - ${mail.body.substring(0, 80).replace(/<[^>]*>?/gm, '')}...</span>
                </div>
                <div class="time">${time}</div>
            `;
            item.onclick = () => openMail(mail);
            mailList.appendChild(item);
        });
    }

    async function loadContacts() {
        const list = document.getElementById('contactList');
        list.innerHTML = '<div class="mail-item skeleton"></div>';
        const snapshot = await window.fb.db.collection('mails').where('to', '==', window.fb.auth.currentUser.email).get();
        const contacts = new Set();
        snapshot.forEach(doc => contacts.add(doc.data().from));

        list.innerHTML = contacts.size === 0 ? '<p style="padding:20px; color:var(--text-dim)">No contacts discovered yet.</p>' : '';
        contacts.forEach(c => {
            const div = document.createElement('div');
            div.className = 'mail-item animate-fade';
            div.style.gridTemplateColumns = '50px 1fr 120px';
            div.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${c}&background=6c8cff&color=fff" class="avatar-sm">
                <div style="padding-top:8px"><strong>${c}</strong></div>
                <button class="btn btn-ghost" onclick="composeTo('${c}')">Message</button>
            `;
            list.appendChild(div);
        });
    }

    window.composeTo = (target) => {
        document.getElementById('openCompose').click();
        document.getElementById('mailTo').value = target;
    };

    // 5. Search
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.mail-item');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(term) ? 'grid' : 'none';
            });
        };
    }

    // 6. Composer & Dropdown
    document.getElementById('openCompose').onclick = () => {
        composer.classList.remove('hidden');
        document.getElementById('mailTo').focus();
    };

    document.getElementById('closeCompose').onclick = () => composer.classList.add('hidden');

    document.getElementById('sendBtn').onclick = async () => {
        const to = document.getElementById('mailTo').value;
        const subject = document.getElementById('mailSubject').value;
        const body = document.getElementById('mailBody').value;
        if (!to || !body) { window.notif.error("Recipient and body required."); return; }

        try {
            const btn = document.getElementById('sendBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await window.mailService.sendEmail({ to, subject, body });
            composer.classList.add('hidden');
            window.notif.success("Transmitted.");
        } catch (e) { window.notif.error(e.message); } finally {
            document.getElementById('sendBtn').disabled = false;
            document.getElementById('sendBtn').innerHTML = '<span>Send</span> <i class="fas fa-paper-plane"></i>';
        }
    };

    userProfile.onclick = (e) => { e.stopPropagation(); userDropdown.classList.toggle('hidden'); };
    document.onclick = () => userDropdown.classList.add('hidden');
    document.getElementById('logoutBtn').onclick = () => window.authService.logout();

    // 7. Mail Reader
    function openMail(mail) {
        let reader = document.getElementById('mailReader');
        if (!reader) {
            reader = document.createElement('div');
            reader.id = 'mailReader';
            reader.className = 'mail-reader-overlay';
            document.body.appendChild(reader);
        }
        const timeFull = mail.timestamp ? new Date(mail.timestamp.seconds * 1000).toLocaleString() : '...';
        const encryption = mail.isEncrypted ? `<div class="encryption-notice"><i class="fas fa-shield-halved"></i> ${window.i18n.t('inbox.reader.encryptedNotice')}</div>` : '';

        reader.innerHTML = `
            <div class="reader-card animate-fade">
                <div class="reader-header">
                    <button class="back-btn" onclick="closeMailReader()"><i class="fas fa-arrow-left"></i></button>
                    <div class="reader-actions">
                        <button onclick="toggleMailStar('${mail.id}', ${!mail.starred})"><i class="${mail.starred ? 'fas' : 'far'} fa-star"></i></button>
                        <button onclick="deleteMail('${mail.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="reader-content">
                    <h1 class="mail-title-big">${mail.subject}</h1>
                    ${encryption}
                    <div class="sender-info">
                        <img src="https://ui-avatars.com/api/?name=${mail.fromName || mail.from}&background=6c8cff&color=fff" class="avatar-sm">
                        <div class="sender-details">
                            <div class="top-row"><p class="name">${mail.fromName || mail.from}</p><span>${timeFull}</span></div>
                            <p class="email">${mail.from}</p>
                        </div>
                    </div>
                    <div class="mail-body-content">${mail.body.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;
        reader.classList.add('active');
        if (!mail.read) window.mailService.toggleRead(mail.id, true);
    }

    window.closeMailReader = () => {
        const reader = document.getElementById('mailReader');
        if (reader) reader.classList.remove('active');
    };

    window.deleteMail = async (id) => {
        if (confirm("Move to trash?")) { await window.mailService.moveToTrash(id); closeMailReader(); }
    };

    window.toggleMailStar = async (id, status) => {
        await window.mailService.toggleStar(id, status);
    };

    // 8. Themes
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.onclick = () => {
            const theme = btn.innerText.toLowerCase();
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (theme === 'neon') {
                document.documentElement.style.setProperty('--primary', '#00ffaa');
                document.documentElement.style.setProperty('--secondary', '#00d4ff');
            } else if (theme === 'cyber') {
                document.documentElement.style.setProperty('--primary', '#ff00c8');
                document.documentElement.style.setProperty('--secondary', '#7000ff');
            } else {
                document.documentElement.style.setProperty('--primary', '#6c8cff');
                document.documentElement.style.setProperty('--secondary', '#00d4ff');
            }
        };
    });
});
