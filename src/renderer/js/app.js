// src/renderer/js/app.js

// ==========================================
// 🛒 ECONOMY, THEME & PROFILE SYSTEM
// ==========================================
const THEMES = {
    'white': { name: 'Default White', cost: 0, css: { '--bg-main': '#f8f9fd', '--bg-card': '#ffffff', '--text-main': '#1a1d23', '--soft-purple': '#9d8df1', '--text-secondary': '#64748b', '--watermelon-pink': '#FF7B7B', '--border-radius': '18px' } },
    'black': { name: 'Midnight Black', cost: 0, css: { '--bg-main': '#0b0e14', '--bg-card': '#161b22', '--text-main': '#f0f6fc', '--soft-purple': '#58a6ff', '--text-secondary': '#8b949e', '--border-radius': '18px' } },
    'red': { name: 'Rose Crimson', cost: 1200, css: { '--bg-main': '#450a0a', '--bg-card': '#7f1d1d', '--text-main': '#fef2f2', '--soft-purple': '#ef4444', '--text-secondary': '#fca5a5', '--border-radius': '18px' } },
    'green': { name: 'Emerald Forest', cost: 3000, css: { '--bg-main': '#064e3b', '--bg-card': '#065f46', '--text-main': '#ecfdf5', '--soft-purple': '#10b981', '--text-secondary': '#a7f3d0', '--border-radius': '18px' } },
    'purple': { name: 'Royal Amethyst', cost: 9000, css: { '--bg-main': '#2e1065', '--bg-card': '#4c1d95', '--text-main': '#f5f3ff', '--soft-purple': '#8b5cf6', '--text-secondary': '#ddd6fe', '--border-radius': '18px' } },
    'enderman': { name: 'The End (Enderman)', cost: 38900, css: { '--bg-main': '#000000', '--bg-card': '#0a0a0a', '--text-main': '#d8b4fe', '--soft-purple': '#a855f7', '--text-secondary': '#7e22ce', '--font-family': "'Courier New', monospace", '--border-radius': '8px' } },
    'minecraft': { name: 'Classic Craft', cost: 100000, css: { '--bg-main': '#312c26', '--bg-card': '#4d4d4d', '--text-main': '#ffffff', '--soft-purple': '#3ca43c', '--text-secondary': '#bfbfbf', '--font-family': "Impact, fantasy", '--border-radius': '0px' } },
    'windows': { name: 'Fluent Windows', cost: 370000, css: { '--bg-main': '#f3f3f3', '--bg-card': '#ffffff', '--text-main': '#000000', '--soft-purple': '#0078d4', '--text-secondary': '#505050', '--font-family': "'Segoe UI Variable', sans-serif", '--border-radius': '4px' } },
    'android': { name: 'Material You', cost: 500000, css: { '--bg-main': '#f7fcf3', '--bg-card': '#e1e5dc', '--text-main': '#191c19', '--soft-purple': '#386a20', '--text-secondary': '#414941', '--font-family': "'Roboto', sans-serif", '--border-radius': '28px' } }
};

const MAX_COINS = 1000000;
let coinTimer = null;

function ensureEconomyData() {
    if (!userProfile) return;
    if (userProfile.coins === undefined) userProfile.coins = 0;
    if (!userProfile.ownedThemes) userProfile.ownedThemes = ['white', 'black'];
    if (!userProfile.activeTheme) userProfile.activeTheme = 'white';
    if (!userProfile.t) userProfile.t = ""; 
}

function calculateTags() {
    if (!userProfile) return;
    const count = userProfile.ownedThemes.length;
    let tags = [];
    if (count >= 3) tags.push('a');
    if (count >= 6) tags.push('b');
    if (count >= Object.keys(THEMES).length) tags.push('c');
    userProfile.t = tags.join(','); 
    localStorage.setItem('cc_profile', JSON.stringify(userProfile));
}

function startCoinGenerator() {
    if (coinTimer) clearInterval(coinTimer);
    coinTimer = setInterval(() => {
        if (!userProfile) return;
        if (userProfile.coins < MAX_COINS) {
            userProfile.coins += 20;
            if (userProfile.coins > MAX_COINS) userProfile.coins = MAX_COINS;
            localStorage.setItem('cc_profile', JSON.stringify(userProfile));
            renderShop();
            renderProfilePage(); 
        }
    }, 60000); 
}

function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return;
    for (const [key, value] of Object.entries(theme.css)) {
        document.documentElement.style.setProperty(key, value);
    }
    document.body.setAttribute('data-theme', themeId);
}

