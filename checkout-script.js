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
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');
    
    if(titleEl) titleEl.innerText = title;
    if(msgEl) msgEl.innerText = message;
    if(iconEl) iconEl.innerHTML = type === 'error' ? '<i class="fa-solid fa-circle-xmark" style="color:#F87171;"></i>' : '<i class="fa-solid fa-circle-check" style="color:#34D399;"></i>';
    
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
    } catch(e) { console.error("API Fetch Error:", e); }

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

    const mainScroll = document.getElementById('mainScroll');
    const bottomCheckoutBar = document.getElementById('bottomCheckoutBar');
    const emptyCartView = document.getElementById('emptyCartView');

    if (checkoutItems.length === 0) {
        if(mainScroll) mainScroll.style.display = 'none';
        if(bottomCheckoutBar) bottomCheckoutBar.style.display = 'none';
        if(emptyCartView) emptyCartView.style.display = 'flex';
        return;
    }

    try {
        const activePromoStr = localStorage.getItem('aavira_active_promo');
        if (activePromoStr) {
            const activePromo = JSON.parse(activePromoStr);
            if (activePromo && activePromo.code && activePromo.discount) {
                appliedCode = activePromo.code;
                discountVal = Number(activePromo.discount);
                const pInputGrp = document.getElementById('promoInputGroup');
                const apCode = document.getElementById('apCodeName');
                const appliedBox = document.getElementById('appliedPromoBox');
                
                if(pInputGrp) pInputGrp.style.display = 'none'; 
                if(apCode) apCode.innerText = appliedCode; 
                if(appliedBox) appliedBox.style.display = 'flex';
            }
        }
    } catch(e) {}

    if(emptyCartView) emptyCartView.style.display = 'none';
    if(mainScroll) mainScroll.style.display = 'block';
    if(bottomCheckoutBar) bottomCheckoutBar.style.display = 'flex';

    updateUI();
}

window.setDeliverySpeed = function(speed) { 
    window.triggerHaptic(); 
    deliveryFee = speed === 'express' ? 99 : 0; 
    document.querySelectorAll('.speed-option').forEach(el => el.classList.remove('selected')); 
    const expEl = document.getElementById('opt_exp');
    const stdEl = document.getElementById('opt_std');
    if(speed === 'express' && expEl) expEl.classList.add('selected');
    else if(stdEl) stdEl.classList.add('selected');
    updateUI(); 
}

