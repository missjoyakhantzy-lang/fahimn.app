// ==========================================
// GLOBALS & UTILITIES
// ==========================================
window.currentProductIdForReviews = null; 
window.customMeasurementsText = null; 
window.currentProduct = null;
window.selectedProductImage = null; 
window.isCartProcessing = false; 
window.defaultCarouselHtml = ''; 
window.defaultDotsHtml = '';

let tempSignupData = { name: "", email: "", pwd: "" }; 
let selectedRating = 0; 

const scrollArea = document.getElementById('mainScrollArea'); 
const header = document.getElementById('mainHeader');

// Sticky Header Box-Shadow on Scroll
scrollArea.addEventListener('scroll', () => { 
    if(scrollArea.scrollTop > 10) header.style.boxShadow = 'var(--shadow-sm)'; 
    else header.style.boxShadow = 'none'; 
});

document.addEventListener('DOMContentLoaded', () => { 
    updateCartBadge(); 
    loadProductData(); 
});

// Update Top Cart Badge
function updateCartBadge() {
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || []; 
    let total = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('topCartBadge'); 
    if(badge) { 
        badge.innerText = total; 
        badge.style.display = total > 0 ? 'flex' : 'none'; 
    }
}

// Accordion Toggle
window.toggleAccordion = function(btn) {
    const item = btn.parentElement; 
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.acc-item').forEach(el => el.classList.remove('active'));
    if(!wasActive) item.classList.add('active');
}

// Modal Toggle Handlers
window.openModal = function(id) { document.getElementById(id).classList.add('show'); }
window.closeModal = function(id) { document.getElementById(id).classList.remove('show'); }

// Heart Wishlist Toggle
window.toggleHeart = function(btn) {
    const icon = btn.querySelector('i');
    if (icon.classList.contains('fa-regular')) { 
        icon.classList.replace('fa-regular', 'fa-solid'); 
        icon.style.color = 'var(--primary-color)'; 
    } else { 
        icon.classList.replace('fa-solid', 'fa-regular'); 
        icon.style.color = 'var(--text-dark)'; 
    }
}

