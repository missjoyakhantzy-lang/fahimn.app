import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js";

const msgConfig = {
    apiKey: "AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",
    authDomain: "messaging-d0a0c.firebaseapp.com",
    projectId: "messaging-d0a0c",
    storageBucket: "messaging-d0a0c.firebasestorage.app",
    messagingSenderId: "271709445992",
    appId: "1:271709445992:web:7a0c706288d88fee6a80dd",
    measurementId: "G-8M97W87HRW"
};

const msgApp = initializeApp(msgConfig, "messagingApp");
let messaging = null;
let currentUser = null;

isSupported().then((supported) => {
    if (supported) {
        messaging = getMessaging(msgApp);
        onMessage(messaging, (payload) => {
            window.showCustomAlert(payload.notification.title || "Update!", payload.notification.body, "success");
            // Optional: Trigger system notification if app is open
            try {
                if (Notification.permission === 'granted') {
                    new Notification(payload.notification.title || "Update!", { body: payload.notification.body });
                }
            } catch(e) {}
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.checkUserLogin === 'function') {
        try {
            currentUser = await window.checkUserLogin();
            if (currentUser) {
                const nameInput = document.getElementById('ad_name');
                const phoneInput = document.getElementById('ad_phone');
                const addressInput = document.getElementById('ad_address');
                const cityInput = document.getElementById('ad_city');
                const pinInput = document.getElementById('ad_pin');

                if (currentUser.name && !nameInput.value) nameInput.value = currentUser.name;
                if ((currentUser.phone || currentUser.phoneNumber) && !phoneInput.value) phoneInput.value = currentUser.phone || currentUser.phoneNumber;
                if (currentUser.address && !addressInput.value) addressInput.value = currentUser.address;
                if (currentUser.city && !cityInput.value) cityInput.value = currentUser.city;
                if ((currentUser.pincode || currentUser.pin) && !pinInput.value) pinInput.value = currentUser.pincode || currentUser.pin;
            }
        } catch(e) {
            console.log("Error fetching user data from Vercel:", e);
        }
    }
});

let checkoutItems = []; 
let cartItems = [];     
let productDataCache = {}; 

let appliedPromoCode = "";
let appliedPromoDiscountAmount = 0;
let selectedPaymentMethod = 'cod';

window.selectPayment = function(method, element) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

window.showCustomAlert = function(title, message, type = 'success') {
    const overlay = document.getElementById('alertOverlay');
    const iconEl = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    
    titleEl.innerText = title;
    msgEl.innerHTML = message;

    if (type === 'success') {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--success-green); font-size: 45px;"></i>';
    } else if (type === 'error') {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #d32f2f; font-size: 45px;"></i>';
    } else {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: var(--secondary-color); font-size: 45px;"></i>';
    }
    
    overlay.classList.add('show');
}

window.closeAlertModal = function() {
    document.getElementById('alertOverlay').classList.remove('show');
}

window.autoFetchLocation = function() {
    const btn = document.getElementById('fetchLocBtn');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching...`;
    btn.style.opacity = '0.7';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (data && data.address) {
                    const addr = data.address;
                    document.getElementById('ad_pin').value = addr.postcode || "";
                    document.getElementById('ad_city').value = addr.city || addr.town || addr.state_district || "";
                    let fullAddress = "";
                    if(addr.road) fullAddress += addr.road + ", ";
                    if(addr.suburb) fullAddress += addr.suburb + ", ";
                    if(addr.city) fullAddress += addr.city;
                    document.getElementById('ad_address').value = fullAddress.replace(/,\s*$/, "");
                    
                    btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--success-green);"></i> Location Found`;
                    btn.style.background = 'rgba(232, 245, 233, 0.8)'; 
                    btn.style.color = 'var(--success-green)'; 
                    btn.style.borderColor = 'var(--success-green)'; 
                    btn.style.opacity = '1';
                } else { throw new Error("Not found"); }
            } catch (error) {
                window.showCustomAlert("Location Error", "Could not fetch exact address. Please enter manually.", "error");
                resetLocBtn(btn);
            }
        }, (error) => {
            window.showCustomAlert("Access Denied", "Please turn on your GPS or Location access to use this feature.", "warning");
            resetLocBtn(btn);
        });
    } else {
        window.showCustomAlert("Not Supported", "Geolocation is not supported by your browser.", "error");
        resetLocBtn(btn);
    }
}

