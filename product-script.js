window.allProductsArray = [];
window.currentProductIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    let total = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBadge = document.getElementById('topCartBadge');
    if(cartBadge) {
        cartBadge.innerText = total;
    }
});

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

window.selectColorImage = function(element, colorName, imageUrl) {
    document.querySelectorAll('.color-img-thumbnail').forEach(img => img.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('colorName').innerText = colorName;
    
    const carousel = document.getElementById('mediaCarousel');
    if(carousel) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        document.querySelectorAll('.dot').forEach((dot, i) => {
            if(i === 0) dot.classList.add('active'); 
            else dot.classList.remove('active');
        });
    }
}

window.selectSize = function(element) {
    document.querySelectorAll('.size-box').forEach(box => box.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('sizeOptionsContainer').classList.remove('shake-error');
}

function getSelectedSize() {
    const activeSize = document.querySelector('.size-box.active');
    return activeSize ? activeSize.innerText : null; 
}

function getSelectedColor() {
    return document.getElementById('colorName').innerText || 'As Shown';
}

window.showErrorPopup = function() {
    const popup = document.getElementById('errorPopup');
    if(popup) {
        popup.style.display = 'flex';
        setTimeout(() => { 
            popup.classList.add('show'); 
        }, 10);
    }
}

window.addToCart = function(event, isBuyNow) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    if (!productId) { 
        window.showErrorPopup(); 
        return; 
    }
    
    productId = decodeURIComponent(productId).trim();

    const size = getSelectedSize();
    
    if (!size) {
        const sizeContainer = document.getElementById('sizeOptionsContainer');
        if(sizeContainer) {
            sizeContainer.classList.remove('shake-error'); 
            void sizeContainer.offsetWidth; 
            sizeContainer.classList.add('shake-error');
        }
        if (navigator.vibrate) { navigator.vibrate(200); }
        return; 
    }

    const color = getSelectedColor();
    
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
        const existingIndex = cart.findIndex(item => String(item.productId) === String(productId) && item.size === size && item.color === color);

        if (existingIndex > -1) {
            cart[existingIndex].qty += 1;
        } else {
            cart.push({ productId: productId, size: size, color: color, qty: 1 });
        }
        localStorage.setItem('aavira_cart', JSON.stringify(cart));
    } catch(e) {
        console.error("Cart save error", e);
    }

    if (isBuyNow) {
        const redirectUrl = "make_order.html?buy_now=" + encodeURIComponent(productId) + "&size=" + encodeURIComponent(size) + "&color=" + encodeURIComponent(color);
        window.location.href = redirectUrl;
    } else {
        const cartBadge = document.getElementById('topCartBadge');
        if(cartBadge) {
            let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            cartBadge.innerText = totalItems;
        }
        alert("Product added to cart successfully!");
    }
}

window.togglePlayPause = function(event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    const video = document.getElementById('customVideo');
    if(!video) return;
    const icon = document.getElementById('playPauseIcon');
    const centerPlay = document.getElementById('centerPlay');
    
    if (video.paused) {
        video.play(); 
        if(icon) icon.className = "fa-solid fa-pause"; 
        if(centerPlay) centerPlay.style.display = "none";
    } else {
        video.pause(); 
        if(icon) icon.className = "fa-solid fa-play"; 
        if(centerPlay) centerPlay.style.display = "flex";
    }
};

window.toggleMute = function(event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    const video = document.getElementById('customVideo');
    if(!video) return;
    const icon = document.getElementById('muteIcon');
    
    if (video.muted) {
        video.muted = false; 
        if(icon) icon.className = "fa-solid fa-volume-high";
    } else {
        video.muted = true; 
        if(icon) icon.className = "fa-solid fa-volume-xmark";
    }
};

window.scrollToSlide = function(index) {
    const carousel = document.getElementById('mediaCarousel');
    if(carousel) {
        carousel.scrollTo({ left: carousel.offsetWidth * index, behavior: 'smooth' });
    }
    document.querySelectorAll('.dot').forEach((dot, i) => {
        if(i === index) {
            dot.classList.add('active'); 
        } else {
            dot.classList.remove('active');
        }
    });
}

const mediaCarousel = document.getElementById('mediaCarousel');
if (mediaCarousel) {
    mediaCarousel.addEventListener('scroll', () => {
        const scrollIndex = Math.round(mediaCarousel.scrollLeft / mediaCarousel.offsetWidth);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            if(i === scrollIndex) {
                dot.classList.add('active'); 
            } else {
                dot.classList.remove('active');
            }
        });

        const video = document.getElementById('customVideo');
        if (video) {
            const slides = document.querySelectorAll('.slide');
            if (slides[scrollIndex] && slides[scrollIndex].classList.contains('video-slide')) {
                video.play(); 
                const icon = document.getElementById('playPauseIcon');
                const centerPlay = document.getElementById('centerPlay');
                if(icon) icon.className = "fa-solid fa-pause"; 
                if(centerPlay) centerPlay.style.display = "none";
            } else {
                video.pause(); 
                const icon = document.getElementById('playPauseIcon');
                const centerPlay = document.getElementById('centerPlay');
                if(icon) icon.className = "fa-solid fa-play"; 
                if(centerPlay) centerPlay.style.display = "flex";
            }
        }
    });
}