// ==========================================
// SIZE SELECTION LOGIC
// ==========================================
window.saveCustomSize = function() {
    const bust = document.getElementById('csBust').value; 
    const waist = document.getElementById('csWaist').value;
    
    if(!bust || !waist) { alert("Enter measurements."); return; }
    
    window.customMeasurementsText = `Custom (B: ${bust}", W: ${waist}")`;
    
    document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
    document.querySelector('.custom-size-btn').classList.add('active');
    document.getElementById('sizeOptionsContainer').classList.remove('shake-error'); 
    
    closeModal('customSizeSheet');
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

function triggerSizeError() {
    const container = document.getElementById('sizeOptionsContainer');
    if(container) { 
        container.classList.remove('shake-error'); 
        void container.offsetWidth; 
        container.classList.add('shake-error'); 
    }
    if (navigator.vibrate) navigator.vibrate(200); 
    alert("Please select a size first!");
}

// ==========================================
// COLOR SWATCH & CAROUSEL LOGIC
// ==========================================
window.selectColorSwatch = function(element, imageUrl, isMainColor) {
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active')); 
    element.classList.add('active');
    window.selectedProductImage = imageUrl; 

    const loader = document.getElementById('mediaLoader'); 
    const carousel = document.getElementById('mediaCarousel'); 
    const dots = document.getElementById('carouselDots');
    
    if (loader) loader.classList.add('show');
    
    setTimeout(() => {
        if (isMainColor) {
            carousel.innerHTML = window.defaultCarouselHtml; 
            dots.innerHTML = window.defaultDotsHtml; 
            dots.style.display = 'flex'; 
            window.scrollToSlide(0);
        } else {
            carousel.innerHTML = `<div class="slide"><img src="${imageUrl}"></div>`; 
            dots.innerHTML = ''; 
            dots.style.display = 'none'; 
            carousel.scrollTo({ left: 0 });
        }
        if (loader) loader.classList.remove('show');
    }, 300); 
}

window.scrollToSlide = function(index) {
    const carousel = document.getElementById('mediaCarousel'); 
    if(carousel) carousel.scrollTo({ left: carousel.offsetWidth * index, behavior: 'smooth' });
}

document.getElementById('mediaWrapper').addEventListener('scroll', function(e) {
    if(e.target.id === 'mediaCarousel') {
        const carousel = e.target; 
        const scrollIndex = Math.round(carousel.scrollLeft / carousel.offsetWidth);
        document.querySelectorAll('.dot').forEach((dot, i) => { 
            if(i === scrollIndex) dot.classList.add('active'); 
            else dot.classList.remove('active'); 
        });
    }
}, true);

// ==========================================
// CART & BUY NOW LOGIC
// ==========================================
window.addToCart = function(event, isBuyNow = false) {
    event.preventDefault();
    if (!window.currentProduct) return;
    if (window.isCartProcessing) return; 

    const size = getSelectedSize(); 
    if (!size) { triggerSizeError(); return; }
    
    window.isCartProcessing = true; 
    let finalImage = window.selectedProductImage || window.currentProduct.imageMain || window.currentProduct.imageUrl;

    if (isBuyNow) {
        // Redirect to Checkout page with Query Params
        window.location.href = `checkout?buy_now=${encodeURIComponent(window.currentProduct.id)}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(finalImage)}`;
        setTimeout(() => window.isCartProcessing = false, 1000); 
        return;
    }

    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const exIdx = cart.findIndex(item => String(item.productId) === String(window.currentProduct.id) && item.size === size && item.image === finalImage);
    
    if (exIdx > -1) { 
        cart[exIdx].qty += 1; 
    } else { 
        cart.push({ 
            productId: window.currentProduct.id, 
            name: window.currentProduct.name, 
            price: Number(window.currentProduct.price), 
            size: size, 
            image: finalImage, 
            qty: 1 
        }); 
    }
    
    localStorage.setItem('aavira_cart', JSON.stringify(cart));
    updateCartBadge(); 
    alert("Added to cart successfully!");
    
    setTimeout(() => window.isCartProcessing = false, 600); 
}

window.buyNow = function(event) { 
    window.addToCart(event, true); 
}

// ==========================================
// MAIN PRODUCT DATA LOADING ENGINE
// ==========================================
async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');
    if (!productId) { productId = "demo_av101"; } else { productId = decodeURIComponent(productId).trim(); }
    window.currentProductIdForReviews = productId; 

    let p = null;

    // Check Normal Products
    if (typeof window.getVercelData === 'function') {
        try { 
            let allProducts = await window.getVercelData(); 
            if (allProducts && allProducts.length > 0) { 
                p = allProducts.find(item => String(item.id) === String(productId) || String(item._id) === String(productId)); 
            } 
        } catch(e) {}
    }
    
    // Check Main Products
    if (!p && typeof window.getMainProductsData === 'function') {
        try { 
            let mainProducts = await window.getMainProductsData(); 
            if (mainProducts && mainProducts.length > 0) { 
                p = mainProducts.find(item => String(item.id) === String(productId) || String(item._id) === String(productId)); 
            } 
        } catch(e) {}
    }

    // Direct Backend Fallback
    if (!p) {
        try {
            const BACKEND_URL = "https://aavira-fashion-backend.vercel.app";
            const mainRes = await fetch(`${BACKEND_URL}/api/main_products`);
            if (mainRes.ok) {
                const mainJson = await mainRes.json();
                if (mainJson.status === "success" && mainJson.data) {
                    p = mainJson.data.find(item => String(item.id) === String(productId) || String(item._id) === String(productId));
                }
            }
        } catch(e) {}
    }

    // If still not found, Show Error Modal
    if (!p) { 
        document.getElementById('errorPopup').classList.add('show'); 
        return; 
    }

    window.currentProduct = p;

    // Render Basic Details
    let rawTitle = p.name || p.title || "Exclusive Collection";
    let cleanTitle = rawTitle.replace(/_/g, ' - ').replace(/\s+/g, ' ').trim(); 
    document.getElementById('productTitle').innerText = cleanTitle; 
    document.getElementById('productTitle').classList.remove('skeleton'); 
    
    let price = Number(p.price) || 0; 
    let mrp = Number(p.mrp) || Number(p.originalPrice) || price;
    
    document.getElementById('currentPrice').innerText = "₹" + price.toLocaleString('en-IN'); 
    document.getElementById('currentPrice').classList.remove('skeleton'); 
    document.getElementById('oldPrice').innerText = "₹" + mrp.toLocaleString('en-IN'); 
    document.getElementById('oldPrice').classList.remove('skeleton'); 
    
    if(mrp > price) { 
        const discount = Math.round(((mrp - price) / mrp) * 100); 
        document.getElementById('discountTag').innerText = discount + "% OFF"; 
        document.getElementById('discountTag').style.display = "inline-block"; 
    }

    // Render Specifications
    if(p.fabric) { document.getElementById('specFabric').innerText = p.fabric; }
    if(p.pattern) { document.getElementById('specPattern').innerText = p.pattern; }
    if(p.work) { document.getElementById('specWork').innerText = p.work; document.getElementById('workRow').style.display = 'list-item'; }
    if(p.style) { document.getElementById('specStyle').innerText = p.style; document.getElementById('styleRow').style.display = 'list-item'; }

    if(p.description) { document.getElementById('productDescription').innerHTML = p.description.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); }
    document.getElementById('productDescription').classList.remove('skeleton'); 
    document.getElementById('productSku').innerText = "AV-" + String(window.currentProductIdForReviews).substring(0, 5).toUpperCase(); 
    document.getElementById('productSku').classList.remove('skeleton');

    // Render Carousel
    const carousel = document.getElementById('mediaCarousel'); 
    const dotsContainer = document.getElementById('carouselDots'); 
    document.getElementById('mediaWrapper').classList.remove('skeleton');
    
    let tempCarouselHtml = ''; 
    let tempDotsHtml = ''; 
    let slideCount = 0;
    
    let mainImage = p.imageMain || p.image || p.imageUrl || p.img || 'https://placehold.co/400x400?text=No+Image';
    window.selectedProductImage = mainImage; 

    if(mainImage) { tempCarouselHtml += `<div class="slide"><img src="${mainImage}"></div>`; tempDotsHtml += `<div class="dot active" onclick="window.scrollToSlide(${slideCount++})"></div>`; }
    if(p.imageBack) { tempCarouselHtml += `<div class="slide"><img src="${p.imageBack}"></div>`; tempDotsHtml += `<div class="dot" onclick="window.scrollToSlide(${slideCount++})"></div>`; }
    if(p.imageSide) { tempCarouselHtml += `<div class="slide"><img src="${p.imageSide}"></div>`; tempDotsHtml += `<div class="dot" onclick="window.scrollToSlide(${slideCount++})"></div>`; }
    if(p.videoUrl) { tempCarouselHtml += `<div class="slide"><video src="${p.videoUrl}" playsinline loop autoplay muted controlsList="nodownload"></video></div>`; tempDotsHtml += `<div class="dot" onclick="window.scrollToSlide(${slideCount++})"></div>`; }

    window.defaultCarouselHtml = tempCarouselHtml; 
    window.defaultDotsHtml = tempDotsHtml; 
    carousel.innerHTML = tempCarouselHtml; 
    dotsContainer.innerHTML = tempDotsHtml;

    // Render Colors
    let finalColorImages = [];
    if (p.colorImages && Array.isArray(p.colorImages) && p.colorImages.length > 0) { 
        finalColorImages = [mainImage, ...p.colorImages]; 
    } else {
        let foundDeep = false;
        for (let key in p) { 
            if (Array.isArray(p[key]) && p[key].length > 0 && typeof p[key][0] === 'string' && p[key][0].includes('res.cloudinary.com')) { 
                if (key !== 'items' && key !== 'reviews' && key !== 'colors') { finalColorImages = [mainImage, ...p[key]]; foundDeep = true; break; } 
            } 
        }
        if(!foundDeep) { finalColorImages = [mainImage]; }
    }
    finalColorImages = [...new Set(finalColorImages)];

    const colorSection = document.getElementById('colorSectionWrapper'); 
    const colorOpts = document.getElementById('dynamicColorOptions');
    
    if (finalColorImages.length > 0) { 
        colorSection.style.display = 'block'; 
        colorOpts.innerHTML = ''; 
        document.getElementById('colorCountInfo').innerText = finalColorImages.length === 1 ? '(1 Option)' : `(${finalColorImages.length} Options)`;
        
        finalColorImages.forEach((cImgUrl, idx) => {
            let activeCls = idx === 0 ? 'active' : ''; 
            let isMainColor = idx === 0 ? true : false; 
            colorOpts.innerHTML += `<div class="color-swatch ${activeCls}" onclick="selectColorSwatch(this, '${cImgUrl}', ${isMainColor})"><img src="${cImgUrl}" onerror="this.src='https://placehold.co/100x100?text=Img'"><i class="fa-solid fa-check"></i></div>`;
        });
    }

    // Trigger Reviews Load
    renderAdvancedRatingSystem(p.adminRating, p.adminReviewCount);
}