window.toggleGiftWrap = function(el) { window.triggerHaptic(); giftWrapFee = el.checked ? 49 : 0; updateUI(); }
window.selectPayment = function(method, el) { window.triggerHaptic(); selectedPaymentMethod = method; document.querySelectorAll('.pay-option').forEach(c => c.classList.remove('selected')); el.classList.add('selected'); }
window.removeCheckoutItem = function(index) { 
    window.triggerHaptic(); 
    checkoutItems.splice(index, 1); 
    if(checkoutItems.length === 0) {
        const mainScroll = document.getElementById('mainScroll');
        const bottomBar = document.getElementById('bottomCheckoutBar');
        const emptyView = document.getElementById('emptyCartView');
        if(mainScroll) mainScroll.style.display = 'none';
        if(bottomBar) bottomBar.style.display = 'none';
        if(emptyView) emptyView.style.display = 'flex';
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

        const elMrp = document.getElementById('billMrp'); if(elMrp) elMrp.innerText = `₹${totalMRP.toLocaleString('en-IN')}`;
        const elDisc = document.getElementById('billDiscount'); if(elDisc) elDisc.innerText = `-₹${prodDiscount.toLocaleString('en-IN')}`;
        
        const delRow = document.getElementById('row_delivery');
        if(delRow) {
            const span = delRow.querySelector('span:last-child');
            if(span) {
                if(deliveryFee > 0) { span.innerText = `₹${deliveryFee}`; span.classList.remove('highlight-green'); }
                else { span.innerText = `FREE`; span.classList.add('highlight-green'); }
            }
        }
        
        const rowGift = document.getElementById('row_gift'); if(rowGift) rowGift.style.display = giftWrapFee > 0 ? 'flex' : 'none';

        const billPromoRow = document.getElementById('billPromoRow');
        const billPromoDisc = document.getElementById('billPromoDiscount');
        if(discountVal > 0) { 
            if(billPromoRow) billPromoRow.style.display = 'flex'; 
            if(billPromoDisc) billPromoDisc.innerText = `-₹${discountVal}`; 
        } else { 
            if(billPromoRow) billPromoRow.style.display = 'none'; 
        }

        const totalSavBadge = document.getElementById('totalSavingsBadge');
        if(totalSavings > 0) { 
            if(totalSavBadge) { totalSavBadge.style.display = 'block'; totalSavBadge.innerText = `You are saving ₹${totalSavings.toLocaleString('en-IN')} on this order!`; }
        } else { 
            if(totalSavBadge) totalSavBadge.style.display = 'none'; 
        }

        const billTotal = document.getElementById('billTotal'); if(billTotal) billTotal.innerText = `₹${grandTotal.toLocaleString('en-IN')}`;
        const bottomTotal = document.getElementById('bottomTotal'); if(bottomTotal) bottomTotal.innerText = `₹${grandTotal.toLocaleString('en-IN')}`;

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
    if(btn) { btn.innerHTML = `<span class="btn-spinner"></span>`; btn.disabled = true; }

    try {
        const CHECKOUT_API_URL = "https://aavira-fashion-backend.vercel.app";
        const res = await fetch(`${CHECKOUT_API_URL}/api/promocodes/${code}`); 
        const result = await res.json();
        if(res.ok && result.status === "success") {
            appliedCode = result.data.id || code; 
            discountVal = Number(result.data.discountAmount) || Number(result.data.discount) || Number(result.data.amount) || 0; 
            
            localStorage.setItem('aavira_active_promo', JSON.stringify({ code: appliedCode, discount: discountVal }));

            const pInputGrp = document.getElementById('promoInputGroup'); if(pInputGrp) pInputGrp.style.display = 'none'; 
            const apCodeName = document.getElementById('apCodeName'); if(apCodeName) apCodeName.innerText = appliedCode; 
            const appPromoBox = document.getElementById('appliedPromoBox'); if(appPromoBox) appPromoBox.style.display = 'flex';
            window.showToast("Offer Applied", `Saved ₹${discountVal}`, "success"); 
            updateUI(); 
        } else {
            window.showToast("Invalid", "Coupon is invalid or expired.", "error");
        }
    } catch(e) { window.showToast("Network Error", "Could not verify coupon.", "error"); }
    
    if(btn) { btn.innerHTML = 'Apply'; btn.disabled = false; }
}

window.removePromo = function() { 
    window.triggerHaptic(); appliedCode = ""; discountVal = 0; 
    localStorage.removeItem('aavira_active_promo');
    const pInput = document.getElementById('promoInput'); if(pInput) pInput.value = ''; 
    const pInputGrp = document.getElementById('promoInputGroup'); if(pInputGrp) pInputGrp.style.display = 'flex'; 
    const appPromoBox = document.getElementById('appliedPromoBox'); if(appPromoBox) appPromoBox.style.display = 'none'; 
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
                    const pinEl = document.getElementById('ad_pin'); if(pinEl) { pinEl.value = data.address.postcode || ""; validateField(pinEl); }
                    const cityEl = document.getElementById('ad_city'); if(cityEl) { cityEl.value = data.address.city || data.address.town || ""; validateField(cityEl); }
                    const addrEl = document.getElementById('ad_address'); if(addrEl) { addrEl.value = `${data.address.road||''} ${data.address.suburb||''}`.trim(); validateField(addrEl); }
                    saveDraft();
                }
            } catch (e) { window.showToast("API Error", "Location mapping failed.", "error"); }
        }, () => window.showToast("Denied", "Please enable GPS.", "error"));
    }
}

