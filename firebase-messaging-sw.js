window.requestNotificationPermission = async function(e) {
        if(e) e.preventDefault();
        if(typeof window.closeSidebar === 'function') window.closeSidebar();
        
        try {
            if(!messaging) { window.showToast("Notifications not supported on this browser.", "error"); return; }
            
            const perm = await Notification.requestPermission();
            
            if (perm === 'granted') {
                window.showToast("Connecting to secure server...", "success");
                
                // 🔥 FIX: Added dot (.) before slash so it works on GitHub Pages! 🔥
                let swRegistration;
                try {
                    swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
                } catch (swError) {
                    console.error('Service Worker Error:', swError);
                    window.showToast("Service worker missing or blocked!", "error");
                    return;
                }

                const token = await getToken(messaging, { 
                    vapidKey: 'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU',
                    serviceWorkerRegistration: swRegistration
                });
                
                if (token) {
                    const userEmail = localStorage.getItem('aavira_user_email') || 'guest_user';
                    const userName = localStorage.getItem('aavira_display_name') || 'Guest';
                    
                    // SAVE DIRECTLY TO FIRESTORE "fcm_tokens"
                    await setDoc(doc(db, "fcm_tokens", token), {
                        token: token,
                        email: userEmail,
                        name: userName,
                        platform: navigator.userAgent,
                        createdAt: new Date()
                    });
                    
                    window.showToast("Notifications Enabled! 🔔", "success");
                    setTimeout(() => { if(typeof window.openNotificationCenter === 'function') window.openNotificationCenter(); }, 1000);
                } else {
                    window.showToast("Failed to generate secure token.", "error");
                }
            } else {
                window.showToast("Notification permission denied.", "error");
            }
        } catch(err) { 
            console.error("Notif Error Full Details:", err);
            window.showToast("Failed to enable notifications.", "error");
        }
    };
