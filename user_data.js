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
    return str ? String(str).trim().substring(0, limit) : '';
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

function animateValue(obj, start, end, duration, isFloat = false) {
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        obj.innerHTML = isFloat ? current.toFixed(1) : Math.floor(current);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
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
// 4. REVIEWS & RATINGS SYSTEM (UI DATA)
// ==========================================
window.saveReviewToDatabase = async function (productId, reviewData) {
    return await jsonPost(`${MAIN_BACKEND_URL}/api/reviews`, { productId, reviewData });
};

window.renderAdvancedRatingSystem = function(adminRatingVal, adminReviewCount) {
    const container = document.getElementById('ratingSummaryBox');
    const reviewsContainer = document.getElementById('reviewsList');
    if(!container || !reviewsContainer) return;

    let realReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || []; 

    let finalRating = parseFloat(adminRatingVal); 
    let finalCount = parseInt(adminReviewCount); 
    if (!finalRating || isNaN(finalRating)) { 
        let hash = 0; let idStr = String(window.currentProductIdForReviews || 'fallback'); 
        for(let i=0; i<idStr.length; i++){ hash += idStr.charCodeAt(i); } 
        finalRating = 3.8 + (hash % 12) / 10; 
        if(finalRating > 5.0) finalRating = 5.0; 
    } 
    if (!finalCount || isNaN(finalCount)) { 
        let hash = 0; let idStr = String(window.currentProductIdForReviews || 'fallback'); 
        for(let i=0; i<idStr.length; i++){ hash += idStr.charCodeAt(i); } 
        finalCount = 20 + (hash % 150); 
    } 

    let totalSum = (finalRating * finalCount); 
    realReviews.forEach(r => { totalSum += parseInt(r.rating || r.score || 5); finalCount += 1; }); 
    finalRating = parseFloat((totalSum / finalCount).toFixed(1)); 
    if(finalRating > 5.0) finalRating = 5.0; 

    let p5 = 0, p4 = 0, p3 = 0, p2 = 0, p1 = 0; 
    if(finalRating >= 4.5) { p5 = 80; p4 = 12; p3 = 5; p2 = 2; p1 = 1; } 
    else if(finalRating >= 4.0) { p5 = 55; p4 = 30; p3 = 10; p2 = 3; p1 = 2; } 
    else if(finalRating >= 3.0) { p5 = 20; p4 = 30; p3 = 30; p2 = 10; p1 = 10; } 
    else { p5 = 5; p4 = 15; p3 = 20; p2 = 30; p1 = 30; } 
    
    const distribution = [ { star: 5, pct: p5 }, { star: 4, pct: p4 }, { star: 3, pct: p3 }, { star: 2, pct: p2 }, { star: 1, pct: p1 } ]; 

    let html = `<div class="rating-summary-wrapper"><div class="rating-left"><div class="rating-big-text" id="animRatingVal">0.0</div><div class="rating-stars-main"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i></div><div class="rating-count"><span id="animReviewCount">0</span> Verified Reviews</div></div><div class="rating-right">`; 
    distribution.forEach(row => { 
        html += `<div class="rating-bar-row"><span style="width:20px;">${row.star} <i class="fa-solid fa-star" style="font-size:9px;"></i></span><div class="progress-track"><div class="progress-fill" id="bar-${row.star}" style="width: 0%;"></div></div><span style="min-width:25px; text-align:right;">${row.pct}%</span></div>`; 
    }); 
    html += `</div></div>`; 
    container.innerHTML = html; 

    const ratingSection = document.getElementById('ratingSummaryBox'); 
    const observer = new IntersectionObserver((entries) => { 
        if(entries[0].isIntersecting) { 
            animateValue(document.getElementById("animRatingVal"), 0.0, finalRating, 1000, true); 
            animateValue(document.getElementById("animReviewCount"), 0, finalCount, 1500, false); 
            setTimeout(() => { 
                distribution.forEach(row => { 
                    const bar = document.getElementById(`bar-${row.star}`); 
                    if(bar) bar.style.width = `${row.pct}%`; 
                }); 
            }, 200); 
            observer.disconnect(); 
        } 
    }); 
    if(ratingSection) observer.observe(ratingSection); 

    if (realReviews.length === 0) { 
        reviewsContainer.innerHTML = `<div style="width: 100%; text-align: center; padding: 25px 20px; background: var(--bg-light); border-radius: 12px; border: 1px dashed #d1d5db;"><h4 style="color: var(--text-dark); font-weight: 700; font-size:14px;">No reviews yet</h4><p style="font-size: 11px; color: var(--text-muted); margin-top:4px;">Be the first to share your experience!</p></div>`; 
    } else { 
        let rHtml = ''; 
        realReviews.forEach(r => { 
            let rateVal = r.rating || r.score || 5; 
            let starsHtml = ''; 
            for(let i=1; i<=5; i++) starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= rateVal ? 'var(--secondary-color)' : '#e5e7eb'}; font-size: 12px;"></i>`; 
            let titleHtml = r.title ? `<div class="review-title-text">${r.title}</div>` : ''; 
            let bodyTxt = r.text || r.body || ''; 
            rHtml += `<div class="review-card"><div class="review-header"><div class="reviewer-info"><div class="reviewer-initial">${r.name.charAt(0).toUpperCase()}</div><div><div class="reviewer-name">${r.name}</div><div class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Buyer</div></div></div><div class="review-date">${r.date || 'Recently'}</div></div><div class="review-stars">${starsHtml}</div>${titleHtml}<p class="review-body-text">${bodyTxt}</p></div>`; 
        }); 
        reviewsContainer.innerHTML = rHtml; 
    } 
};

