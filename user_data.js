// ==========================================
// user_data.js (DATA PROVIDER & DELIVERY BOY) - secured version
// Saare backend URLs aur API calls sirf yahin hain.
// Security rules:
//   * Price/total kabhi client se trust nahi hota (server banata hai).
//   * Login ke baad server ka signed token 'aavira_token' mein rehta hai.
//   * Har request timeout ke saath, aur response safe tareeke se parse hota hai.
// ==========================================

const VERCEL_URL = "https://server-js-psi-five.vercel.app";   // products, orders, promo, reviews, addresses
const AUTH_URL = "https://ssxpq15in.vercel.app";               // OTP, login, google, reset password
const CLOUDINARY_CLOUD = "lqbslpty";
const CLOUDINARY_PRESET = "hcfer3tk";

(function () {
'use strict';

// ==========================================
// 0. SAFE HELPERS
// ==========================================
const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    json(k, fallback) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; } catch (e) { return fallback; } }
};

async function api(url, options = {}, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: ctrl.signal });
        let data = null;
        try { data = await response.json(); } catch (e) {}
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        return { ok: false, status: 0, data: null, error };
    } finally { clearTimeout(timer); }
}

const jsonPost = (url, body, headers) => api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: JSON.stringify(body)
});

const isSuccess = r => !!(r && r.ok && r.data && (r.data.status === 'success' || r.data.success === true));
const cleanStr = (v, max) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/;

// ==========================================
// 0.1 SESSION TOKEN & HEADERS
// ==========================================
function jwtExpired(token) {
    try {
        const part = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(part));
        return !payload.exp || payload.exp * 1000 < Date.now() + 30000;
    } catch (e) { return true; }
}

window.aaviraSessionExpired = false;

window.getAaviraToken = function () {
    const token = LS.get('aavira_token') || LS.get('authToken');
    if (!token) return '';
    if (jwtExpired(token)) { 
        LS.del('aavira_token'); 
        LS.del('authToken'); 
        window.aaviraSessionExpired = true; 
        return ''; 
    }
    return token;
};

window.authHeaders = function (extra) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    const token = window.getAaviraToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
};

const ORDER_TOKEN_PREFIX = 'aavira_order_token_';
function rememberOrderToken(orderId, token) {
    if (!orderId || !token) return;
    LS.set(ORDER_TOKEN_PREFIX + orderId, token);
    const ids = LS.json('aavira_order_token_ids', []).filter(x => x !== orderId);
    ids.push(orderId);
    while (ids.length > 20) LS.del(ORDER_TOKEN_PREFIX + ids.shift());
    LS.set('aavira_order_token_ids', JSON.stringify(ids));
}

function clearCachedOrders() {
    ['aavira_orders', 'aavira_placed_orders', 'aavira_last_order_id', 'aavira_guest_order_id'].forEach(LS.del);
    LS.json('aavira_order_token_ids', []).forEach(id => LS.del(ORDER_TOKEN_PREFIX + id));
    LS.del('aavira_order_token_ids');
}

window.clearAaviraSession = function () {
    ['authToken', 'aavira_token', 'aavira_user_email', 'aavira_display_name', 'aavira_user_phone'].forEach(LS.del);
    clearCachedOrders();
    window.aaviraSessionExpired = false;
};

// ==========================================
// 0.2 SAFE UNIVERSAL API FETCH (for checkout & components)
// ==========================================
window.fetchAaviraApi = async function (path, options = {}) {
    const url = path.startsWith('http') ? path : `${VERCEL_URL}${path}`;
    const headers = window.authHeaders(options.headers || {});
    
    const r = await api(url, { ...options, headers });
    
    if (r.status === 401 || r.status === 403) {
        if (typeof window.aaviraSessionExpired === 'function') window.aaviraSessionExpired();
        return { success: false, message: 'Session expired' };
    }
    
    const payloadData = r.data?.data || r.data;
    return {
        success: r.ok && (r.data?.status === 'success' || r.data?.success || r.status === 200),
        data: payloadData,
        message: r.data?.message || r.data?.error || ''
    };
};