// 🔥 THIS IS THE MASTER FIX: 100% CRASH PROOF PLACE ORDER FUNCTION 🔥
window.placeOrder = async function() {
    window.triggerHaptic('light');
    const reqIds = ['ad_name', 'ad_email', 'ad_phone', 'ad_pin', 'ad_city', 'ad_address'];
    let valid = true;
    let firstInvalid = null;

    reqIds.forEach(id => { 
        const el = document.getElementById(id); 
        if(!validateField(el, true)) { 
            const wrapper = el ? el.closest('.pro-input-group') : null;
            if(wrapper) wrapper.classList.add('is-invalid'); 
            valid = false; 
            if(!firstInvalid) firstInvalid = wrapper || el;
        } 
    });

    if(!valid) {
        window.showToast("Incomplete Details", "Please fill required fields (marked red).", "error");
        if(firstInvalid && typeof firstInvalid.scrollIntoView === 'function') {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    const modal = document.getElementById('processModal'); 
    const gateway = document.getElementById('gatewayBox');
    const processText = document.getElementById('processText');
    const successBox = document.getElementById('successBox');
    const btn = document.getElementById('placeOrderBtn');
    const btnText = document.getElementById('btnText');

    if(modal) modal.classList.add('show'); 
    if(gateway) gateway.style.display = 'block'; 
    if(successBox) successBox.style.display = 'none';
    if(btn) btn.disabled = true;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    if(processText) {
        if(selectedPaymentMethod === 'online') {
            processText.innerText = "Connecting to Secure Gateway..."; await wait(1200);
            processText.innerText = "Authenticating Payment Details..."; await wait(1500);
            processText.innerText = "Confirming Transaction..."; await wait(1000);
        } else {
            processText.innerText = "Verifying Address Details..."; await wait(1200);
            processText.innerText = "Generating COD Invoice..."; await wait(1500);
            processText.innerText = "Confirming Order Placement..."; await wait(1000);
        }
    } else {
        await wait(2000);
    }

    let subTotal = 0; let finalItemsToSave = [];
    checkoutItems.forEach(item => {
        const p = productDataCache[item.productId];
        if(!p) return;
        let cPrice = parsePrice(p.price); subTotal += (cPrice * item.qty);
        finalItemsToSave.push({ 
            productId: item.productId, 
            name: p.name, 
            price: cPrice, 
            qty: item.qty, 
            size: item.size, 
            color: item.color, 
            image: p.imageMain || p.image || p.imageUrl 
        });
    });
    
    let finalTotalAmount = Math.max(0, subTotal + deliveryFee + giftWrapFee - discountVal);
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    // SAFE FETCHING OF INPUTS (Crash se bachane ke liye)
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value.trim() : "";
    
    const landmark = getVal('ad_landmark');
    const city = getVal('ad_city');
    const pin = getVal('ad_pin');
    const baseAddr = getVal('ad_address');
    const fullAddress = `${baseAddr}, ${landmark ? landmark + ', ' : ''}${city}, PIN: ${pin}`;

    const orderPayload = {
        orderId: orderId, 
        userId: localStorage.getItem('aavira_display_name') || 'guest', 
        customerName: getVal('ad_name'), 
        phone: getVal('ad_phone'), 
        email: getVal('ad_email'),
        address: fullAddress, 
        items: finalItemsToSave, 
        totalAmount: finalTotalAmount, 
        promoCodeUsed: appliedCode || "None", 
        promoDiscount: discountVal,
        paymentMethod: selectedPaymentMethod, 
        paymentStatus: selectedPaymentMethod === 'cod' ? 'Pending' : 'Paid', 
        orderStatus: 'Placed'
    };

    try {
        if (typeof window.sendOrderToVercel === 'function') {
            const isSuccess = await window.sendOrderToVercel(orderPayload);
            if (!isSuccess) throw new Error("Backend Rejected");
        } else { 
            await wait(1000); 
        }

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
        const displayIdEl = document.getElementById('displayOrderId');
        if(displayIdEl) displayIdEl.innerText = orderId;
        
        if(gateway) gateway.style.display = 'none'; 
        if(successBox) successBox.style.display = 'block'; 

    } catch(e) { 
        console.error("Order error", e);
        if(modal) modal.classList.remove('show'); 
        window.showToast("Failed", "Server Error. Try again.", "error"); 
        if(btn) btn.disabled = false;
        if(btnText) btnText.innerHTML = 'Place Order <i class="fa-solid fa-lock"></i>';
    }
}
</script>