let selectedRating = 0;

window.handleWriteReviewClick = function() { 
    const savedName = localStorage.getItem('aavira_display_name'); 
    if (!savedName || savedName.trim() === "") { openModal('loginPromptModal'); } 
    else { openModal('reviewModal'); } 
};

window.setRating = function(val) { 
    selectedRating = parseInt(val); 
    document.querySelectorAll('#starSelector i').forEach(star => { 
        if(parseInt(star.getAttribute('data-val')) <= val) star.classList.add('active'); 
        else star.classList.remove('active'); 
    }); 
};

window.submitReview = async function() { 
    if (selectedRating === 0) { alert("Please select a star rating!"); return; } 
    const titleEl = document.getElementById('reviewTitleInput'); 
    const textEl = document.getElementById('reviewText'); 
    if (!textEl.value.trim()) { alert("Please write your experience!"); return; } 
    
    const newReview = { name: localStorage.getItem('aavira_display_name') || "User", rating: selectedRating, title: titleEl.value.trim() || 'Amazing Product', text: textEl.value.trim(), date: new Date().toLocaleDateString('en-GB') }; 
    const btn = document.getElementById('submitReviewBtn'); 
    const ogText = btn.innerHTML; 
    btn.innerHTML = 'Saving...'; btn.disabled = true; 
    
    try { 
        if (typeof window.saveReviewToDatabase === 'function') { 
            await window.saveReviewToDatabase(window.currentProductIdForReviews, newReview); 
        } 
    } catch(e) {} 
    
    let productReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || []; 
    productReviews.unshift(newReview); 
    localStorage.setItem(`reviews_${window.currentProductIdForReviews}`, JSON.stringify(productReviews)); 
    
    alert("Review Posted Successfully!"); 
    if (typeof closeModal === 'function') closeModal('reviewModal'); 
    setRating(0); 
    textEl.value = ''; titleEl.value = ''; 
    if (window.currentProduct) { renderAdvancedRatingSystem(window.currentProduct.adminRating, window.currentProduct.adminReviewCount); } 
    btn.innerHTML = ogText; btn.disabled = false; 
};

// ==========================================
// 5. AUTHENTICATION (LOGIN / SIGNUP / OTP)
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
    return r.data || r; 
};

