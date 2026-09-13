// ==========================================
// user_data.js (DATA PROVIDER & DELIVERY BOY)
// ==========================================

// 🔥 1. PRODUCTS, MAIN PRODUCTS & BANNERS KE LIYE URL 🔥
const VERCEL_URL = "https://server-js-psi-five.vercel.app";

// 🔥 2. OTP, LOGIN AUR ORDERS KE LIYE NAYA URL 🔥
const AUTH_URL = "https://ssxpq15in.vercel.app";


// ==========================================
// 1. DATA FETCHING (Products, Main Products, Banners, Categories)
// ==========================================

window.getVercelData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/products`); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        console.error("Products Fetch Error:", e);
        return []; 
    }
};

window.getMainProductsData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/main_products`); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        console.error("Main Products Fetch Error:", e);
        return []; 
    }
};

window.getBannersData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/banners`); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        return []; 
    }
};

window.getCategoriesData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/categories`); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        return []; 
    }
};


// ==========================================
// 2. ORDERS LOGIC
// ==========================================
window.sendOrderToVercel = async function(orderPayload) {
    try {
        const response = await fetch(`${AUTH_URL}/api/orders`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(orderPayload) 
        });
        const result = await response.json(); 
        return (response.ok && result.status === "success");
    } catch (error) { 
        return false; 
    }
};


// ==========================================
// 3. PRODUCT REVIEWS LOGIC
// ==========================================
window.saveReviewToDatabase = async function(productId, reviewData) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/add-review`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ productId: productId, review: reviewData }) 
        });
        const result = await response.json(); 
        return result.success;
    } catch (error) { 
        return false; 
    }
};

window.getReviewsFromDatabase = async function(productId) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/get-reviews?productId=${productId}`);
        const result = await response.json(); 
        return (response.ok && result.success) ? result.data : [];
    } catch (error) { 
        return []; 
    }
};


// ==========================================
// 🌟 3.1. GLOBAL EXPERIENCE 🌟
// ==========================================
window.sendToVercelExperience = async function(expData) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/experience`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expData)
        });
        const result = await response.json();
        return (response.ok && result.status === "success");
    } catch (error) {
        console.error("Experience Submit Error:", error);
        return false;
    }
};

window.getVercelExperiences = async function() {
    try {
        const response = await fetch(`${VERCEL_URL}/api/experience`);
        const result = await response.json();
        return (response.ok && result.status === "success" && result.data) ? result.data : [];
    } catch (error) {
        console.error("Experience Fetch Error:", error);
        return [];
    }
};


// ==========================================
// 4. LOGIN & OTP DELIVERY BOY
// ==========================================
window.DeliveryBoy = {
    sendOTP: async function(email, name) {
        try {
            const response = await fetch(`${AUTH_URL}/api/send-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userName: name })
            });
            const data = await response.json(); 
            return { ok: response.ok, data: data };
        } catch (error) { 
            return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; 
        }
    },

    verifyOTP: async function(email, userOtp, name, pwd) {
        try {
            const response = await fetch(`${AUTH_URL}/api/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userOTP: userOtp, userName: name, userPassword: pwd })
            });
            const data = await response.json(); 
            return { ok: response.ok, data: data };
        } catch (error) { 
            return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; 
        }
    },

    login: async function(email, pwd) {
        try {
            const response = await fetch(`${AUTH_URL}/api/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userPassword: pwd })
            });
            const data = await response.json(); 
            return { ok: response.ok, data: data };
        } catch (error) { 
            return { ok: false, data: { success: false, message: 'Auth Server Error!' } }; 
        }
    },

    checkEmailExists: async function(email) {
        try {
            const response = await fetch(`${AUTH_URL}/api/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userPassword: "DUMMY_PASSWORD_CHECK_123" })
            });
            const data = await response.json();
            if (data.message === "Incorrect Password!" || (data.message && data.message.includes("already registered"))) {
                return { exists: true };
            }
            return { exists: false };
        } catch (error) { 
            return { exists: false }; 
        }
    },

    // 🔥 NEW: Real Google Login API Call 🔥
    googleLogin: async function(token) {
        try {
            const response = await fetch(`${AUTH_URL}/api/google-login`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleToken: token })
            });
            const data = await response.json(); 
            return { ok: response.ok, data: data };
        } catch (error) { 
            console.error("Google Login API Error:", error);
            return { ok: false, data: { success: false, message: 'Google Auth Server Error!' } }; 
        }
    }
};
