// =========================================
// Aavira - Main Application Logic
// =========================================

window.allProductsList = [];
let tempSignupData = { name: "", email: "", pwd: "" };
let lastScrollTop = 0;
let isNavManuallyHidden = false;

// SCROLL ANIMATIONS (Header, Bottom Nav, Progress Bar, Fade-Up)
const mainHeader = document.getElementById('main-header');
const progressBar = document.getElementById('scroll-progress');

window.revealBottomNav = function() {
    isNavManuallyHidden = false;
    const navContainer = document.getElementById('bottomNavContainer');
    const revealBtn = document.getElementById('navRevealBtn');
    
    if(navContainer && revealBtn) {
        navContainer.classList.remove('translate-y-full');
        revealBtn.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
        revealBtn.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
}

window.hideBottomNav = function() {
    isNavManuallyHidden = true;
    const navContainer = document.getElementById('bottomNavContainer');
    const revealBtn = document.getElementById('navRevealBtn');
    
    if(navContainer && revealBtn) {
        navContainer.classList.add('translate-y-full');
        revealBtn.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
        revealBtn.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
}

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    
    if(progressBar) progressBar.style.width = scrollPercentage + '%';

    if(mainHeader) {
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            mainHeader.style.transform = 'translateY(-100%)';
        } else {
            mainHeader.style.transform = 'translateY(0)';
        }
    }

    if (scrollTop > lastScrollTop && scrollTop > 150) {
        if(!isNavManuallyHidden) hideBottomNav();
    } else if (scrollTop < lastScrollTop) {
        if(isNavManuallyHidden) revealBottomNav();
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

function initFadeAnimations() {
    document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
}

window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast'), msg = document.getElementById('toast-msg'), icon = document.getElementById('toast-icon');
    if(!toast || !msg) return;
    msg.innerText = message; 
    toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#111827';
    if(icon) {
        icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none'); }, 3000);
}

// NEWSLETTER LOGIC
window.subscribeNewsletter = async function() {
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if(!email || !emailRegex.test(email)) {
        window.showToast("Please enter a valid email address.", "error");
        return;
    }
    
    const btn = document.getElementById('btnNewsletter');
    const originalText = btn.innerText;
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 text-rani-pink animate-spin"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    try {
        const { getFirestore, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const db = getFirestore();
        await setDoc(doc(db, "newsletter_subscribers", email), {
            email: email,
            joinedAt: new Date(),
            status: "active"
        });

        fetch("https://aavira-fashion-backend.vercel.app/api/subscribe", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        }).catch(e => console.log('Backend trigger processed'));

        window.showToast("Thanks for joining Aavira community! 🎉", "success");
        emailInput.value = '';
    } catch(error) {
        window.showToast("Thanks for joining Aavira community! 🎉", "success");
        emailInput.value = '';
    }
    btn.innerText = originalText;
}

// PROFILE UI 
function updateProfileUI() {
    const savedName = localStorage.getItem('aavira_display_name');
    const guestUI = document.getElementById('guestProfileUI');
    const vipUI = document.getElementById('vipProfileUI');
    const vipName = document.getElementById('vipName');
    const profileInitial = document.getElementById('profileInitial');
    const promoBanner = document.getElementById('login-promo-banner');

    if (savedName && savedName.toLowerCase() !== "guest user") {
        if(guestUI) guestUI.classList.add('hidden');
        if(vipUI) { vipUI.classList.remove('hidden'); vipUI.classList.add('flex'); }
        if(vipName) vipName.innerText = savedName;
        if(profileInitial) profileInitial.innerText = savedName.charAt(0).toUpperCase();
        if(promoBanner) promoBanner.classList.add('hidden');
    } else {
        if(vipUI) { vipUI.classList.add('hidden'); vipUI.classList.remove('flex'); }
        if(guestUI) guestUI.classList.remove('hidden');
        if(promoBanner) promoBanner.classList.remove('hidden');
    }

    const activePromo = JSON.parse(localStorage.getItem('aavira_active_promo'));
    const promoBadge = document.getElementById('activePromoBadge');
    const promoText = document.getElementById('activePromoText');
    
    if (activePromo) {
        if(promoBadge) { promoBadge.classList.remove('hidden'); promoBadge.classList.add('flex'); }
        if(promoText) promoText.innerText = `${activePromo.code} (-₹${activePromo.discount})`;
    } else {
        if(promoBadge) { promoBadge.classList.add('hidden'); promoBadge.classList.remove('flex'); }
    }
}

window.handleLogout = function() {
    localStorage.removeItem('aavira_display_name');
    localStorage.removeItem('aavira_user_email');
    updateProfileUI();
    if(typeof window.clearAuthInputs === 'function') window.clearAuthInputs(); 
    window.showToast("Logged out securely!", "success");
    window.closeSidebar();
}

window.updateCartCount = function() {
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const badge = document.getElementById('cart-badge');
    if(badge) {
        badge.innerText = cart.length;
        if(cart.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

window.toggleHeart = async function(event, btn, id) {
    event.preventDefault(); event.stopPropagation();
    const icon = btn.querySelector('svg') || btn.querySelector('i'); 
    let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
    const strId = String(id);
    
    btn.classList.toggle('text-red-500'); 
    btn.classList.toggle('text-gray-400');
    
    if (btn.classList.contains('text-red-500')) { 
        if (!wishlist.includes(strId)) wishlist.push(strId); 
        if(icon) icon.setAttribute('fill', 'currentColor'); 
        window.showToast("Added to Wishlist ❤️", "success");
    } else { 
        wishlist = wishlist.filter(item => String(item) !== strId); 
        if(icon) icon.setAttribute('fill', 'none'); 
        window.showToast("Removed from Wishlist", "success");
    }
    localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
}

// SEARCH
window.openSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.remove('translate-y-full');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 300);
}
window.closeSearch = function() {
    document.getElementById('searchOverlay').classList.add('translate-y-full');
    document.body.style.overflow = '';
}
window.handleSearch = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('searchResults');
    if(!query) {
        container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-16 font-serif italic flex flex-col items-center gap-3"><div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"><i data-lucide="search" class="w-7 h-7 text-gray-300"></i></div>Discover timeless elegance...</div>';
        if (typeof lucide !== 'undefined') lucide.createIcons(); return;
    }
    const filtered = window.allProductsList.filter(p => p.name.toLowerCase().includes(query));
    if(filtered.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No creations found matching your search.</div>'; return;
    }
    let html = '';
    filtered.forEach(p => {
        let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
        html += `
        <div class="flex gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onclick="goToProduct('${p.id}')">
            <img src="${p.img}" class="w-20 h-20 object-cover bg-gray-50 aspect-[1/1.1] rounded-xl" />
            <div class="flex-1 flex flex-col justify-center">
                <p class="text-[9px] tracking-widest text-ethnic-gold uppercase font-bold mb-1">Aavira Luxe</p>
                <h4 class="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">${p.name}</h4>
                <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-sm font-bold text-gray-900">₹${price}</span>
                    ${mrp > price ? `<span class="text-[10px] text-gray-400 line-through">₹${mrp}</span>` : ''}
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// COLOR PICKER
const ethnicColors = [
    { name: "Burgundy", hex: "#741B2C" }, { name: "Rani", hex: "#D81B60" }, { name: "Blush", hex: "#F48FB1" },
    { name: "Plum", hex: "#8E24AA" }, { name: "Midnight", hex: "#1A237E" }, { name: "Emerald", hex: "#00695C" },
    { name: "Olive", hex: "#558B2F" }, { name: "Gold", hex: "#D4AF37" }, { name: "Mustard", hex: "#FBC02D" },
    { name: "Rust", hex: "#E65100" }, { name: "Onyx", hex: "#212121" }, { name: "Ivory", hex: "#F5F5F0" }
];

window.openColorSheet = function() {
    const sheet = document.getElementById('premiumColorSheet');
    const content = document.getElementById('colorSheetContent');
    const container = document.getElementById('colorSwatchesContainer');
    const bg = document.getElementById('colorSheetBg');
    
    if(!sheet || !content || !container) return;
    
    container.innerHTML = ethnicColors.map(c => `
        <div class="flex flex-col items-center gap-2 cursor-pointer color-swatch group" onclick="selectColorAndSearch('${c.name}', '${c.hex}')">
            <div class="w-14 h-14 rounded-full border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:border-gray-50 flex items-center justify-center transition-all" style="background-color: ${c.hex}"></div>
            <span class="text-[9px] font-semibold tracking-widest uppercase text-gray-500 group-hover:text-gray-900 transition-colors">${c.name}</span>
        </div>
    `).join('');

    sheet.classList.remove('hidden'); sheet.classList.add('flex');
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        bg.classList.remove('opacity-0');
        content.classList.remove('translate-y-full'); 
    });
};

window.closeColorSheet = function() {
    const content = document.getElementById('colorSheetContent');
    const sheet = document.getElementById('premiumColorSheet');
    const bg = document.getElementById('colorSheetBg');

    content.classList.add('translate-y-full');
    bg.classList.add('opacity-0');
    document.body.style.overflow = '';
    
    setTimeout(() => { sheet.classList.add('hidden'); sheet.classList.remove('flex'); }, 500); 
};

window.selectColorAndSearch = function(colorName, colorHex) {
    closeColorSheet();
    setTimeout(() => {
        const overlay = document.getElementById('colorResultsOverlay');
        const badge = document.getElementById('selectedColorBadge');
        const grid = document.getElementById('colorResultsGrid');
        if(!overlay || !badge || !grid) return;
        
        badge.style.backgroundColor = colorHex;
        overlay.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
        document.getElementById('colorMatchText').innerText = `Curated collection in ${colorName}`;
        grid.innerHTML = '';
        
        let matchedProducts = window.allProductsList.filter(p => p.name.toLowerCase().includes(colorName.toLowerCase()));
        
        if(matchedProducts.length > 0) {
            matchedProducts.forEach(p => { grid.innerHTML += generateProductCard(p, true); });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            grid.innerHTML = `
                <div class="col-span-2 flex flex-col items-center justify-center mt-24 text-center px-4">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-sm border border-gray-100">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h4 class="font-serif text-gray-800 text-xl font-bold mb-2">No Match Found</h4>
                    <p class="text-xs text-gray-500 leading-relaxed">Our artisans haven't crafted a piece matching <span class="font-bold text-gray-800">${colorName}</span> just yet.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }, 400); 
};

window.closeColorResults = function() {
    document.getElementById('colorResultsOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

// SIDEBAR & UTILS
window.openSidebar = function() { 
    updateProfileUI();
    const sbOv = document.getElementById('sidebarOverlay'), sb = document.getElementById('sidebar');
    sbOv.classList.remove('hidden'); document.body.style.overflow = 'hidden'; 
    setTimeout(()=>{ sbOv.classList.remove('opacity-0'); sb.classList.remove('-translate-x-full'); }, 10); 
}
window.closeSidebar = function() { 
    const sbOv = document.getElementById('sidebarOverlay'), sb = document.getElementById('sidebar');
    sb.classList.add('-translate-x-full'); sbOv.classList.add('opacity-0'); document.body.style.overflow = ''; 
    setTimeout(()=>{ sbOv.classList.add('hidden'); }, 300); 
}

window.goToProduct = function(id) {
    let recent = JSON.parse(localStorage.getItem('aavira_recent')) || [];
    recent = recent.filter(item => item !== id); recent.unshift(id);
    if(recent.length > 8) recent.pop(); localStorage.setItem('aavira_recent', JSON.stringify(recent));
    window.location.href = `product?id=${id}`;
}

// PROMO CODES
window.openPromoModal = function() {
    if(typeof window.closeSidebar === 'function') window.closeSidebar();
    document.getElementById('promoInput').value = '';
    const modal = document.getElementById('promoModal');
    const overlay = document.getElementById('promoModalOverlay');
    const content = document.getElementById('promoModalContent');
    
    modal.classList.remove('hidden'); modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        content.classList.remove('translate-y-full', 'opacity-0');
    }, 10);
}

window.closePromoModal = function() {
    document.getElementById('promoModalOverlay').classList.add('opacity-0');
    document.getElementById('promoModalContent').classList.add('translate-y-full', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => { document.getElementById('promoModal').classList.add('hidden'); document.getElementById('promoModal').classList.remove('flex'); }, 400);
}

window.processPromoCode = async function() {
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    if(!code) { window.showToast("Enter a Promo Code!", "error"); return; }
    let usedPromos = JSON.parse(localStorage.getItem('aavira_used_promos')) || [];
    if (usedPromos.includes(code)) { window.showToast("Promo code already used once.", "error"); return; }
    
    const btn = document.getElementById('btnApplyPromo');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Checking...';
    btn.disabled = true;

    try {
        const VERCEL_URL = "https://aavira-fashion-backend.vercel.app";
        const response = await fetch(`${VERCEL_URL}/api/promocodes/${code}`);
        const result = await response.json();

        if(response.ok && result.status === "success") {
            const discountAmt = Number(result.data.discountAmount) || Number(result.data.amount) || 0; 
            window.showToast(`Flat ₹${discountAmt} OFF applied! 🎉`, "success");
            localStorage.setItem('aavira_active_promo', JSON.stringify({ code: result.data.id || code, discount: discountAmt }));
            usedPromos.push(code); localStorage.setItem('aavira_used_promos', JSON.stringify(usedPromos));
            updateProfileUI(); 
            setTimeout(() => closePromoModal(), 1200);
        } else { window.showToast(result.message || "Invalid or expired code.", "error"); }
    } catch(e) { window.showToast("Network Error.", "error"); }

    btn.innerHTML = 'Verify & Apply'; btn.disabled = false;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.removePromoCode = function() {
    localStorage.removeItem('aavira_active_promo');
    updateProfileUI();
    window.showToast("Promo Code Removed", "success");
}

function loadSkeletons() {
    document.getElementById('category-container').innerHTML = Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[72px] h-[72px] rounded-full bg-gray-200 animate-pulse shadow-sm"></div></div>`).join('');
    const prodSkel = `<div class="w-[160px] shrink-0 bg-white border border-gray-100 p-2.5 shadow-sm rounded-none"><div class="w-full aspect-[1/1.1] bg-gray-100 animate-pulse mb-3"></div><div class="h-2 bg-gray-200 animate-pulse w-3/4 mb-2"></div><div class="h-2 bg-gray-200 animate-pulse w-1/2 mb-4"></div><div class="h-3 bg-gray-200 animate-pulse w-full pt-2 border-t border-gray-50"></div></div>`;
    document.getElementById('trending-container').innerHTML = Array(3).fill(prodSkel).join('');
    const gridSkel = `<div class="w-full bg-white border border-gray-100 p-2.5 shadow-sm rounded-none"><div class="w-full aspect-[1/1.1] bg-gray-100 animate-pulse mb-3"></div><div class="h-2 bg-gray-200 animate-pulse w-3/4 mb-2"></div><div class="h-2 bg-gray-200 animate-pulse w-1/2 mb-4"></div><div class="h-3 bg-gray-200 animate-pulse w-full pt-2 border-t border-gray-50"></div></div>`;
    document.getElementById('new-arrivals-container').innerHTML = Array(4).fill(gridSkel).join('');
}

const generateProductCard = (p, isGrid) => {
    let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
    let discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    let mrpHtml = mrp > price ? `<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${mrp}</span>` : ``; 
    let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
    let w = wishlist.map(String).includes(String(p.id));
    
    let colorsArray = p.colors || [];
    let colorHtml = '';
    if (colorsArray.length > 0) {
        let swatches = colorsArray.slice(0, 3).map(c => `<span class="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style="background-color: ${c}"></span>`).join('');
        let moreText = colorsArray.length > 1 ? `${colorsArray.length} Colours` : '1 Colour';
        colorHtml = `<div class="flex items-center gap-1.5 mb-2 mt-auto"><div class="flex -space-x-1">${swatches}</div><span class="text-[9px] text-gray-400 font-medium tracking-wider uppercase ml-1">${moreText}</span></div>`;
    } else {
        colorHtml = `<div class="mb-2 mt-auto"><span class="text-[9px] text-gray-400 font-medium tracking-wider uppercase">1 Colour</span></div>`;
    }

    let discountHtml = discount > 0 ? `<div class="absolute top-2 left-2 z-10 bg-white px-2 py-0.5 text-[9px] font-bold text-rani-pink uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.1)] rounded-sm">${discount}% OFF</div>` : '';

    return `
    <div class="product-card ${isGrid ? 'w-full' : 'snap-start shrink-0 w-[160px]'} bg-white block overflow-hidden flex flex-col relative rounded-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_15px_30px_-6px_rgba(216,27,96,0.15)]">
        <div class="relative overflow-hidden bg-gray-50 cursor-pointer" style="aspect-ratio: 1/1.1;" onclick="goToProduct('${p.id}')">
            <img src="${p.img}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ${discountHtml}
            <button type="button" class="absolute top-2 right-2 p-1.5 z-10 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors ${w ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 hover:bg-gray-50" onclick="toggleHeart(event, this, '${p.id}')">
                <i data-lucide="heart" class="w-3.5 h-3.5" fill="${w ? 'currentColor' : 'none'}"></i>
            </button>
        </div>
        <div class="px-3 pt-2.5 pb-2 flex-1 flex flex-col bg-white">
            <h4 class="font-sans text-[12.5px] font-semibold text-gray-800 line-clamp-1 mb-1 cursor-pointer group-hover:text-rani-pink transition-colors" onclick="goToProduct('${p.id}')">${p.name}</h4>
            ${colorHtml}
            <div class="flex items-center justify-between pt-2 border-t border-gray-50 relative z-20">
                <div class="flex items-baseline gap-1.5">
                    <span class="text-[14px] font-bold text-gray-900 leading-none">₹${price}</span>
                    ${mrpHtml}
                </div>
                <button type="button" class="w-6 h-6 flex items-center justify-center bg-rani-pink text-white hover:bg-[#c21554] transition-all rounded-full cursor-pointer shrink-0 shadow-sm" onclick="goToProduct('${p.id}')">
                    <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                </button>
            </div>
        </div>
    </div>`;
};

// FETCH DATA
window.fetchBanners = async function() {
    try {
        const docsArr = typeof window.getBannersData === 'function' ? await window.getBannersData() : [];
        const bannerVariations = [
            { tag: "Luxury Edit", title: "Timeless <br/><span class='text-4xl font-light italic font-script'>Elegance</span>", btn: "Discover" },
            { tag: "Royal Heritage", title: "Bridal <br/><span class='text-4xl font-light italic font-script'>Collection</span>", btn: "Shop Now" },
            { tag: "Festive Exclusive", title: "Modern <br/><span class='text-4xl font-light italic font-script'>Classics</span>", btn: "Explore" },
            { tag: "New Arrivals", title: "Signature <br/><span class='text-4xl font-light italic font-script'>Styles</span>", btn: "View All" }
        ];

        if(docsArr && docsArr.length > 0) {
            const carousel = document.getElementById('bannerCarousel');
            carousel.classList.remove('bg-gray-100'); carousel.innerHTML = ''; 
            
            docsArr.forEach((d, i) => {
                let url = d.imageUrl || d.image || d.url || 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=800'; 
                let variant = bannerVariations[i % bannerVariations.length];

                carousel.innerHTML += `
                    <div class="snap-start shrink-0 w-full h-full relative flex items-center justify-center overflow-hidden cursor-pointer rounded-none" onclick="window.location.href='${d.link || '#'}'">
                        <img src="${url}" class="absolute inset-0 w-full h-full object-cover rounded-none" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div class="relative z-10 text-center px-6 mt-auto mb-14 w-full flex flex-col items-center">
                            <span class="text-ethnic-gold font-sans tracking-[0.4em] text-[9px] uppercase mb-2 drop-shadow">${variant.tag}</span>
                            <h2 class="font-serif text-3xl text-white mb-5 leading-tight shadow-black drop-shadow-md">${variant.title}</h2>
                            <span class="bg-white text-gray-900 px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors">${variant.btn}</span>
                        </div>
                    </div>`;
            });

            const dotsContainer = document.getElementById('banner-dots');
            dotsContainer.innerHTML = docsArr.map((_, i) => `<div class="banner-dot h-1.5 transition-all duration-300 rounded-none ${i === 0 ? 'w-5 bg-white' : 'w-2 bg-white/50'}"></div>`).join('');
            
            let autoSlideInterval; let isUserInteracting = false;
            const startAutoSlide = () => {
                autoSlideInterval = setInterval(() => {
                    if (!isUserInteracting && carousel) {
                        let maxScroll = carousel.scrollWidth - carousel.clientWidth;
                        if (carousel.scrollLeft >= maxScroll - 10) carousel.scrollTo({ left: 0, behavior: 'smooth' });
                        else carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
                    }
                }, 3500);
            };

            carousel.addEventListener('touchstart', () => isUserInteracting = true, {passive: true});
            carousel.addEventListener('touchend', () => isUserInteracting = false);
            
            startAutoSlide();
            carousel.addEventListener('scroll', () => {
                const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                const dots = document.querySelectorAll('.banner-dot');
                dots.forEach((dot, i) => {
                    if(i === index) { dot.classList.add('w-5', 'bg-white'); dot.classList.remove('w-2', 'bg-white/50'); }
                    else { dot.classList.remove('w-5', 'bg-white'); dot.classList.add('w-2', 'bg-white/50'); }
                });
            });
        }
    } catch (error) {}
}

window.fetchCategories = async function() {
    try {
        const arr = typeof window.getCategoriesData === 'function' ? await window.getCategoriesData() : [];
        if(arr && arr.length > 0) {
            const catCont = document.getElementById('category-container'); catCont.innerHTML = ''; 
            arr.forEach((data) => {
                let img = data.image || data.imageUrl || data.url || 'https://via.placeholder.com/150';
                catCont.innerHTML += `<button type="button" class="flex flex-col items-center gap-3 group w-[72px] shrink-0" onclick="window.location.href='categories'"><div class="h-[72px] w-[72px] rounded-full overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-all p-0.5 bg-white"><img src="${img}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" /></div><span class="text-[9px] font-semibold text-gray-700 uppercase tracking-widest">${data.name}</span></button>`;
            });
        }
    } catch (error) {}
}

window.fetchProducts = async function() {
    try {
        const dataArray = typeof window.getVercelData === 'function' ? await window.getVercelData() : [];
        if (!dataArray || dataArray.length === 0) return;
        
        window.allProductsList = dataArray.map(data => ({ 
            id: data.id, name: data.name, price: data.price, mrp: data.mrp, colors: data.colors || [], 
            img: data.imageMain || data.image || data.imageUrl || 'https://via.placeholder.com/200' 
        }));
        
        document.getElementById('trending-container').innerHTML = ''; 
        document.getElementById('new-arrivals-container').innerHTML = '';
        
        window.allProductsList.forEach((p, index) => {
            if (index < 4) document.getElementById('trending-container').innerHTML += generateProductCard(p, false);
            else document.getElementById('new-arrivals-container').innerHTML += generateProductCard(p, true);
        });
        initFadeAnimations();
    } catch (error) {}
}

// AUTH
window.clearAuthInputs = function() {
    const inputs = ['signupName', 'signupEmail', 'signupPassword', 'loginEmail', 'loginPassword', 'otpInput'];
    inputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}
window.toggleAuthView = function(viewMode) {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('signupView').classList.add('hidden');
    document.getElementById('otpView').classList.add('hidden');
    if(viewMode === 'signup') document.getElementById('signupView').classList.remove('hidden');
    else if(viewMode === 'login') document.getElementById('loginView').classList.remove('hidden');
    else if(viewMode === 'otp') document.getElementById('otpView').classList.remove('hidden');
}
window.openLoginModal = function() {
    window.closeSidebar(); clearAuthInputs(); 
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('flex');
    document.body.style.overflow = 'hidden';
    toggleAuthView('signup');
    setTimeout(() => {
        document.getElementById('loginModalOverlay').classList.remove('opacity-0');
        document.getElementById('loginModalContent').classList.remove('translate-y-full', 'opacity-0');
    }, 10);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.closeLoginModal = function() {
    document.getElementById('loginModalOverlay').classList.add('opacity-0');
    document.getElementById('loginModalContent').classList.add('translate-y-full', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => { document.getElementById('loginModal').classList.add('hidden'); document.getElementById('loginModal').classList.remove('flex'); clearAuthInputs(); }, 400);
}
window.processSignup = async function() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pwd = document.getElementById('signupPassword').value.trim();
    if(!name || !email || !pwd) { window.showToast("All fields are required.", 'error'); return; }
    if (typeof window.DeliveryBoy === 'undefined') return;
    const btn = document.getElementById('btnSignupAction');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Processing...';
    btn.disabled = true;
    tempSignupData = { name, email, pwd };
    try {
        const result = await window.DeliveryBoy.sendOTP(email, name);
        if(result && result.ok && result.data && result.data.success) {
            window.showToast("Verification code sent!", 'success');
            document.getElementById('otpSubText').innerText = `Sent to ${email}`;
            toggleAuthView('otp');
        } else { window.showToast(result.data?.message || "Error sending code.", 'error'); }
    } catch (error) { window.showToast("Network Error.", 'error'); }
    btn.innerHTML = 'Continue <i data-lucide="arrow-right" class="w-4 h-4"></i>';
    btn.disabled = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.verifySignupOTP = async function() {
    const otpVal = document.getElementById('otpInput').value.trim();
    if(otpVal.length !== 6) { window.showToast("Enter complete OTP.", 'error'); return; }
    const vBtn = document.getElementById('btnOtpAction');
    vBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Verifying...'; 
    vBtn.disabled = true;
    try {
        const result = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otpVal, tempSignupData.name, tempSignupData.pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', tempSignupData.name);
            localStorage.setItem('aavira_user_email', tempSignupData.email);
            if(typeof window.processReferral === 'function') window.processReferral(tempSignupData.email);
            window.showToast("Welcome to Aavira!", 'success');
            updateProfileUI();
            setTimeout(() => { closeLoginModal(); }, 1500);
        } else { window.showToast(result.data?.message || "Invalid OTP", 'error'); }
    } catch (error) { window.showToast("Network Error", 'error'); }
    vBtn.innerHTML = 'Verify';
    vBtn.disabled = false; 
}
window.processLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    if(!email || !pwd) return;
    const btn = document.getElementById('btnLoginAction');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Checking...';
    btn.disabled = true;
    try {
        const result = await window.DeliveryBoy.login(email, pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', result.data.userName || email.split('@')[0]);
            localStorage.setItem('aavira_user_email', email);
            window.showToast("Signed In successfully!", 'success');
            updateProfileUI();
            setTimeout(() => { closeLoginModal(); }, 1000);
        } else { window.showToast(result.data?.message || "Invalid credentials.", 'error'); }
    } catch(e) { window.showToast("Network Error", 'error'); }
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
}

// INITIALIZE APP
window.initializeAppEngine = function() {
    updateProfileUI();
    if(typeof window.updateNotifBadge === 'function') window.updateNotifBadge();
    loadSkeletons();
    window.updateCartCount();
    initFadeAnimations();
    
    if (typeof window.syncNotificationsFromDB === 'function') window.syncNotificationsFromDB();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(async () => {
        const savedName = localStorage.getItem('aavira_display_name');
        let dbPromise = Promise.resolve();

        if (savedName && savedName.toLowerCase() !== "guest user" && typeof window.getWishlistFromDB === 'function') {
            dbPromise = window.getWishlistFromDB(savedName).then(dbWishlist => {
                if (dbWishlist && dbWishlist.length > 0) localStorage.setItem('aavira_wishlist', JSON.stringify(dbWishlist.map(String)));
            }).catch(err => console.error(err));
        }

        try { 
            await Promise.all([
                typeof window.fetchBanners === 'function' ? window.fetchBanners() : Promise.resolve(), 
                typeof window.fetchCategories === 'function' ? window.fetchCategories() : Promise.resolve(), 
                typeof window.fetchProducts === 'function' ? window.fetchProducts() : Promise.resolve(),
                dbPromise
            ]); 
        } finally { if(typeof lucide !== 'undefined') lucide.createIcons(); }
    }, 50);
}

document.addEventListener("DOMContentLoaded", window.initializeAppEngine);
