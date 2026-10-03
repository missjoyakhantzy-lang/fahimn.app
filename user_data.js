// ==========================================
// user_data.js (DATA PROVIDER & DELIVERY BOY)
// Saare backend URLs aur API calls sirf yahin hain. index.html mein koi URL nahi hai.
// ==========================================

// 🔥 1. PRODUCTS, MAIN PRODUCTS, BANNERS, CATEGORIES, PROMO, REVIEWS, NEWSLETTER KE LIYE URL 🔥
const VERCEL_URL = "https://server-js-psi-five.vercel.app";

// 🔥 2. OTP, LOGIN AUR AUTH KE LIYE NAYA URL 🔥
const AUTH_URL = "https://ssxpq15in.vercel.app";

// 🔥 3. REVIEW PHOTO UPLOAD (Cloudinary) 🔥
const CLOUDINARY_CLOUD = "lqbslpty";
const CLOUDINARY_PRESET = "hcfer3tk";

// ==========================================
// 1. DATA FETCHING (Products, Main Products, Banners, Categories)
// ==========================================
window.getVercelData = async function() {
    try {
        const res = await fetch(`${VERCEL_URL}/api/products`);
        const data = await res.json();
        return (res.ok && data.status === "success") ? data.data : [];
    } catch (e) { console.error("Products Fetch Error:", e); return []; }
};

window.getMainProductsData = async function() {
    try {
        const res = await fetch(`${VERCEL_URL}/api/main_products`);
        const data = await res.json();
        return (res.ok && data.status === "success") ? data.data : [];
    } catch (e) { console.error("Main Products Fetch Error:", e); return []; }
};

window.getBannersData = async function() {
    try {
        const res = await fetch(`${VERCEL_URL}/api/banners`);
        const data = await res.json();
        return (res.ok && data.status === "success") ? data.data : [];
    } catch (e) { return []; }
};

window.getCategoriesData = async function() {
    try {
        const res = await fetch(`${VERCEL_URL}/api/categories`);
        const data = await res.json();
        return (res.ok && data.status === "success") ? data.data : [];
    } catch (e) { return []; }
};

// ==========================================
// 1.1. SHARED PROMO CODE API
// ==========================================
window.checkPromoCode = async function(code) {
    // index.html expects this helper to return the API URL.
    // The caller performs fetch() and reads the JSON response itself.
    const rawCode = String(code || '').trim();
    if (!rawCode) return null;

    let cleanCode = rawCode;
    try { cleanCode = decodeURIComponent(rawCode); } catch (e) {}
    cleanCode = cleanCode.trim().toUpperCase();
    if (!cleanCode) return null;

    // Promo codes use the MAIN API backend, not the authentication server.
    return `${VERCEL_URL}/api/promocodes/${encodeURIComponent(cleanCode)}`;
};

// ==========================================
// 1.2. NEWSLETTER SUBSCRIBE
// Returns { ok: boolean, message: string }
// ==========================================
window.subscribeNewsletterApi = async function(email) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        let result = null;
        try { result = await response.json(); } catch (e) {}
        if (response.ok && result && result.status === "success") return { ok: true, message: result.message || 'Subscribed' };
        console.error("Newsletter Error:", response.status, result);
        return { ok: false, message: (result && result.message) || 'Could not subscribe. Please try again.' };
    } catch (error) {
        console.error("Newsletter Error:", error);
        return { ok: false, message: 'Could not reach the server. Please try again.' };
    }
};

// ==========================================
// 2. ORDERS LOGIC
// ==========================================
window.getLocalAaviraOrders = function() {
    try {
        const raw = localStorage.getItem('aavira_orders');
        const orders = raw ? JSON.parse(raw) : [];
        return Array.isArray(orders) ? orders : [];
    } catch (e) { return []; }
};

