<script>
window.triggerHaptic = function(type = 'light') {
    try {
        if (!navigator.vibrate) return;
        if (type === 'light') navigator.vibrate(30);
        else if (type === 'error') navigator.vibrate([60, 40, 60]);
        else if (type === 'success') navigator.vibrate([40, 50, 40]);
    } catch(e) {}
};

window.showToast = function(title, message, type = 'error') {
    const toast = document.getElementById('alertToast');
    if(!toast) return;
    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastMessage').innerText = message;
    document.getElementById('toastIcon').innerHTML = type === 'error' ? '<i class="fa-solid fa-circle-xmark" style="color:#F87171;"></i>' : '<i class="fa-solid fa-circle-check" style="color:#34D399;"></i>';
    window.triggerHaptic(type);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function parsePrice(val) { 
    if(!val) return 0;
    return parseInt(String(val).replace(/[^0-9]/g, '')) || 0; 
}

const validators = {
    ad_email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    ad_phone: { regex: /^[6-9]\d{9}$/ },
    ad_pin: { regex: /^\d{6}$/ }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        document.querySelectorAll('.pro-input').forEach(input => {
            input.addEventListener('input', (e) => {
                if(e.target.id === 'ad_phone' || e.target.id === 'ad_pin') { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
                validateField(e.target); saveDraft();
            });
            input.addEventListener('blur', (e) => validateField(e.target, true));
        });
        restoreDraft();
        
        const savedName = localStorage.getItem('aavira_display_name');
        const savedEmail = localStorage.getItem('aavira_user_email');
        if (savedName && savedName.toLowerCase() !== "guest user") {
            let nameEl = document.getElementById('ad_name'); 
            if(nameEl) { nameEl.value = savedName; nameEl.dispatchEvent(new Event('input')); }
        }
        if (savedEmail) {
            let emailEl = document.getElementById('ad_email'); 
            if(emailEl) { emailEl.value = savedEmail; emailEl.dispatchEvent(new Event('input')); }
        }
        
        initCheckout();
    } catch(e) { console.error("Initialization Error:", e); }
});

function validateField(el, strict = false) {
    if(!el) return true;
    if(!el.required && el.value.trim() === '') return true;
    const rule = validators[el.id];
    const wrapper = el.closest('.pro-input-group');
    if(!wrapper) return true;
    
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
    try {
        const draft = {}; document.querySelectorAll('.pro-input').forEach(el => draft[el.id] = el.value);
        localStorage.setItem('aavira_pro_draft', JSON.stringify(draft));
    } catch(e){}
}
function restoreDraft() {
    try {
        const draftStr = localStorage.getItem('aavira_pro_draft');
        if (draftStr) { 
            const draft = JSON.parse(draftStr); 
            Object.keys(draft).forEach(key => { 
                const el = document.getElementById(key); 
                if (el && !el.value) { el.value = draft[key]; validateField(el); } 
            }); 
        } 
    } catch(e){}
}

let checkoutItems = []; 
let cartItems = [];
let productDataCache = {}; 
window.allAvailableProducts = [];

let appliedCode = ""; let discountVal = 0; let deliveryFee = 0; let giftWrapFee = 0;
let selectedPaymentMethod = 'cod';
let isBuyNowMode = false;
const CHECKOUT_API_URL = "https://aavira-fashion-backend.vercel.app";

async function initCheckout() {
    let storedCart = [];
    try { storedCart = JSON.parse(localStorage.getItem('aavira_cart')) || []; } catch(e){}
    if(!Array.isArray(storedCart)) storedCart = [];

    const urlParams = new URLSearchParams(window.location.search);
    const buyNowId = urlParams.get('buy_now');

    try {
        if(typeof window.getVercelData === 'function') {
            let apiData = await window.getVercelData();
            window.allAvailableProducts = Array.isArray(apiData) ? apiData : [];
            window.allAvailableProducts.forEach(p => {
                if(p && p.id) productDataCache[String(p.id).trim()] = p;
            });
        }
    } catch(e) {}

    if (buyNowId) {
        isBuyNowMode = true;
        const size = urlParams.get('size') || 'Free Size';
        const color = urlParams.get('color') || 'As Shown';
        checkoutItems.push({ productId: decodeURIComponent(buyNowId).trim(), size: size, color: color, qty: 1 });
    } else {
        isBuyNowMode = false;
        checkoutItems = [...storedCart];
    }

    checkoutItems = checkoutItems.filter(i => {
        if(!i || !i.productId) return false;
        let pid = String(i.productId).trim();
        if(productDataCache[pid]) {
            i.productId = pid; 
            return true;
        }
        return false;
    });

    if (checkoutItems.length === 0) {
        document.getElementById('mainScroll').style.display = 'none';
        document.getElementById('bottomCheckoutBar').style.display = 'none';
        document.getElementById('emptyCartView').style.display = 'flex';
        return;
    }

    try {
        const activePromoStr = localStorage.getItem('aavira_active_promo');
        if (activePromoStr) {
            const activePromo = JSON.parse(activePromoStr);
            if (activePromo && activePromo.code && activePromo.discount) {
                appliedCode = activePromo.code;
                discountVal = Number(activePromo.discount);
                document.getElementById('promoInputGroup').style.display = 'none'; 
                document.getElementById('apCodeName').innerText = appliedCode; 
                document.getElementById('appliedPromoBox').style.display = 'flex';
            }
        }
    } catch(e) {}

    document.getElementById('emptyCartView').style.display = 'none';
    document.getElementById('mainScroll').style.display = 'block';
    document.getElementById('bottomCheckoutBar').style.display = 'flex';

    updateUI();
}