function buyTheme(themeId) {
    const theme = THEMES[themeId];
    if (userProfile.coins >= theme.cost && !userProfile.ownedThemes.includes(themeId)) {
        userProfile.coins -= theme.cost;
        userProfile.ownedThemes.push(themeId);
        calculateTags(); 
        localStorage.setItem('cc_profile', JSON.stringify(userProfile));
        equipTheme(themeId);
    }
}

function equipTheme(themeId) {
    userProfile.activeTheme = themeId;
    localStorage.setItem('cc_profile', JSON.stringify(userProfile));
    applyTheme(themeId);
    renderShop();
    renderProfilePage();
}

function renderShop() {
    if (!userProfile) return;
    
    const balanceDisplay = document.getElementById('coin-balance-display');
    if (balanceDisplay) balanceDisplay.innerText = userProfile.coins.toLocaleString();
    
    const grid = document.getElementById('shop-grid');
    if (!grid) return; 
    
    grid.innerHTML = '';

    for (const [id, theme] of Object.entries(THEMES)) {
        const isOwned = userProfile.ownedThemes.includes(id);
        const isActive = userProfile.activeTheme === id;
        
        let btnHtml = '';
        if (isActive) {
            btnHtml = `<button class="action-button" style="width: 100%; background: var(--soft-purple); color: #fff; border: none; cursor: default;">✅ Equipped</button>`;
        } else if (isOwned) {
            btnHtml = `<button class="action-button" style="width: 100%; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color);" onclick="equipTheme('${id}')">Equip Theme</button>`;
        } else {
            const canAfford = userProfile.coins >= theme.cost;
            btnHtml = `<button class="action-button primary" style="width: 100%; ${!canAfford ? 'opacity: 0.5; cursor: not-allowed;' : ''}" onclick="${canAfford ? `buyTheme('${id}')` : ''}">🛒 Buy for ${theme.cost.toLocaleString()} 🪙</button>`;
        }

        grid.innerHTML += `
            <div class="card" style="padding: 24px; border: 2px solid ${isActive ? 'var(--soft-purple)' : 'var(--border-color)'}; display: flex; flex-direction: column; justify-content: space-between; background: var(--bg-card);">
                <div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">${theme.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">Changes the entire look and feel of Craft CanvaS.</p>
                </div>
                ${btnHtml}
            </div>
        `;
    }
}

function renderProfilePage() {
    if (!userProfile) return;
    
    document.getElementById('profile-page-name').innerText = userProfile.name;
    document.getElementById('profile-page-initial').innerText = userProfile.name.charAt(0).toUpperCase();
    document.getElementById('profile-coin-balance').innerText = userProfile.coins.toLocaleString();
    
    const badgeContainer = document.getElementById('profile-badges-container');
    badgeContainer.innerHTML = '';
    
    const tags = userProfile.t.split(',');
    if (tags.length === 1 && tags[0] === "") {
        badgeContainer.innerHTML = '<span style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;">Purchase more UIs to unlock tags!</span>';
    } else {
        if (tags.includes('a')) badgeContainer.innerHTML += `<div class="ui-tag tag-a">🎨 Theme Collector (3)</div>`;
        if (tags.includes('b')) badgeContainer.innerHTML += `<div class="ui-tag tag-b">✨ UI Enthusiast (6)</div>`;
        if (tags.includes('c')) badgeContainer.innerHTML += `<div class="ui-tag tag-c">👑 The Architect (All)</div>`;
    }

    const wardrobeGrid = document.getElementById('profile-wardrobe-grid');
    wardrobeGrid.innerHTML = '';
    userProfile.ownedThemes.forEach(id => {
        const theme = THEMES[id];
        const isActive = userProfile.activeTheme === id;
        wardrobeGrid.innerHTML += `
            <div style="padding: 12px 16px; border-radius: 12px; background: ${isActive ? 'var(--soft-purple)' : 'var(--bg-main)'}; color: ${isActive ? '#fff' : 'var(--text-main)'}; border: 1px solid var(--border-color); font-weight: 700; cursor: pointer; transition: 0.3s;" onclick="equipTheme('${id}')">
                ${isActive ? '✅ ' : ''}${theme.name}
            </div>
        `;
    });
}

// ==========================================
// LOCAL MOD INSPECTOR LOGIC
// ==========================================
let currentLocalView = 'active';

function parseModName(filename) {
    let loader = "Unknown";
    let version = "Unknown";
    const lower = filename.toLowerCase();

    if (lower.includes('fabric')) loader = "Fabric";
    else if (lower.includes('forge') && !lower.includes('neoforge')) loader = "Forge";
    else if (lower.includes('neoforge')) loader = "NeoForge";
    else if (lower.includes('optifine')) loader = "OptiFine";

    const verMatch = filename.match(/1\.\d+(\.\d+)?/);
    if (verMatch) version = verMatch[0];

    return { loader, version, cleanName: filename.replace(/\.(jar|zip)$/i, '') };
}

