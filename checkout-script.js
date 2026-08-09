/**
 * ==============================================================================
 * AAVIRA LUXE - MERGED PROFESSIONAL CHECKOUT ENGINE (NO GST)
 * ==============================================================================
 */

// 1. HAPTICS & TOAST NOTIFICATIONS
window.triggerHaptic = function(type = 'light') {
    if (!navigator.vibrate) return;
    if (type === 'light') navigator.vibrate(30);
    else if (type === 'error') navigator.vibrate([60, 40, 60]);
    else if (type === 'success') navigator.vibrate([40, 50, 40]);
};

function showToast(title, message, type = 'error') {
    const toast = document.getElementById('alertToast');
    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastMessage').innerText = message;
    document.getElementById('toastIcon').innerHTML = type === 'error' ? '<i class="fa-solid fa-circle-xmark" style="color:#F87171;"></i>' : '<i class="fa-solid fa-circle-check" style="color:#34D399;"></i>';
    window.triggerHaptic(type);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function parsePrice(val) { return parseInt(String(val).replace(/[^0-9]/g, '')) || 0; }

// 2. MERGED FORM VALIDATION
const validators = {
    ad_email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    ad_phone: { regex: /^[6-9]\d{9}$/ },
    ad_pin: { regex: /^\d{6}$/ }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pro-input').forEach(input => {
        input.addEventListener('input', (e) => {
            if(e.target.id === 'ad_phone' || e.target.id === 'ad_pin') { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
            validateField(e.target); saveDraft();
        });
        input.addEventListener('blur', (e) => validateField(e.target, true));
    });
    restoreDraft();
    initCheckout();
});

function validateField(el, strict = false) {
    if(!el.required && el.value.trim() === '') return true;
    const rule = validators[el.id];
    const wrapper = el.closest('.pro-input-group');
    
    if (rule && rule.regex) {
        if (rule.regex.test(el.value.trim())) { wrapper.classList.remove('is-invalid'); return true; } 
        else { if(strict || el.value.trim().length > 0) wrapper.classList.add('is-invalid'); return false; }
    } else if (el.required) {
        if(el.value.trim().length > 2) { wrapper.classList.remove('is-invalid'); return true; }
        else { if(strict) wrapper.classList.add('is-invalid'); return false; }
    }
    return true;
}

function saveDraft() {
    const draft = {}; document.querySelectorAll('.pro-input').forEach(el => draft[el.id] = el.value);
    localStorage.setItem('aavira_pro_draft', JSON.stringify(draft));
}
function restoreDraft() {
    const draftStr = localStorage.getItem('aavira_pro_draft');
    if (draftStr) { try { const draft = JSON.parse(draftStr); Object.keys(draft).forEach(key => { const el = document.getElementById(key); if (el) { el.value = draft[key]; validateField(el); } }); } catch(e){} }
}

// 3. CHECKOUT & MATH ENGINE (GST REMOVED)
let checkoutItems = []; 
let productDataCache = {}; 
let appliedCode = ""; let discountVal = 0; let deliveryFee = 0; let giftWrapFee = 0;
let selectedPaymentMethod = 'cod';
const VERCEL_URL = "https://aavira-fashion-backend.vercel.app";

async function initCheckout() {
    const storedCart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const buyNowId = new URLSearchParams(window.location.search).get('buy_now');

    if (buyNowId) checkoutItems.push({ productId: buyNowId, size: 'Free Size', qty: 1 });
    else checkoutItems = [...storedCart];

    if (checkoutItems.length === 0) return;

    try {
        if(typeof window.getVercelData === 'function') {
            const allProds = await window.getVercelData();
            checkoutItems.forEach(item => { const p = allProds.find(x => String(x.id) === String(item.productId)); if(p) productDataCache[item.productId] = p; });
        }
    } catch(e) {}
    
    checkoutItems = checkoutItems.filter(i => productDataCache[i.productId]);
    updateUI();
}

window.setDeliverySpeed = function(speed) { window.triggerHaptic(); deliveryFee = speed === 'express' ? 99 : 0; document.querySelectorAll('.speed-option').forEach(el => el.classList.remove('selected')); document.getElementById(speed === 'express' ? 'opt_exp' : 'opt_std').classList.add('selected'); updateUI(); }
window.toggleGiftWrap = function(el) { window.triggerHaptic(); giftWrapFee = el.checked ? 49 : 0; updateUI(); }
window.selectPayment = function(method, el) { window.triggerHaptic(); selectedPaymentMethod = method; document.querySelectorAll('.pay-option').forEach(c => c.classList.remove('selected')); el.classList.add('selected'); }
window.removeCheckoutItem = function(index) { window.triggerHaptic(); checkoutItems.splice(index, 1); updateUI(); }

