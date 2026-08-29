/* =========================================================
   AAVIRA LUXE - CHECKOUT SCRIPT (checkout.script.js)
   ========================================================= */

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

// Safe Toast Controller
const ToastAlert = {
    show(message, isSuccess = false) {
        const toastEl = document.getElementById('alertToast');
        const toastTxt = document.getElementById('toastMessage');
        const toastIcn = document.getElementById('toastIcon');
        
        if (!toastEl || !toastTxt || !toastIcn) return;

        if (navigator.vibrate) navigator.vibrate(isSuccess ? 40 : 60);
        toastTxt.innerText = message;
        toastIcn.innerHTML = isSuccess 
            ? '<i class="fa-solid fa-circle-check" style="color:#10b981; font-size:22px;"></i>' 
            : '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444; font-size:22px;"></i>';
        
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
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
        return val.length >= 2;
    };

    if(checkRules()) {
        inputGroup.classList.remove('is-invalid'); 
        return true;
    } else {
        if(forceShowError || val.length > 0) inputGroup.classList.add('is-invalid');
        return false;
    }
}

// Save & Restore Draft
function saveFormDraft() { 
    let formData = {}; 
    document.querySelectorAll('.pro-input').forEach(input => formData[input.id] = input.value);
    localStorage.setItem('checkoutAddressDraft', JSON.stringify(formData));
}

function restoreFormDraft() { 
    try {
        let draftDataString = localStorage.getItem('checkoutAddressDraft');
        if (draftDataString) {
            let formData = JSON.parse(draftDataString);
            Object.keys(formData).forEach(key => { 
                let inputEl = document.getElementById(key); 
                if(inputEl && !inputEl.value && formData[key]){ 
                    inputEl.value = formData[key]; 
                    validateInputField(inputEl); 
                } 
            });
        }
    } catch(e) {}
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
        } else if ((item.fallbackPrice || item.price) && (item.fallbackName || item.name)) {
            productDatabase[pId] = { 
                id: pId, 
                name: item.fallbackName || item.name, 
                price: item.fallbackPrice || item.price, 
                image: item.image || "https://placehold.co/100" 
            };
            item.productId = pId;
            return true;
        }
        return false;
    });

    if(cartItems.length === 0){
        const mainScroll = document.getElementById('mainScroll');
        const bottomBar = document.getElementById('bottomCheckoutBar');
        const emptyView = document.getElementById('emptyCartView');
        if (mainScroll) mainScroll.style.display = 'none'; 
        if (bottomBar) bottomBar.style.display = 'none'; 
        if (emptyView) emptyView.style.display = 'flex';
        return;
    }

    // Restore promo code if saved
    try {
        let savedPromo = JSON.parse(localStorage.getItem('savedPromoCache'));
        if(savedPromo && savedPromo.label && savedPromo.discount) {
            appliedPromoCode = savedPromo.label;
            promoDiscountAmount = Number(savedPromo.discount);
            const pGroup = document.getElementById('promoInputGroup');
            const apCode = document.getElementById('apCodeName');
            const apBox = document.getElementById('appliedPromoBox');
            if (pGroup) pGroup.style.display = 'none';
            if (apCode) apCode.innerText = appliedPromoCode;
            if (apBox) apBox.style.display = 'flex';
        }
    } catch(e) {}

    const emptyView = document.getElementById('emptyCartView');
    const mainScroll = document.getElementById('mainScroll');
    const bottomBar = document.getElementById('bottomCheckoutBar');
    if (emptyView) emptyView.style.display = 'none';
    if (mainScroll) mainScroll.style.display = 'block';
    if (bottomBar) bottomBar.style.display = 'flex';
    
    renderCartUI();
}

