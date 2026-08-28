let cartItems = [];
let productDatabase = {};

// Promo variables
let appliedPromoCode = "";
let promoDiscountAmount = 0;

let selectedPaymentMode = 'cod';
let giftWrapFee = 0;
let deliveryFee = 0;
let isBuyNowMode = false;

window.pendingWhatsAppUrl = "";
let whatsappTimerInterval;

const ToastAlert = {
    toastElement: document.getElementById('alertToast'),
    toastText: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon'),
    
    show(message, isSuccess = false) {
        if(navigator.vibrate) navigator.vibrate(isSuccess ? 40 : 60);
        this.toastText.innerText = message;
        this.toastIcon.innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check" style="color:#10b981; font-size:22px;"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444; font-size:22px;"></i>';
        this.toastElement.classList.add('show');
        setTimeout(() => this.toastElement.classList.remove('show'), 3000);
    }
};

const parseCurrencyNumber = (val) => parseInt(String(val).replace(/[^0-9]/g, '')) || 0;

document.addEventListener('DOMContentLoaded', async () => {
    restoreFormDraft();
    bindInputValidationEvents();
    await fetchProductsAndInitializeCart();
});

function bindInputValidationEvents() {
    document.querySelectorAll('.pro-input').forEach(inputField => {
        inputField.addEventListener('input', (event) => { 
            if(event.target.id === 'ad_phone' || event.target.id === 'ad_pin') { 
                event.target.value = event.target.value.replace(/\D/g, ''); 
            }
            validateInputField(event.target); 
            saveFormDraft(); 
        });
        inputField.addEventListener('blur', (event) => validateInputField(event.target, true));
    });
}

