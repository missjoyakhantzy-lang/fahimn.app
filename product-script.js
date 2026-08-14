// ==========================================
// AAVIRA - PRODUCT SCRIPT LOGIC
// ==========================================

window.allProductsArray = [];
window.currentProductIndex = 0;
window.currentProductIdForReviews = null;
window.customMeasurementsText = null; 
let tempSignupData = { name: "", email: "", pwd: "" };

document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    let total = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBadge = document.getElementById('topCartBadge');
    if(cartBadge) { cartBadge.innerText = total; }
    loadProductData();
});

window.shareProduct = async function(event) {
    event.preventDefault();
    const title = document.getElementById('productTitle').innerText || "Aavira Premium";
    const url = window.location.href;
    
    if (navigator.share) {
        try { await navigator.share({ title: title, text: 'Check out this beautiful product on Aavira.', url: url });
        } catch (err) { console.log('Share prompt failed.', err); }
    } else {
        try { await navigator.clipboard.writeText(url); alert("Product link copied!");
        } catch (err) { alert("Unable to copy link."); }
    }
}

window.toggleHeart = function(event, button) {
    event.preventDefault();
    const icon = button.querySelector('i');
    if (icon.classList.contains('fa-regular')) {
        icon.classList.replace('fa-regular', 'fa-solid'); icon.style.color = 'var(--primary-color)';
    } else {
        icon.classList.replace('fa-solid', 'fa-regular'); icon.style.color = 'var(--icon-color)';
    }
}

window.openCustomSize = function() { document.getElementById('customSizeSheet').style.display = 'flex'; }
window.closeCustomSize = function() { document.getElementById('customSizeSheet').style.display = 'none'; }
window.saveCustomSize = function() {
    const bust = document.getElementById('csBust').value; const waist = document.getElementById('csWaist').value;
    if(!bust || !waist) { alert("Please enter measurements."); return; }
    window.customMeasurementsText = `Custom (Bust: ${bust}", Waist: ${waist}")`;
    document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
    document.querySelector('.custom-size-btn').classList.add('active');
    document.getElementById('sizeOptionsContainer').classList.remove('shake-error');
    closeCustomSize();
}

window.selectSize = function(element) {
    window.customMeasurementsText = null;
    document.querySelectorAll('.size-box').forEach(box => box.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('sizeOptionsContainer').classList.remove('shake-error');
}

function getSelectedSize() {
    const activeSize = document.querySelector('.size-box.active');
    if(!activeSize) return null;
    if(activeSize.classList.contains('custom-size-btn')) return window.customMeasurementsText || "Custom";
    return activeSize.innerText;
}

// 🔥 COLOR VALUE GETTER FIXED 🔥
function getSelectedColor() { 
    return document.getElementById('colorName').innerText || 'As Shown'; 
}

window.selectColorSwatch = function(element, colorName, imageUrl = null) {
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('colorName').innerText = colorName;
    if(imageUrl) {
        const carousel = document.getElementById('mediaCarousel');
        if(carousel) carousel.scrollTo({ left: 0, behavior: 'smooth' });
    }
}

window.showErrorPopup = function() {
    const popup = document.getElementById('errorPopup');
    if(popup) { popup.style.display = 'flex'; setTimeout(() => popup.classList.add('show'), 10); }
}

function triggerSizeError() {
    const sizeContainer = document.getElementById('sizeOptionsContainer');
    if(sizeContainer) {
        sizeContainer.classList.remove('shake-error'); void sizeContainer.offsetWidth; sizeContainer.classList.add('shake-error');
    }
    if (navigator.vibrate) navigator.vibrate(200); 
}

window.addToCart = function(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    let productId = decodeURIComponent(urlParams.get('id')).trim();
    if (!productId) { window.showErrorPopup(); return; }

    const size = getSelectedSize(); if (!size) { triggerSizeError(); return; }
    const color = getSelectedColor();
    
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const exIdx = cart.findIndex(item => String(item.productId) === String(productId) && item.size === size && item.color === color);

    if (exIdx > -1) cart[exIdx].qty += 1; 
    else cart.push({ productId: productId, size: size, color: color, qty: 1 });
    
    localStorage.setItem('aavira_cart', JSON.stringify(cart));
    const cartBadge = document.getElementById('topCartBadge');
    if(cartBadge) cartBadge.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    alert("Product added to cart successfully!");
}

window.buyNow = function(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    let productId = decodeURIComponent(urlParams.get('id')).trim();
    if (!productId) { window.showErrorPopup(); return; }

    const size = getSelectedSize(); if (!size) { triggerSizeError(); return; }
    const color = getSelectedColor();
    
    window.location.href = "make_order?buy_now=" + encodeURIComponent(productId) + "&size=" + encodeURIComponent(size) + "&color=" + encodeURIComponent(color);
}

window.scrollToSlide = function(index) {
    const carousel = document.getElementById('mediaCarousel');
    if(carousel) carousel.scrollTo({ left: carousel.offsetWidth * index, behavior: 'smooth' });
}

const mediaCarousel = document.getElementById('mediaCarousel');
if (mediaCarousel) {
    mediaCarousel.addEventListener('scroll', () => {
        const scrollIndex = Math.round(mediaCarousel.scrollLeft / mediaCarousel.offsetWidth);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            if(i === scrollIndex) dot.classList.add('active'); else dot.classList.remove('active');
        });
    });
}