window.setDeliverySpeed = function(speed) { window.triggerHaptic(); deliveryFee = speed === 'express' ? 99 : 0; document.querySelectorAll('.speed-option').forEach(el => el.classList.remove('selected')); document.getElementById(speed === 'express' ? 'opt_exp' : 'opt_std').classList.add('selected'); updateUI(); }
window.toggleGiftWrap = function(el) { window.triggerHaptic(); giftWrapFee = el.checked ? 49 : 0; updateUI(); }
window.selectPayment = function(method, el) { window.triggerHaptic(); selectedPaymentMethod = method; document.querySelectorAll('.pay-option').forEach(c => c.classList.remove('selected')); el.classList.add('selected'); }
window.removeCheckoutItem = function(index) { 
    window.triggerHaptic(); 
    checkoutItems.splice(index, 1); 
    if(checkoutItems.length === 0) {
        document.getElementById('mainScroll').style.display = 'none';
        document.getElementById('bottomCheckoutBar').style.display = 'none';
        document.getElementById('emptyCartView').style.display = 'flex';
    } else { updateUI(); }
}

function updateSuggestions() {
    try {
        const suggestSection = document.getElementById('cartSuggestionsSection');
        const suggestContainer = document.getElementById('suggestedItemsContainer');
        if(!suggestSection || !suggestContainer) return;

        let suggestions = [];
        let checkoutIds = checkoutItems.map(i => String(i.productId));

        let wishlist = [];
        try { wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || []; } catch(e){}
        if(Array.isArray(wishlist)) {
            wishlist.forEach(wId => {
                let strId = String(wId).trim();
                if(!checkoutIds.includes(strId)) {
                    let p = productDataCache[strId] || window.allAvailableProducts.find(x => String(x.id) === strId);
                    if(p && !suggestions.find(s => String(s.id) === strId)) suggestions.push(p);
                }
            });
        }

        if (isBuyNowMode) {
            let storedCart = [];
            try { storedCart = JSON.parse(localStorage.getItem('aavira_cart')) || []; } catch(e){}
            if(Array.isArray(storedCart)) {
                storedCart.forEach(item => {
                    if(!item || !item.productId) return;
                    let strId = String(item.productId).trim();
                    if(!checkoutIds.includes(strId)) {
                        let p = productDataCache[strId] || window.allAvailableProducts.find(x => String(x.id) === strId);
                        if(p && !suggestions.find(s => String(s.id) === strId)) suggestions.push(p);
                    }
                });
            }
        }

        if(suggestions.length > 0) {
            suggestSection.style.display = 'block';
            suggestContainer.innerHTML = '';
            suggestions.forEach(product => {
                let cPrice = parsePrice(product.price);
                let img = product.imageMain || product.image || product.imageUrl;
                suggestContainer.innerHTML += `
                    <div class="s-card">
                        <div class="s-img" style="background-image: url('${img}');"></div>
                        <div class="s-title">${product.name}</div>
                        <div class="s-bottom">
                            <div class="s-price">₹${cPrice.toLocaleString('en-IN')}</div>
                            <button type="button" class="btn-add-suggest" onclick="window.addSuggestionToCheckout('${product.id}')">+ ADD</button>
                        </div>
                    </div>
                `;
            });
        } else { suggestSection.style.display = 'none'; }
    } catch(err) {}
}