// ==========================================
// 1. DATA FETCHING (public catalog)
// ==========================================
const listData = async path => {
    const r = await window.fetchAaviraApi(path);
    return (r.success && Array.isArray(r.data)) ? r.data : [];
};
window.getVercelData = () => listData('/api/products');
window.getMainProductsData = () => listData('/api/main_products');
window.getBannersData = () => listData('/api/banners');
window.getCategoriesData = () => listData('/api/categories');

window.checkPromoCode = async function (code) {
    let clean = String(code || '').trim();
    try { clean = decodeURIComponent(clean); } catch (e) {}
    clean = clean.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(clean)) return null;
    return `${VERCEL_URL}/api/promocodes/${encodeURIComponent(clean)}`;
};

window.subscribeNewsletterApi = async function (email) {
    const clean = cleanStr(email, 120).toLowerCase();
    if (!EMAIL_RE.test(clean)) return { ok: false, message: 'Enter a valid email address.' };
    const r = await jsonPost(`${VERCEL_URL}/api/subscribe`, { email: clean });
    if (isSuccess(r)) return { ok: true, message: r.data.message || 'Subscribed' };
    return { ok: false, message: (r.data && r.data.message) || 'Could not subscribe. Please try again.' };
};

// ==========================================
// 2. ORDERS LOGIC & CHECKOUT
// ==========================================
window.getLocalAaviraOrders = function () {
    const orders = LS.json('aavira_orders', []);
    return Array.isArray(orders) ? orders : [];
};

window.syncAaviraOrderLocally = function (orderPayload) {
    try {
        if (!orderPayload || !orderPayload.orderId) return false;
        const id = String(orderPayload.orderId).trim();
        const normalized = { 
            ...orderPayload, 
            id: orderPayload.id || id, 
            orderId: id, 
            totalAmount: Number(orderPayload.totalAmount ?? orderPayload.total ?? orderPayload.amount ?? 0) || 0 
        };
        
        let orders = window.getLocalAaviraOrders();
        const index = orders.findIndex(order => String(order?.orderId || order?.id || '').trim() === id);
        
        if (index >= 0) orders[index] = { ...orders[index], ...normalized }; 
        else orders.unshift(normalized);
        
        LS.set('aavira_orders', JSON.stringify(orders.slice(0, 50)));
        LS.set('aavira_last_order_id', id);
        return true;
    } catch (e) { return false; }
};

window.getAaviraOrdersForCurrentUser = async function () {
    const email = String(LS.get('aavira_user_email') || '').trim().toLowerCase();
    const name = String(LS.get('aavira_display_name') || '').trim();
    const signedIn = !!(email && name && name.toLowerCase() !== 'guest user');
    const token = window.getAaviraToken();
    const useJwt = signedIn && !!token;
    const guestId = String(LS.get('aavira_guest_order_id') || '').trim();

    if (!useJwt && !guestId) {
        if (signedIn) { window.aaviraSessionExpired = true; return window.getLocalAaviraOrders(); }
        return [];
    }

    const headers = window.authHeaders();
    let url = `${VERCEL_URL}/api/orders?nocache=${Date.now()}`;
    if (!useJwt) {
        url += `&orderId=${encodeURIComponent(guestId)}`;
        const orderToken = LS.get(ORDER_TOKEN_PREFIX + guestId);
        if (orderToken) headers['X-Order-Token'] = orderToken;
    }

    const r = await api(url, { headers });
    if (r.status === 401 || r.status === 403) {
        if (useJwt) { 
            LS.del('aavira_token'); 
            LS.del('authToken');
            window.aaviraSessionExpired = true; 
            return window.getLocalAaviraOrders(); 
        }
        return [];
    }
    
    if (!(r.ok && r.data && r.data.status === 'success' && Array.isArray(r.data.data))) return [];
    LS.set('aavira_orders', JSON.stringify(r.data.data));
    return r.data.data;
};

