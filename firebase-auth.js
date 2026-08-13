// ==========================================
// 🔥 FIREBASE SDK (AUTH, FIRESTORE, MESSAGING & DB SYNC) 🔥
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const msgConfig = {
    apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
    authDomain: "messaging-d0a0c.firebaseapp.com",
    projectId: "messaging-d0a0c",
    storageBucket: "messaging-d0a0c.firebasestorage.app",
    messagingSenderId: "271709445992",
    appId: "1:271709445992:web:7a0c706288d88fee6a80dd"
};

const msgApp = initializeApp(msgConfig, "messagingApp");
const db = getFirestore(msgApp); 
const auth = getAuth(msgApp);
const provider = new GoogleAuthProvider();
let messaging = null;

// SYNC NOTIFICATIONS DIRECTLY FROM DATABASE
window.syncNotificationsFromDB = async function() {
    try {
        const q = query(collection(db, "admin_broadcasts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        let dbNotifs = [];
        let readState = JSON.parse(localStorage.getItem('aavira_read_notifs')) || {};

        snap.forEach(docSnap => {
            let data = docSnap.data();
            let timeStr = data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString();
            
            dbNotifs.push({
                id: docSnap.id,
                title: data.title,
                body: data.body,
                time: timeStr,
                read: readState[docSnap.id] ? true : false
            });
        });

        localStorage.setItem('aavira_notifications', JSON.stringify(dbNotifs));
        
        if(typeof window.renderNotifications === 'function') window.renderNotifications();
        if(typeof window.updateNotifBadge === 'function') window.updateNotifBadge();
    } catch(e) {
        console.error("Fetch notifs error:", e);
    }
};

// REFERRAL SYSTEM BACKEND LOGIC
window.processReferral = async function(newUserEmail) {
    const refCode = localStorage.getItem('aavira_ref_code');
    if (refCode) {
        try {
            const referrerEmail = atob(refCode);
            if(referrerEmail && referrerEmail !== newUserEmail) {
                const userRef = doc(db, "users", referrerEmail);
                const docSnap = await getDoc(userRef);
                if(docSnap.exists()) {
                    await updateDoc(userRef, { referralCount: increment(1), referralEarned: increment(500) });
                } else {
                    await setDoc(userRef, { referralCount: 1, referralEarned: 500 }, {merge: true});
                }
                localStorage.removeItem('aavira_ref_code'); 
            }
        } catch(e) { console.error("Referral process error", e); }
    }
}

window.loadReferralStats = async function(email) {
    try {
        const docSnap = await getDoc(doc(db, "users", email));
        if(docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('refCount').innerText = data.referralCount || 0;
            document.getElementById('refEarned').innerText = "₹" + (data.referralEarned || 0);
        }
    } catch(e) { console.error("Error loading stats", e); }
}

// REAL GOOGLE LOGIN 
window.performGoogleLogin = async function() {
    try {
        if(typeof window.showToast === 'function') window.showToast("Opening Google Secure Login...", "success");
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        localStorage.setItem('aavira_display_name', user.displayName);
        localStorage.setItem('aavira_user_email', user.email);
        
        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName, email: user.email, role: "user", loginMethod: "google", createdAt: new Date()
        }, { merge: true });

        window.processReferral(user.email);
        if(typeof window.showToast === 'function') window.showToast(`Welcome back, ${user.displayName}!`, "success");
        if(typeof window.updateProfileUI === 'function') window.updateProfileUI();
        if(typeof window.closeLoginModal === 'function') window.closeLoginModal();
    } catch (error) {
        console.error("Google Auth Error:", error);
        if(typeof window.showToast === 'function') window.showToast("Login Cancelled.", "error");
    }
};

// FIREBASE LIVE NOTIFICATIONS & DIRECT TOKEN SAVE
isSupported().then((supported) => {
    if (supported) {
        messaging = getMessaging(msgApp);
        onMessage(messaging, (payload) => {
            const title = payload.notification?.title || "Aavira Update";
            if(typeof window.showToast === 'function') window.showToast(`🔔 ${title}`, "success");
            window.syncNotificationsFromDB(); 
        });
    }
});

window.requestNotificationPermission = async function(e) {
    if(e) e.preventDefault();
    if(typeof window.closeSidebar === 'function') window.closeSidebar();
    
    try {
        if(!messaging) { if(typeof window.showToast === 'function') window.showToast("Notifications not supported.", "error"); return; }
        
        const perm = await Notification.requestPermission();
        
        if (perm === 'granted') {
            if(typeof window.showToast === 'function') window.showToast("Connecting to secure server...", "success");
            let swRegistration;
            try {
                swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            } catch (swError) {
                if(typeof window.showToast === 'function') window.showToast("SW Error: " + swError.message, "error");
                return;
            }

            const token = await getToken(messaging, { 
                vapidKey: 'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU',
                serviceWorkerRegistration: swRegistration
            });
            
            if (token) {
                const userEmail = localStorage.getItem('aavira_user_email') || 'guest_user';
                const userName = localStorage.getItem('aavira_display_name') || 'Guest';
                try {
                    await setDoc(doc(db, "fcm_tokens", token), {
                        token: token, email: userEmail, name: userName, platform: navigator.userAgent, createdAt: new Date()
                    });
                    if(typeof window.showToast === 'function') window.showToast("Notifications Enabled! 🔔", "success");

                    // Send Welcome Notification
                    const AUTH_VERCEL_URL = "https://ssxpq15in.vercel.app";
                    fetch(`${AUTH_VERCEL_URL}/api/broadcast`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tokens: [token],
                            title: "🎉 Welcome to Aavira Fashion! 🎉",
                            body: `Hi ${userName}, thanks for enabling notifications! Get ready for exclusive ethnic trends & secret offers. 👗✨`
                        })
                    }).catch(e => console.log("Welcome push failed", e));

                    setTimeout(() => { if(typeof window.openNotificationCenter === 'function') window.openNotificationCenter(); }, 1500);
                } catch (dbErr) { if(typeof window.showToast === 'function') window.showToast("DB Error: " + dbErr.message, "error"); }
            } else { if(typeof window.showToast === 'function') window.showToast("Failed to generate secure token.", "error"); }
        } else { if(typeof window.showToast === 'function') window.showToast("Notification permission denied.", "error"); }
    } catch(err) { if(typeof window.showToast === 'function') window.showToast("Error: " + err.message, "error"); }
};