window.addSuggestionToCheckout = function(productId) {
    window.triggerHaptic('light');
    let pIdStr = String(productId).trim();
    const product = productDataCache[pIdStr] || window.allAvailableProducts.find(p => String(p.id) === pIdStr);
    
    if(product) {
        productDataCache[pIdStr] = product; 
        let defaultColor = "As Shown";
        if(product.colors && product.colors.length > 0) defaultColor = product.colors[0].name || product.colors[0];
        else if(product.color) defaultColor = product.color.split(',')[0].trim();

        checkoutItems.push({ productId: pIdStr, size: 'Free Size', color: defaultColor, qty: 1 });
        updateUI();
        window.showToast("Item Added", "Product added to your order.", "success");
    }
}

function updateUI() {
    try {
        const container = document.getElementById('orderItemsContainer');
        if(!container) return;
        container.innerHTML = ''; 
        let totalMRP = 0; let subTotal = 0; 

        const countBadge = document.getElementById('itemCountBadge');
        if(countBadge) countBadge.innerText = `${checkoutItems.length} Item${checkoutItems.length > 1 ? 's' : ''}`;

        checkoutItems.forEach((item, index) => {
            const p = productDataCache[item.productId];
            if(!p) return; 
            
            let cPrice = parsePrice(p.price); 
            let oPrice = p.mrp ? parsePrice(p.mrp) : (cPrice + 450);
            totalMRP += (oPrice * item.qty); subTotal += (cPrice * item.qty);

            container.innerHTML += `
                <div class="o-item">
                    <div class="o-img" style="background-image: url('${p.imageMain || p.image || p.imageUrl}');"></div>
                    <div class="o-info">
                        <h4>${p.name}</h4>
                        <p>Size: ${item.size} | Color: ${item.color} | Qty: ${item.qty}</p>
                        <h3>₹${cPrice.toLocaleString('en-IN')}</h3>
                    </div>
                    <button type="button" class="remove-btn" onclick="window.removeCheckoutItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
        });

        let prodDiscount = totalMRP - subTotal;
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

        updateSuggestions();
    } catch(e) { console.error("UI Update Error", e); }
}

window.applyPromo = async function() {
    window.triggerHaptic(); 
    const input = document.getElementById('promoInput'); 
    if(!input) return;
    const code = input.value.trim().toUpperCase();
    if(!code) return window.showToast("Empty Code", "Please enter a valid coupon.", "error");
    
    const btn = document.getElementById('promoBtn');
    btn.innerHTML = `<span class="btn-spinner"></span>`; btn.disabled = true;

    try {
        const res = await fetch(`${CHECKOUT_API_URL}/api/promocodes/${code}`); 
        const result = await res.json();
        if(res.ok && result.status === "success") {
            appliedCode = result.data.id || code; 
            discountVal = Number(result.data.discountAmount) || Number(result.data.discount) || Number(result.data.amount) || 0; 
            
            localStorage.setItem('aavira_active_promo', JSON.stringify({ code: appliedCode, discount: discountVal }));

            document.getElementById('promoInputGroup').style.display = 'none'; 
            document.getElementById('apCodeName').innerText = appliedCode; 
            document.getElementById('appliedPromoBox').style.display = 'flex';
            window.showToast("Offer Applied", `Saved ₹${discountVal}`, "success"); 
            updateUI(); 
        } else {
            window.showToast("Invalid", "Coupon is invalid or expired.", "error");
        }
    } catch(e) { window.showToast("Network Error", "Could not verify coupon.", "error"); }
    
    btn.innerHTML = 'Apply'; btn.disabled = false;
}

window.removePromo = function() { 
    window.triggerHaptic(); appliedCode = ""; discountVal = 0; 
    localStorage.removeItem('aavira_active_promo');
    document.getElementById('promoInput').value = ''; 
    document.getElementById('promoInputGroup').style.display = 'flex'; 
    document.getElementById('appliedPromoBox').style.display = 'none'; 
    updateUI(); 
}

window.autoFetchLocation = function() {
    window.triggerHaptic(); window.showToast("Fetching", "Locating securely...", "success");
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
            } catch (e) { window.showToast("API Error", "Location mapping failed.", "error"); }
        }, () => window.showToast("Denied", "Please enable GPS.", "error"));
    }
}

window.placeOrder = async function() {
    window.triggerHaptic('light');
    const reqIds = ['ad_name', 'ad_email', 'ad_phone', 'ad_pin', 'ad_city', 'ad_address'];
    let valid = true;
    reqIds.forEach(id => { const el = document.getElementById(id); if(!validateField(el, true)) { el.closest('.pro-input-group').classList.add('is-invalid'); valid = false; } });

    if(!valid) {
        window.showToast("Incomplete Details", "Please fill required fields (marked red).", "error");
        document.querySelector('.is-invalid').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const modal = document.getElementById('processModal'); const gateway = document.getElementById('gatewayBox');
    const processText = document.getElementById('processText');
    modal.classList.add('show'); gateway.style.display = 'block'; document.getElementById('successBox').style.display = 'none';

    const btn = document.getElementById('placeOrderBtn');
    const btnText = document.getElementById('btnText');
    btn.disabled = true;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    if(selectedPaymentMethod === 'online') {
        processText.innerText = "Connecting to Secure Gateway..."; await wait(1200);
        processText.innerText = "Authenticating Payment Details..."; await wait(1500);
        processText.innerText = "Confirming Transaction..."; await wait(1000);
    } else {
        processText.innerText = "Verifying Address Details..."; await wait(1200);
        processText.innerText = "Generating COD Invoice..."; await wait(1500);
        processText.innerText = "Confirming Order Placement..."; await wait(1000);
    }

    let subTotal = 0; let finalItemsToSave = [];
    checkoutItems.forEach(item => {
        const p = productDataCache[item.productId];
        if(!p) return;
        let cPrice = parsePrice(p.price); subTotal += (cPrice * item.qty);
        finalItemsToSave.push({ productId: item.productId, name: p.name, price: cPrice, qty: item.qty, size: item.size, color: item.color, image: p.imageMain || p.image || p.imageUrl });
    });
    
    let finalTotalAmount = Math.max(0, subTotal + deliveryFee + giftWrapFee - discountVal);
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    const landmark = document.getElementById('ad_landmark').value.trim();
    const city = document.getElementById('ad_city').value.trim();
    const fullAddress = `${document.getElementById('ad_address').value.trim()}, ${landmark ? landmark + ', ' : ''}${city}, PIN: ${document.getElementById('ad_pin').value.trim()}`;

    const orderPayload = {
        orderId: orderId, userId: localStorage.getItem('aavira_display_name') || 'guest', 
        customerName: document.getElementById('ad_name').value.trim(), 
        phone: document.getElementById('ad_phone').value.trim(), 
        email: document.getElementById('ad_email').value.trim(),
        address: fullAddress, items: finalItemsToSave, totalAmount: finalTotalAmount, 
        promoCodeUsed: appliedCode || "None", promoDiscount: discountVal,
        paymentMethod: selectedPaymentMethod, paymentStatus: selectedPaymentMethod === 'cod' ? 'Pending' : 'Paid', 
        orderStatus: 'Placed'
    };

    try {
        if (typeof window.sendOrderToVercel === 'function') {
            const isSuccess = await window.sendOrderToVercel(orderPayload);
            if (!isSuccess) throw new Error("Backend Rejected");
        } else { await wait(1000); }

        if (!isBuyNowMode) {
            localStorage.removeItem('aavira_cart');
        } else {
            let storedCart = [];
            try { storedCart = JSON.parse(localStorage.getItem('aavira_cart')) || []; } catch(e){}
            if(Array.isArray(storedCart)) {
                let remainingCart = storedCart.filter(item => !checkoutItems.find(c => String(c.productId) === String(item.productId)));
                localStorage.setItem('aavira_cart', JSON.stringify(remainingCart));
            }
        }

        if(appliedCode) {
            let used = [];
            try { used = JSON.parse(localStorage.getItem('aavira_used_promos')) || []; } catch(e){}
            if(!used.includes(appliedCode)) used.push(appliedCode);
            localStorage.setItem('aavira_used_promos', JSON.stringify(used));
            localStorage.removeItem('aavira_active_promo');
        }

        localStorage.removeItem('aavira_pro_draft');
        localStorage.setItem('aavira_latest_order', orderId);

        // 🔥🔥🔥 SAFELY SAVING ORDER ID TO LOCAL STORAGE FOR TRACKING 🔥🔥🔥
        let guestOrders = [];
        try { 
            let stored = JSON.parse(localStorage.getItem('aavira_placed_orders'));
            if(Array.isArray(stored)) {
                guestOrders = stored;
            }
        } catch(e){}
        
        if (!guestOrders.includes(String(orderId))) {
            guestOrders.push(String(orderId));
        }
        localStorage.setItem('aavira_placed_orders', JSON.stringify(guestOrders));
        // 🔥🔥🔥 FIX KHATAM 🔥🔥🔥

        window.triggerHaptic('success');
        document.getElementById('displayOrderId').innerText = orderId;
        gateway.style.display = 'none'; 
        document.getElementById('successBox').style.display = 'block'; 

    } catch(e) { 
        console.error("Order error", e);
        modal.classList.remove('show'); 
        window.showCustomAlert("Failed", "Server Error. Try again.", "error"); 
        btn.disabled = false;
        btnText.innerHTML = 'Place Order <i class="fa-solid fa-lock"></i>';
    }
}
</script>