// --- NEW CHECKOUT PLACEMENT SYSTEM ---
window.placeAaviraOrder = async function (payload) {
    const r = await jsonPost(`${VERCEL_URL}/api/orders`, payload, window.authHeaders());
    
    if (r.status === 401 || r.status === 403) {
        if (typeof window.aaviraSessionExpired === 'function') window.aaviraSessionExpired();
        return { success: false, message: 'Session expired. Please log in again.' };
    }

    if (r.ok && (r.data?.orderId || r.data?.status === 'success' || r.data?.data?.orderId)) {
        const responseData = r.data.data || r.data;
        if (responseData.order) window.syncAaviraOrderLocally(responseData.order);
        
        return {
            success: true,
            orderId: responseData.orderId,
            orderToken: responseData.orderToken
        };
    }
    
    return { success: false, message: r.data?.message || r.data?.error || 'Failed to place order' };
};

window.saveAaviraOrderToken = function (orderId, token) {
    if (orderId && token) rememberOrderToken(String(orderId).trim(), String(token).trim());
};

// Legacy support
window.sendOrderToVercel = async function (orderPayload) {
    const result = await window.placeAaviraOrder(orderPayload);
    if (result.success) {
        if (result.orderToken) window.saveAaviraOrderToken(result.orderId, result.orderToken);
        return { orderId: result.orderId, orderToken: result.orderToken, order: orderPayload };
    }
    window.lastOrderError = result.message;
    return null;
};

// ==========================================
// 3. PRODUCT REVIEWS & EXPERIENCE LOGIC
// ==========================================
window.saveReviewToDatabase = async function (productId, reviewData) {
    const r = await jsonPost(`${VERCEL_URL}/api/add-review`, { productId: cleanStr(productId, 100), review: reviewData }, window.authHeaders());
    return !!(r.data && r.data.success);
};

window.getReviewsFromDatabase = async function (productId) {
    const r = await window.fetchAaviraApi(`/api/get-reviews?productId=${encodeURIComponent(cleanStr(productId, 100))}`);
    return r.success && Array.isArray(r.data) ? r.data : [];
};

const PHOTO_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/i;
window.uploadExperiencePhoto = async function (file) {
    if (!file || !PHOTO_TYPES.test(file.type || '') || file.size > 8 * 1024 * 1024) return '';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    fd.append('cloud_name', CLOUDINARY_CLOUD);
    const r = await api(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd }, 60000);
    const url = r.data && r.data.secure_url;
    return (typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')) ? url : '';
};

window.sendToVercelExperience = async function (expData) {
    const e = expData || {};
    const r = await jsonPost(`${VERCEL_URL}/api/experience`, {
        name: cleanStr(e.name, 60), email: cleanStr(e.email, 120).toLowerCase(),
        text: cleanStr(e.text, 500), photo: cleanStr(e.photo, 500),
        rating: Math.max(1, Math.min(5, Number(e.rating) || 5)), date: cleanStr(e.date, 40)
    }, window.authHeaders());
    return isSuccess(r);
};

window.getVercelExperiences = async function () {
    const r = await window.fetchAaviraApi('/api/experience');
    return r.success && Array.isArray(r.data) ? r.data : [];
};