window.DeliveryBoy.googleLogin = async function () {
    return await jsonPost(`${AUTH_BACKEND_URL}/api/google-login`, {}); 
};

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
    
    if(!name || !email || !pwd) { alert("Please fill all fields!"); return; } 
    const btn = document.getElementById('btnSignupAction'); 
    btn.innerText = 'Checking...'; btn.disabled = true; 
    
    if(typeof window.DeliveryBoy !== 'undefined') { 
        const existsRes = await window.DeliveryBoy.checkEmailExists(email); 
        if(existsRes && existsRes.exists) { 
            alert("Email already registered. Please Sign In."); 
            btn.innerText = 'Continue'; btn.disabled = false; toggleAuthView('login'); return; 
        } 
        btn.innerText = 'Sending OTP...'; 
        const otpRes = await window.DeliveryBoy.sendOTP(email, name); 
        if(otpRes && otpRes.ok && otpRes.data && otpRes.data.success) { 
            tempSignupData = { name, email, pwd }; toggleAuthView('otp'); 
            document.getElementById('otpSubText').innerText = `Code sent to ${email}`; 
        } else { 
            alert((otpRes && otpRes.data && otpRes.data.message) || "Failed to send OTP."); 
        } 
    } else { alert("Auth system unavailable currently."); } 
    
    btn.innerText = 'Continue'; btn.disabled = false; 
};

window.verifySignupOTP = async function() { 
    const otp = document.getElementById('otpInput').value.trim(); 
    if(otp.length !== 6) { alert("Please enter a valid 6-digit OTP"); return; } 
    const btn = document.getElementById('btnOtpAction'); 
    btn.innerText = 'Verifying...'; btn.disabled = true; 
    
    if(typeof window.DeliveryBoy !== 'undefined') { 
        const res = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otp, tempSignupData.name, tempSignupData.pwd); 
        if(res && res.ok && res.data && res.data.success) { 
            localStorage.setItem('aavira_display_name', tempSignupData.name); 
            localStorage.setItem('aavira_user_email', tempSignupData.email); 
            alert("Welcome to Aavira! Account verified."); 
            if (typeof closeModal === 'function') closeModal('loginModal'); 
            setTimeout(() => window.handleWriteReviewClick(), 500); 
        } else { 
            alert((res && res.data && res.data.message) || "Invalid OTP!"); 
        } 
    } 
    btn.innerText = 'Verify'; btn.disabled = false; 
};

window.processLogin = async function() { 
    const email = document.getElementById('loginEmail').value.trim(); 
    const pwd = document.getElementById('loginPassword').value.trim(); 
    if(!email || !pwd) { alert("Fields required!"); return; } 
    
    const btn = document.getElementById('btnLoginAction'); 
    btn.innerText = 'Logging in...'; btn.disabled = true; 
    
    if(typeof window.DeliveryBoy !== 'undefined') { 
        const res = await window.DeliveryBoy.login(email, pwd); 
        if(res && res.ok && res.data && res.data.success) { 
            localStorage.setItem('aavira_display_name', res.data.userName || email.split('@')[0]); 
            localStorage.setItem('aavira_user_email', email); 
            alert("Login Successful!"); 
            if (typeof closeModal === 'function') closeModal('loginModal'); 
            setTimeout(() => window.handleWriteReviewClick(), 500); 
        } else { 
            alert((res && res.data && res.data.message) || "Login Failed. Check credentials."); 
        } 
    } else { alert("Auth system unavailable currently."); } 
    
    btn.innerText = 'Secure Login'; btn.disabled = false; 
};

window.performGoogleLogin = async function() { 
    try { 
        if(typeof window.DeliveryBoy !== 'undefined') { 
            const res = await window.DeliveryBoy.googleLogin(); 
            if(res && res.success) { 
                localStorage.setItem('aavira_display_name', res.userName); 
                localStorage.setItem('aavira_user_email', res.email); 
                alert(`Welcome, ${res.userName}!`); 
                if (typeof closeModal === 'function') closeModal('loginModal'); 
                setTimeout(() => window.handleWriteReviewClick(), 500); 
            } 
        } 
    } catch (error) { alert("Google Sign in unavailable."); } 
};