async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');
    if (!productId) { window.showErrorPopup(); return; }
    
    productId = decodeURIComponent(productId).trim();
    window.currentProductIdForReviews = productId; 

    try {
        const allProducts = await window.getVercelData();
        window.allProductsArray = allProducts;
        window.currentProductIndex = allProducts.findIndex(p => String(p.id).trim() === String(productId));
        const productData = allProducts[window.currentProductIndex];

        if (productData) {
            document.getElementById('productTitle').innerText = productData.name; 
            document.getElementById('productTitle').classList.remove('skeleton'); 
            
            document.getElementById('currentPrice').innerText = "₹" + productData.price; 
            document.getElementById('currentPrice').classList.remove('skeleton'); 

            let mrp = productData.mrp || (parseInt(String(productData.price).replace(/,/g, '')) + 450).toLocaleString('en-IN');
            document.getElementById('oldPrice').innerText = "₹" + mrp; 
            document.getElementById('oldPrice').classList.remove('skeleton'); 
            
            const cPrice = parseInt(String(productData.price).replace(/,/g, ''));
            const oPrice = parseInt(String(mrp).replace(/,/g, ''));
            if(oPrice > cPrice) {
                const discount = Math.round(((oPrice - cPrice) / oPrice) * 100);
                document.getElementById('discountTag').innerText = discount + "% OFF";
                document.getElementById('discountTag').style.display = "inline-block";
            }

            if(productData.fabric) document.getElementById('specFabric').innerText = productData.fabric;
            if(productData.pattern) document.getElementById('specPattern').innerText = productData.pattern;
            document.getElementById('productDescription').innerText = productData.description; 
            document.getElementById('productDescription').classList.remove('skeleton');
            
            document.getElementById('productSku').innerText = "AV-" + String(productId).substring(0, 5).toUpperCase() + "-SURAT"; 
            document.getElementById('productSku').classList.remove('skeleton');

            // 🔥 SMART COLOR LOGIC 🔥 (Sirf tab dikhega jab upload kiya ho)
            const colorSection = document.getElementById('colorSectionWrapper');
            const colorOpts = document.getElementById('dynamicColorOptions');
            const mainImage = productData.imageMain || productData.image || productData.imageUrl;

            if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
                colorSection.style.display = 'block';
                let firstColorName = typeof productData.colors[0] === 'object' ? productData.colors[0].name : productData.colors[0];
                document.getElementById('colorName').innerText = firstColorName;

                colorOpts.innerHTML = '';
                productData.colors.forEach((colObj, idx) => {
                    let cName = typeof colObj === 'object' ? colObj.name : colObj;
                    let cImg = typeof colObj === 'object' && colObj.image ? colObj.image : mainImage;
                    let activeCls = idx === 0 ? 'active' : '';

                    colorOpts.innerHTML += `
                        <div class="color-swatch ${activeCls}" style="background-image: url('${cImg}'); background-size: cover; width: 40px; height: 40px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 2px; background-clip: content-box; display: flex; justify-content: center; align-items: center;" onclick="selectColorSwatch(this, '${cName}', '${cImg}')" title="${cName}">
                            <i class="fa-solid fa-check" style="display: ${idx === 0 ? 'block' : 'none'}; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);"></i>
                        </div>`;
                });
            } else {
                // Agar colors array nahi hai toh pura box HIDE kar do
                colorSection.style.display = 'none';
                document.getElementById('colorName').innerText = 'As Shown';
            }

            const carousel = document.getElementById('mediaCarousel');
            const dotsContainer = document.getElementById('carouselDots');
            document.getElementById('mediaWrapper').classList.remove('skeleton');
            carousel.innerHTML = ''; dotsContainer.innerHTML = '';

            let slideCount = 0;
            if(mainImage) { carousel.innerHTML += `<div class="slide"><img src="${mainImage}"></div>`; dotsContainer.innerHTML += `<div class="dot active" onclick="scrollToSlide(${slideCount++})"></div>`; }
            if(productData.imageBack) { carousel.innerHTML += `<div class="slide"><img src="${productData.imageBack}"></div>`; dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount++})"></div>`; }
            if(productData.imageSide) { carousel.innerHTML += `<div class="slide"><img src="${productData.imageSide}"></div>`; dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount++})"></div>`; }
            if(productData.videoUrl) { carousel.innerHTML += `<div class="slide"><video src="${productData.videoUrl}" playsinline loop autoplay muted></video></div>`; dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount++})"></div>`; }

            await loadRealReviewsFromDB();
        } else { window.showErrorPopup(); }
    } catch (error) { window.showErrorPopup(); }
}

