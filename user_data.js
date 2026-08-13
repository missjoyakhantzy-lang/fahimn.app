// ==========================================
// user_data.js (DATA PROVIDER & DELIVERY BOY)
// ==========================================

// 🔥 PRODUCTS & ORDERS BACKEND (Aavira) 🔥
const VERCEL_URL = "https://aavira-fashion-backend.vercel.app";

// 🔥 NAYA AUTHENTICATION BACKEND (Login/OTP) 🔥
const AUTH_URL = "https://ssxpq15in.vercel.app";

// ==========================================
// 1. DATA FETCHING (Products, Banners, Categories)
// ==========================================
window.getVercelData = async function() {
    try { const res = await fetch(`${VERCEL_URL}/api/products`); const data = await res.json(); return (res.ok && data.status === "success") ? data.data : []; } catch (e) { return []; }
};
window.getBannersData = async function() {
    try { const res = await fetch(`${VERCEL_URL}/api/banners`); const data = await res.json(); return (res.ok && data.status === "success") ? data.data : []; } catch (e) { return []; }
};
window.getCategoriesData = async function() {
    try { const res = await fetch(`${VERCEL_URL}/api/categories`); const data = await res.json(); return (res.ok && data.status === "success") ? data.data : []; } catch (e) { return []; }
};

// ==========================================
// 2. ORDERS & REVIEWS LOGIC
// ==========================================
window.sendOrderToVercel = async function(orderPayload) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
        const result = await response.json(); return (response.ok && result.status === "success");
    } catch (error) { return false; }
};

window.saveReviewToDatabase = async function(productId, reviewData) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/add-review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: productId, review: reviewData }) });
        const result = await response.json(); return result.success;
    } catch (error) { return false; }
};

window.getReviewsFromDatabase = async function(productId) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/get-reviews?productId=${productId}`);
        const result = await response.json(); return (response.ok && result.success) ? result.data : [];
    } catch (error) { return []; }
};

// ==========================================
// ✨ 3. LOGIN & OTP DELIVERY BOY (NEW URL) ✨
// ==========================================
window.DeliveryBoy = {
    sendOTP: async function(email, name) {
        try {
            const response = await fetch(`${AUTH_URL}/api/send-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userName: name })
            });
            const data = await response.json(); return { ok: response.ok, data: data };
        } catch (error) { return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; }
    },

    verifyOTP: async function(email, userOtp, name, pwd) {
        try {
            const response = await fetch(`${AUTH_URL}/api/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userOTP: userOtp, userName: name, userPassword: pwd })
            });
            const data = await response.json(); return { ok: response.ok, data: data };
        } catch (error) { return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; }
    },

    login: async function(email, pwd) {
        try {
            const response = await fetch(`${AUTH_URL}/api/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userPassword: pwd })
            });
            const data = await response.json(); return { ok: response.ok, data: data };
        } catch (error) { return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; }
    },

    checkEmailExists: async function(email) {
        try {
            const response = await fetch(`${AUTH_URL}/api/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userPassword: "DUMMY_PASSWORD_CHECK_123" })
            });
            const data = await response.json();
            if (data.message === "Incorrect Password!") return { exists: true };
            return { exists: false };
        } catch (error) { return { exists: false }; }
    },

    googleLogin: async function() {
        return new Promise((resolve) => { setTimeout(() => { resolve({ success: true, userName: "Google User", email: "user@gmail.com" }); }, 1500); });
    }
};
