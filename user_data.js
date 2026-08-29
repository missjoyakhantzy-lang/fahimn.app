// =========================================================
// AAVIRA LUXE - DATA PROVIDER & DELIVERY BOY (user_data.js)
// =========================================================

// 🔥 1. MAIN BACKEND URL (Products, Orders, Banners, Reviews) 🔥
const VERCEL_URL = "https://server-js-psi-five.vercel.app";

// 🔥 2. AUTH BACKEND URL (Login, Send OTP, Verify OTP) 🔥
const AUTH_URL = "https://ssxpq15in.vercel.app";

// 🔑 3. SECURE SECRET KEY (Unauthorized Access Block Karne Ke Liye) 🔑
const AAVIRA_SECRET_KEY = "AAVIRA_LUXE_SECURE_AUTH_2026_PROD";

// Common Secure Headers Helper
const getSecureHeaders = (customHeaders = {}) => {
    return {
        'Content-Type': 'application/json',
        'x-aavira-secret': AAVIRA_SECRET_KEY,
        ...customHeaders
    };
};


// =========================================================
// 1. PRODUCTS & STORE UI DATA (VERCEL_URL)
// =========================================================

// 👉 Normal Products Fetcher
window.getVercelData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/products`, {
            headers: getSecureHeaders()
        }); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        console.error("Products Fetch Error:", e);
        return []; 
    }
};

// 👉 Main Products Fetcher (Single Product Pages)
window.getMainProductsData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/main_products`, {
            headers: getSecureHeaders()
        }); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        console.error("Main Products Fetch Error:", e);
        return []; 
    }
};

// 👉 Banners Fetcher
window.getBannersData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/banners`, {
            headers: getSecureHeaders()
        }); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        return []; 
    }
};

// 👉 Categories Fetcher
window.getCategoriesData = async function() {
    try { 
        const res = await fetch(`${VERCEL_URL}/api/categories`, {
            headers: getSecureHeaders()
        }); 
        const data = await res.json(); 
        return (res.ok && data.status === "success") ? data.data : []; 
    } catch (e) { 
        return []; 
    }
};


// =========================================================
// 2. ORDERS ENGINE (VERCEL_URL - MAIN SERVER)
// =========================================================

// 👉 Naya Order Database me Save karna
window.sendOrderToVercel = async function(orderPayload) {
    try { 
        const response = await fetch(`${VERCEL_URL}/api/orders`, { 
            method: 'POST', 
            headers: getSecureHeaders(), 
            body: JSON.stringify(orderPayload) 
        });
        const result = await response.json(); 
        return (response.ok && result.status === "success");
    } catch (error) { 
        console.error("Order Submit Error:", error);
        return false; 
    }
};

// 👉 User Orders Fetch karna (tcc.js ke liye)
window.getOrdersFromVercel = async function(phone = '', email = '') {
    try {
        let url = `${VERCEL_URL}/api/orders?nocache=${new Date().getTime()}`;
        if (phone) url += `&phone=${encodeURIComponent(phone)}`;
        else if (email) url += `&email=${encodeURIComponent(email)}`;

        const response = await fetch(url, {
            headers: getSecureHeaders()
        });
        const result = await response.json(); 
        return (response.ok && result.status === "success" && Array.isArray(result.data)) ? result.data : [];
    } catch (error) { 
        console.error("Orders Fetch Error:", error);
        return []; 
    }
};


// =========================================================
// 3. REVIEWS ENGINE (VERCEL_URL)
// =========================================================
window.saveReviewToDatabase = async function(productId, reviewData) {
    try { 
        const response = await fetch(`${VERCEL_URL}/api/add-review`, { 
            method: 'POST', 
            headers: getSecureHeaders(), 
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
        const response = await fetch(`${VERCEL_URL}/api/get-reviews?productId=${productId}`, {
            headers: getSecureHeaders()
        });
        const result = await response.json(); 
        return (response.ok && result.success) ? result.data : [];
    } catch (error) { 
        return []; 
    }
};


// =========================================================
// 4. LOGIN & OTP DELIVERY BOY (AUTH_URL)
// =========================================================
window.DeliveryBoy = {
    sendOTP: async function(email, name) {
        try { 
            const response = await fetch(`${AUTH_URL}/api/send-otp`, {
                method: 'POST', 
                headers: getSecureHeaders(),
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
                method: 'POST', 
                headers: getSecureHeaders(),
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
                method: 'POST', 
                headers: getSecureHeaders(),
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
                method: 'POST', 
                headers: getSecureHeaders(),
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

    googleLogin: async function() {
        return new Promise((resolve) => { 
            setTimeout(() => { 
                resolve({ success: true, userName: "Google User", email: "user@gmail.com" }); 
            }, 1000); 
        });
    }
};