async function loadLocalMods() {
    try {
        const activeList = document.getElementById('local-mods-list');
        const trashList = document.getElementById('trash-mods-list');
        const filterEl = document.getElementById('local-loader-filter');
        const filter = filterEl ? filterEl.value.toLowerCase() : 'all';

        if (!activeList || !trashList) return;

        activeList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</div>';
        trashList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</div>';

        const activeMods = await window.electronAPI.getLocalMods();
        const trashMods = await window.electronAPI.getTrashMods();

        function renderList(mods, container, isTrash) {
            container.innerHTML = '';
            if (!mods || mods.length === 0) {
                container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-secondary); font-weight: 600;">No mods found in this folder.</div>`;
                return;
            }

            let addedCount = 0;

            mods.forEach(mod => {
                const data = parseModName(mod.name);
                
                if (filter !== 'all' && data.loader.toLowerCase() !== filter) return;

                addedCount++;

                const safeJSName = mod.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                const safeVisualName = data.cleanName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                const btnHtml = isTrash 
                    ? `<button class="action-button primary" style="padding: 8px 16px; background: #2ecc71; border: none; color: #fff;" onclick="recoverMod('${safeJSName}')">↩️ Recover</button>`
                    : `<button class="action-button primary" style="padding: 8px 16px; background: #ff5555; border: none; color: #fff;" onclick="trashMod('${safeJSName}')">🗑️ Disable</button>`;

                container.innerHTML += `
                    <div class="card" style="padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); background: var(--bg-card); margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 24px;">☕</div>
                            <div>
                                <div style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">${safeVisualName}</div>
                                <div style="display: flex; gap: 8px;">
                                    <span class="mod-tag" style="background: rgba(157, 141, 241, 0.1); color: var(--soft-purple); padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">Loader: ${data.loader}</span>
                                    <span class="mod-tag" style="background: rgba(46, 204, 113, 0.1); color: #2ecc71; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">MC: ${data.version}</span>
                                </div>
                            </div>
                        </div>
                        ${btnHtml}
                    </div>
                `;
            });
            
            if (addedCount === 0) {
                container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-secondary); font-weight: 600;">No mods match this filter.</div>`;
            }
        }

        renderList(activeMods, activeList, false);
        renderList(trashMods, trashList, true);
    } catch (err) {
        console.error("Error loading local mods:", err);
    }
}

function renderLocalMods() { loadLocalMods(); }

function toggleLocalView(view) {
    currentLocalView = view;
    const btnActive = document.getElementById('btn-active-mods');
    const btnTrash = document.getElementById('btn-trash-mods');
    
    if(btnActive) {
        btnActive.style.background = view === 'active' ? 'var(--bg-main)' : 'transparent';
        btnActive.style.boxShadow = view === 'active' ? 'var(--shadow-sm)' : 'none';
    }
    if(btnTrash) {
        btnTrash.style.background = view === 'trash' ? 'var(--bg-main)' : 'transparent';
        btnTrash.style.boxShadow = view === 'trash' ? 'var(--shadow-sm)' : 'none';
    }

    document.getElementById('local-mods-list').style.display = view === 'active' ? 'flex' : 'none';
    document.getElementById('trash-mods-list').style.display = view === 'trash' ? 'flex' : 'none';
}

async function trashMod(filename) {
    await window.electronAPI.moveToTrash(filename);
    loadLocalMods();
}

async function recoverMod(filename) {
    await window.electronAPI.recoverFromTrash(filename);
    loadLocalMods();
}

let chatUnsubscribe = null;
let activeSentMessages = []; 

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="#" onclick="window.electronAPI.openExternal(\'$1\'); return false;" style="color: #ffb3b3; text-decoration: underline;">$1</a>');
}

