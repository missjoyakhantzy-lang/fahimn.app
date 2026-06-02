// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Aapka Master Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCMGx6C5_al22KjCmdhGVKugJoR2UmZ1Ng",
    authDomain: "aavira-co-in.firebaseapp.com",
    projectId: "aavira-co-in",
    storageBucket: "aavira-co-in.firebasestorage.app",
    messagingSenderId: "247971292356",
    appId: "1:247971292356:web:82780c6dffe9ba530f9591"
};

// Firebase Initialize karna
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Yahan se hum in teeno tools ko "export" kar rahe hain, 
// taaki koi bhi HTML file inhe import karke use kar sake.
export { app, auth, db };