function validateInputField(inputElement, forceShowError = false) {
    if(!inputElement) return true;
    const inputGroup = inputElement.closest('.pro-input-group');
    if(!inputGroup) return true;
    
    let val = inputElement.value.trim();
    if(!inputElement.required && val === '') return true;

    const checkRules = () => {
        if(inputElement.id === 'ad_email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if(inputElement.id === 'ad_phone') return /^[6-9]\d{9}$/.test(val);
        if(inputElement.id === 'ad_pin') return /^\d{6}$/.test(val);
        if(inputElement.id === 'ad_map_link') return true; 
        return val.length >= 3;
    }

    if(checkRules()) {
        inputGroup.classList.remove('is-invalid'); return true;
    } else {
        if(forceShowError || val.length > 0) inputGroup.classList.add('is-invalid');
        return false;
    }
}

function saveFormDraft() { 
    let formData = {}; 
    document.querySelectorAll('.pro-input').forEach(input => formData[input.id] = input.value);
    localStorage.setItem('checkoutAddressDraft', JSON.stringify(formData));
}

function restoreFormDraft() { 
    let draftDataString = localStorage.getItem('checkoutAddressDraft');
    if (draftDataString){
        let formData = JSON.parse(draftDataString);
        Object.keys(formData).forEach(key => { 
            let inputEl = document.getElementById(key); 
            if(inputEl && !inputEl.value){ 
                inputEl.value = formData[key]; validateInputField(inputEl); 
            } 
        });
    }
}

async function fetchProductsAndInitializeCart() {
    try { 
        if (typeof window.getVercelData === 'function') {
            let db1 = await window.getVercelData() || [];
            db1.forEach(prod => { if (prod && prod.id) productDatabase[String(prod.id).trim()] = prod; });
        } 
    } catch(e) { }

    try {
        if (typeof window.getMainProductsData === 'function') {
            let db2 = await window.getMainProductsData() || [];
            db2.forEach(prod => { if (prod && prod.id) productDatabase[String(prod.id).trim()] = prod; });
        }
    } catch(e) { }

    const urlParams = new URLSearchParams(window.location.search);
    const buyNowProductId = urlParams.get('buy_now');

    if(buyNowProductId) {
        isBuyNowMode = true;
        cartItems.push({
            productId: decodeURIComponent(buyNowProductId).trim(),
            size: urlParams.get('size') || 'Free Size',
            color: urlParams.get('color') || 'Standard',
            image: urlParams.get('image') || '',
            qty: 1,
            fallbackName: urlParams.get('name') || "Exclusive Item",
            fallbackPrice: urlParams.get('price') || 0
        });
    } else {
        cartItems = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    }

    // Sync with DB
    cartItems = cartItems.filter(item => {
        let pId = String(item.productId).trim();
        if (productDatabase[pId]) {
            item.productId = pId;
            return true;
        } else if (item.fallbackPrice && item.fallbackName) {
            productDatabase[pId] = { id: pId, name: item.fallbackName, price: item.fallbackPrice, image: item.image || "https://placehold.co/100" };
            item.productId = pId;
            return true;
        }
        return false;
    });

    if(cartItems.length === 0){
        document.getElementById('mainScroll').style.display = 'none'; document.getElementById('bottomCheckoutBar').style.display = 'none'; document.getElementById('emptyCartView').style.display = 'flex';
        return;
    }

    // 🔥 RESTORE PROMO CODE IF SAVED IN LOCAL STORAGE 🔥
    try {
        let savedPromo = JSON.parse(localStorage.getItem('savedPromoCache'));
        if(savedPromo && savedPromo.label && savedPromo.discount) {
            appliedPromoCode = savedPromo.label;
            promoDiscountAmount = Number(savedPromo.discount);
            document.getElementById('promoInputGroup').style.display = 'none';
            document.getElementById('apCodeName').innerText = appliedPromoCode;
            document.getElementById('appliedPromoBox').style.display = 'flex';
        }
    } catch(e) {}

    document.getElementById('emptyCartView').style.display = 'none';
    document.getElementById('mainScroll').style.display = 'block';
    document.getElementById('bottomCheckoutBar').style.display = 'flex';
    
    renderCartUI();
}

// ==========================================
// 🔥 WISH LIST / SUGGESTIONS LOGIC 🔥
// ==========================================
function renderWishlistSuggestions() {
    try {
        let suggestedProducts = [];
        let currentCartIds = cartItems.map(item => String(item.productId).trim());
        
        // Fetch Wishlist Items
        let wishlistIds = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
        
        // Fallback: If wishlist is empty, suggest some items from Database
        let allProductIds = Object.keys(productDatabase);
        
        // Combine and remove duplicates, prioritizing wishlist
        let combinedIds = [...new Set([...wishlistIds, ...allProductIds])]; 
        
        for(let id of combinedIds) {
            let cleanId = String(id).trim();
            if(!currentCartIds.includes(cleanId) && productDatabase[cleanId]) {
                suggestedProducts.push(productDatabase[cleanId]);
            }
            if(suggestedProducts.length >= 6) break; // Maximum 6 suggestions
        }

        if(suggestedProducts.length > 0) {
            document.getElementById('cartSuggestionsSection').style.display = 'block'; 
            let htmlString = "";
            suggestedProducts.forEach(prod => {
                let imageUrl = prod.imageMain || prod.imageUrl || prod.image || 'https://placehold.co/150?text=Item';
                htmlString += `
                <div class="s-card">
                    <div class="s-img-wrapper"><img src="${imageUrl}" onerror="this.src='https://placehold.co/150?text=IMG'"></div>
                    <div class="s-title">${prod.name || 'Premium Collection'}</div>
                    <div class="s-bottom">
                        <span class="s-price">₹${parseCurrencyNumber(prod.price).toLocaleString()}</span>
                        <button onclick="addSuggestedProduct('${prod.id}')" class="btn-add-suggest">+ ADD</button>
                    </div>
                </div>`; 
            }); 
            document.getElementById('suggestedItemsContainer').innerHTML = htmlString;
        } else {
            document.getElementById('cartSuggestionsSection').style.display = 'none'; 
        }
    } catch(e){ 
        console.error("Suggestions Error:", e); 
    }
}

window.addSuggestedProduct = function(productId){
    if(navigator.vibrate) navigator.vibrate(30);
    let product = productDatabase[String(productId).trim()]; 
    if(product) { 
        cartItems.push({
            productId: product.id, 
            size: 'Free Size', 
            color: 'Standard', 
            qty: 1, 
            image: product.imageMain || product.image || product.imageUrl || 'https://placehold.co/150'
        }); 
        
        if(!isBuyNowMode) {
            localStorage.setItem('aavira_cart', JSON.stringify(cartItems));
        }
        
        ToastAlert.show('Item added to your bag successfully.', true);
        renderCartUI(); 
    }
};

window.setUserDeliveryPreferencesCost = (deliveryType) => {
    deliveryFee = (deliveryType === 'express') ? 99 : 0;
    document.querySelectorAll('.speed-option').forEach(el=>el.classList.remove('selected'));
    document.getElementById((deliveryType==='express')?'opt_exp':'opt_std').classList.add('selected');
    renderCartUI();
};

window.updateCustomWrapPreferencesCosts = (checkboxEl) => { giftWrapFee = checkboxEl.checked ? 49 : 0; renderCartUI(); };

window.pickPaymentMode = (paymentType, domElement) => { 
    selectedPaymentMode = paymentType; 
    document.querySelectorAll('.pay-option').forEach(el=>el.classList.remove('selected')); 
    domElement.classList.add('selected');
}

window.removeCartItem = (index) => { 
    cartItems.splice(index, 1); 
    
    if(!isBuyNowMode) {
        localStorage.setItem('aavira_cart', JSON.stringify(cartItems));
    }

    if(cartItems.length === 0){
        document.getElementById('mainScroll').style.display = 'none'; document.getElementById('bottomCheckoutBar').style.display = 'none'; document.getElementById('emptyCartView').style.display = 'flex';
    } else { renderCartUI(); }
}

function renderCartUI(){
    const orderContainer = document.getElementById('orderItemsContainer'); 
    if(!orderContainer) return; 
    orderContainer.innerHTML = '';
    document.getElementById('itemCountBadge').innerText = `${cartItems.length} ITEMS`;

    let totalMRP = 0; let totalCartValue = 0;
    cartItems.forEach((item, index) => {
        let product = productDatabase[item.productId]; if(!product) return;
        let currentPrice = parseCurrencyNumber(product.price);
        let originalMrp = product.mrp ? parseCurrencyNumber(product.mrp) : (currentPrice + 540);
        
        totalMRP += (originalMrp * item.qty);
        totalCartValue += (currentPrice * item.qty);
        let imageUrl = (item.image || product.imageMain || product.imageUrl || product.image || "https://placehold.co/100").toString().replace(/['"]/g,'');

        orderContainer.innerHTML += `
            <div class="o-item">
                <div class="o-img-box"><img src="${imageUrl}" onerror="this.src='https://placehold.co/100?text=Item'"></div>
                <div class="o-info">
                    <h4>${product.name}</h4>
                    <p class="o-item-specs">Size: <strong>${item.size || 'Free Size'}</strong> <br>Qty: <strong>${item.qty} Piece(s)</strong></p>
                    <h3>₹ ${currentPrice.toLocaleString()}</h3>
                </div>
                <button class="remove-btn" onclick="removeCartItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
    });

    document.getElementById('billMrp').innerText = `₹ ${totalMRP.toLocaleString()}`;
    document.getElementById('billDiscount').innerText = `- ₹ ${(totalMRP - totalCartValue).toLocaleString()}`;
    
    if (promoDiscountAmount) { document.getElementById('billPromoRow').style.display='flex'; document.getElementById('billPromoDiscount').innerText=`- ₹ ${promoDiscountAmount.toLocaleString()}`;} else document.getElementById('billPromoRow').style.display='none';
    if (deliveryFee) { document.getElementById('billDelivery').innerText = `₹ 99`; document.getElementById('billDelivery').className=''; } else { document.getElementById('billDelivery').innerText = `Free`; document.getElementById('billDelivery').className='green-txt'; }
    
    document.getElementById('row_gift').style.display = giftWrapFee ? 'flex' : 'none';
    let finalPayableAmount = Math.max(0, totalCartValue + deliveryFee + giftWrapFee - promoDiscountAmount);
    
    document.getElementById('billTotal').innerText = `₹ ${finalPayableAmount.toLocaleString()}`;
    document.getElementById('bottomTotal').innerText = `₹ ${finalPayableAmount.toLocaleString()}`;

    // Trigger suggestions rendering
    renderWishlistSuggestions();
}

// ==========================================
// 🔥 ROBUST PROMO CODE LOGIC 🔥
// ==========================================
window.verifyAndApplyCouponAPI = async () => {
    let inputField = document.getElementById('promoInput'); 
    if(!inputField) return;
    let code = inputField.value.trim().toUpperCase();
    
    if(code.length < 3) return ToastAlert.show("Please enter a valid coupon code.", false);
    
    const btn = document.getElementById('promoBtn'); 
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="btn-spinner"></div>'; 
    btn.disabled = true;

    let discountAmt = 0;
    let isValid = false;

    try {
        // Testing endpoints resiliently based on user_data structure
        let response = await fetch(`https://ssxpq15in.vercel.app/api/promo_codes/${code}`);
        if (!response.ok) response = await fetch(`https://ssxpq15in.vercel.app/api/promocodes/${code}`);
        if (!response.ok) response = await fetch(`https://server-js-psi-five.vercel.app/api/promocodes/${code}`);
        
        if (response.ok) {
            let result = await response.json();
            let promoData = result.data || result;
            
            if (promoData && promoData.isActive !== false) {
                discountAmt = Number(promoData.amount || promoData.discountAmount || promoData.discount || 0);
                if(discountAmt > 0) isValid = true;
            }
        }
    } catch(error) {
        console.warn("Promo API fallback triggered");
    }

    // Hardcoded Fallback for testing/safety if API fails
    if (!isValid) {
        if(code === 'LUXURY500') { discountAmt = 500; isValid = true; }
        else if(code === 'AAVIRA200') { discountAmt = 200; isValid = true; }
    }

    if(isValid) {
        applyPromoUI(code, discountAmt);
    } else {
        ToastAlert.show('Invalid or Expired Coupon Code.', false);
    }
    
    btn.innerHTML = originalText; 
    btn.disabled = false;
}

function applyPromoUI(code, discount) {
    appliedPromoCode = code;
    promoDiscountAmount = discount;
    localStorage.setItem('savedPromoCache', JSON.stringify({label: code, discount: discount}));
    document.getElementById('promoInputGroup').style.display='none'; 
    document.getElementById('apCodeName').innerText = code; 
    document.getElementById('appliedPromoBox').style.display='flex';
    ToastAlert.show("Coupon applied successfully!", true); 
    renderCartUI();
}

window.removeActiveCoupon = () => { 
    appliedPromoCode = ""; 
    promoDiscountAmount = 0; 
    localStorage.removeItem('savedPromoCache'); 
    document.getElementById('promoInputGroup').style.display='flex'; 
    document.getElementById('promoInput').value=''; 
    document.getElementById('appliedPromoBox').style.display='none'; 
    renderCartUI(); 
    ToastAlert.show("Coupon Removed", true);
}

window.forceWhatsAppRedirect = () => {
    if (whatsappTimerInterval) clearInterval(whatsappTimerInterval);
    if (window.pendingWhatsAppUrl) {
        window.location.href = window.pendingWhatsAppUrl;
    }
};

// ==========================================
//  SUBMIT ORDER - FULL DATABASE SCHEMA 
// ==========================================
window.submitFinalOrder = async () => {
    let isFormValid = true; let firstErrorField = null;
    ['ad_name', 'ad_phone', 'ad_pin', 'ad_city', 'ad_address', 'ad_email'].forEach(id=>{ 
        let inputEl = document.getElementById(id); 
        if(!validateInputField(inputEl, true)){ isFormValid=false; inputEl.closest('.pro-input-group').classList.add('is-invalid'); firstErrorField = inputEl;} 
    });
    
    if(!isFormValid){ ToastAlert.show('Please fill all required address fields.', false); if(firstErrorField) firstErrorField.scrollIntoView({behavior:'smooth'}); return; }

    let successSound = new Audio('success_music.mp3');

    document.getElementById('processModal').classList.add('active');
    document.getElementById('processText').innerText = 'Creating Secure Invoice Request...';

    let productsCost = 0; let cleanStringOfItems = [];
    
    let formattedItemsPayload = cartItems.map(item => {
        let dbProduct = productDatabase[item.productId] || {}; 
        let price = parseCurrencyNumber(dbProduct.price || 0); 
        productsCost += (price * item.qty);
        
        cleanStringOfItems.push(`${item.qty}x ${dbProduct.name ? dbProduct.name.substring(0,35) : "Exclusive Item"}... (Size: ${item.size || 'Standard'}) - ₹${price.toLocaleString()}`);
        
        return {
            productId: item.productId,
            name: dbProduct.name || "Exclusive Product",
            qty: item.qty,
            price: price,
            color: item.color || "Standard",
            size: item.size || "Free Size",
            image: item.image || dbProduct.imageMain || dbProduct.imageUrl || dbProduct.image || ""
        };
    });

    let finalOrderId = "ORD-" + Math.floor(Math.random() * 881239841).toString();
    let customerName = document.getElementById('ad_name').value.trim();
    let customerPhone = document.getElementById('ad_phone').value.trim();
    let customerEmail = document.getElementById('ad_email').value.trim();
    let customerMapLink = document.getElementById('ad_map_link') ? document.getElementById('ad_map_link').value.trim() : "";
    let customerAddress = `${document.getElementById('ad_address').value.trim()}, ${document.getElementById('ad_city').value.trim()} - Pincode: ${document.getElementById('ad_pin').value.trim()}`;
    
    let totalAmountToPay = Math.max(0, productsCost + deliveryFee + giftWrapFee - promoDiscountAmount);
    let orderCurrentState = (selectedPaymentMode === 'online') ? 'Pending Payment' : 'Placed';
    
    try { 
        if (typeof window.sendOrderToVercel === 'function'){
            let payloadData = {
                orderId: finalOrderId,
                userId: localStorage.getItem('aavira_user_email') || 'Guest User',
                customerName: customerName,
                email: customerEmail,
                phone: customerPhone,
                address: customerAddress,
                mapLink: customerMapLink, 
                items: formattedItemsPayload,
                totalAmount: totalAmountToPay,
                paymentMethod: selectedPaymentMode,
                paymentStatus: (selectedPaymentMode === 'online' ? 'Pending' : 'COD'),
                orderStatus: orderCurrentState,
                promoCodeUsed: appliedPromoCode || "",
                promoDiscount: promoDiscountAmount || 0,
                createdAt: new Date().toISOString()
            };
            await window.sendOrderToVercel(payloadData);
        }
    } catch(e) { console.error("Database Save Failed", e); } 

    // Clear Cart and Promo memory
    if(!isBuyNowMode) { localStorage.removeItem('aavira_cart'); }
    localStorage.removeItem('savedPromoCache');

    let previousOrders = JSON.parse(localStorage.getItem('aavira_placed_orders'))||[];
    previousOrders.push(finalOrderId);
    localStorage.setItem('aavira_placed_orders', JSON.stringify(previousOrders));
    
    document.getElementById('displayOrderId').innerText = finalOrderId;
    
    try { successSound.play().catch(err => console.warn("Audio blocked or missing:", err)); } catch(e) { }

    document.getElementById('gatewayBox').style.display='none'; 
    document.getElementById('successBox').style.display='block';

    let dynamicIcon = document.getElementById('dynamicModalIcon');
    let popupActions = document.getElementById('popupActionBtns');

    if (selectedPaymentMode === 'online') {
        
        dynamicIcon.style.background = '#f59e0b'; 
        dynamicIcon.style.border = '4px solid #fef3c7';
        dynamicIcon.style.boxShadow = '0 10px 20px rgba(245,158,11, 0.2)';
        dynamicIcon.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
        
        document.getElementById('successBoxTitle').innerText = 'Awaiting Payment ⏳';
        document.getElementById('successBoxDesc').innerText = 'Please complete the payment on WhatsApp to confirm your order.';
        
        let cleanWhatsAppMessage = `*AAVIRA - ONLINE PAYMENT REQUEST*\n\nHello Team Aavira! I would like to complete the online payment for my order securely.\n\n*ORDER ID:* ${finalOrderId}\n*NAME:* ${customerName}\n*MOBILE:* ${customerPhone}\n\n*ADDRESS:* \n${customerAddress}\n${customerMapLink ? "*MAP LINK:* " + customerMapLink + "\n" : ""}\n*TOTAL TO PAY: ₹ ${totalAmountToPay.toLocaleString()}* \n\n_Please share the UPI ID / Scanner so I can complete this transaction. Thank you!_`;
        
        window.pendingWhatsAppUrl = `https://wa.me/919608720622?text=${encodeURIComponent(cleanWhatsAppMessage)}`;

        popupActions.innerHTML = `
            <button class="btn-pro-action whatsapp" onclick="forceWhatsAppRedirect()">
                <i class="fa-brands fa-whatsapp" style="font-size: 18px;"></i> 
                Open WhatsApp <span id="waTimerTxt" style="font-size:11px; margin-left:4px; background:rgba(0,0,0,0.15); padding:3px 8px; border-radius:12px;">(5s)</span>
            </button>
            <button class="btn-pro-action outline" onclick="window.location.href='./'">
                <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
            </button>
        `;

        let countdown = 5;
        whatsappTimerInterval = setInterval(() => {
            countdown--;
            let timerEl = document.getElementById('waTimerTxt');
            if (timerEl) { timerEl.innerText = `(${countdown}s)`; }
            if (countdown <= 0) {
                clearInterval(whatsappTimerInterval);
                forceWhatsAppRedirect();
            }
        }, 1000);

    } else {
        dynamicIcon.style.background = 'var(--success)';
        dynamicIcon.style.border = '4px solid #D1FAE5';
        dynamicIcon.style.boxShadow = '0 10px 20px rgba(5,150,105, 0.2)';
        dynamicIcon.innerHTML = '<i class="fa-solid fa-check"></i>';

        document.getElementById('successBoxTitle').innerText = 'Order Placed Successfully! 🎉';
        document.getElementById('successBoxDesc').innerText = 'Your order details have been securely recorded. We will process it shortly.';

        popupActions.innerHTML = `
            <button class="btn-pro-action primary" onclick="handleTrackOrder()">
                <i class="fa-solid fa-location-arrow"></i> Track Order
            </button>
            <button class="btn-pro-action outline" onclick="window.location.href='./'">
                <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
            </button>
        `;
    }
}

window.handleTrackOrder = () => { window.location.href = 'orders'; }