// =========================================================================
// CUSTOMER REVIEWS
// =========================================================================
let selectedRating = 0;
window.handleWriteReviewClick = function() {
    const savedName = localStorage.getItem('aavira_display_name');
    if (!savedName || savedName.toLowerCase() === "guest user" || savedName === "") {
        window.openLoginModal(); // Seedha Login Modal Khulega!
    } else {
        document.getElementById('reviewUserName').innerText = savedName;
        document.getElementById('reviewUserInitial').innerText = savedName.charAt(0).toUpperCase();
        document.getElementById('reviewModal').style.display = 'flex';
    }
}
window.closeReviewModals = function() {
    document.getElementById('loginPromptModal').style.display = 'none'; document.getElementById('reviewModal').style.display = 'none';
}
window.setRating = function(val) {
    selectedRating = parseInt(val);
    document.querySelectorAll('#starSelector i').forEach(star => {
        star.style.color = parseInt(star.getAttribute('data-val')) <= val ? '#E5C158' : '#ddd';
    });
}
window.submitReview = async function() {
    if (selectedRating === 0) { alert("Please select a star rating!"); return; }
    const textEl = document.getElementById('reviewText');
    if (!textEl.value.trim()) { alert("Please write your experience!"); return; }

    const newReview = { name: localStorage.getItem('aavira_display_name') || "User", rating: selectedRating, text: textEl.value.trim(), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) };
    const btn = document.getElementById('submitReviewBtn');
    const ogText = btn.innerHTML; btn.innerHTML = 'Saving...'; btn.disabled = true;

    if(typeof window.saveReviewToDatabase === 'function') {
        const isSaved = await window.saveReviewToDatabase(window.currentProductIdForReviews, newReview);
        if(isSaved) { alert("Review Posted Successfully!"); closeReviewModals(); setRating(0); textEl.value = ''; await loadRealReviewsFromDB(); } 
        else { saveToLocalFallback(window.currentProductIdForReviews, newReview); }
    } else { saveToLocalFallback(window.currentProductIdForReviews, newReview); }
    btn.innerHTML = ogText; btn.disabled = false;
}
function saveToLocalFallback(productId, newReview) {
    let productReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`)) || [];
    productReviews.unshift(newReview); localStorage.setItem(`reviews_${productId}`, JSON.stringify(productReviews));
    alert("Review Posted Successfully!"); closeReviewModals(); setRating(0); document.getElementById('reviewText').value = ''; loadRealReviewsFromDB(); 
}
window.loadRealReviewsFromDB = async function() {
    const container = document.getElementById('reviewsList');
    let realReviews = [];
    if(typeof window.getReviewsFromDatabase === 'function') {
        const dbReviews = await window.getReviewsFromDatabase(window.currentProductIdForReviews);
        if(dbReviews && dbReviews.length > 0) realReviews = dbReviews;
    }
    if(realReviews.length === 0) realReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || [];

    if (realReviews.length === 0) {
        container.innerHTML = `<div style="width: 100%; text-align: center; padding: 25px 20px; background: #fdfdfd; border-radius: 12px; border: 1px dashed #ddd;"><h4 style="color: #444; font-weight: 600;">No review found</h4><p style="font-size: 12px; color: #888;">Be the first to share your experience with this product!</p></div>`;
        return;
    }
    let html = '';
    realReviews.forEach(r => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= r.rating ? '#E5C158' : '#eee'}; font-size: 11px;"></i>`;
        html += `<div class="review-card"><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><div style="display: flex; gap: 10px;"><div style="width: 32px; height: 32px; border-radius: 50%; background: #fff1f4; color: #6A1B29; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">${r.name.charAt(0).toUpperCase()}</div><div><div style="font-size: 13px; font-weight: 700;">${r.name}</div><div style="display: flex; gap: 2px;">${starsHtml}</div></div></div><div style="font-size: 10px; color: #aaa;">${r.date}</div></div><p style="font-size: 12px; color: #666; margin: 0;">${r.text}</p></div>`;
    });
    container.innerHTML = html;
}

