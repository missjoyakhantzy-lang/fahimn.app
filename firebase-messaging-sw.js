importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
    projectId: "messaging-d0a0c",
    messagingSenderId: "271709445992",
    appId: "1:271709445992:web:7a0c706288d88fee6a80dd"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('Background Message Received: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1161/1161388.png' // Yahan apna logo laga sakte ho
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
