window.allProductsArray = [];
window.currentProductIndex = 0;
window.currentProductIdForReviews = null;
window.customMeasurementsText = null; 

document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    let total = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBadge = document.getElementById('topCartBadge');
    if(cartBadge) { cartBadge.innerText = total; }
});

// ✨ ADVANCED SHARE SYSTEM WITH FALLBACK ✨
window.shareProduct = async function(event) {
    event.preventDefault();
    const title = document.getElementById('productTitle').innerText || "Aavira Premium";
    const url = window.location.href;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: 'Hey! Check out this beautiful product I found on Aavira.',
                url: url
            });
        } catch (err) { console.log('Share prompt closed or failed.', err); }
    } else {
        // Fallback: Copy to clipboard if Web Share API is not supported (Desktop/HTTP)
        try {
            await navigator.clipboard.writeText(url);
            alert("Product link copied to clipboard!");
        } catch (err) {
            alert("Unable to copy link.");
        }
    }
}

function toggleHeart(event, button) {
    event.preventDefault();
    const icon = button.querySelector('i');
    if (icon.classList.contains('fa-regular')) {
        icon.classList.replace('fa-regular', 'fa-solid'); 
        icon.style.color = 'var(--primary-color)';
    } else {
        icon.classList.replace('fa-solid', 'fa-regular'); 
        icon.style.color = 'var(--icon-color)';
    }
}

// ✨ CUSTOM SIZE LOGIC ✨
window.openCustomSize = function() {
    document.getElementById('customSizeSheet').style.display = 'flex';
}
window.closeCustomSize = function() {
    document.getElementById('customSizeSheet').style.display = 'none';
}
window.saveCustomSize = function() {
    const bust = document.getElementById('csBust').value;
    const waist = document.getElementById('csWaist').value;
    
    if(!bust || !waist) {
        alert("Please enter Bust and Waist measurements."); return;
    }
    window.customMeasurementsText = `Custom (Bust: ${bust}", Waist: ${waist}")`;
    
    document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
    const customBtn = document.querySelector('.custom-size-btn');
    customBtn.classList.add('active');
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

function getSelectedColor() {
    return document.getElementById('colorName').innerText || 'As Shown';
}

window.selectColorText = function(element, colorName) {
    document.querySelectorAll('.color-pill, .color-img-thumbnail').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('colorName').innerText = colorName;
}
window.selectColorImage = function(element, colorName, imageUrl) {
    document.querySelectorAll('.color-img-thumbnail, .color-pill').forEach(img => img.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('colorName').innerText = colorName;
    const carousel = document.getElementById('mediaCarousel');
    if(carousel) { carousel.scrollTo({ left: 0, behavior: 'smooth' }); }
}

window.showErrorPopup = function() {
    const popup = document.getElementById('errorPopup');
    if(popup) { popup.style.display = 'flex'; setTimeout(() => { popup.classList.add('show'); }, 10); }
}

function triggerSizeError() {
    const sizeContainer = document.getElementById('sizeOptionsContainer');
    if(sizeContainer) {
        sizeContainer.classList.remove('shake-error'); 
        void sizeContainer.offsetWidth; 
        sizeContainer.classList.add('shake-error');
    }
    if (navigator.vibrate) { navigator.vibrate(200); }
}

// ✨ ADD TO CART LOGIC (Only saves to Cart Array) ✨
window.addToCart = function(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    if (!productId) { window.showErrorPopup(); return; }
    productId = decodeURIComponent(productId).trim();

    const size = getSelectedSize();
    if (!size) { triggerSizeError(); return; }

    const color = getSelectedColor();
    
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const existingIndex = cart.findIndex(item => String(item.productId) === String(productId) && item.size === size && item.color === color);

    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ productId: productId, size: size, color: color, qty: 1 });
    }
    localStorage.setItem('aavira_cart', JSON.stringify(cart));

    // Update Badge
    const cartBadge = document.getElementById('topCartBadge');
    if(cartBadge) {
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartBadge.innerText = totalItems;
    }
    alert("Product added to cart successfully!");
}