window.syncAaviraOrderLocally = function(orderPayload) {
    try {
        if (!orderPayload || !orderPayload.orderId) return false;
        const email = String(orderPayload.email || orderPayload.customerEmail || '').trim().toLowerCase();
        const phone = String(orderPayload.phone || orderPayload.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
        const currentEmail = String(localStorage.getItem('aavira_user_email') || '').trim().toLowerCase();
        const currentPhone = String(localStorage.getItem('aavira_user_phone') || '').replace(/[^0-9]/g, '').slice(-10);
        const currentName = String(localStorage.getItem('aavira_display_name') || '').trim();
        const signedIn = !!(currentEmail && currentName && currentName.toLowerCase() !== 'guest user');
        if (signedIn && email && email !== currentEmail && (!phone || phone !== currentPhone)) return false;
        const id = String(orderPayload.orderId).trim();
        const normalized = { ...orderPayload, id: orderPayload.id || id, orderId: id, totalAmount: Number(orderPayload.totalAmount ?? orderPayload.total ?? orderPayload.amount ?? 0) || 0, userId: orderPayload.userId || email || phone };
        let orders = window.getLocalAaviraOrders().filter(order => {
            const oEmail = String(order?.email || order?.customerEmail || '').trim().toLowerCase();
            const oPhone = String(order?.phone || order?.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
            if (signedIn) return (!!currentEmail && oEmail === currentEmail) || (!!currentPhone && oPhone === currentPhone);
            return String(order?.orderId || order?.id || '').trim() === id;
        });
        const index = orders.findIndex(order => String(order?.orderId || order?.id || '').trim() === id);
        if (index >= 0) orders[index] = { ...orders[index], ...normalized }; else orders.unshift(normalized);
        localStorage.setItem('aavira_orders', JSON.stringify(orders));
        localStorage.setItem('aavira_last_order_id', id);
        return true;
    } catch (e) { console.error('Local Order Sync Error:', e); return false; }
};

window.getAaviraOrdersForCurrentUser = async function() {
    try {
        const email = String(localStorage.getItem('aavira_user_email') || '').trim().toLowerCase();
        const name = String(localStorage.getItem('aavira_display_name') || '').trim();
        const phone = String(localStorage.getItem('aavira_user_phone') || '').replace(/[^0-9]/g, '').slice(-10);
        const signedIn = !!(email && name && name.toLowerCase() !== 'guest user');
        if (!signedIn && !localStorage.getItem('aavira_guest_order_id')) return [];
        let url = `${VERCEL_URL}/api/orders?nocache=${Date.now()}`;
        if (signedIn) { if (email) url += `&email=${encodeURIComponent(email)}`; else if (phone) url += `&phone=${encodeURIComponent(phone)}`; }
        else url += `&orderId=${encodeURIComponent(localStorage.getItem('aavira_guest_order_id'))}`;
        const response = await fetch(url); const result = await response.json();
        if (!response.ok || result.status !== 'success' || !Array.isArray(result.data)) return [];
        const filtered = result.data.filter(order => {
            const oEmail = String(order?.email || order?.customerEmail || '').trim().toLowerCase();
            const oPhone = String(order?.phone || order?.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
            const oId = String(order?.orderId || order?.id || '').trim();
            if (signedIn) return (!!email && oEmail === email) || (!!phone && oPhone === phone);
            return oId === String(localStorage.getItem('aavira_guest_order_id') || '').trim();
        });
        localStorage.setItem('aavira_orders', JSON.stringify(filtered)); return filtered;
    } catch (error) { console.error('Current User Order Sync Error:', error); return []; }
};

window.sendOrderToVercel = async function(orderPayload) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
        const result = await response.json(); const saved = response.ok && result.status === "success";
        if (saved) window.syncAaviraOrderLocally(orderPayload); return saved;
    } catch (error) { console.error("Order Save Error:", error); return false; }
};

// ==========================================
// 3. PRODUCT REVIEWS LOGIC
// ==========================================
window.saveReviewToDatabase = async function(productId, reviewData) {
    try { const response = await fetch(`${VERCEL_URL}/api/add-review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, review: reviewData }) }); const result = await response.json(); return result.success; }
    catch (error) { return false; }
};

window.getReviewsFromDatabase = async function(productId) {
    try { const response = await fetch(`${VERCEL_URL}/api/get-reviews?productId=${productId}`); const result = await response.json(); return (response.ok && result.success) ? result.data : []; }
    catch (error) { return []; }
};

// Review photo ko Cloudinary par upload karta hai. Success par photo ka https URL deta hai, warna ''.
window.uploadExperiencePhoto = async function(file) {
    try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_PRESET);
        fd.append('cloud_name', CLOUDINARY_CLOUD);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
        const result = await response.json();
        return result.secure_url || '';
    } catch (error) { console.error("Photo Upload Error:", error); return ''; }
};

window.sendToVercelExperience = async function(expData) {
    try { const response = await fetch(`${VERCEL_URL}/api/experience`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expData) }); const result = await response.json(); return response.ok && result.status === "success"; }
    catch (error) { console.error("Experience Submit Error:", error); return false; }
};

// Safe version: server JSON ki jagah HTML/khaali response de to bhi page crash nahi hoga.
window.getVercelExperiences = async function() {
    try {
        const response = await fetch(`${VERCEL_URL}/api/experience`);
        const text = await response.text();
        if (!response.ok) { console.error("Experience Fetch Error: HTTP", response.status); return []; }
        if (!text.trim()) return [];
        const result = JSON.parse(text);
        return (result.status === "success" && Array.isArray(result.data)) ? result.data : [];
    } catch (error) { console.error("Experience Fetch Error:", error.message); return []; }
};

// ==========================================
// 4. LOGIN & OTP DELIVERY BOY
// ==========================================
window.DeliveryBoy = {
    sendOTP: async function(email, name) { try { const response = await fetch(`${AUTH_URL}/api/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userEmail:email,userName:name}) }); const data=await response.json(); return {ok:response.ok,data}; } catch(error){ return {ok:false,data:{success:false,message:'Auth Server Error!'}}; } },
    verifyOTP: async function(email, userOtp, name, pwd) { try { const response=await fetch(`${AUTH_URL}/api/verify-otp`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userEmail:email,userOTP:userOtp,userName:name,userPassword:pwd})}); const data=await response.json(); return {ok:response.ok,data}; } catch(error){ return {ok:false,data:{success:false,message:'Auth Server Error!'}}; } },
    login: async function(email,pwd) { try { const response=await fetch(`${AUTH_URL}/api/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userEmail:email,userPassword:pwd})}); const data=await response.json(); return {ok:response.ok,data}; } catch(error){ return {ok:false,data:{success:false,message:'Auth Server Error!'}}; } },
    checkEmailExists: async function(email) { try { const response=await fetch(`${AUTH_URL}/api/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userEmail:email,userPassword:"DUMMY_PASSWORD_CHECK_123"})}); const data=await response.json(); if(data.message==="Incorrect Password!"||(data.message&&data.message.includes("already registered"))) return {exists:true}; return {exists:false}; } catch(error){ return {exists:false}; } },
    googleLogin: async function(token) { try { const response=await fetch(`${AUTH_URL}/api/google-login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({googleToken:token})}); const data=await response.json(); return {ok:response.ok,data}; } catch(error){ console.error("Google Login API Error:",error); return {ok:false,data:{success:false,message:'Google Auth Server Error!'}}; } }
};

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