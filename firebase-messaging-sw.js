// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
  projectId: "messaging-d0a0c",
  messagingSenderId: "271709445992",
  appId: "1:271709445992:web:7a0c706288d88fee6a80dd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Aavira Fashion';
  
  const notificationOptions = {
    body: payload.notification?.body || 'Aapke liye naya ethnic collection aaya hai!',
    
    // ==========================================
    // 1️⃣ NOTIFICATION ICON (Chhota Logo)
    // ChatGPT ke 1st Prompt wali photo ka link yahan daalein
    // Example: 'https://missjoyakhantzy-lang.github.io/fahimn.app/icon.png'
    // ==========================================
    icon: 'https://github.com/missjoyakhantzy-lang/fahimn.app/blob/main/file_00000000082881fda1a366c789ed0fa3.png', 
    
    // ==========================================
    // 2️⃣ BIG BANNER IMAGE (Badi Photo)
    // ChatGPT ke 2nd Prompt wali badi photo ka link yahan daalein
    // Example: 'https://missjoyakhantzy-lang.github.io/fahimn.app/banner.jpg'
    // ==========================================
    image: 'https://github.com/missjoyakhantzy-lang/fahimn.app/blob/main/file_00000000792081fa91bf7fd99dc468df.png', 
    
    // ==========================================
    // 3️⃣ STATUS BAR BADGE (Upar aane wala chhota safed icon)
    // ChatGPT ke 3rd Prompt wali photo (jiska background remove kiya ho) uska link yahan daalein
    // Example: 'https://missjoyakhantzy-lang.github.io/fahimn.app/badge.png'
    // ==========================================
    badge: 'https://github.com/missjoyakhantzy-lang/fahimn.app/blob/main/file_00000000f6588230a680e62beef2d61a.png',
    
    vibrate: [200, 100, 200, 100, 200], 
    requireInteraction: true, 
    
    // Niche aane wale 2 buttons
    actions: [
      { action: 'explore', title: '🛍️ Shop Now' },
      { action: 'close', title: '✖️ Dismiss' }
    ],
    
    // Notification par click karne par khulne wala link
    data: {
      url: 'https://missjoyakhantzy-lang.github.io/fahimn.app/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Jab user notification ya "Shop Now" par click kare toh kya ho
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