async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');

    if (!productId) { 
        window.showErrorPopup(); 
        return; 
    }
    
    productId = decodeURIComponent(productId).trim();

    try {
        if(typeof window.getVercelData !== 'function') {
            console.error("user_data.js API function not found.");
            window.showErrorPopup();
            return;
        }

        const allProducts = await window.getVercelData();
        window.allProductsArray = allProducts;
        
        // Exact ID match logic
        window.currentProductIndex = allProducts.findIndex(p => String(p.id).trim() === String(productId));

        const productData = allProducts[window.currentProductIndex];

        if (productData) {
            const titleEl = document.getElementById('productTitle');
            const priceEl = document.getElementById('currentPrice');
            const oldPriceEl = document.getElementById('oldPrice');
            const discountTag = document.getElementById('discountTag');
            const descEl = document.getElementById('productDescription');
            const skuEl = document.getElementById('productSku');
            
            if(titleEl) {
                titleEl.innerText = productData.name; 
                titleEl.classList.remove('skeleton'); 
            }
            if(priceEl) {
                priceEl.innerText = "₹" + productData.price; 
                priceEl.classList.remove('skeleton');
            }

            let mrp = productData.mrp;
            if (!mrp) {
                let numericPrice = parseInt(String(productData.price).replace(/,/g, ''));
                mrp = (numericPrice + 450).toLocaleString('en-IN');
            }
            if(oldPriceEl) {
                oldPriceEl.innerText = "₹" + mrp;
                oldPriceEl.classList.remove('skeleton');
            }
            
            const cPrice = parseInt(String(productData.price).replace(/,/g, ''));
            const oPrice = parseInt(String(mrp).replace(/,/g, ''));
            if(oPrice > cPrice && discountTag) {
                const discount = Math.round(((oPrice - cPrice) / oPrice) * 100);
                discountTag.innerText = discount + "% OFF";
                discountTag.style.display = "inline-block";
            }

            if(productData.fabric && document.getElementById('specFabric')) document.getElementById('specFabric').innerText = productData.fabric;
            if(productData.pattern && document.getElementById('specPattern')) document.getElementById('specPattern').innerText = productData.pattern;
            if(productData.description && descEl) {
                descEl.innerText = productData.description;
                descEl.classList.remove('skeleton');
            }

            if(skuEl) {
                skuEl.innerText = "AV-" + String(productId).substring(0, 5).toUpperCase() + "-SURAT";
                skuEl.classList.remove('skeleton');
            }

            let hash = 0;
            let strId = String(productId);
            for (let i = 0; i < strId.length; i++) {
                hash = strId.charCodeAt(i) + ((hash << 5) - hash);
            }
            let randomFactor = Math.abs(Math.sin(hash));
            let ratingValue = (4.0 + (randomFactor * 0.9)).toFixed(1); 
            let reviewsCount = Math.floor(100 + (randomFactor * 100)); 

            const dynamicRatingText = document.getElementById('dynamicRatingText');
            if(dynamicRatingText) dynamicRatingText.innerText = `${ratingValue} (${reviewsCount} reviews)`;
            
            let starsHtml = '';
            for(let s=1; s<=5; s++) {
                if(s <= Math.floor(ratingValue)) {
                    starsHtml += '<i class="fa-solid fa-star"></i>';
                } else if(s == Math.ceil(ratingValue) && ratingValue % 1 !== 0) {
                    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                } else {
                    starsHtml += '<i class="fa-regular fa-star"></i>';
                }
            }
            const dynamicStars = document.getElementById('dynamicStars');
            if(dynamicStars) dynamicStars.innerHTML = starsHtml;

            const colorSection = document.getElementById('colorSectionWrapper');
            const colorOpts = document.getElementById('dynamicColorOptions');
            const mainImage = productData.imageMain || productData.image || productData.imageUrl;
            
            let availableColors = [];
            if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
                availableColors = productData.colors;
            } 

            if (availableColors.length > 0 && colorSection && colorOpts) {
                colorSection.style.display = 'block';
                
                let firstColorName = typeof availableColors[0] === 'object' ? availableColors[0].name : availableColors[0];
                const colorNameEl = document.getElementById('colorName');
                if(colorNameEl) colorNameEl.innerText = firstColorName;
                
                colorOpts.innerHTML = '';
                availableColors.forEach((colObj, idx) => {
                    let cName = typeof colObj === 'object' ? colObj.name : colObj;
                    let cImg = typeof colObj === 'object' && colObj.image ? colObj.image : mainImage; 
                    
                    colorOpts.innerHTML += `
                        <div class="color-img-thumbnail ${idx === 0 ? 'active' : ''}" 
                             style="background-image: url('${cImg}');" 
                             onclick="selectColorImage(this, '${cName}', '${cImg}')">
                        </div>
                    `;
                });
            } else if (colorSection && colorOpts) {
                colorSection.style.display = 'block';
                const colorNameEl = document.getElementById('colorName');
                if(colorNameEl) colorNameEl.innerText = 'As Shown';
                colorOpts.innerHTML = `
                    <div class="color-img-thumbnail active" 
                         style="background-image: url('${mainImage}');" 
                         onclick="selectColorImage(this, 'As Shown', '${mainImage}')">
                    </div>
                `;
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
                carousel.innerHTML += `
                    <div class="slide video-slide" onclick="togglePlayPause(event)">
                        <video id="customVideo" src="${productData.videoUrl}" playsinline loop autoplay muted></video>
                        <div class="center-play-btn" id="centerPlay" style="display:none;"><i class="fa-solid fa-play"></i></div>
                        <div class="custom-video-controls">
                            <button class="vid-ctrl-btn" onclick="togglePlayPause(event)"><i id="playPauseIcon" class="fa-solid fa-pause"></i></button>
                            <button class="vid-ctrl-btn" onclick="toggleMute(event)"><i id="muteIcon" class="fa-solid fa-volume-xmark"></i></button>
                        </div>
                    </div>
                `;
                dotsContainer.innerHTML += `<div class="dot" onclick="scrollToSlide(${slideCount})"></div>`;
                slideCount++;
            }
        } else {
            window.showErrorPopup();
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        window.showErrorPopup();
    }
}

document.addEventListener('DOMContentLoaded', loadProductData);
