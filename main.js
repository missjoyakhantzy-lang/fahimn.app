// ==========================================
// CAPTURE REFERRAL LINK ON LOAD
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref');
if(refParam) localStorage.setItem('aavira_ref_code', refParam);

// ==========================================
// GLOBAL VARIABLES & HEADER SCROLL
// ==========================================
window.allProductsList = [];
let tempSignupData = { name: "", email: "", pwd: "" };
let lastScrollTop = 0;

const mainHeader = document.getElementById('main-header');
if(mainHeader) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if(scrollTop > 10) {
            mainHeader.classList.add('shadow-md', 'bg-white/90', 'border-b', 'border-gray-200/50');
            mainHeader.classList.remove('bg-[#FAF8F5]/60');
        } else {
            mainHeader.classList.remove('shadow-md', 'bg-white/90', 'border-b', 'border-gray-200/50');
            mainHeader.classList.add('bg-[#FAF8F5]/60');
        }
        if (scrollTop > lastScrollTop && scrollTop > 80) mainHeader.style.transform = 'translateY(-100%)';
        else mainHeader.style.transform = 'translateY(0)';
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast'), msg = document.getElementById('toast-msg'), icon = document.getElementById('toast-icon');
    if(!toast || !msg) return;
    msg.innerText = message; 
    toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#10b981';
    if(icon) {
        icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none'); }, 3000);
}

// ==========================================
// REFERRAL CENTER LOGIC
// ==========================================
window.openReferralCenter = function() {
    if(typeof window.closeSidebar === 'function') window.closeSidebar();
    const email = localStorage.getItem('aavira_user_email');
    if(!email) {
        window.showToast("Please login to access Refer & Earn!", "warning");
        setTimeout(() => { window.openLoginModal(); }, 1000);
        return;
    }
    const refLink = window.location.origin + window.location.pathname + '?ref=' + btoa(email);
    document.getElementById('referralLinkInput').value = refLink;
    document.getElementById('referralCenter').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    if(typeof window.loadReferralStats === 'function') window.loadReferralStats(email);
}