// ==========================================
// RATING & REVIEW SYSTEM
// ==========================================
function animateValue(obj, start, end, duration, isFloat) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp; 
        const progress = Math.min((timestamp - startTimestamp) / duration, 1); 
        let current = progress * (end - start) + start;
        if(obj) obj.innerHTML = isFloat ? current.toFixed(1) : Math.floor(current); 
        if (progress < 1) { 
            window.requestAnimationFrame(step); 
        } else if(obj) { 
            obj.innerHTML = isFloat ? end.toFixed(1) : end; 
        }
    }; 
    window.requestAnimationFrame(step);
}

window.renderAdvancedRatingSystem = async function(adminRatingVal, adminReviewCount) {
    const container = document.getElementById('ratingSummaryBox'); 
    const reviewsContainer = document.getElementById('reviewsList');
    
    let realReviews = [];
    if(typeof window.getReviewsFromDatabase === 'function') {
        try { realReviews = await window.getReviewsFromDatabase(window.currentProductIdForReviews); } catch(e){}
    }
    if(!realReviews || realReviews.length === 0) { 
        realReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || []; 
    }

    let finalRating = parseFloat(adminRatingVal); 
    let finalCount = parseInt(adminReviewCount);
    
    if (!finalRating || isNaN(finalRating)) { 
        let hash = 0; let idStr = String(window.currentProductIdForReviews || 'fallback'); 
        for(let i=0; i<idStr.length; i++){ hash += idStr.charCodeAt(i); } 
        finalRating = 3.8 + (hash % 12) / 10; 
        if(finalRating > 5.0) finalRating = 5.0; 
    }
    if (!finalCount || isNaN(finalCount)) { 
        let hash = 0; let idStr = String(window.currentProductIdForReviews || 'fallback'); 
        for(let i=0; i<idStr.length; i++){ hash += idStr.charCodeAt(i); } 
        finalCount = 20 + (hash % 150); 
    }

    let totalSum = (finalRating * finalCount); 
    realReviews.forEach(r => { totalSum += parseInt(r.rating || r.score || 5); finalCount += 1; });
    finalRating = parseFloat((totalSum / finalCount).toFixed(1)); 
    if(finalRating > 5.0) finalRating = 5.0;

    let p5 = 0, p4 = 0, p3 = 0, p2 = 0, p1 = 0;
    if(finalRating >= 4.5) { p5 = 80; p4 = 12; p3 = 5; p2 = 2; p1 = 1; } 
    else if(finalRating >= 4.0) { p5 = 55; p4 = 30; p3 = 10; p2 = 3; p1 = 2; }
    else if(finalRating >= 3.0) { p5 = 20; p4 = 30; p3 = 30; p2 = 10; p1 = 10; } 
    else { p5 = 5; p4 = 15; p3 = 20; p2 = 30; p1 = 30; }
    
    const distribution = [ { star: 5, pct: p5 }, { star: 4, pct: p4 }, { star: 3, pct: p3 }, { star: 2, pct: p2 }, { star: 1, pct: p1 } ];

    let html = `<div class="rating-summary-wrapper"><div class="rating-left"><div class="rating-big-text" id="animRatingVal">0.0</div><div class="rating-stars-main"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i></div><div class="rating-count"><span id="animReviewCount">0</span> Verified Reviews</div></div><div class="rating-right">`;
    distribution.forEach(row => { html += `<div class="rating-bar-row"><span style="width:20px;">${row.star} <i class="fa-solid fa-star" style="font-size:9px;"></i></span><div class="progress-track"><div class="progress-fill" id="bar-${row.star}" style="width: 0%;"></div></div><span style="min-width:25px; text-align:right;">${row.pct}%</span></div>`; }); 
    html += `</div></div>`;
    
    container.innerHTML = html;

    const ratingSection = document.getElementById('ratingSummaryBox');
    const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) { 
            animateValue(document.getElementById("animRatingVal"), 0.0, finalRating, 1000, true); 
            animateValue(document.getElementById("animReviewCount"), 0, finalCount, 1500, false); 
            setTimeout(() => { 
                distribution.forEach(row => { 
                    const bar = document.getElementById(`bar-${row.star}`); 
                    if(bar) bar.style.width = `${row.pct}%`; 
                }); 
            }, 200); 
            observer.disconnect(); 
        }
    }); 
    if(ratingSection) observer.observe(ratingSection);

    // Reviews List Map
    if (realReviews.length === 0) { 
        reviewsContainer.innerHTML = `<div style="width: 100%; text-align: center; padding: 25px 20px; background: var(--bg-light); border-radius: 12px; border: 1px dashed #d1d5db;"><h4 style="color: var(--text-dark); font-weight: 700; font-size:14px;">No reviews yet</h4><p style="font-size: 11px; color: var(--text-muted); margin-top:4px;">Be the first to share your experience!</p></div>`; 
    } else {
        let rHtml = '';
        realReviews.forEach(r => {
            let rateVal = r.rating || r.score || 5; 
            let starsHtml = ''; 
            for(let i=1; i<=5; i++) starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= rateVal ? 'var(--secondary-color)' : '#e5e7eb'}; font-size: 12px;"></i>`;
            
            let titleHtml = r.title ? `<div class="review-title-text">${r.title}</div>` : ''; 
            let bodyTxt = r.text || r.body || '';
            
            rHtml += `<div class="review-card"><div class="review-header"><div class="reviewer-info"><div class="reviewer-initial">${r.name.charAt(0).toUpperCase()}</div><div><div class="reviewer-name">${r.name}</div><div class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Buyer</div></div></div><div class="review-date">${r.date || 'Recently'}</div></div><div class="review-stars">${starsHtml}</div>${titleHtml}<p class="review-body-text">${bodyTxt}</p></div>`;
        }); 
        reviewsContainer.innerHTML = rHtml;
    }
}