// ==========================================
// WISHLIST / SUGGESTIONS LOGIC
// ==========================================
function renderWishlistSuggestions() {
    try {
        let suggestedProducts = [];
        let currentCartIds = cartItems.map(item => String(item.productId).trim());
        let wishlistIds = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
        let allProductIds = Object.keys(productDatabase);
        let combinedIds = [...new Set([...wishlistIds, ...allProductIds])]; 
        
        for(let id of combinedIds) {
            let cleanId = String(id).trim();
            if(!currentCartIds.includes(cleanId) && productDatabase[cleanId]) {
                suggestedProducts.push(productDatabase[cleanId]);
            }
            if(suggestedProducts.length >= 6) break;
        }

        const suggSection = document.getElementById('cartSuggestionsSection');
        const suggContainer = document.getElementById('suggestedItemsContainer');

        if(suggestedProducts.length > 0 && suggSection && suggContainer) {
            suggSection.style.display = 'block'; 
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
            suggContainer.innerHTML = htmlString;
        } else if (suggSection) {
            suggSection.style.display = 'none'; 
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
    const targetOpt = document.getElementById((deliveryType==='express')?'opt_exp':'opt_std');
    if (targetOpt) targetOpt.classList.add('selected');
    renderCartUI();
};

window.updateCustomWrapPreferencesCosts = (checkboxEl) => { 
    giftWrapFee = checkboxEl.checked ? 49 : 0; 
    renderCartUI(); 
};

window.pickPaymentMode = (paymentType, domElement) => { 
    selectedPaymentMode = paymentType; 
    document.querySelectorAll('.pay-option').forEach(el=>el.classList.remove('selected')); 
    domElement.classList.add('selected');
};

window.removeCartItem = (index) => { 
    cartItems.splice(index, 1); 
    
    if(!isBuyNowMode) {
        localStorage.setItem('aavira_cart', JSON.stringify(cartItems));
    }

    if(cartItems.length === 0){
        const mainScroll = document.getElementById('mainScroll');
        const bottomBar = document.getElementById('bottomCheckoutBar');
        const emptyView = document.getElementById('emptyCartView');
        if (mainScroll) mainScroll.style.display = 'none'; 
        if (bottomBar) bottomBar.style.display = 'none'; 
        if (emptyView) emptyView.style.display = 'flex';
    } else { 
        renderCartUI(); 
    }
};

function renderCartUI(){
    const orderContainer = document.getElementById('orderItemsContainer'); 
    if(!orderContainer) return; 
    orderContainer.innerHTML = '';
    
    const countBadge = document.getElementById('itemCountBadge');
    if (countBadge) countBadge.innerText = `${cartItems.length} ITEMS`;

    let totalMRP = 0; 
    let totalCartValue = 0;

    cartItems.forEach((item, index) => {
        let product = productDatabase[item.productId]; 
        if(!product) return;
        let currentPrice = parseCurrencyNumber(product.price);
        let originalMrp = product.mrp ? parseCurrencyNumber(product.mrp) : (currentPrice + 500);
        
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

    const billMrp = document.getElementById('billMrp');
    const billDisc = document.getElementById('billDiscount');
    const promoRow = document.getElementById('billPromoRow');
    const promoDisc = document.getElementById('billPromoDiscount');
    const billDelivery = document.getElementById('billDelivery');
    const rowGift = document.getElementById('row_gift');
    const billTotal = document.getElementById('billTotal');
    const bottomTotal = document.getElementById('bottomTotal');

    if (billMrp) billMrp.innerText = `₹ ${totalMRP.toLocaleString()}`;
    if (billDisc) billDisc.innerText = `- ₹ ${(totalMRP - totalCartValue).toLocaleString()}`;
    
    if (promoDiscountAmount && promoRow && promoDisc) { 
        promoRow.style.display = 'flex'; 
        promoDisc.innerText = `- ₹ ${promoDiscountAmount.toLocaleString()}`;
    } else if (promoRow) {
        promoRow.style.display = 'none';
    }

    if (billDelivery) {
        if (deliveryFee) { 
            billDelivery.innerText = `₹ 99`; 
            billDelivery.className = ''; 
        } else { 
            billDelivery.innerText = `Free`; 
            billDelivery.className = 'green-txt'; 
        }
    }
    
    if (rowGift) rowGift.style.display = giftWrapFee ? 'flex' : 'none';
    let finalPayableAmount = Math.max(0, totalCartValue + deliveryFee + giftWrapFee - promoDiscountAmount);
    
    if (billTotal) billTotal.innerText = `₹ ${finalPayableAmount.toLocaleString()}`;
    if (bottomTotal) bottomTotal.innerText = `₹ ${finalPayableAmount.toLocaleString()}`;

    renderWishlistSuggestions();
}

// PROMO CODE LOGIC
window.verifyAndApplyCouponAPI = async () => {
    let inputField = document.getElementById('promoInput'); 
    if(!inputField) return;
    let code = inputField.value.trim().toUpperCase();
    
    if(code.length < 3) return ToastAlert.show("Please enter a valid coupon code.", false);
    
    const btn = document.getElementById('promoBtn'); 
    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<div class="btn-spinner"></div>'; btn.disabled = true; }

    let discountAmt = 0;
    let isValid = false;

    try {
        let response = await fetch(`https://ssxpq15in.vercel.app/api/promo_codes/${code}`);
        if (!response.ok) response = await fetch(`https://ssxpq15in.vercel.app/api/promocodes/${code}`);
        
        if (response.ok) {
            let result = await response.json();
            let promoData = result.data || result;
            if (promoData && promoData.isActive !== false) {
                discountAmt = Number(promoData.amount || promoData.discountAmount || promoData.discount || 0);
                if(discountAmt > 0) isValid = true;
            }
        }
    } catch(error) {}

    // Fallbacks
    if (!isValid) {
        if(code === 'LUXURY500') { discountAmt = 500; isValid = true; }
        else if(code === 'AAVIRA200') { discountAmt = 200; isValid = true; }
    }

    if(isValid) {
        applyPromoUI(code, discountAmt);
    } else {
        ToastAlert.show('Invalid or Expired Coupon Code.', false);
    }
    
    if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
};

function applyPromoUI(code, discount) {
    appliedPromoCode = code;
    promoDiscountAmount = discount;
    localStorage.setItem('savedPromoCache', JSON.stringify({label: code, discount: discount}));
    
    const pGroup = document.getElementById('promoInputGroup');
    const apCode = document.getElementById('apCodeName');
    const apBox = document.getElementById('appliedPromoBox');
    
    if (pGroup) pGroup.style.display = 'none'; 
    if (apCode) apCode.innerText = code; 
    if (apBox) apBox.style.display = 'flex';
    
    ToastAlert.show("Coupon applied successfully!", true); 
    renderCartUI();
}

window.removeActiveCoupon = () => { 
    appliedPromoCode = ""; 
    promoDiscountAmount = 0; 
    localStorage.removeItem('savedPromoCache'); 
    
    const pGroup = document.getElementById('promoInputGroup');
    const pInput = document.getElementById('promoInput');
    const apBox = document.getElementById('appliedPromoBox');

    if (pGroup) pGroup.style.display = 'flex'; 
    if (pInput) pInput.value = ''; 
    if (apBox) apBox.style.display = 'none'; 
    
    renderCartUI(); 
    ToastAlert.show("Coupon Removed", true);
};

window.forceWhatsAppRedirect = () => {
    if (whatsappTimerInterval) clearInterval(whatsappTimerInterval);
    if (window.pendingWhatsAppUrl) {
        window.location.href = window.pendingWhatsAppUrl;
    }
};

// ==========================================
// 🔥 SUBMIT FINAL ORDER & SYNC STATE 🔥
// ==========================================
window.submitFinalOrder = async () => {
    let isFormValid = true; 
    let firstErrorField = null;
    
    ['ad_name', 'ad_phone', 'ad_pin', 'ad_city', 'ad_address', 'ad_email'].forEach(id => { 
        let inputEl = document.getElementById(id); 
        if(!validateInputField(inputEl, true)){ 
            isFormValid = false; 
            if (inputEl) inputEl.closest('.pro-input-group').classList.add('is-invalid'); 
            if (!firstErrorField) firstErrorField = inputEl;
        } 
    });
    
    if(!isFormValid){ 
        ToastAlert.show('Please fill all required address fields correctly.', false); 
        if(firstErrorField) firstErrorField.scrollIntoView({behavior:'smooth'}); 
        return; 
    }

    const processModal = document.getElementById('processModal');
    const processText = document.getElementById('processText');
    if (processModal) processModal.classList.add('active');
    if (processText) processText.innerText = 'Creating Secure Invoice Request...';

    let productsCost = 0;
    let formattedItemsPayload = cartItems.map(item => {
        let dbProduct = productDatabase[item.productId] || {}; 
        let price = parseCurrencyNumber(dbProduct.price || 0); 
        productsCost += (price * item.qty);
        
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

    // Generate Standard AVF Order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const finalOrderId = `AVF-${randomNum}`;
    
    const customerName = document.getElementById('ad_name').value.trim();
    const customerPhone = document.getElementById('ad_phone').value.trim();
    const customerEmail = document.getElementById('ad_email').value.trim();
    const customerMapLink = document.getElementById('ad_map_link') ? document.getElementById('ad_map_link').value.trim() : "";
    const customerAddress = `${document.getElementById('ad_address').value.trim()}, ${document.getElementById('ad_city').value.trim()} - Pincode: ${document.getElementById('ad_pin').value.trim()}`;
    
    const totalAmountToPay = Math.max(0, productsCost + deliveryFee + giftWrapFee - promoDiscountAmount);
    const orderCurrentState = (selectedPaymentMode === 'online') ? 'Processing' : 'Processing';
    
    // Save to Vercel/Backend Database
    try { 
        if (typeof window.sendOrderToVercel === 'function'){
            let payloadData = {
                orderId: finalOrderId,
                userId: customerEmail || customerPhone,
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
    } catch(e) { 
        console.error("Database Save Failed", e); 
    } 

    // 🔥 1. CLEAR CART, PROMO & ADDRESS DRAFT MEMORY 🔥
    if(!isBuyNowMode) { 
        localStorage.removeItem('aavira_cart'); 
    }
    localStorage.removeItem('savedPromoCache');
    localStorage.removeItem('checkoutAddressDraft'); // <--- Address draft cleared!

    // 🔥 2. STRICT ORDER & USER ISOLATION SYNC 🔥
    // Save current user credentials on this device so orders screen syncs immediately
    localStorage.setItem('aavira_user_phone', customerPhone);
    if (customerEmail) localStorage.setItem('aavira_user_email', customerEmail);

    let previousOrders = [];
    try {
        previousOrders = JSON.parse(localStorage.getItem('aavira_placed_orders')) || [];
    } catch(e) {}
    
    if (!previousOrders.includes(finalOrderId)) {
        previousOrders.push(finalOrderId);
    }
    localStorage.setItem('aavira_placed_orders', JSON.stringify(previousOrders));
    
    const displayOrderIdEl = document.getElementById('displayOrderId');
    if (displayOrderIdEl) displayOrderIdEl.innerText = finalOrderId;

    const gatewayBox = document.getElementById('gatewayBox');
    const successBox = document.getElementById('successBox');
    if (gatewayBox) gatewayBox.style.display = 'none'; 
    if (successBox) successBox.style.display = 'block';

    const dynamicIcon = document.getElementById('dynamicModalIcon');
    const popupActions = document.getElementById('popupActionBtns');

    if (selectedPaymentMode === 'online') {
        if (dynamicIcon) {
            dynamicIcon.style.background = '#f59e0b'; 
            dynamicIcon.style.border = '4px solid #fef3c7';
            dynamicIcon.style.boxShadow = '0 10px 20px rgba(245,158,11, 0.2)';
            dynamicIcon.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
        }
        
        const titleEl = document.getElementById('successBoxTitle');
        const descEl = document.getElementById('successBoxDesc');
        if (titleEl) titleEl.innerText = 'Awaiting Payment ⏳';
        if (descEl) descEl.innerText = 'Please complete the payment on WhatsApp to confirm your order.';
        
        let cleanWhatsAppMessage = `*AAVIRA - ONLINE PAYMENT REQUEST*\n\nHello Team Aavira! I would like to complete the online payment for my order.\n\n*ORDER ID:* #${finalOrderId}\n*NAME:* ${customerName}\n*MOBILE:* ${customerPhone}\n\n*ADDRESS:* \n${customerAddress}\n\n*TOTAL TO PAY: ₹ ${totalAmountToPay.toLocaleString()}*\n\n_Please share the UPI ID / Payment QR code. Thank you!_`;
        
        window.pendingWhatsAppUrl = `https://wa.me/919608720622?text=${encodeURIComponent(cleanWhatsAppMessage)}`;

        if (popupActions) {
            popupActions.innerHTML = `
                <button class="btn-pro-action whatsapp" onclick="forceWhatsAppRedirect()">
                    <i class="fa-brands fa-whatsapp" style="font-size: 18px;"></i> 
                    Open WhatsApp <span id="waTimerTxt" style="font-size:11px; margin-left:4px; background:rgba(0,0,0,0.15); padding:3px 8px; border-radius:12px;">(5s)</span>
                </button>
                <button class="btn-pro-action outline" onclick="window.location.href='orders.html'">
                    <i class="fa-solid fa-box"></i> View My Orders
                </button>
            `;
        }

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
        if (dynamicIcon) {
            dynamicIcon.style.background = 'var(--success)';
            dynamicIcon.style.border = '4px solid #D1FAE5';
            dynamicIcon.style.boxShadow = '0 10px 20px rgba(5,150,105, 0.2)';
            dynamicIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        }

        const titleEl = document.getElementById('successBoxTitle');
        const descEl = document.getElementById('successBoxDesc');
        if (titleEl) titleEl.innerText = 'Order Placed Successfully! 🎉';
        if (descEl) descEl.innerText = 'Your order details have been securely recorded. We will process it shortly.';

        if (popupActions) {
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
};

window.handleTrackOrder = () => { 
    window.location.href = 'orders'; 
};