function loadChat() {
    if (chatUnsubscribe) return; 
    
    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-weight: 600; margin-top: 20px;">Connecting to secure chat...</div>';

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

    chatUnsubscribe = db.collection('global_chat')
        .where('timestamp', '>', tenMinsAgo)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            chatBox.innerHTML = '';
            
            if (snapshot.empty) {
                chatBox.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-weight: 600; margin-top: 20px;">It is quiet here... Be the first to say hi!</div>';
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const isMe = userProfile && data.uid === userProfile.uid;
                const safeText = linkify(escapeHTML(data.text));
                
                const msgHTML = `
                    <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; animation: fadeIn 0.3s ease;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; margin-bottom: 4px; padding: 0 4px;">${data.author}</span>
                        <div style="background: ${isMe ? 'var(--soft-purple)' : 'var(--bg-card)'}; color: ${isMe ? '#ffffff' : 'var(--text-main)'}; border: 1px solid var(--border-color); padding: 12px 18px; border-radius: 20px; border-bottom-${isMe ? 'right' : 'left'}-radius: 4px; box-shadow: var(--shadow-sm); max-width: 75%; font-size: 0.95rem; line-height: 1.5; word-wrap: break-word;">
                            ${safeText}
                        </div>
                    </div>
                `;
                chatBox.innerHTML += msgHTML;
            });
            
            chatBox.scrollTop = chatBox.scrollHeight; 
        });
}

function stopChatListener() {
    if (chatUnsubscribe) {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }
}

function sendChatMessage() {
    if (!userProfile) {
        alert("You must log in to use the Global Chat!");
        document.getElementById('onboarding-modal').style.display = 'flex';
        return;
    }
    
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    }).then((docRef) => {
        activeSentMessages.push(docRef);
        setTimeout(() => {
            docRef.delete().then(() => {
                activeSentMessages = activeSentMessages.filter(ref => ref.id !== docRef.id);
            }).catch(e => {});
        }, 10 * 60 * 1000); 
    }).catch(err => {
        console.error("Error sending message:", err);
    });
}

if (window.electronAPI && window.electronAPI.onCleanupAndQuit) {
    window.electronAPI.onCleanupAndQuit(async () => {
        document.body.innerHTML = `
            <div style="display:flex; height:100vh; align-items:center; justify-content:center; background: var(--bg-main); color: var(--soft-purple); flex-direction: column;">
                <h2>🧹 Synchronizing Cloud Data...</h2>
                <p>Closing Craft CanvaS</p>
            </div>
        `;
        
        const deletePromises = activeSentMessages.map(docRef => docRef.delete().catch(e => console.log("Already deleted")));
        await Promise.all(deletePromises);
        
        if (userProfile && userProfile.uid) {
            await db.collection('users').doc(userProfile.uid).update({
                coins: userProfile.coins,
                ownedThemes: userProfile.ownedThemes,
                activeTheme: userProfile.activeTheme,
                t: userProfile.t 
            }).catch(e => console.log("Cloud sync issue", e));
        }
        
        window.electronAPI.forceQuit();
    });
}



if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

let currentPage = 0;
const MODS_PER_PAGE = 20;
let currentOpenedModDetails = null;

// ==========================================
// ONBOARDING, GOOGLE AUTH & PROFILE SYSTEM
// ==========================================
let userProfile = JSON.parse(localStorage.getItem('cc_profile')) || null;
let downloadHistory = JSON.parse(localStorage.getItem('cc_history')) || {};

function checkOnboarding() {
    if (!userProfile) {
        document.getElementById('onboarding-modal').style.display = 'flex';
    } else {
        updateProfileWidget();
        loadRecommendations();
        fetchGlobalStats(); 
    }
}

function validateAuthForm() {
    const isAdult = document.getElementById('age-verify-check').checked;
    const name = document.getElementById('ob-name').value.trim();
    const email = document.getElementById('ob-email').value.trim();
    const password = document.getElementById('ob-password').value;
    const errorEl = document.getElementById('ob-error');

    if (!isAdult) {
        errorEl.innerText = "You must confirm you are 18+ to continue.";
        errorEl.style.display = 'block';
        return null;
    }
    if (!email || !password) {
        errorEl.innerText = "Email and Password are required.";
        errorEl.style.display = 'block';
        return null;
    }
    
    errorEl.style.display = 'none';
    return { name, email, password };
}

function handleAuthSuccess(user, displayName) {
    document.getElementById('onboarding-modal').style.display = 'none';
    
    db.collection('users').doc(user.uid).get().then(doc => {
        let cloudCoins = 0;
        let cloudThemes = ['white', 'black'];
        let cloudActive = 'white';
        let cloudTags = ""; 

        if (doc.exists && doc.data().coins !== undefined) {
            cloudCoins = doc.data().coins;
            cloudThemes = doc.data().ownedThemes || ['white', 'black'];
            cloudActive = doc.data().activeTheme || 'white';
            cloudTags = doc.data().t || ""; 
        }

        userProfile = { 
            uid: user.uid,
            name: displayName || user.displayName || "Creator", 
            avatar: null,
            ageVerified: true,
            coins: cloudCoins,
            ownedThemes: cloudThemes,
            activeTheme: cloudActive,
            t: cloudTags 
        }
    });
}