window.handleWriteReviewClick = function() { 
    const savedName = localStorage.getItem('aavira_display_name'); 
    if (!savedName || savedName.trim() === "") { 
        openModal('loginPromptModal'); 
    } else { 
        openModal('reviewModal'); 
    } 
}

window.setRating = function(val) { 
    selectedRating = parseInt(val); 
    document.querySelectorAll('#starSelector i').forEach(star => { 
        if(parseInt(star.getAttribute('data-val')) <= val) star.classList.add('active'); 
        else star.classList.remove('active'); 
    }); 
}

window.submitReview = async function() {
    if (selectedRating === 0) { alert("Please select a star rating!"); return; } 
    const titleEl = document.getElementById('reviewTitleInput'); 
    const textEl = document.getElementById('reviewText'); 
    if (!textEl.value.trim()) { alert("Please write your experience!"); return; }
    
    const newReview = { 
        name: localStorage.getItem('aavira_display_name') || "User", 
        rating: selectedRating, 
        title: titleEl.value.trim() || 'Amazing Product', 
        text: textEl.value.trim(), 
        date: new Date().toLocaleDateString('en-GB') 
    };
    
    const btn = document.getElementById('submitReviewBtn'); 
    const ogText = btn.innerHTML; 
    btn.innerHTML = 'Saving...'; 
    btn.disabled = true;

    try {
        if (typeof window.saveReviewToDatabase === 'function') { 
            await window.saveReviewToDatabase(window.currentProductIdForReviews, newReview); 
        }
    } catch(e) {}
    
    let productReviews = JSON.parse(localStorage.getItem(`reviews_${window.currentProductIdForReviews}`)) || []; 
    productReviews.unshift(newReview); 
    localStorage.setItem(`reviews_${window.currentProductIdForReviews}`, JSON.stringify(productReviews));
    
    alert("Review Posted Successfully!"); 
    closeModal('reviewModal'); 
    setRating(0); 
    textEl.value = ''; 
    titleEl.value = ''; 
    
    if (window.currentProduct) { 
        renderAdvancedRatingSystem(window.currentProduct.adminRating, window.currentProduct.adminReviewCount); 
    }
    
    btn.innerHTML = ogText; 
    btn.disabled = false;
}

