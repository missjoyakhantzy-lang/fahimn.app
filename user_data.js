// ==========================================
// 1. API ENDPOINTS & CONFIGURATION
// ==========================================
const MAIN_BACKEND_URL = "https://server-js-psi-five.vercel.app";
const AUTH_BACKEND_URL = "https://ssxpq15in.vercel.app";
const NEWSLETTER_BACKEND_URL = "https://wwwfahimapp.vercel.app";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let tempSignupData = {};

// ==========================================
// 2. UTILITY FUNCTIONS
// ==========================================
function cleanStr(str, limit) {
    return str ? str.trim().substring(0, limit) : '';
}

function isSuccess(res) {
    return res && res.ok === true;
}

async function jsonPost(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await response.json();
        return { ok: response.ok, data: json };
    } catch (error) {
        console.error("Fetch Error:", error);
        return { ok: false, data: { message: "Network error. Please try again." } };
    }
}

// ==========================================
// 3. NEWSLETTER SYSTEM
// ==========================================
window.subscribeNewsletterApi = async function (email) {
    const cleanEmail = cleanStr(email, 120).toLowerCase();
    
    if (!EMAIL_RE.test(cleanEmail)) {
        return { ok: false, message: 'Please enter a valid email address.' };
    }
    
    // Yahan NEWSLETTER_BACKEND_URL use ho raha hai
    const r = await jsonPost(`${NEWSLETTER_BACKEND_URL}/api/subscribe`, { email: cleanEmail });
    
    if (isSuccess(r)) {
        return { ok: true, message: r.data.message || 'Subscribed successfully!' };
    }
    return { ok: false, message: (r.data && r.data.message) || 'Could not subscribe. Please try again.' };
};

// ==========================================
// 4. AUTHENTICATION (LOGIN / SIGNUP / OTP)
// ==========================================
window.DeliveryBoy = window.DeliveryBoy || {};

window.DeliveryBoy.login = async function (email, password) {
    return await jsonPost(`${AUTH_BACKEND_URL}/api/login`, { email, password });
};

window.DeliveryBoy.sendOTP = async function (email, name) {
    return await jsonPost(`${AUTH_BACKEND_URL}/api/send-otp`, { email, name });
};

window.DeliveryBoy.verifyOTP = async function (email, otp, name, password) {
    return await jsonPost(`${AUTH_BACKEND_URL}/api/verify-otp`, { email, otp, name, password });
};

window.DeliveryBoy.checkEmailExists = async function (email) {
    const r = await jsonPost(`${AUTH_BACKEND_URL}/api/check-email`, { email });
    return r.data;
};

window.DeliveryBoy.googleLogin = async function () {
    return await jsonPost(`${AUTH_BACKEND_URL}/api/google-login`, {}); 
};

// --- Auth UI Logic ---
window.toggleAuthView = function(viewMode) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('otpView').style.display = 'none';
    document.getElementById(viewMode + 'View').style.display = 'block';
    document.getElementById('authTitle').innerText = viewMode === 'signup' ? 'Create Account' : viewMode === 'login' ? 'Welcome Back' : 'Verify OTP';
};

window.processSignup = async function() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pwd = document.getElementById('signupPassword').value.trim();
    
    if(!name || !email || !pwd) { 
        alert("Please fill all fields!"); 
        return; 
    }
    
    const btn = document.getElementById('btnSignupAction');
    btn.innerText = 'Checking...'; 
    btn.disabled = true;

    const existsRes = await window.DeliveryBoy.checkEmailExists(email);
    if(existsRes && existsRes.exists) {
        alert("Email already registered. Please Sign In.");
        btn.innerText = 'Continue'; 
        btn.disabled = false;
        toggleAuthView('login'); 
        return;
    }
    
    btn.innerText = 'Sending OTP...';
    const otpRes = await window.DeliveryBoy.sendOTP(email, name);
    
    if(otpRes.ok && otpRes.data.success) {
        tempSignupData = { name, email, pwd };
        toggleAuthView('otp');
        document.getElementById('otpSubText').innerText = `Code sent to ${email}`;
    } else {
        alert(otpRes.data.message || "Failed to send OTP.");
    }
    btn.innerText = 'Continue'; 
    btn.disabled = false;
};