function registerWithEmail() {
    const form = validateAuthForm();
    if (!form) return;
    if (!form.name) {
        document.getElementById('ob-error').innerText = "Display Name is required to Sign Up.";
        document.getElementById('ob-error').style.display = 'block';
        return;
    }

    auth.createUserWithEmailAndPassword(form.email, form.password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: form.name
            }).then(() => {
                handleAuthSuccess(userCredential.user, form.name);
            });
        })
        .catch((error) => {
            console.error("Register Error:", error);
            document.getElementById('ob-error').innerText = error.message;
            document.getElementById('ob-error').style.display = 'block';
        });
}

function loginWithEmail() {
    const form = validateAuthForm();
    if (!form) return;

    auth.signInWithEmailAndPassword(form.email, form.password)
        .then((userCredential) => {
            handleAuthSuccess(userCredential.user, userCredential.user.displayName);
        })
        .catch((error) => {
            console.error("Login Error:", error);
            document.getElementById('ob-error').innerText = "Invalid email or password.";
            document.getElementById('ob-error').style.display = 'block';
        });

        document.getElementById('widget-initial').innerText = userProfile.name.charAt(0).toUpperCase();
    }
}

function openProfileSettings() {
    if (!userProfile) return;
    
    document.getElementById('profile-modal-name').innerText = userProfile.name;
    
    if (userProfile.avatar) {
        document.getElementById('profile-modal-initial').style.display = 'none';
        const avatarImg = document.getElementById('profile-modal-avatar');
        avatarImg.src = userProfile.avatar;
        avatarImg.style.display = 'block';
    } else {
        document.getElementById('profile-modal-initial').innerText = userProfile.name.charAt(0).toUpperCase();
        document.getElementById('profile-modal-initial').style.display = 'flex';
        document.getElementById('profile-modal-avatar').style.display = 'none';
    }
    
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileSettings() {
    document.getElementById('profile-modal').style.display = 'none';
}

function logoutUser() {
    auth.signOut().then(() => {
        userProfile = null;
        localStorage.removeItem('cc_profile');
        closeProfileSettings();
        document.getElementById('widget-name').innerText = 'Guest';
        document.getElementById('widget-avatar').style.display = 'none';
        document.getElementById('widget-initial').style.display = 'flex';
        document.getElementById('widget-initial').innerText = '?';
        document.getElementById('user-greeting').innerText = 'Hello, Creator!';
        document.getElementById('onboarding-modal').style.display = 'flex';
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

function clearLocalData() {
    if(confirm("Are you sure you want to clear your local app data? This will reset your smart recommendations and cached settings.")) {
        downloadHistory = {};
        localStorage.removeItem('cc_history');
        sessionStorage.removeItem('cc_stats_loaded');
        document.getElementById('recommended-container').style.display = 'none';
        alert("App data cleared successfully!");
        closeProfileSettings();
    }
}

function copyShareLink() {
    navigator.clipboard.writeText("https://drive.google.com/drive/folders/YOUR_DRIVE_LINK_HERE");
    alert("Link copied! Thank you for sharing Craft CanvaS.");
}

async function fetchGlobalStats() {
    if (sessionStorage.getItem('cc_stats_loaded')) {
        document.getElementById('stat-downloads').innerText = sessionStorage.getItem('cc_stats_loaded');
        return;
    }

    try {
        const doc = await db.collection('app_data').doc('statistics').get();
        if (doc.exists) {
            const count = doc.data().totalDownloads || 0;
            document.getElementById('stat-downloads').innerText = count.toLocaleString();
            sessionStorage.setItem('cc_stats_loaded', count.toLocaleString());
        }
    } catch (e) {
        console.log("Could not load stats.");
    }
}

function incrementGlobalDownloads() {
    db.collection('app_data').doc('statistics').set({
        totalDownloads: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
}

function trackModDownload(modDetails) {
    if (modDetails && modDetails.display_categories) {
        modDetails.display_categories.forEach(cat => {
            if (cat !== 'client' && cat !== 'server') { 
                downloadHistory[cat] = (downloadHistory[cat] || 0) + 1;
            }
        });
        localStorage.setItem('cc_history', JSON.stringify(downloadHistory));
        loadRecommendations(); 
    }
}

async function loadRecommendations() {
    const sortedTags = Object.keys(downloadHistory).sort((a, b) => downloadHistory[b] - downloadHistory[a]);
    const topTag = sortedTags[0];

    if (!topTag) return; 

    document.getElementById('recommended-container').style.display = 'block';
    const recGrid = document.getElementById('recommended-grid');
    
    const data = await fetchMods('', 'mod', '', '', topTag, 'relevance', 5, 0);
    const mods = data.hits || [];

    recGrid.innerHTML = '';
    
    mods.forEach(mod => {
        const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg';
        const shortDesc = mod.description.length > 60 ? mod.description.substring(0, 60) + '...' : mod.description;
        
        recGrid.innerHTML += `
            <div class="card" style="min-width: 300px; display: flex; flex-direction: column; gap: 12px; padding: 16px; cursor: pointer; border: 1px solid var(--border-color);" onclick="openModDetails('${mod.project_id}')">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <img src="${iconUrl}" style="width: 48px; height: 48px; border-radius: 12px; background: var(--bg-main);">
                    <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">${mod.title}</div>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${shortDesc}</div>
            </div>
        `;
    });
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 604800;
    if (interval > 1) return Math.floor(interval) + " weeks ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

async function renderMods() {
    const query = document.getElementById('search-input').value;
    const type = document.getElementById('type-filter').value;
    const loader = document.getElementById('loader-filter').value;
    const version = document.getElementById('version-filter').value;
    const category = document.getElementById('category-filter').value;
    const sort = document.getElementById('sort-filter').value;

    const modGrid = document.getElementById('mod-grid');
    const paginationContainer = document.getElementById('pagination-controls');
    
    modGrid.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 40px; font-weight: 600;">Searching Database...</div>';
    if (paginationContainer) paginationContainer.innerHTML = '';

    const offset = currentPage * MODS_PER_PAGE;
    const data = await fetchMods(query, type, loader, version, category, sort, MODS_PER_PAGE, offset);
    
    const mods = data.hits || [];
    const totalHits = data.total_hits || 0;

    modGrid.innerHTML = ''; 

    if (mods.length === 0) {
        modGrid.innerHTML = '<div style="color: var(--watermelon-pink); text-align: center; padding: 40px; font-weight: 600;">No results found for these filters.</div>';
        return;
    }

    mods.forEach((mod, index) => {
        const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg';
        const author = mod.author || 'Unknown';
        const updated = timeAgo(mod.date_modified);
        
        let tagsHtml = '';
        if(mod.display_categories) {
            mod.display_categories.forEach(cat => {
                const isEnv = cat === 'client' || cat === 'server';
                tagsHtml += `<span class="mod-tag ${isEnv ? 'env' : ''}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>`;
            });
        }

        const modCard = `
            <div class="mod-card" style="animation-delay: ${index * 0.02}s" onclick="openModDetails('${mod.project_id}')">
                <img src="${iconUrl}" alt="${mod.title} icon" class="mod-icon">
                <div class="mod-content">
                    <div class="mod-header">
                        <span class="mod-title">${mod.title}</span>
                        <span class="mod-author">by ${author}</span>
                    </div>
                    <div class="mod-desc">${mod.description}</div>
                    <div class="mod-tags">${tagsHtml}</div>
                </div>
                <div class="mod-stats">
                    <div class="mod-stat-item">⬇️ ${formatNumber(mod.downloads)}</div>
                    <div class="mod-stat-item">🕒 ${updated}</div>
                </div>
            </div>
        `;
        modGrid.innerHTML += modCard;
    });

    renderPagination(totalHits);
}

function renderPagination(totalHits) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(totalHits / MODS_PER_PAGE);
    if (totalPages <= 1) return;

    let html = '';
    html += `<button class="action-button" style="padding: 8px 16px;" onclick="changePage(-1)" ${currentPage === 0 ? 'disabled' : ''}>← Prev</button>`;
    html += `<span style="font-weight: 600; color: var(--text-main);">Page ${currentPage + 1} of ${totalPages.toLocaleString()}</span>`;
    html += `<button class="action-button" style="padding: 8px 16px;" onclick="changePage(1)" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>`;

    paginationContainer.innerHTML = html;
}

function changePage(delta) {
    currentPage += delta;
    renderMods();
    document.querySelector('.mod-main').scrollTo(0, 0);
}

function executeSearch() {
    currentPage = 0; 
    renderMods();
}

async function loadSearchFilters() {
    const versionSelect = document.getElementById('version-filter');
    const loaderSelect = document.getElementById('loader-filter');
    const mcVersionList = document.getElementById('mc-versions-list');

    const [versions, loaders] = await Promise.all([fetchGameVersions(), fetchLoaders()]);
    const releaseVersions = versions.filter(v => v.version_type === 'release');
    
    if (mcVersionList) mcVersionList.innerHTML = ''; 
    
    releaseVersions.forEach(v => {
        versionSelect.innerHTML += `<option value="${v.version}">${v.version}</option>`;
        if (mcVersionList) mcVersionList.innerHTML += `<option value="${v.version}">${v.version}</option>`; 
    });

    loaders.forEach(l => {
        const name = l.name.charAt(0).toUpperCase() + l.name.slice(1);
        loaderSelect.innerHTML += `<option value="${l.name}">${name}</option>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadSearchFilters(); 
    renderMods();
    checkOnboarding();
    ensureEconomyData(); applyTheme(userProfile.activeTheme); renderShop(); startCoinGenerator(); 

    document.getElementById('search-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') executeSearch();
    });
});

async function openModDetails(projectId) {
    document.getElementById('mod-browse-view').style.display = 'none';
    document.getElementById('mod-details-view').style.display = 'block';
    
    const contentDiv = document.getElementById('mod-details-content');
    contentDiv.innerHTML = '<p style="color: var(--text-secondary); font-weight: 600;">Loading mod details...</p>';

    const mod = await fetchModDetails(projectId);
    currentOpenedModDetails = mod;

    if (!mod) {
        contentDiv.innerHTML = '<p style="color: var(--watermelon-pink); font-weight: 600;">Failed to load mod details.</p>';
        return;
    }

    const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg';
    const descriptionHtml = mod.body || mod.description; 

    contentDiv.innerHTML = `
        <div class="details-header-card">
            <div style="display: flex; gap: 30px; align-items: center;">
                <img src="${iconUrl}" style="width: 130px; height: 130px; border-radius: 20px; background: var(--bg-main); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
                <div style="flex: 1;">
                    <h1 style="font-size: 36px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; letter-spacing: -0.5px;">${mod.title}</h1>
                    <p style="color: var(--text-secondary); font-size: 16px; font-weight: 500; margin-bottom: 24px;">${mod.description}</p>
                    <button class="action-button primary" onclick="openDownloadModal('${mod.id}')">
                        📥 Download Mod
                    </button>
                </div>
            </div>
        </div>
        <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.7; color: var(--text-main); padding: 0 10px;">${descriptionHtml}</div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 10px; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Advertisement</div>
            <iframe src="https://euphonious-sunshine-590712.netlify.app/ad-banner.html" width="728" height="90" frameborder="0" scrolling="no" style="border-radius: 8px; background: var(--bg-main);"></iframe>
        </div>
    `;
}

function closeModDetails() {
    document.getElementById('mod-details-view').style.display = 'none';
    document.getElementById('mod-browse-view').style.display = 'flex'; 
}

let currentDownloadVersions = [];

async function openDownloadModal(projectId) {
    document.getElementById('download-modal').style.display = 'flex';
    const versionSelect = document.getElementById('modal-version-select');
    const loaderSelect = document.getElementById('modal-loader-select'); 
    
    versionSelect.innerHTML = '<option>Loading...</option>';
    loaderSelect.innerHTML = '<option>Loading...</option>';

    const versions = await fetchModVersions(projectId);
    currentDownloadVersions = versions;

    versionSelect.innerHTML = '';
    loaderSelect.innerHTML = '';
    
    const uniqueGameVersions = new Set();
    const uniqueLoaders = new Set(); 

    versions.forEach(v => {
        v.game_versions.forEach(gv => uniqueGameVersions.add(gv));
        v.loaders.forEach(ld => uniqueLoaders.add(ld)); 
    });

    Array.from(uniqueGameVersions).sort().reverse().forEach(v => {
        versionSelect.innerHTML += `<option value="${v}">${v}</option>`;
    });

    if (uniqueLoaders.size === 0) {
        loaderSelect.innerHTML = `<option value="none">None Required</option>`;
    } else {
        Array.from(uniqueLoaders).sort().forEach(loader => {
            const cleanName = loader.charAt(0).toUpperCase() + loader.slice(1);
            loaderSelect.innerHTML += `<option value="${loader}">${cleanName}</option>`;
        });
    }
}

function closeDownloadModal() {
    document.getElementById('download-modal').style.display = 'none';
}

function executeDownload(method, btnElement) {
    const selectedGameVersion = document.getElementById('modal-version-select').value;
    const selectedLoader = document.getElementById('modal-loader-select').value;

    const matchedVersion = currentDownloadVersions.find(v => {
        const matchesVersion = v.game_versions.includes(selectedGameVersion);
        const matchesLoader = selectedLoader === 'none' || v.loaders.includes(selectedLoader) || v.loaders.length === 0;
        return matchesVersion && matchesLoader;
    });

    if (matchedVersion && matchedVersion.files.length > 0) {
        const file = matchedVersion.files[0];
        
        const oldText = btnElement.innerText;
        btnElement.innerText = "⏳ Processing...";
        btnElement.disabled = true;

        if (method === 'direct') {
            window.electronAPI.downloadModDirect(file.url, file.filename).then(() => {
                if (currentOpenedModDetails) trackModDownload(currentOpenedModDetails);
                incrementGlobalDownloads();
                
                btnElement.innerText = oldText;
                btnElement.disabled = false;
                loadLocalMods(); 
                closeDownloadModal();
                alert(`Success! ${file.filename} was installed directly to your .minecraft/mods folder!`);
            });
        } else {
            window.electronAPI.downloadMod(file.url);
            if (currentOpenedModDetails) trackModDownload(currentOpenedModDetails);
            incrementGlobalDownloads();
            
            btnElement.innerText = oldText;
            btnElement.disabled = false;
            closeDownloadModal();
        }

    } else {
        alert("Sorry, no file available for Version: " + selectedGameVersion + " and Loader: " + selectedLoader + ".");
    }
}

function loadWebsite(buttonElement, url) {
    document.querySelectorAll('.web-nav .action-button').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#fff';
    });
    
    buttonElement.classList.add('active');
    buttonElement.style.background = '#f0eeff';
    
    const frame = document.getElementById('website-frame');
    frame.style.opacity = '0.5'; 
    frame.src = url;
    setTimeout(() => { frame.style.opacity = '1'; }, 300);
}

// ==========================================
// LAUNCHER LOGIC
// ==========================================
let isPremiumMode = false;

function toggleAuth(mode) {
    const tabOffline = document.getElementById('tab-offline');
    const tabPremium = document.getElementById('tab-premium');
    const inputsOffline = document.getElementById('offline-inputs');
    const inputsPremium = document.getElementById('premium-inputs');

    if (mode === 'premium') {
        isPremiumMode = true;
        tabPremium.style.background = '#fff';
        tabPremium.style.boxShadow = 'var(--shadow-sm)';
        tabOffline.style.background = 'transparent';
        tabOffline.style.boxShadow = 'none';
        inputsOffline.style.display = 'none';
        inputsPremium.style.display = 'block';
    } else {
        isPremiumMode = false;
        tabOffline.style.background = '#fff';
        tabOffline.style.boxShadow = 'var(--shadow-sm)';
        tabPremium.style.background = 'transparent';
        tabPremium.style.boxShadow = 'none';
        inputsOffline.style.display = 'block';
        inputsPremium.style.display = 'none';
    }
}

function startLaunch() {
    const username = document.getElementById('mc-username').value || 'DevPlayer';
    const version = document.getElementById('mc-version').value;
    const loader = document.getElementById('mc-loader').value;

    const btn = document.getElementById('launch-btn');
    btn.innerText = '⏳ Preparing Engine...';
    btn.disabled = true;
    
    document.getElementById('launch-progress-container').style.display = 'block';
    document.getElementById('launch-progress-bar').style.width = '0%';
    document.getElementById('launch-percentage').innerText = '0%';
    document.getElementById('launch-task').innerText = 'Connecting to auth servers...';

    window.electronAPI.launchMinecraft({ username, version, loader, isPremium: isPremiumMode });
}

if (window.electronAPI) {
    window.electronAPI.onLaunchProgress((data) => {
        document.getElementById('launch-task').innerText = `Downloading: ${data.task}`;
        document.getElementById('launch-percentage').innerText = `${data.percentage}%`;
        document.getElementById('launch-progress-bar').style.width = `${data.percentage}%`;
    });

    window.electronAPI.onLaunchComplete(() => {
        const btn = document.getElementById('launch-btn');
        btn.innerText = '🎮 Game is Running!';
        btn.style.background = '#2ecc71'; 
        document.getElementById('launch-task').innerText = 'Launch complete.';
        document.getElementById('launch-percentage').innerText = '100%';
        document.getElementById('launch-progress-bar').style.width = '100%';
        
        setTimeout(() => {
            btn.innerText = '🚀 Play';
            btn.style.background = '#6366f1';
            btn.disabled = false;
            document.getElementById('launch-progress-container').style.display = 'none';
        }, 5000);
    });

    window.electronAPI.onLaunchError((error) => {
        alert('Launch failed: ' + error);
        const btn = document.getElementById('launch-btn');
        btn.innerText = '🚀 Play';
        btn.disabled = false;
        document.getElementById('launch-progress-container').style.display = 'none';
    });
}