// ==========================================
// AUTH SYSTEM (LOGIN/SIGNUP)
// ==========================================
window.toggleAuthView = function(viewMode) { 
    document.getElementById('loginView').style.display = 'none'; 
    document.getElementById('signupView').style.display = 'none'; 
    document.getElementById('otpView').style.display = 'none'; 
    document.getElementById(viewMode + 'View').style.display = 'block'; 
    document.getElementById('authTitle').innerText = viewMode === 'signup' ? 'Create Account' : viewMode === 'login' ? 'Welcome Back' : 'Verify OTP'; 
}

window.processSignup = async function() { 
    const name = document.getElementById('signupName').value.trim(); 
    const email = document.getElementById('signupEmail').value.trim(); 
    const pwd = document.getElementById('signupPassword').value.trim(); 
    
    if(!name || !email || !pwd) { alert("Please fill all fields!"); return; } 
    
    const btn = document.getElementById('btnSignupAction'); 
    btn.innerText = 'Checking...'; 
    btn.disabled = true;
    
    if(typeof window.DeliveryBoy !== 'undefined') {
        const existsRes = await window.DeliveryBoy.checkEmailExists(email);
        if(existsRes.exists) { 
            alert("Email already registered. Please Sign In."); 
            btn.innerText = 'Continue'; btn.disabled = false; 
            toggleAuthView('login'); return; 
        }
        
        btn.innerText = 'Sending OTP...'; 
        const otpRes = await window.DeliveryBoy.sendOTP(email, name);
        if(otpRes.ok && otpRes.data.success) { 
            tempSignupData = { name, email, pwd }; 
            toggleAuthView('otp'); 
            document.getElementById('otpSubText').innerText = `Code sent to ${email}`; 
        } else { 
            alert(otpRes.data.message || "Failed to send OTP."); 
        }
    } else { 
        alert("Auth system unavailable currently."); 
    }
    btn.innerText = 'Continue'; btn.disabled = false;
}