// ✨ CONTINUE / BUY NOW LOGIC (Directly fires make_order.html) ✨
window.buyNow = function(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    if (!productId) { window.showErrorPopup(); return; }
    productId = decodeURIComponent(productId).trim();

    const size = getSelectedSize();
    if (!size) { triggerSizeError(); return; }

    const color = getSelectedColor();
    
    // Redirect instantly without adding to the regular cart array
    const redirectUrl = "make_order.html?buy_now=" + encodeURIComponent(productId) + "&size=" + encodeURIComponent(size) + "&color=" + encodeURIComponent(color);
    window.location.href = redirectUrl;
}

window.scrollToSlide = function(index) {
    const carousel = document.getElementById('mediaCarousel');
    if(carousel) { carousel.scrollTo({ left: carousel.offsetWidth * index, behavior: 'smooth' }); }
    document.querySelectorAll('.dot').forEach((dot, i) => {
        if(i === index) dot.classList.add('active'); 
        else dot.classList.remove('active');
    });
}

const mediaCarousel = document.getElementById('mediaCarousel');
if (mediaCarousel) {
    mediaCarousel.addEventListener('scroll', () => {
        const scrollIndex = Math.round(mediaCarousel.scrollLeft / mediaCarousel.offsetWidth);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            if(i === scrollIndex) dot.classList.add('active'); 
            else dot.classList.remove('active');
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
        if(typeof window.getVercelData !== 'function') {
            console.error("user_data.js API function not found.");
            window.showErrorPopup(); return;
        }

        const allProducts = await window.getVercelData();
        window.allProductsArray = allProducts;
        window.currentProductIndex = allProducts.findIndex(p => String(p.id).trim() === String(productId));
        const productData = allProducts[window.currentProductIndex];

        if (productData) {
            const titleEl = document.getElementById('productTitle');
            const priceEl = document.getElementById('currentPrice');
            const oldPriceEl = document.getElementById('oldPrice');
            const discountTag = document.getElementById('discountTag');
            const descEl = document.getElementById('productDescription');
            const skuEl = document.getElementById('productSku');
            
            if(titleEl) { titleEl.innerText = productData.name; titleEl.classList.remove('skeleton'); }
            if(priceEl) { priceEl.innerText = "₹" + productData.price; priceEl.classList.remove('skeleton'); }

            let mrp = productData.mrp;
            if (!mrp) {
                let numericPrice = parseInt(String(productData.price).replace(/,/g, ''));
                mrp = (numericPrice + 450).toLocaleString('en-IN');
            }
            if(oldPriceEl) { oldPriceEl.innerText = "₹" + mrp; oldPriceEl.classList.remove('skeleton'); }
            
            const cPrice = parseInt(String(productData.price).replace(/,/g, ''));
            const oPrice = parseInt(String(mrp).replace(/,/g, ''));
            if(oPrice > cPrice && discountTag) {
                const discount = Math.round(((oPrice - cPrice) / oPrice) * 100);
                discountTag.innerText = discount + "% OFF";
                discountTag.style.display = "inline-block";
            }

            if(productData.fabric && document.getElementById('specFabric')) document.getElementById('specFabric').innerText = productData.fabric;
            if(productData.pattern && document.getElementById('specPattern')) document.getElementById('specPattern').innerText = productData.pattern;
            if(productData.description && descEl) { descEl.innerText = productData.description; descEl.classList.remove('skeleton'); }

            if(skuEl) { skuEl.innerText = "AV-" + String(productId).substring(0, 5).toUpperCase() + "-SURAT"; skuEl.classList.remove('skeleton'); }

            const colorSection = document.getElementById('colorSectionWrapper');
            const colorOpts = document.getElementById('dynamicColorOptions');
            const mainImage = productData.imageMain || productData.image || productData.imageUrl;
            
            let availableColors = [];
            if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
                availableColors = productData.colors;
            } else if (productData.color && typeof productData.color === 'string') {
                availableColors = productData.color.split(',').map(c => c.trim()).filter(c => c);
            }

            if (availableColors.length > 0 && colorSection && colorOpts) {
                colorSection.style.display = 'block';
                let firstColorName = typeof availableColors[0] === 'object' ? availableColors[0].name : availableColors[0];
                const colorNameEl = document.getElementById('colorName');
                if(colorNameEl) colorNameEl.innerText = firstColorName;
                
                colorOpts.innerHTML = '';
                availableColors.forEach((colObj, idx) => {
                    let cName = typeof colObj === 'object' ? colObj.name : colObj;
                    if(typeof colObj === 'string') {
                        colorOpts.innerHTML += `<div class="color-pill ${idx === 0 ? 'active' : ''}" onclick="selectColorText(this, '${cName}')">${cName}</div>`;
                    } else {
                        let cImg = colObj.image ? colObj.image : mainImage; 
                        colorOpts.innerHTML += `<div class="color-img-thumbnail ${idx === 0 ? 'active' : ''}" style="background-image: url('${cImg}');" onclick="selectColorImage(this, '${cName}', '${cImg}')"></div>`;
                    }
                });
            } else if (colorSection && colorOpts) {
                colorSection.style.display = 'block';
                const colorNameEl = document.getElementById('colorName');
                if(colorNameEl) colorNameEl.innerText = 'As Shown';
                colorOpts.innerHTML = `<div class="color-img-thumbnail active" style="background-image: url('${mainImage}');" onclick="selectColorImage(this, 'As Shown', '${mainImage}')"></div>`;
            }

            const mediaWrapper = document.getElementById('mediaWrapper');
            const carousel = document.getElementById('mediaCarousel');
            const dotsContainer = document.getElementById('carouselDots');
            
            if(mediaWrapper) mediaWrapper.classList.remove('skeleton');
            if(carousel) carousel.innerHTML = '';
            if(dotsContainer) dotsContainer.innerHTML = '';

            let slideCount = 0;

            if(mainImage && carousel && dotsContainer) {
                carousel.innerHTML += `<div class="slide"><img src="${mainImage}" alt="Front"></div>`;
                dotsContainer.innerHTML += `<div class="dot active" onclick="scrollToSlide(${slideCount})"></div>`;
                slideCount++;
            }
            if(productData.imageBack && carousel && dotsContainer) {
                carousel.innerHTML += `<div class="slide"><img src="${productData.imageBack}" alt="Back"></div>`;
                dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount})"></div>`;
                slideCount++;
            }
            if(productData.imageSide && carousel && dotsContainer) {
                carousel.innerHTML += `<div class="slide"><img src="${productData.imageSide}" alt="Side"></div>`;
                dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount})"></div>`;
                slideCount++;
            }
            if(productData.videoUrl && carousel && dotsContainer) {
                // Auto play, Muted, Looped video, No Controls
                carousel.innerHTML += `
                    <div class="slide video-slide">
                        <video src="${productData.videoUrl}" playsinline loop autoplay muted style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
                    </div>
                `;
                dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount})"></div>`;
                slideCount++;
            }

            await loadRealReviewsFromDB();

        } else { window.showErrorPopup(); }
    } catch (error) { window.showErrorPopup(); }
}

