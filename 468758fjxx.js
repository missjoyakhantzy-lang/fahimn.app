import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const c = {
    apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
    authDomain: "messaging-d0a0c.firebaseapp.com",
    projectId: "messaging-d0a0c",
    storageBucket: "messaging-d0a0c.firebasestorage.app",
    messagingSenderId: "271709445992",
    appId: "1:271709445992:web:7a0c706288d88fee6a80dd"
};

const a = initializeApp(c);
const d = getFirestore(a);
let m = null;


// ==========================================
// 2. CLOUDINARY API INTEGRATION
// ==========================================
window.uploadToCloudinary = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "hcfer3tk"); // Aapka Preset
        formData.append("cloud_name", "lqbslpty");    // Aapka Cloud Name

        const response = await fetch("https://api.cloudinary.com/v1_1/lqbslpty/image/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Cloudinary image upload failed");
        }

        const data = await response.json();
        return data.secure_url || ""; // Ye function direct secure URL return karega
    } catch (error) {
        console.error("Cloudinary API Error:", error);
        throw error;
    }
};


// ==========================================
// 3. FIREBASE NOTIFICATIONS & REFERRAL LOGIC
// ==========================================
window.syncNotificationsFromDB = async () => {
    try {
        let q = query(collection(d, "admin_broadcasts"), orderBy("createdAt", "desc"));
        let s = await getDocs(q);
        let n = [];
        let r = JSON.parse(localStorage.getItem('aavira_read_notifs')) || {};
        
        s.forEach(x => {
            let dt = x.data();
            let t = dt.createdAt ? dt.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString();
            n.push({
                id: x.id,
                title: dt.title,
                body: dt.body,
                link: dt.link || '',
                time: t,
                read: r[x.id] ? true : false
            });
        });
        
        localStorage.setItem('aavira_notifications', JSON.stringify(n));
        
        if (typeof window.renderNotifications === 'function') window.renderNotifications();
        if (typeof window.updateNotifBadge === 'function') window.updateNotifBadge();
    } catch (e) {
        console.error("Error syncing notifications:", e);
    }
};

window.loadReferralStats = async (e) => {
    try {
        let s = await getDoc(doc(d, "users", e));
        if (s.exists()) {
            let x = s.data();
            document.getElementById('refCount').innerText = x.referralCount || 0;
            document.getElementById('refEarned').innerText = "₹" + (x.referralEarned || 0);
        }
    } catch (e) {
        console.error("Error loading referral stats:", e);
    }
};

// Messaging Setup
isSupported().then((s) => {
    if (s) {
        m = getMessaging(a);
        onMessage(m, (p) => {
            let t = p.notification?.title || "Update";
            if (typeof window.showToast === 'function') window.showToast(`🔔 ${t}`, "success");
            if (typeof window.vibrateApp === 'function') window.vibrateApp(100);
            window.syncNotificationsFromDB();
        });
    }
});

window.requestNotificationPermission = async (e) => {
    if (e) e.preventDefault();
    if (typeof window.closeSidebar === 'function') window.closeSidebar();
    
    if (!('Notification' in window)) {
        window.showToast("Notifications not supported in this browser.", "error");
        return;
    }
    
    try {
        if (!m) {
            window.showToast("Not supported.", "error");
            return;
        }
        
        let p = await Notification.requestPermission();
        if (p === 'granted') {
            window.showToast("Connecting...", "success");
            let sw = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            let t = await getToken(m, { 
                vapidKey: 'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU', 
                serviceWorkerRegistration: sw 
            });
            
            if (t) {
                let ue = localStorage.getItem('aavira_user_email') || 'guest_user';
                let un = localStorage.getItem('aavira_display_name') || 'Guest';
                
                await setDoc(doc(d, "fcm_tokens", t), {
                    token: t,
                    email: ue,
                    name: un,
                    platform: navigator.userAgent,
                    createdAt: new Date()
                });
                
                window.showToast("Enabled! 🔔", "success");
                if (typeof window.closeDynamicBanner === 'function') window.closeDynamicBanner('notif');
                
                fetch(`https://ssxpq15in.vercel.app/api/broadcast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tokens: [t],
                        title: "🎉 Welcome!",
                        body: `Hi ${un}, thanks for enabling notifications!`
                    })
                }).catch(() => { });
                
                setTimeout(() => {
                    if (typeof window.openNotificationCenter === 'function') window.openNotificationCenter();
                }, 1500);
            } else {
                window.showToast("Failed.", "error");
            }
        } else {
            window.showToast("Denied.", "error");
        }
    } catch (err) {
        window.showToast("Error.", "error");
        console.error(err);
    }
};