function resetLocBtn(btn) {
    btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Use Current Location`;
    btn.style.background = '#F0F8FF'; 
    btn.style.color = '#1976D2'; 
    btn.style.borderColor = '#64B5F6'; 
    btn.style.opacity = '1';
}

window.openMapHelp = function() { 
    document.getElementById('helpOverlay').classList.add('show'); 
    document.getElementById('helpSheet').classList.add('show'); 
}
window.closeMapHelp = function() { 
    document.getElementById('helpOverlay').classList.remove('show'); 
    document.getElementById('helpSheet').classList.remove('show'); 
}

function animateValue(obj, start, end, duration, prefix = "₹") {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = `${prefix}${currentVal.toLocaleString('en-IN')}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = `${prefix}${end.toLocaleString('en-IN')}`;
        }
    };
    window.requestAnimationFrame(step);
}

function showEmptyCart() {
    document.getElementById('mainScroll').style.display = 'none';
    document.getElementById('bottomCheckoutBar').style.display = 'none';
    document.getElementById('emptyCartView').style.display = 'flex';
}

function cleanCartData() {
    let stored = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    let clean = stored.filter(item => item && item.productId && item.productId !== 'null' && item.productId !== 'undefined' && String(item.productId).trim() !== '');
    localStorage.setItem('aavira_cart', JSON.stringify(clean));
    return clean;
}

async function initCheckout() {
    const urlParams = new URLSearchParams(window.location.search);
    const buyNowId = urlParams.get('buy_now');
    
    let storedCart = cleanCartData();

    if (buyNowId && buyNowId !== 'null' && buyNowId !== 'undefined' && buyNowId.trim() !== '') {
        const size = urlParams.get('size') || '32';
        const color = urlParams.get('color') || 'As Shown';
        checkoutItems.push({ productId: buyNowId, size: size, color: color, qty: 1 });
        cartItems = storedCart.filter(item => !(item.productId === buyNowId && item.size === size && item.color === color));
    } else {
        if (storedCart.length === 0) {
            showEmptyCart();
            return;
        }
        checkoutItems = [...storedCart];
        cartItems = []; 
    }

    const allIds = new Set();
    checkoutItems.forEach(i => allIds.add(i.productId));
    cartItems.forEach(i => allIds.add(i.productId));

    let validCheckoutCount = 0;

    try {
        if(typeof window.getVercelData !== 'function') {
            console.error("Vercel data API not found. Please ensure user_data.js is loaded.");
            showEmptyCart();
            return;
        }

        const allProducts = await window.getVercelData();
        
        for (const id of allIds) {
            const product = allProducts.find(p => String(p.id) === String(id));
            if (product) {
                productDataCache[id] = product;
                if (checkoutItems.some(item => String(item.productId) === String(id))) {
                    validCheckoutCount++;
                }
            }
        }
    } catch(e) {
        console.error("Error fetching products from Vercel:", e);
    }
    
    if(validCheckoutCount === 0) {
        showEmptyCart();
        return;
    }

    updateUI(false); 
}

window.applyPromo = async function() {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();
    const msgBox = document.getElementById('promoMsg');
    const btn = document.getElementById('promoBtn');
    
    if(!code) return;

    btn.innerText = '...';
    msgBox.style.display = 'none';

    try {
        if(code === "AAVIRA15" || code === "FIRST15") {
            appliedPromoCode = code;
            appliedPromoDiscountAmount = 150; 
            
            document.getElementById('promoInputGroup').style.display = 'none';
            document.getElementById('apCodeName').innerText = code;
            document.getElementById('appliedPromoBox').classList.add('show');
            
            updateUI(true); 
            window.showCustomAlert("Promo Applied", `Congratulations! Promo code <b>${code}</b> is active.<br>Discount successfully applied to your order.`, "success");
        } else {
            window.showCustomAlert("Invalid Code", "Please enter a valid promo code.", "error");
        }
    } catch(e) {
        window.showCustomAlert("Verification Error", "Code verification failed. Please try again.", "error");
    }
    btn.innerText = 'Apply';
}

