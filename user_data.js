// ==========================================
// user_data.js (DATA PROVIDER & DELIVERY BOY) - secured version v2
// Saare backend URLs aur API calls sirf yahin hain.
// Security rules:
//   * Price/total kabhi client se trust nahi hota (server banata hai).
//   * Login ke baad server ka signed token 'aavira_token' mein rehta hai.
//   * Login wale customer ke orders: sirf token se (email URL mein kabhi nahi).
//   * Bina login wale customer: sirf Order ID + (email ya phone) se tracking (/api/track).
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
const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

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

// A page may define window.aaviraSessionExpired = () => {...}. Never overwrite that function with a boolean.
if (typeof window.aaviraSessionExpired !== 'function') window.aaviraSessionExpired = false;
function markSessionExpired() {
    if (typeof window.aaviraSessionExpired === 'function') window.aaviraSessionExpired();
    else window.aaviraSessionExpired = true;
}

window.getAaviraToken = function () {
    const token = LS.get('aavira_token') || LS.get('authToken');
    if (!token) return '';
    if (jwtExpired(token)) {
        LS.del('aavira_token');
        LS.del('authToken');
        markSessionExpired();
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
    if (typeof window.aaviraSessionExpired !== 'function') window.aaviraSessionExpired = false;
};

// ==========================================
// 0.2 SAFE UNIVERSAL API FETCH (for checkout & components)
// ==========================================
window.fetchAaviraApi = async function (path, options = {}) {
    const url = path.startsWith('http') ? path : `${VERCEL_URL}${path}`;
    const headers = window.authHeaders(options.headers || {});

    const r = await api(url, { ...options, headers });

    if (r.status === 401 || r.status === 403) {
        markSessionExpired();
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
// 2. ORDERS: LOGGED-IN CUSTOMERS
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

// My Orders: ONLY for a logged-in customer. The server reads the email from the signed token.
// Guests never appear here - they use trackAaviraOrder() / the /track/order page.
window.getAaviraOrdersForCurrentUser = async function () {
    const email = String(LS.get('aavira_user_email') || '').trim().toLowerCase();
    const name = String(LS.get('aavira_display_name') || '').trim();
    const signedIn = !!(email && name && name.toLowerCase() !== 'guest user');
    if (!signedIn) return [];

    const token = window.getAaviraToken();
    if (!token) { markSessionExpired(); return window.getLocalAaviraOrders(); }

    const r = await api(`${VERCEL_URL}/api/orders?nocache=${Date.now()}`, { headers: window.authHeaders() });
    if (r.status === 401 || r.status === 403) {
        LS.del('aavira_token');
        LS.del('authToken');
        markSessionExpired();
        return window.getLocalAaviraOrders();
    }

    if (!(r.ok && r.data && r.data.status === 'success' && Array.isArray(r.data.data))) return [];
    const mine = r.data.data.filter(o => o && o.guest !== true && o.verifiedUser !== false);
    LS.set('aavira_orders', JSON.stringify(mine));
    return mine;
};

// ==========================================
// 2.1 PLACE ORDER (checkout)
// ==========================================
window.placeAaviraOrder = async function (payload) {
    const body = { ...(payload || {}) };
    if (!body.idempotencyKey) body.idempotencyKey = randomKey(); // a double tap can never create two orders
    const r = await jsonPost(`${VERCEL_URL}/api/orders`, body, window.authHeaders());

    if (r.status === 401 || r.status === 403) {
        markSessionExpired();
        return { success: false, message: 'Session expired. Please log in again.' };
    }

    const d = r.data || {};
    if (r.ok && d.status === 'success' && d.orderId) {
        const order = d.order || {};
        // only a logged-in customer's order is cached on the device; a guest order is never stored locally
        if (d.verified && order.orderId) window.syncAaviraOrderLocally(order);
        return {
            success: true,
            orderId: d.orderId,
            orderToken: d.orderToken || '',   // secret code for the guest tracking link
            verified: !!d.verified,           // true = linked to the logged-in account
            order,
            totalAmount: Number(order.totalAmount) || 0
        };
    }
    if (r.status === 0) return { success: false, message: 'Could not reach the server. Please check your internet connection.' };
    return { success: false, message: d.message || d.error || 'Failed to place order' };
};

// Link the customer should open after ordering
window.getOrderPageUrl = function (result) {
    if (result && result.verified) return '/orders';
    const id = encodeURIComponent((result && result.orderId) || '');
    const t = encodeURIComponent((result && result.orderToken) || '');
    return `/track/order?id=${id}` + (t ? `&t=${t}` : '');
};

window.saveAaviraOrderToken = function (orderId, token) {
    if (orderId && token) rememberOrderToken(String(orderId).trim(), String(token).trim());
};

// Legacy support (old pages)
window.sendOrderToVercel = async function (orderPayload) {
    const result = await window.placeAaviraOrder(orderPayload);
    if (result.success) {
        return { orderId: result.orderId, orderToken: result.orderToken, verified: result.verified, order: result.order };
    }
    window.lastOrderError = result.message;
    return null;
};

// ==========================================
// 2.2 ORDER TRACKING FOR CUSTOMERS WITHOUT LOGIN
//     Order ID + (email OR phone)  ->  or Order ID + secret link code
// ==========================================
window.trackAaviraOrder = async function (orderId, contact, linkToken) {
    const id = cleanStr(orderId, 40).toUpperCase().replace(/^#/, '');
    const c = cleanStr(contact, 120);
    const t = cleanStr(linkToken, 100);
    if (!/^AVF-[A-Z0-9]{4,12}$/.test(id)) return { success: false, status: 400, message: 'Enter a valid Order ID (example: AVF-AB12CD34).' };
    if (!t) {
        const okContact = c.includes('@') ? EMAIL_RE.test(c) : c.replace(/\D/g, '').length >= 10;
        if (!okContact) return { success: false, status: 400, message: 'Enter the email or 10-digit phone number used for this order.' };
    }

    // public on purpose: no login header is sent, the server checks Order ID + email/phone itself
    const url = `${VERCEL_URL}/api/track?orderId=${encodeURIComponent(id)}` + (t ? `&token=${encodeURIComponent(t)}` : `&contact=${encodeURIComponent(c)}`);
    const r = await api(url);

    if (r.status === 0) return { success: false, status: 0, message: 'Could not reach the server. Please check your internet connection.' };
    if (r.status === 429) return { success: false, status: 429, message: 'Too many attempts. Please wait a few minutes and try again.' };
    if (r.status === 404) return { success: false, status: 404, message: 'We could not find an order with these details. Please check your Order ID and email or phone number.' };

    const list = r.data && r.data.data;
    if (r.ok && Array.isArray(list) && list[0]) return { success: true, order: list[0] };
    return { success: false, status: r.status, message: (r.data && r.data.message) || 'Could not track the order right now.' };
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
            if (typeof window.aaviraSessionExpired !== 'function') window.aaviraSessionExpired = false;
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