// ==========================================
// 🔥 MODAL LOGIN LOGIC (Fixed using Pure CSS) 🔥
// ==========================================
window.clearAuthInputs = function() {
    ['signupName', 'signupEmail', 'signupPassword', 'loginEmail', 'loginPassword', 'otpInput'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

window.toggleAuthView = function(viewMode) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none'; 
    document.getElementById('otpView').style.display = 'none';
    
    document.getElementById(viewMode + 'View').style.display = 'block';
    
    const titleEl = document.getElementById('authTitle');
    if(viewMode === 'signup') titleEl.innerText = 'Create Account';
    if(viewMode === 'login') titleEl.innerText = 'Welcome Back';
    if(viewMode === 'otp') titleEl.innerText = 'Verify OTP';
}

window.openLoginModal = function() {
    window.clearAuthInputs(); 
    document.getElementById('loginModal').style.display = 'flex'; 
    document.body.style.overflow = 'hidden'; 
    window.toggleAuthView('signup');
}

window.closeLoginModal = function() {
    document.getElementById('loginModal').style.display = 'none'; 
    document.body.style.overflow = '';
}

window.processSignup = async function() {
    const name = document.getElementById('signupName').value.trim(); const email = document.getElementById('signupEmail').value.trim(); const pwd = document.getElementById('signupPassword').value.trim();
    if(!name || !email || !pwd) { alert("Please fill all fields!"); return; }
    const btn = document.getElementById('btnSignupAction'); btn.innerHTML = 'Processing...'; btn.disabled = true;
    try {
        const checkRes = await window.DeliveryBoy.checkEmailExists(email);
        if (checkRes && checkRes.exists) { alert("Email already registered. Please Login."); window.toggleAuthView('login'); btn.innerHTML = 'Get Secure OTP'; btn.disabled = false; return; }
    } catch(e) {}
    tempSignupData = { name, email, pwd };
    try {
        const result = await window.DeliveryBoy.sendOTP(email, name);
        if(result && result.ok && result.data && result.data.success) { document.getElementById('otpSubText').innerText = `Code sent to ${email}`; window.toggleAuthView('otp'); } 
        else alert("Failed to send OTP.");
    } catch (error) { alert("Network Error!"); }
    btn.innerHTML = 'Get Secure OTP'; btn.disabled = false;
}

window.verifySignupOTP = async function() {
    const otpVal = document.getElementById('otpInput').value.trim();
    if(otpVal.length !== 6) { alert("Enter 6-digit OTP!"); return; }
    const vBtn = document.getElementById('btnOtpAction'); vBtn.innerHTML = 'Finalizing...'; vBtn.disabled = true;
    try {
        const result = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otpVal, tempSignupData.name, tempSignupData.pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', tempSignupData.name); localStorage.setItem('aavira_user_email', tempSignupData.email);
            alert("Verified Successfully!"); window.closeLoginModal(); setTimeout(() => { window.handleWriteReviewClick(); }, 500);
        } else alert("Invalid OTP!");
    } catch (error) { alert("Network Error!"); }
    vBtn.innerHTML = 'Verify & Complete Setup'; vBtn.disabled = false; 
}

window.processLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim(); const pwd = document.getElementById('loginPassword').value.trim();
    if(!email || !pwd) { alert("Fields required!"); return; }
    const btn = document.getElementById('btnLoginAction'); btn.innerHTML = 'Checking...'; btn.disabled = true;
    try {
        const result = await window.DeliveryBoy.login(email, pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', result.data.userName); localStorage.setItem('aavira_user_email', email);
            alert("Login Successful!"); window.closeLoginModal(); setTimeout(() => { window.handleWriteReviewClick(); }, 500);
        } else alert("Invalid Email or Password.");
    } catch(e) { alert("Network Error!"); }
    btn.innerHTML = 'Secure Login'; btn.disabled = false;
}