window.removePromo = function() {
    appliedPromoCode = "";
    appliedPromoDiscountAmount = 0;
    
    document.getElementById('promoInput').value = '';
    document.getElementById('promoInputGroup').style.display = 'flex';
    document.getElementById('appliedPromoBox').classList.remove('show');
    
    updateUI(true); 
}

window.removeCheckoutItem = function(index) {
    const removedItem = checkoutItems.splice(index, 1)[0];
    
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    let cartIndex = cart.findIndex(i => i.productId === removedItem.productId && i.size === removedItem.size && i.color === removedItem.color);
    
    if(cartIndex > -1) {
        cart.splice(cartIndex, 1);
        localStorage.setItem('aavira_cart', JSON.stringify(cart));
    }
    
    updateUI(true); 
    
    if(checkoutItems.length === 0) {
        showEmptyCart();
    }
}

window.moveItemToCheckout = function(cartIndex) {
    const itemToMove = cartItems[cartIndex];
    let existingIdx = checkoutItems.findIndex(i => i.productId === itemToMove.productId && i.size === itemToMove.size && i.color === itemToMove.color);
    if (existingIdx > -1) { checkoutItems[existingIdx].qty += itemToMove.qty; } 
    else { checkoutItems.push(itemToMove); }
    cartItems.splice(cartIndex, 1);
    updateUI(true); 
}