document.addEventListener('DOMContentLoaded', loadProductData);

// =========================================================================
// CUSTOMER REVIEWS ACTIONS
// =========================================================================
let selectedRating = 0;

window.handleWriteReviewClick = function() {
    const savedName = localStorage.getItem('aavira_display_name');
    if (!savedName || savedName.toLowerCase() === "guest user" || savedName === "") {
        document.getElementById('loginPromptModal').style.display = 'flex';
    } else {
        document.getElementById('reviewUserName').innerText = savedName;
        document.getElementById('reviewUserInitial').innerText = savedName.charAt(0).toUpperCase();
        document.getElementById('reviewModal').style.display = 'flex';
    }
}

window.closeReviewModals = function() {
    document.getElementById('loginPromptModal').style.display = 'none';
    document.getElementById('reviewModal').style.display = 'none';
}

window.setRating = function(val) {
    selectedRating = parseInt(val);
    const stars = document.querySelectorAll('#starSelector i');
    stars.forEach(star => {
        if (parseInt(star.getAttribute('data-val')) <= val) { star.style.color = '#E5C158'; } 
        else { star.style.color = '#ddd'; }
    });
}

window.submitReview = async function() {
    if (selectedRating === 0) { alert("Please select a star rating!"); return; }
    const textEl = document.getElementById('reviewText');
    const text = textEl ? textEl.value.trim() : '';
    if (!text) { alert("Please write your experience!"); return; }

    const userName = localStorage.getItem('aavira_display_name') || "User";
    const newReview = {
        name: userName,
        rating: selectedRating,
        text: text,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const productId = window.currentProductIdForReviews || 'default_product';
    const btn = document.getElementById('submitReviewBtn');
    const ogText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:5px;"></i> Saving...';
    btn.disabled = true;

    if(typeof window.saveReviewToDatabase === 'function') {
        const isSaved = await window.saveReviewToDatabase(productId, newReview);
        if(isSaved) {
            alert("Review Posted Successfully!");
            closeReviewModals(); setRating(0); if(textEl) textEl.value = ''; 
            await loadRealReviewsFromDB();
        } else { saveToLocalFallback(productId, newReview); }
    } else { saveToLocalFallback(productId, newReview); }
    
    btn.innerHTML = ogText; btn.disabled = false;
}

function saveToLocalFallback(productId, newReview) {
    let productReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`)) || [];
    productReviews.unshift(newReview); 
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(productReviews));
    alert("Review Posted Successfully!");
    closeReviewModals(); setRating(0); document.getElementById('reviewText').value = ''; 
    loadRealReviewsFromDB(); 
}

window.loadRealReviewsFromDB = async function() {
    const container = document.getElementById('reviewsList');
    if(!container) return;
    const productId = window.currentProductIdForReviews || 'default_product';

    let realReviews = [];
    if(typeof window.getReviewsFromDatabase === 'function') {
        const dbReviews = await window.getReviewsFromDatabase(productId);
        if(dbReviews && dbReviews.length > 0) realReviews = dbReviews;
    }
    if(realReviews.length === 0) {
        realReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`)) || [];
    }

    if (realReviews.length === 0) {
        container.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 25px 20px; background: #fdfdfd; border-radius: 12px; border: 1px dashed #ddd; flex-shrink: 0;">
                <i class="fa-regular fa-comment-dots" style="font-size: 28px; color: #ccc; margin-bottom: 8px;"></i>
                <h4 style="margin: 0; font-size: 14px; color: #444; font-weight: 600;">No review found</h4>
                <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Be the first to share your experience with this product!</p>
            </div>`;
        return;
    }

    let html = '';
    realReviews.forEach(r => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            if(i <= r.rating) starsHtml += `<i class="fa-solid fa-star" style="color: #E5C158; font-size: 11px;"></i>`;
            else starsHtml += `<i class="fa-solid fa-star" style="color: #eee; font-size: 11px;"></i>`;
        }

        html += `
        <div class="review-card" style="flex-shrink: 0; width: 260px; background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 15px; scroll-snap-align: start; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #fff1f4; color: #6A1B29; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">
                        ${r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-size: 13px; font-weight: 700; color: #222; text-align: left;">${r.name}</div>
                        <div style="display: flex; gap: 2px; margin-top: 3px;">${starsHtml}</div>
                    </div>
                </div>
                <div style="font-size: 10px; color: #aaa; font-weight: 500;">${r.date}</div>
            </div>
            <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.5; white-space: normal; text-align: left;">${r.text}</p>
        </div>`;
    });
    container.innerHTML = html;
}