window.verifySignupOTP = async function() {
    const otp = document.getElementById('otpInput').value.trim();
    
    if(otp.length !== 6) { 
        alert("Please enter a valid 6-digit OTP"); 
        return; 
    }
    
    const btn = document.getElementById('btnOtpAction');
    btn.innerText = 'Verifying...'; 
    btn.disabled = true;

    const res = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otp, tempSignupData.name, tempSignupData.pwd);
    
    if(res.ok && res.data.success) {
        localStorage.setItem('aavira_display_name', tempSignupData.name);
        localStorage.setItem('aavira_user_email', tempSignupData.email);
        alert("Welcome to Aavira! Account verified.");
        if(typeof closeModal === 'function') closeModal('loginModal');
        setTimeout(() => { 
            if(typeof window.handleWriteReviewClick === 'function') window.handleWriteReviewClick(); 
        }, 500);
    } else {
        alert(res.data.message || "Invalid OTP!");
    }
    btn.innerText = 'Verify'; 
    btn.disabled = false;
};

window.processLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    
    if(!email || !pwd) { 
        alert("Fields required!"); 
        return; 
    }
    
    const btn = document.getElementById('btnLoginAction');
    btn.innerText = 'Logging in...'; 
    btn.disabled = true;

    const res = await window.DeliveryBoy.login(email, pwd);
    
    if(res.ok && res.data.success) {
        localStorage.setItem('aavira_display_name', res.data.userName || email.split('@')[0]);
        localStorage.setItem('aavira_user_email', email);
        alert("Login Successful!");
        if(typeof closeModal === 'function') closeModal('loginModal');
        setTimeout(() => { 
            if(typeof window.handleWriteReviewClick === 'function') window.handleWriteReviewClick(); 
        }, 500);
    } else {
        alert(res.data.message || "Login Failed. Check credentials.");
    }
    btn.innerText = 'Secure Login'; 
    btn.disabled = false;
};

window.performGoogleLogin = async function() {
    try {
        const res = await window.DeliveryBoy.googleLogin();
        if(res && res.success) {
            localStorage.setItem('aavira_display_name', res.userName);
            localStorage.setItem('aavira_user_email', res.email);
            alert(`Welcome, ${res.userName}!`);
            if(typeof closeModal === 'function') closeModal('loginModal');
            setTimeout(() => { 
                if(typeof window.handleWriteReviewClick === 'function') window.handleWriteReviewClick(); 
            }, 500);
        }
    } catch (error) {
        alert("Google Sign in unavailable.");
    }
};

// ==========================================
// 5. REVIEWS & RATINGS SYSTEM
// ==========================================
window.saveReviewToDatabase = async function (productId, reviewData) {
    return await jsonPost(`${MAIN_BACKEND_URL}/api/reviews`, { productId, reviewData });
};

let selectedRating = 0;

window.setRating = function(val) {
    selectedRating = parseInt(val);
    document.querySelectorAll('#starSelector i').forEach(star => {
        if(parseInt(star.getAttribute('data-val')) <= val) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
};

window.handleWriteReviewClick = function() {
    const savedName = localStorage.getItem('aavira_display_name');
    if (!savedName || savedName.trim() === "") {
        if(typeof openModal === 'function') openModal('loginPromptModal');
    } else {
        if(typeof openModal === 'function') openModal('reviewModal');
    }
};

window.submitReview = async function() {
    if (selectedRating === 0) { 
        alert("Please select a star rating!"); 
        return; 
    }
    
    const titleEl = document.getElementById('reviewTitleInput');
    const textEl = document.getElementById('reviewText');
    
    if (!textEl.value.trim()) { 
        alert("Please write your experience!"); 
        return; 
    }

    const newReview = {
        name: localStorage.getItem('aavira_display_name') || "User",
        rating: selectedRating,
        title: titleEl.value.trim() || 'Amazing Product',
        text: textEl.value.trim(),
        date: new Date().toLocaleDateString('en-GB')
    };

    const btn = document.getElementById('submitReviewBtn');
    const ogText = btn.innerHTML;
    btn.innerHTML = 'Saving...'; 
    btn.disabled = true;

    try {
        await window.saveReviewToDatabase(window.currentProductIdForReviews, newReview);
    } catch(e) { 
        console.error("Database save failed:", e); 
    }

    let productReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || [];
    productReviews.unshift(newReview);
    localStorage.setItem(`reviews_${window.currentProductIdForReviews}`, JSON.stringify(productReviews));

    alert("Review Posted Successfully!");
    
    if(typeof closeModal === 'function') closeModal('reviewModal');
    setRating(0); 
    textEl.value = ''; 
    titleEl.value = '';
    
    if (window.currentProduct && typeof renderAdvancedRatingSystem === 'function') {
        renderAdvancedRatingSystem(window.currentProduct.adminRating, window.currentProduct.adminReviewCount);
    }
    
    btn.innerHTML = ogText; 
    btn.disabled = false;
};