function updateUI() {
    const container = document.getElementById('orderItemsContainer');
    container.innerHTML = ''; 
    let totalMRP = 0; let subTotal = 0; 

    document.getElementById('itemCountBadge').innerText = `${checkoutItems.length} Item${checkoutItems.length > 1 ? 's' : ''}`;

    checkoutItems.forEach((item, index) => {
        const p = productDataCache[item.productId];
        let cPrice = parsePrice(p.price); let oPrice = p.mrp ? parsePrice(p.mrp) : (cPrice + 450);
        totalMRP += (oPrice * item.qty); subTotal += (cPrice * item.qty);

        container.innerHTML += `
            <div class="o-item">
                <div class="o-img" style="background-image: url('${p.imageMain || p.image || p.imageUrl}');"></div>
                <div class="o-info">
                    <h4>${p.name}</h4>
                    <p>Size: ${item.size} | Qty: ${item.qty}</p>
                    <h3>₹${cPrice.toLocaleString('en-IN')}</h3>
                </div>
                <button class="remove-btn ripple" onclick="window.removeCheckoutItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });

    let prodDiscount = totalMRP - subTotal;
    // GST CALCULATION HAS BEEN COMPLETELY REMOVED
    let grandTotal = Math.max(0, subTotal + deliveryFee + giftWrapFee - discountVal);
    let totalSavings = prodDiscount + discountVal;

    document.getElementById('billMrp').innerText = `₹${totalMRP.toLocaleString('en-IN')}`;
    document.getElementById('billDiscount').innerText = `-₹${prodDiscount.toLocaleString('en-IN')}`;
    
    const delRow = document.getElementById('row_delivery');
    if(deliveryFee > 0) { delRow.querySelector('span:last-child').innerText = `₹${deliveryFee}`; delRow.querySelector('span:last-child').classList.remove('highlight-green'); }
    else { delRow.querySelector('span:last-child').innerText = `FREE`; delRow.querySelector('span:last-child').classList.add('highlight-green'); }
    
    document.getElementById('row_gift').style.display = giftWrapFee > 0 ? 'flex' : 'none';

    if(discountVal > 0) { document.getElementById('billPromoRow').style.display = 'flex'; document.getElementById('billPromoDiscount').innerText = `-₹${discountVal}`; } 
    else { document.getElementById('billPromoRow').style.display = 'none'; }

    if(totalSavings > 0) { document.getElementById('totalSavingsBadge').style.display = 'block'; document.getElementById('totalSavingsBadge').innerText = `You are saving ₹${totalSavings.toLocaleString('en-IN')} on this order!`; }
    else { document.getElementById('totalSavingsBadge').style.display = 'none'; }

    document.getElementById('billTotal').innerText = `₹${grandTotal.toLocaleString('en-IN')}`;
    document.getElementById('bottomTotal').innerText = `₹${grandTotal.toLocaleString('en-IN')}`;
}

// 4. API INTEGRATIONS (PROMO WITH SPINNER)
window.applyPromo = async function() {
    window.triggerHaptic(); 
    const input = document.getElementById('promoInput'); 
    const code = input.value.trim().toUpperCase();
    if(!code) return showToast("Empty Code", "Please enter a valid coupon.", "error");
    
    const btn = document.getElementById('promoBtn');
    
    // START PREMIUM SPINNER ANIMATION
    btn.innerHTML = `<span class="btn-spinner"></span>`;
    btn.disabled = true;

    try {
        const res = await fetch(`${VERCEL_URL}/api/promocodes/${code}`); 
        const result = await res.json();
        if(res.ok && result.status === "success") {
            appliedCode = result.data.id || code; 
            discountVal = Number(result.data.discountAmount) || 0; 
            document.getElementById('promoInputGroup').style.display = 'none'; 
            document.getElementById('apCodeName').innerText = appliedCode; 
            document.getElementById('appliedPromoBox').style.display = 'flex';
            showToast("Offer Applied", `Saved ₹${discountVal}`, "success"); 
            updateUI(); 
        } else {
            showToast("Invalid", "Coupon is invalid.", "error");
        }
    } catch(e) { 
        showToast("Network Error", "Could not verify coupon.", "error"); 
    }
    
    // RESTORE BUTTON STATE
    btn.innerHTML = 'Apply';
    btn.disabled = false;
}

window.removePromo = function() { window.triggerHaptic(); appliedCode = ""; discountVal = 0; document.getElementById('promoInput').value = ''; document.getElementById('promoInputGroup').style.display = 'flex'; document.getElementById('appliedPromoBox').style.display = 'none'; updateUI(); }

window.autoFetchLocation = function() {
    window.triggerHaptic(); showToast("Fetching", "Locating securely...", "success");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                if (data && data.address) {
                    document.getElementById('ad_pin').value = data.address.postcode || ""; validateField(document.getElementById('ad_pin'));
                    document.getElementById('ad_city').value = data.address.city || data.address.town || ""; validateField(document.getElementById('ad_city'));
                    document.getElementById('ad_address').value = `${data.address.road||''} ${data.address.suburb||''}`.trim(); validateField(document.getElementById('ad_address'));
                    saveDraft();
                }
            } catch (e) { showToast("API Error", "Location mapping failed.", "error"); }
        }, () => showToast("Denied", "Please enable GPS.", "error"));
    }
}

// 5. PLACE ORDER
window.placeOrder = async function() {
    window.triggerHaptic('light');
    const reqIds = ['ad_name', 'ad_email', 'ad_phone', 'ad_pin', 'ad_city', 'ad_address'];
    let valid = true;
    reqIds.forEach(id => { const el = document.getElementById(id); if(!validateField(el, true)) { el.closest('.pro-input-group').classList.add('is-invalid'); valid = false; } });

    if(!valid) {
        showToast("Incomplete Details", "Please fill required fields (marked red).", "error");
        document.querySelector('.is-invalid').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const modal = document.getElementById('processModal'); const gateway = document.getElementById('gatewayBox');
    modal.classList.add('show'); gateway.style.display = 'block'; document.getElementById('successBox').style.display = 'none';

    await new Promise(r => setTimeout(r, 1500)); // Process Simulation

    try {
        // Assume API Success
        localStorage.removeItem('aavira_pro_draft');
        window.triggerHaptic('success');
        document.getElementById('displayOrderId').innerText = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        gateway.style.display = 'none'; document.getElementById('successBox').style.display = 'block'; 
    } catch(e) { modal.classList.remove('show'); showToast("Failed", "Server Error.", "error"); }
}