// ==========================================
// 4. LOGIN & OTP DELIVERY BOY (Auth Server)
// ==========================================
window.DeliveryBoy = (function () {
    const post = async (path, body, errMsg) => {
        const r = await jsonPost(`${AUTH_URL}${path}`, body);
        if (r.status === 0 || !r.data) return { ok: false, data: { success: false, message: errMsg || 'Auth Server Error!' } };
        const data = r.data;
        if (data.authToken) {
            const prev = String(LS.get('aavira_user_email') || '').toLowerCase();
            const next = String(data.email || '').toLowerCase();
            if (prev && next && prev !== next) clearCachedOrders();
            LS.set('aavira_token', data.authToken);
            LS.set('authToken', data.authToken);
            window.aaviraSessionExpired = false;
            delete data.authToken;
        }
        return { ok: r.ok, data };
    };
    
    return Object.freeze({
        sendOTP: (email, name) => post('/api/send-otp', { userEmail: email, userName: name }),
        verifyOTP: (email, userOtp, name, pwd) => post('/api/verify-otp', { userEmail: email, userOTP: userOtp, userName: name, userPassword: pwd }),
        login: (email, pwd) => post('/api/login', { userEmail: email, userPassword: pwd }),
        googleLogin: token => post('/api/google-login', { googleToken: token }, 'Google Auth Server Error!'),
        sendPasswordResetOTP: email => post('/api/send-reset-otp', { userEmail: email }),
        resetPassword: (email, otp, newPwd) => post('/api/update-password', { userEmail: email, userOTP: otp, newPassword: newPwd }),
        checkEmailExists: async email => {
            const r = await post('/api/email-exists', { userEmail: email });
            return { exists: !!(r.data && r.data.exists) };
        }
    });
})();

})();

// ==========================================
// 5. HOME PREMIUM TEXT MOTION
// ==========================================
(function initAaviraPremiumTextMotion(){
    const items = [
        'PREMIUM ETHNIC WEAR',
        'CRAFTED FOR ELEGANCE',
        'NEW COLLECTION 2026',
        'ELEGANCE IN EVERY DETAIL'
    ];

    function mount(){
        if (!document.body || document.querySelector('.aavira-premium-text')) return;
        const hero = document.querySelector('.hero');
        if (!hero || !hero.parentNode) return;

        const section = document.createElement('section');
        section.className = 'aavira-premium-text';
        section.setAttribute('aria-label','Aavira Fashion highlights');
        section.innerHTML = items.map((text,index)=>
            `<div class="aavira-premium-line ${index % 2 ? 'from-left' : 'from-right'}"><span>${text}</span></div>`
        ).join('');

        const style = document.createElement('style');
        style.textContent = `
.aavira-premium-text{margin:18px 16px 0;padding:4px 0 2px;overflow:hidden}
.aavira-premium-line{height:38px;display:flex;align-items:center;overflow:hidden;white-space:nowrap;font-family:"Playfair Display",serif;font-size:14px;font-weight:600;letter-spacing:1.7px;color:#242024;text-transform:uppercase;opacity:0;will-change:transform,opacity}
.aavira-premium-line span{display:inline-block;padding:0 2px}
.aavira-premium-line.from-right{justify-content:flex-end;transform:translateX(105%)}
.aavira-premium-line.from-left{justify-content:flex-start;transform:translateX(-105%)}
.aavira-premium-line.is-visible{animation:aaviraTextSlide .75s cubic-bezier(.2,.8,.2,1) forwards}
.aavira-premium-line.from-left.is-visible{animation-name:aaviraTextSlideLeft}
@keyframes aaviraTextSlide{to{transform:translateX(0);opacity:1}}
@keyframes aaviraTextSlideLeft{to{transform:translateX(0);opacity:1}}
@media (prefers-reduced-motion:reduce){.aavira-premium-line{opacity:1!important;transform:none!important;animation:none!important}}
`;
        document.head.appendChild(style);
        hero.parentNode.insertBefore(section,hero.nextSibling);

        const lines = section.querySelectorAll('.aavira-premium-line');
        if ('IntersectionObserver' in window){
            const observer = new IntersectionObserver((entries,obs)=>{
                entries.forEach(entry=>{
                    if(entry.isIntersecting){
                        lines.forEach((line,index)=>setTimeout(()=>line.classList.add('is-visible'),index*110));
                        obs.disconnect();
                    }
                });
            },{threshold:.18});
            observer.observe(section);
        } else {
            lines.forEach((line,index)=>setTimeout(()=>line.classList.add('is-visible'),index*110));
        }
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
    else mount();
})();