function updateUI(animate = false) {
    const mainContainer = document.getElementById('orderItemsContainer');
    const suggestContainer = document.getElementById('suggestedItemsContainer');
    const suggestSection = document.getElementById('cartSuggestionsSection');
    const billSection = document.getElementById('billSection');
    const calcLoader = document.getElementById('calcLoader');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    mainContainer.innerHTML = '';
    suggestContainer.innerHTML = '';
    
    let totalMRP = 0;
    let subTotal = 0; 

    checkoutItems = checkoutItems.filter(item => productDataCache[item.productId]);

    if(checkoutItems.length === 0) {
        showEmptyCart();
        return;
    }

    checkoutItems.forEach((item, index) => {
        const product = productDataCache[item.productId];
        let cPrice = parseInt(String(product.price).replace(/,/g, ''));
        let oPrice = product.mrp ? parseInt(String(product.mrp).replace(/,/g, '')) : (cPrice + 450);
        
        totalMRP += (oPrice * item.qty);
        subTotal += (cPrice * item.qty);

        mainContainer.innerHTML += `
            <div class="order-item">
                <div class="o-img" style="background-image: url('${product.imageMain || product.image || product.imageUrl}');"></div>
                <div class="o-details">
                    <div class="o-title">${product.name}</div>
                    <div class="o-meta">Size: ${item.size} | Color: ${item.color}</div>
                    <div class="o-price-qty">
                        <div class="o-price">₹${product.price}</div>
                        <div class="o-qty">Qty: ${item.qty}</div>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="window.removeCheckoutItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });

    cartItems = cartItems.filter(item => productDataCache[item.productId]);

    if (cartItems.length > 0) {
        suggestSection.style.display = 'block';
        cartItems.forEach((item, index) => {
            const product = productDataCache[item.productId];
            suggestContainer.innerHTML += `
                <div class="s-card">
                    <div class="s-img" style="background-image: url('${product.imageMain || product.image || product.imageUrl}');"></div>
                    <div class="s-title">${product.name}</div>
                    <div class="o-meta" style="margin-bottom:0;">Sz: ${item.size} | Qty: ${item.qty}</div>
                    <div class="s-bottom">
                        <div class="s-price">₹${product.price}</div>
                        <button class="btn-add-suggest" onclick="window.moveItemToCheckout(${index})"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            `;
        });
    } else {
        suggestSection.style.display = 'none';
    }

    let productDiscount = totalMRP - subTotal;
    let finalPrice = subTotal - appliedPromoDiscountAmount;
    if(finalPrice < 0) finalPrice = 0;

    const promoRow = document.getElementById('billPromoRow');
    if(appliedPromoDiscountAmount > 0) {
        promoRow.classList.add('show');
        document.getElementById('billPromoDiscount').innerText = `-₹${appliedPromoDiscountAmount.toLocaleString('en-IN')}`;
    } else {
        promoRow.classList.remove('show');
    }

    if (animate) {
        billSection.classList.add('calculating');
        calcLoader.style.display = 'inline-block';
        placeOrderBtn.disabled = true;
        document.getElementById('btnText').innerText = 'CALCULATING...';

        let currentTotalStr = document.getElementById('billTotal').innerText.replace(/[^0-9]/g, '');
        let startTotal = currentTotalStr ? parseInt(currentTotalStr) : 0;

        animateValue(document.getElementById('billMrp'), 0, totalMRP, 800);
        animateValue(document.getElementById('billDiscount'), 0, productDiscount, 800, "-₹");
        animateValue(document.getElementById('billTotal'), startTotal, finalPrice, 800);
        animateValue(document.getElementById('bottomTotal'), startTotal, finalPrice, 800);

        setTimeout(() => {
            billSection.classList.remove('calculating');
            calcLoader.style.display = 'none';
            placeOrderBtn.disabled = false;
            document.getElementById('btnText').innerText = 'PLACE ORDER';
        }, 800);

    } else {
        document.getElementById('billMrp').innerText = `₹${totalMRP.toLocaleString('en-IN')}`;
        document.getElementById('billDiscount').innerText = `-₹${productDiscount.toLocaleString('en-IN')}`;
        document.getElementById('billTotal').innerText = `₹${finalPrice.toLocaleString('en-IN')}`;
        document.getElementById('bottomTotal').innerText = `₹${finalPrice.toLocaleString('en-IN')}`;
    }
}

async function hitBackendNotification(token, orderId, name, amount) {
    try {
        const response = await fetch('https://aavirafashions.pythonanywhere.com/send_notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fcm_token: token,
                order_id: orderId,
                customer_name: name,
                total_amount: amount,
                message: "Your order is placed successfully!"
            })
        });
        console.log("Backend Hit Success", await response.text());
    } catch (error) {
        console.log("Backend Hit Failed", error);
    }
}

function showSuccess(orderId, finalTotalAmount, name) {
    try {
        const successAudio = new Audio('https://actions.google.com/sounds/v1/alarms/success_bell.ogg');
        successAudio.play();
    } catch (error) {}

    document.getElementById('displayOrderId').innerText = orderId;
    document.getElementById('gatewayBox').style.display = 'none';
    document.getElementById('successBox').style.display = 'block';

    const notifPrompt = document.getElementById('successNotifPrompt');
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        notifPrompt.style.display = 'block';
        
        window.requestNotificationPermission = async function(e) {
            if(e) e.preventDefault();
            const btn = document.getElementById('inlineNotifBtn');
            btn.innerText = "Allowing...";
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted' && messaging) {
                    const token = await getToken(messaging, { vapidKey: 'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU' });
                    if (token) {
                        await hitBackendNotification(token, orderId, name, finalTotalAmount);
                    }
                    notifPrompt.innerHTML = `<p style="color: var(--success-green); font-size: 13px; font-weight: 600; margin: 10px 0;"><i class="fa-solid fa-check-circle"></i> Notifications Enabled!</p>`;
                } else {
                    notifPrompt.style.display = 'none';
                }
            } catch(err) {
                notifPrompt.style.display = 'none';
            }
        };
    } else {
        notifPrompt.style.display = 'none';
    }

    const trackBtn = document.getElementById('successActionBtn');
    if (trackBtn) {
        trackBtn.onclick = () => {
            window.location.href = 'profile.html';
        };
    }
    localStorage.removeItem('aavira_cart');
}

window.placeOrder = async function() {
    const name = document.getElementById('ad_name').value.trim();
    const phone = document.getElementById('ad_phone').value.trim();
    const pin = document.getElementById('ad_pin').value.trim();
    const city = document.getElementById('ad_city').value.trim();
    const address = document.getElementById('ad_address').value.trim();
    const landmark = document.getElementById('ad_landmark').value.trim();
    const mapLink = document.getElementById('ad_maplink').value.trim();

    if(!name || !phone || !pin || !city || !address) {
        window.showCustomAlert("Fields Missing", "Please fill in all the required delivery address fields.", "warning");
        document.getElementById('mainScroll').scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if(phone.length < 10) { 
        window.showCustomAlert("Invalid Number", "Please enter a valid 10-digit mobile number.", "warning"); 
        return; 
    }

    const btn = document.getElementById('placeOrderBtn');
    const btnText = document.getElementById('btnText');
    
    btn.disabled = true;
    btnText.innerText = 'PROCESSING...';

    const modal = document.getElementById('processModal');
    const gatewayBox = document.getElementById('gatewayBox');
    
    gatewayBox.style.display = 'flex';
    document.getElementById('successBox').style.display = 'none';
    modal.classList.add('show');

    if(selectedPaymentMethod === 'online') {
        document.getElementById('processText').innerText = "Connecting to Payment Gateway...";
    } else {
        document.getElementById('processText').innerText = "Confirming your Order...";
    }

    let subTotal = 0;
    let finalItemsToSave = [];

    checkoutItems.forEach(item => {
        const product = productDataCache[item.productId];
        let cPrice = parseInt(String(product.price).replace(/,/g, ''));
        subTotal += (cPrice * item.qty);
        finalItemsToSave.push({
            productId: item.productId, 
            name: product.name, 
            price: cPrice,
            qty: item.qty, 
            size: item.size, 
            color: item.color, 
            image: product.imageMain || product.image || product.imageUrl
        });
    });
    
    let finalTotalAmount = subTotal - appliedPromoDiscountAmount;
    if(finalTotalAmount < 0) finalTotalAmount = 0;

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const fullAddress = `${address}, ${landmark ? landmark + ', ' : ''}${city}, PIN: ${pin}`;

    const orderPayload = {
        orderId: orderId, 
        userId: currentUser ? (currentUser.uid || currentUser.id) : 'guest', 
        customerName: name, phone: phone, 
        address: fullAddress, 
        mapLink: mapLink,
        items: finalItemsToSave, 
        totalAmount: finalTotalAmount, 
        promoCodeUsed: appliedPromoCode || "None",
        promoDiscount: appliedPromoDiscountAmount,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: selectedPaymentMethod === 'cod' ? 'Pending' : 'Paid', 
        orderStatus: 'Placed',
        createdAt: new Date().toISOString()
    };

    try {
        if (typeof window.sendOrderToVercel === 'function') {
            await window.sendOrderToVercel(orderPayload);
        } else {
            await new Promise(r => setTimeout(r, 1500));
        }

        localStorage.setItem('aavira_cart', JSON.stringify(cartItems)); 

        if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted' && messaging) {
                try {
                    const token = await getToken(messaging, { vapidKey: 'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU' });
                    if (token) {
                        await hitBackendNotification(token, orderId, name, finalTotalAmount);
                    }
                } catch(err) { console.log(err); }
            }
        }
        
        showSuccess(orderId, finalTotalAmount, name);

    } catch(e) {
        console.error("Order Failed: ", e);
        window.showCustomAlert("Order Failed", "The order could not be processed. Please try again.", "error");
        btn.disabled = false;
        btnText.innerText = 'PLACE ORDER';
        modal.classList.remove('show');
    }
}

initCheckout();