window.closeReferralCenter = function() {
    document.getElementById('referralCenter').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

window.copyReferralLink = function() {
    const link = document.getElementById('referralLinkInput').value;
    navigator.clipboard.writeText(link);
    window.showToast("Referral link copied! 📋", "success");
}

window.shareReferralLink = function() {
    const link = document.getElementById('referralLinkInput').value;
    const msg = `Hey! I found this amazing premium ethnic wear app, Aavira. Use my link to sign up and get flat ₹500 OFF on your first order! 🎁\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// NOTIFICATION CENTER UI LOGIC
// ==========================================
window.updateNotifBadge = function() {
    let notifs = JSON.parse(localStorage.getItem('aavira_notifications')) || [];
    let unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if(badge) {
        badge.innerText = unread;
        if(unread > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

window.renderNotifications = function() {
    let notifs = JSON.parse(localStorage.getItem('aavira_notifications')) || [];
    const list = document.getElementById('notificationList');
    if(!list) return;

    if(notifs.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
                <i data-lucide="bell-off" class="w-12 h-12 mb-3 opacity-30"></i>
                <p class="text-sm">No new notifications</p>
            </div>`;
    } else {
        list.innerHTML = notifs.map((n, i) => `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer ${!n.read ? 'border-l-4 border-l-ethnic-burgundy bg-red-50/20' : ''}" onclick="markNotifAsRead(${i})">
                <div class="flex justify-between items-start mb-1.5">
                    <h4 class="font-bold text-gray-800 text-[13px] flex items-center gap-1">${n.title} ${!n.read ? '<span class="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>' : ''}</h4>
                    <span class="text-[10px] text-gray-400 font-medium">${n.time}</span>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">${n.body}</p>
            </div>
        `).join('');
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.markNotifAsRead = function(index) {
    let notifs = JSON.parse(localStorage.getItem('aavira_notifications')) || [];
    if(notifs[index]) {
        notifs[index].read = true;
        let readState = JSON.parse(localStorage.getItem('aavira_read_notifs')) || {};
        if(notifs[index].id) readState[notifs[index].id] = true;
        localStorage.setItem('aavira_read_notifs', JSON.stringify(readState));
    }
    localStorage.setItem('aavira_notifications', JSON.stringify(notifs));
    window.renderNotifications();
    window.updateNotifBadge();
}

window.openNotificationCenter = function() {
    document.getElementById('notificationCenter').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    if(typeof window.syncNotificationsFromDB === 'function') window.syncNotificationsFromDB();
    else window.renderNotifications();
}

window.closeNotificationCenter = function() {
    document.getElementById('notificationCenter').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

// ==========================================
// PROFILE UI & LOGOUT
// ==========================================
window.updateProfileUI = function() {
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
        if(promoBadge) promoBadge.classList.remove('hidden');
        if(promoText) promoText.innerText = `${activePromo.code} (-₹${activePromo.discount})`;
    } else {
        if(promoBadge) promoBadge.classList.add('hidden');
    }
}

window.handleLogout = function() {
    localStorage.removeItem('aavira_display_name');
    localStorage.removeItem('aavira_user_email');
    window.updateProfileUI();
    if(typeof window.clearAuthInputs === 'function') window.clearAuthInputs(); 
    window.showToast("Logged out securely!", "success");
    window.closeSidebar();
}

// ==========================================
// CART, WISHLIST & SEARCH
// ==========================================
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

window.openSearch = function() {
    document.getElementById('searchOverlay').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 300);
}
window.closeSearch = function() {
    document.getElementById('searchOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}
window.handleSearch = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('searchResults');
    if(!query) {
        container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic flex flex-col items-center gap-2"><i data-lucide="search" class="w-8 h-8 opacity-20"></i>Type something to search our collection...</div>';
        if (typeof lucide !== 'undefined') lucide.createIcons(); return;
    }
    const filtered = window.allProductsList.filter(p => p.name.toLowerCase().includes(query));
    if(filtered.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No products found matching your search.</div>'; return;
    }
    let html = '';
    filtered.forEach(p => {
        let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
        html += `
        <div class="flex gap-3 bg-white/80 p-2.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/50 cursor-pointer hover:shadow-md transition-shadow" onclick="goToProduct('${p.id}')">
            <img src="${p.img}" class="w-[72px] h-[72px] object-cover rounded-lg bg-[#F9F9F9]" />
            <div class="flex-1 flex flex-col justify-center">
                <p class="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-0.5">Aavira Luxe</p>
                <h4 class="text-xs font-medium text-gray-800 line-clamp-2">${p.name}</h4>
                <div class="mt-1.5 flex items-baseline gap-2">
                    <span class="text-sm font-bold text-ethnic-burgundy">₹${price}</span>
                    ${mrp > price ? `<span class="text-[10px] text-gray-400 line-through">₹${mrp}</span>` : ''}
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// ==========================================
// COLOR WHEEL LOGIC
// ==========================================
let colorData = { h: 45, s: 100, l: 50, hex: '#FFB04B' }; 
let isDragging = false;
const wheel = document.getElementById('pickerWheel'), thumb = document.getElementById('pickerThumb');
const preview = document.getElementById('previewColor'), hexText = document.getElementById('previewHex');
const satInput = document.getElementById('satSlider'), lightInput = document.getElementById('lightSlider');

function hslToHex(h, s, l) {
    l /= 100; const a = s * Math.min(l, 1 - l) / 100;
    const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
function getClosestColorName(h, s, l) {
    if (l < 20) return "black"; if (l > 90) return "white"; if (s < 15) return "grey";
    if (h < 15 || h >= 345) return "red"; if (h >= 15 && h < 45) return "orange";
    if (h >= 45 && h < 75) return "yellow"; if (h >= 75 && h < 160) return "green";
    if (h >= 160 && h < 195) return "cyan"; if (h >= 195 && h < 260) return "blue";
    if (h >= 260 && h < 290) return "purple"; if (h >= 290 && h < 345) return "pink";
    return "";
}
function updateColorUI() {
    colorData.hex = hslToHex(colorData.h, colorData.s, colorData.l);
    if(preview) preview.style.backgroundColor = colorData.hex; 
    if(hexText) hexText.innerText = colorData.hex;
    if(satInput) satInput.style.background = `linear-gradient(to right, #808080, ${hslToHex(colorData.h, 100, colorData.l)})`;
    if(lightInput) lightInput.style.background = `linear-gradient(to right, #000000, ${hslToHex(colorData.h, colorData.s, 50)}, #FFFFFF)`;
}
function setWheelAngle(angleDeg) {
    colorData.h = Math.round(angleDeg); const rad = (angleDeg - 90) * (Math.PI / 180);
    if(!wheel) return;
    const centerX = wheel.offsetWidth / 2, centerY = wheel.offsetHeight / 2, radius = centerX - 13; 
    const x = Math.cos(rad) * radius + centerX, y = Math.sin(rad) * radius + centerY;
    if(thumb) { thumb.style.left = `${x}px`; thumb.style.top = `${y}px`; }
    updateColorUI();
}
function handleWheelMove(e) {
    if (!isDragging || !wheel) return;
    const rect = wheel.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX, clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - (rect.width / 2), y = clientY - rect.top - (rect.height / 2);
    let angleDeg = Math.atan2(y, x) * (180 / Math.PI) + 90; if (angleDeg < 0) angleDeg += 360;
    setWheelAngle(angleDeg);
}
if(wheel) {
    wheel.addEventListener('mousedown', (e) => { isDragging = true; handleWheelMove(e); });
    wheel.addEventListener('touchstart', (e) => { isDragging = true; handleWheelMove(e); }, {passive: true});
    document.addEventListener('mousemove', handleWheelMove);
    document.addEventListener('touchmove', handleWheelMove, {passive: false});
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
}
if(satInput) satInput.addEventListener('input', (e) => { colorData.s = e.target.value; updateColorUI(); });
if(lightInput) lightInput.addEventListener('input', (e) => { colorData.l = e.target.value; updateColorUI(); });

window.copyHex = function() { navigator.clipboard.writeText(colorData.hex); window.showToast("Color Code Copied!", "success"); }

window.openColorModal = function() {
    const modal = document.getElementById('colorPickerModal');
    if(!modal) return;
    modal.classList.remove('hidden'); modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { 
        setWheelAngle(45); 
        document.getElementById('colorModalOverlay').classList.remove('opacity-0'); 
        document.getElementById('colorModalContent').classList.remove('scale-95', 'opacity-0'); 
    }, 10);
}
window.closeColorModal = function() {
    document.getElementById('colorModalOverlay').classList.add('opacity-0'); 
    document.getElementById('colorModalContent').classList.add('scale-95', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => { document.getElementById('colorPickerModal').classList.add('hidden'); document.getElementById('colorPickerModal').classList.remove('flex'); }, 300);
}

window.applyColorAndSearch = function() {
    window.closeColorModal();
    setTimeout(() => {
        const overlay = document.getElementById('colorResultsOverlay');
        const badge = document.getElementById('selectedColorBadge');
        const grid = document.getElementById('colorResultsGrid');
        if(!overlay || !badge || !grid) return;
        
        badge.style.backgroundColor = colorData.hex;
        overlay.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
        
        const colorStr = getClosestColorName(colorData.h, colorData.s, colorData.l);
        document.getElementById('colorMatchText').innerText = `Showing products matching ${colorStr.toUpperCase()}`;
        grid.innerHTML = '';
        let matchedProducts = window.allProductsList.filter(p => p.name.toLowerCase().includes(colorStr));
        
        if(matchedProducts.length > 0) {
            matchedProducts.forEach(p => { grid.innerHTML += window.generateProductCard(p, true); });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            grid.innerHTML = `
                <div class="col-span-2 flex flex-col items-center justify-center mt-20 text-center">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 border-2 border-dashed border-gray-200">
                        <i data-lucide="frown" class="w-10 h-10"></i>
                    </div>
                    <h4 class="text-gray-800 text-lg font-bold mb-1">No products found</h4>
                    <p class="text-xs text-gray-500 max-w-[220px]">We couldn't find any products in <b class="text-gray-800">${colorStr.toUpperCase()}</b> shade. Try selecting a different color.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }, 350);
}

window.closeColorResults = function() {
    document.getElementById('colorResultsOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

// ==========================================
// SIDEBAR & NAVIGATION
// ==========================================
window.openSidebar = function() { 
    window.updateProfileUI();
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

window.initScrollAnimations = function() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 }); 
    reveals.forEach(reveal => observer.observe(reveal));
    setTimeout(() => reveals.forEach(r => { if(r.getBoundingClientRect().top < window.innerHeight) r.classList.add('active'); }), 100);
}

// ==========================================
// PRODUCTS & BANNERS RENDER LOGIC
// ==========================================
window.loadSkeletons = function() {
    document.getElementById('category-container').innerHTML = Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[76px] h-[76px] rounded-full premium-skeleton border-2 border-white shadow-sm"></div></div>`).join('');
    const prodSkel = `<div class="w-[150px] shrink-0 bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
    document.getElementById('trending-container').innerHTML = Array(3).fill(prodSkel).join('');
    const gridSkel = `<div class="w-full bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
    document.getElementById('new-arrivals-container').innerHTML = Array(4).fill(gridSkel).join('');
}

window.generateProductCard = function(p, isGrid) {
    let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
    let discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    let mrpHtml = mrp > price ? `<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${mrp}</span>` : ``; 
    let badgeHtml = discount > 0 ? `<span class="text-[9px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded ml-1.5 tracking-wider">${discount}% OFF</span>` : '';
    let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
    let w = wishlist.map(String).includes(String(p.id));
    
    return `
    <div class="${isGrid ? 'w-full' : 'snap-start shrink-0 w-[150px]'} bg-white block overflow-hidden flex flex-col relative rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div class="relative overflow-hidden bg-[#F9F9F9] cursor-pointer" style="aspect-ratio: 1;" onclick="goToProduct('${p.id}')">
            <img src="${p.img}" class="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <button type="button" class="absolute top-2 right-2 p-1.5 z-10 transition-colors ${w ? 'text-red-500' : 'text-gray-400'} drop-shadow-md hover:text-red-500" onclick="toggleHeart(event, this, '${p.id}')">
                <i data-lucide="heart" class="w-4 h-4 stroke-[2]" fill="${w ? 'currentColor' : 'none'}"></i>
            </button>
        </div>
        <div class="p-2.5 flex-1 flex flex-col bg-white">
            <h4 class="font-sans text-[12px] font-medium text-[#2D2D2D] truncate cursor-pointer group-hover:text-ethnic-burgundy transition-colors" onclick="goToProduct('${p.id}')">${p.name}</h4>
            <div class="flex items-end justify-between mt-2 pt-1 border-t border-gray-50">
                <div class="flex flex-col">
                    <div class="flex items-center"><span class="text-[14px] font-bold text-ethnic-burgundy font-sans leading-none">₹${price}</span>${badgeHtml}</div>
                    <div class="mt-1 leading-none h-[12px]">${mrpHtml}</div>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" class="relative overflow-hidden w-[28px] h-[28px] flex items-center justify-center bg-ethnic-burgundy text-white hover:bg-[#4a121c] transition-all duration-300 rounded-full cursor-pointer shrink-0 shadow-md group/btn" onclick="goToProduct('${p.id}')">
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                        <div class="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%] animate-shimmer-sweep"></div>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
};

window.fetchBanners = async function() {
    try {
        const docsArr = typeof window.getBannersData === 'function' ? await window.getBannersData() : [];
        if(docsArr && docsArr.length > 0) {
            const carousel = document.getElementById('bannerCarousel');
            carousel.classList.remove('bg-gray-200', 'premium-skeleton'); carousel.innerHTML = ''; 
            docsArr.forEach(d => {
                let url = d.imageUrl || d.image || d.url || 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=800'; 
                carousel.innerHTML += `<div class="snap-start shrink-0 w-full h-full relative flex items-end justify-center overflow-hidden banner-slide" onclick="window.location.href='${d.link || '#'}'"><img src="${url}" class="absolute inset-0 w-full h-full object-cover object-[center_20%] scale-105 hover:scale-100 transition-transform duration-[10s]" /><div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div><div class="relative z-10 text-center px-6 pb-14 w-full flex flex-col items-center"><span class="text-ethnic-gold font-sans tracking-[0.4em] text-[9px] uppercase mb-3 drop-shadow"></span><h2 class="font-serif text-[32px] text-white mb-5 leading-tight shadow-black drop-shadow-lg"> <br/><span class="text-[40px] font-light italic font-['Dancing_Script']">more details</span></h2><button class="bg-white text-ethnic-burgundy px-8 py-3 text-[10px] font-bold uppercase rounded shadow-lg hover:bg-ethnic-burgundy hover:text-white transition-colors">Shop Now</button></div></div>`;
            });
            const dotsContainer = document.getElementById('banner-dots');
            dotsContainer.innerHTML = docsArr.map((_, i) => `<div class="banner-dot h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}"></div>`).join('');
            
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
            carousel.addEventListener('mousedown', () => isUserInteracting = true);
            carousel.addEventListener('mouseup', () => isUserInteracting = false);
            startAutoSlide();
            carousel.addEventListener('scroll', () => {
                const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                const dots = document.querySelectorAll('.banner-dot');
                dots.forEach((dot, i) => {
                    if(i === index) { dot.classList.add('w-4', 'bg-white'); dot.classList.remove('w-1.5', 'bg-white/50'); }
                    else { dot.classList.remove('w-4', 'bg-white'); dot.classList.add('w-1.5', 'bg-white/50'); }
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
                catCont.innerHTML += `<button type="button" class="flex flex-col items-center gap-2.5 group w-[76px] shrink-0" onclick="window.location.href='categories'"><div class="h-[76px] w-[76px] rounded-full overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg transition-all p-0.5 bg-gradient-to-tr from-ethnic-gold/40 to-ethnic-burgundy/40"><img src="${img}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" /></div><span class="text-[10px] font-bold text-gray-700 uppercase tracking-wider">${data.name}</span></button>`;
            });
        }
    } catch (error) {}
}

window.fetchProducts = async function() {
    try {
        const dataArray = typeof window.getVercelData === 'function' ? await window.getVercelData() : [];
        if (!dataArray || dataArray.length === 0) return;
        window.allProductsList = dataArray.map(data => ({ id: data.id, name: data.name, price: data.price, mrp: data.mrp, img: data.imageMain || data.image || data.imageUrl || 'https://via.placeholder.com/200' }));
        
        document.getElementById('trending-container').innerHTML = ''; document.getElementById('new-arrivals-container').innerHTML = '';
        
        window.allProductsList.forEach((p, index) => {
            if (index < 4) document.getElementById('trending-container').innerHTML += window.generateProductCard(p, false);
            else document.getElementById('new-arrivals-container').innerHTML += window.generateProductCard(p, true);
        });
    } catch (error) {}
}

window.openTrendingAll = function() {
    document.getElementById('trendingOverlay').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    const grid = document.getElementById('trendingGridFull');
    grid.innerHTML = '';
    let trendingProducts = [...window.allProductsList].sort(() => 0.5 - Math.random());
    trendingProducts.forEach(p => { grid.innerHTML += window.generateProductCard(p, true); });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.closeTrending = function() {
    document.getElementById('trendingOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

// ==========================================
// PROMO CODE LOGIC 
// ==========================================
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
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.closePromoModal = function() {
    document.getElementById('promoModalOverlay').classList.add('opacity-0');
    document.getElementById('promoModalContent').classList.add('scale-95', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => {
        document.getElementById('promoModal').classList.add('hidden');
        document.getElementById('promoModal').classList.remove('flex');
    }, 300);
}

window.processPromoCode = async function() {
    const promoBox = document.getElementById('promoInput');
    const code = promoBox.value.trim().toUpperCase();
    if(!code) { window.showToast("Please enter a Promo Code!", "error"); return; }

    let usedPromos = JSON.parse(localStorage.getItem('aavira_used_promos')) || [];
    if (usedPromos.includes(code)) {
        window.showToast("Oops! You have already used this promo code once.", "error"); return;
    }
    
    const btn = document.getElementById('btnApplyPromo');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Checking...';
    btn.disabled = true;

    try {
        const VERCEL_URL = "https://aavira-fashion-backend.vercel.app";
        const response = await fetch(`${VERCEL_URL}/api/promocodes/${code}`, {
            method: 'GET', headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if(response.ok && result.status === "success") {
            const dbData = result.data;
            const appliedPromoCode = dbData.id || code;
            const discountAmt = Number(dbData.discountAmount) || Number(dbData.discount) || Number(dbData.amount) || 0; 
            
            window.showToast(`Success! Flat ₹${discountAmt} OFF applied! 🎉`, "success");
            localStorage.setItem('aavira_active_promo', JSON.stringify({ code: appliedPromoCode, discount: discountAmt }));
            usedPromos.push(appliedPromoCode);
            localStorage.setItem('aavira_used_promos', JSON.stringify(usedPromos));
            
            window.updateProfileUI(); 
            setTimeout(() => { window.closePromoModal(); }, 1200);
        } else {
            window.showToast(result.message || "This promo code is invalid or expired.", "error");
        }
    } catch(e) { window.showToast("Network Error! Could not connect to the server.", "error"); }

    btn.innerHTML = 'Verify & Apply'; btn.disabled = false;
}

window.removePromoCode = function() {
    localStorage.removeItem('aavira_active_promo');
    window.updateProfileUI();
    window.showToast("Promo Code Removed", "success");
}

// ==========================================
// AUTHENTICATION ENGINE
// ==========================================
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
    window.closeSidebar(); window.clearAuthInputs(); 
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('flex');
    document.body.style.overflow = 'hidden';
    window.toggleAuthView('signup');
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
    setTimeout(() => {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
        window.clearAuthInputs(); 
    }, 300);
}

window.processSignup = async function() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pwd = document.getElementById('signupPassword').value.trim();

    if(!name) { window.showToast("Please enter Full Name.", 'error'); return; }
    if(!email || !pwd) { window.showToast("Email and password required!", 'error'); return; }
    if (typeof window.DeliveryBoy === 'undefined') { window.showToast("user_data.js missing!", 'error'); return; }

    const btn = document.getElementById('btnSignupAction');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Processing...';
    btn.disabled = true;

    try {
        const checkRes = await window.DeliveryBoy.checkEmailExists(email);
        if (checkRes && checkRes.exists) {
            window.showToast("Email is already registered. Please Login.", 'error');
            window.toggleAuthView('login');
            btn.innerHTML = 'Get Secure OTP <i data-lucide="arrow-right" class="w-4 h-4"></i>';
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons(); return;
        }
    } catch(e) {}

    tempSignupData = { name, email, pwd };

    try {
        const result = await window.DeliveryBoy.sendOTP(email, name);
        if(result && result.ok && result.data && result.data.success) {
            window.showToast("Verification OTP sent!", 'success');
            document.getElementById('otpSubText').innerText = `Code sent to ${email}`;
            window.toggleAuthView('otp');
        } else { window.showToast(result.data?.message || "Failed to send OTP.", 'error'); }
    } catch (error) { window.showToast("Network Error! Backend unreachable.", 'error'); }
    
    btn.innerHTML = 'Get Secure OTP <i data-lucide="arrow-right" class="w-4 h-4"></i>';
    btn.disabled = false;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.verifySignupOTP = async function() {
    const otpVal = document.getElementById('otpInput').value.trim();
    if(otpVal.length !== 6) { window.showToast("Enter complete 6-digit OTP!", 'error'); return; }
    
    const vBtn = document.getElementById('btnOtpAction');
    vBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Finalizing...'; 
    vBtn.disabled = true;

    try {
        const result = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otpVal, tempSignupData.name, tempSignupData.pwd);
        if(result && result.ok && result.data && result.data.success) {
            const finalName = tempSignupData.name || tempSignupData.email.split('@')[0];
            localStorage.setItem('aavira_display_name', finalName);
            localStorage.setItem('aavira_user_email', tempSignupData.email);
            
            if(typeof window.processReferral === 'function') window.processReferral(tempSignupData.email);

            window.showToast("Verified Successfully! Welcome to Aavira.", 'success');
            window.updateProfileUI();
            setTimeout(() => { window.closeLoginModal(); }, 1500);
        } else { window.showToast(result.data?.message || "Invalid OTP!", 'error'); }
    } catch (error) { window.showToast("Network Error!", 'error'); }

    vBtn.innerHTML = 'Verify & Complete Setup <i data-lucide="check-circle" class="w-4 h-4"></i>';
    vBtn.disabled = false; 
}

window.processLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    if(!email || !pwd) { window.showToast("Email and password required!", 'error'); return; }

    const btn = document.getElementById('btnLoginAction');
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Checking...';
    btn.disabled = true;

    try {
        const result = await window.DeliveryBoy.login(email, pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', result.data.userName || email.split('@')[0]);
            localStorage.setItem('aavira_user_email', email);
            window.showToast("Login Successful!", 'success');
            window.updateProfileUI();
            setTimeout(() => { window.closeLoginModal(); }, 1000);
        } else { window.showToast(result.data?.message || "Invalid Email or Password.", 'error'); }
    } catch(e) { window.showToast("Network Error!", 'error'); }

    btn.innerHTML = 'Secure Login <i data-lucide="log-in" class="w-4 h-4"></i>';
    btn.disabled = false;
}

// ==========================================
// ENGINE START
// ==========================================
window.initializeAppEngine = function() {
    window.updateProfileUI();
    window.updateNotifBadge();
    window.loadSkeletons();
    window.updateCartCount();
    window.initScrollAnimations();
    
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