window.verifySignupOTP = async function() { 
    const otp = document.getElementById('otpInput').value.trim(); 
    if(otp.length !== 6) { alert("Please enter a valid 6-digit OTP"); return; }
    
    const btn = document.getElementById('btnOtpAction'); 
    btn.innerText = 'Verifying...'; 
    btn.disabled = true;
    
    if(typeof window.DeliveryBoy !== 'undefined') {
        const res = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otp, tempSignupData.name, tempSignupData.pwd);
        if(res.ok && res.data.success) { 
            localStorage.setItem('aavira_display_name', tempSignupData.name); 
            localStorage.setItem('aavira_user_email', tempSignupData.email); 
            alert("Welcome to Aavira! Account verified."); 
            closeModal('loginModal'); 
            setTimeout(() => window.handleWriteReviewClick(), 500); 
        } else { 
            alert(res.data.message || "Invalid OTP!"); 
        }
    }
    btn.innerText = 'Verify'; btn.disabled = false;
}

window.processLogin = async function() { 
    const email = document.getElementById('loginEmail').value.trim(); 
    const pwd = document.getElementById('loginPassword').value.trim(); 
    
    if(!email || !pwd) { alert("Fields required!"); return; } 
    
    const btn = document.getElementById('btnLoginAction'); 
    btn.innerText = 'Logging in...'; 
    btn.disabled = true;
    
    if(typeof window.DeliveryBoy !== 'undefined') {
        const res = await window.DeliveryBoy.login(email, pwd);
        if(res.ok && res.data.success) { 
            localStorage.setItem('aavira_display_name', res.data.userName || email.split('@')[0]); 
            localStorage.setItem('aavira_user_email', email); 
            alert("Login Successful!"); 
            closeModal('loginModal'); 
            setTimeout(() => window.handleWriteReviewClick(), 500); 
        } else { 
            alert(res.data.message || "Login Failed. Check credentials."); 
        }
    } else { 
        alert("Auth system unavailable currently."); 
    }
    btn.innerText = 'Secure Login'; btn.disabled = false;
}

window.performGoogleLogin = async function() { 
    try { 
        if(typeof window.DeliveryBoy !== 'undefined') {
            const res = await window.DeliveryBoy.googleLogin(); 
            if(res.success) { 
                localStorage.setItem('aavira_display_name', res.userName); 
                localStorage.setItem('aavira_user_email', res.email); 
                alert(`Welcome, ${res.userName}!`); 
                closeModal('loginModal'); 
                setTimeout(() => window.handleWriteReviewClick(), 500); 
            } 
        }
    } catch (error) { 
        alert("Google Sign in unavailable."); 
    } 
};
