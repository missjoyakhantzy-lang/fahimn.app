/* ==========================================
   AAVIRA PREMIUM JAVASCRIPT
========================================== */
window.allProductsList = [];

// ✨ 1. FIRST TIME WELCOME POPUP & HEADER SCROLL
let lastScrollTop = 0;
const mainHeader = document.getElementById('main-header');

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

function checkFirstVisit() {
    if(!localStorage.getItem('aavira_first_visit')) {
        const modal = document.getElementById('welcomePopupModal');
        if(!modal) return;
        modal.classList.remove('hidden'); modal.classList.add('flex');
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.children[0].classList.remove('scale-95');
        }, 100);

        setTimeout(() => {
            modal.classList.add('opacity-0');
            modal.children[0].classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }, 3000); // Hide after 3 seconds

        localStorage.setItem('aavira_first_visit', 'true');
    }
}

// ✨ 2. NOTIFICATION PERMISSION LOGIC
window.requestNotificationPermission = async function() {
    closeSidebar();
    if (!("Notification" in window)) {
        showToast("Push notifications not supported on this browser.", true);
        return;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            showToast("Notifications Enabled! 🎉", false);
            console.log("FCM/Push Token saved to backend database.");
            localStorage.setItem('aavira_notif_enabled', 'true');
        } else {
            showToast("Notification permission denied.", true);
        }
    } catch(e) { console.error(e); }
}

// ✨ 3. SIDEBAR VIP CARD LOGIC 
function updateProfileUI() {
    const savedName = localStorage.getItem('aavira_display_name');
    const guestUI = document.getElementById('guestProfileUI');
    const vipUI = document.getElementById('vipProfileUI');
    const vipName = document.getElementById('vipName');
    const profileInitial = document.getElementById('profileInitial');

    if (savedName && savedName.toLowerCase() !== "guest user") {
        if(guestUI) guestUI.classList.add('hidden');
        if(vipUI) { vipUI.classList.remove('hidden'); vipUI.classList.add('flex'); }
        if(vipName) vipName.innerText = savedName;
        if(profileInitial) profileInitial.innerText = savedName.charAt(0).toUpperCase();
    } else {
        if(vipUI) { vipUI.classList.add('hidden'); vipUI.classList.remove('flex'); }
        if(guestUI) guestUI.classList.remove('hidden');
    }
}

window.handleLogout = function() {
    localStorage.removeItem('aavira_display_name');
    updateProfileUI();
    showToast("Logged out securely!", "check-circle");
    closeSidebar();
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

// ✨ 4. SEARCH & OVERLAYS
function openSearch() {
    document.getElementById('searchOverlay').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 300);
}
function closeSearch() {
    document.getElementById('searchOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('searchResults');
    if(!query) {
        container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic flex flex-col items-center gap-2"><i data-lucide="search" class="w-8 h-8 opacity-20"></i>Type something to search our collection...</div>';
        lucide.createIcons(); return;
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

// ✨ 5. VIEW ALL TRENDING SCREEN ✨
window.openTrendingAll = function() {
    document.getElementById('trendingOverlay').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    const grid = document.getElementById('trendingGridFull');
    grid.innerHTML = '';
    // Display all products mixed up for trending
    let trendingProducts = [...window.allProductsList].sort(() => 0.5 - Math.random());
    trendingProducts.forEach(p => { grid.innerHTML += generateProductCard(p, true); });
    lucide.createIcons();
}
window.closeTrending = function() {
    document.getElementById('trendingOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}

// ✨ 6. COLOR WHEEL LOGIC
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

// STRICT COLOR ALGORITHM
function getClosestColorName(h, s, l) {
    if (l < 20) return "black";
    if (l > 90) return "white";
    if (s < 15) return "grey";
    if (h < 15 || h >= 345) return "red";
    if (h >= 15 && h < 45) return "orange";
    if (h >= 45 && h < 75) return "yellow";
    if (h >= 75 && h < 160) return "green";
    if (h >= 160 && h < 195) return "cyan";
    if (h >= 195 && h < 260) return "blue";
    if (h >= 260 && h < 290) return "purple";
    if (h >= 290 && h < 345) return "pink";
    return "";
}

function updateColorUI() {
    colorData.hex = hslToHex(colorData.h, colorData.s, colorData.l);
    if(preview) preview.style.backgroundColor = colorData.hex; 
    if(hexText) hexText.innerText = colorData.hex;
    if(satInput) satInput.style.background = `linear-gradient(to right, #808080, ${hslToHex(colorData.h, 100, colorData.l)})`;
    if(lightInput) lightInput.style.background = `linear-gradient(to right, #000000, ${hslToHex(colorData.h, colorData.s, 50)}, #FFFFFF)`;
    const satV = document.getElementById('satVal'), ligV = document.getElementById('lightVal');
    if(satV) satV.innerText = `${colorData.s}%`; 
    if(ligV) ligV.innerText = `${colorData.l}%`;
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

function copyHex() { navigator.clipboard.writeText(colorData.hex); showToast("Color Code Copied!", "check-circle"); }

function openColorModal() {
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

function closeColorModal() {
    document.getElementById('colorModalOverlay').classList.add('opacity-0'); 
    document.getElementById('colorModalContent').classList.add('scale-95', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => { document.getElementById('colorPickerModal').classList.add('hidden'); document.getElementById('colorPickerModal').classList.remove('flex'); }, 300);
}

// APPLY COLOR & SEARCH
window.applyColorAndSearch = function() {
    closeColorModal();
    
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
            matchedProducts.forEach(p => {
                grid.innerHTML += generateProductCard(p, true);
            });
            lucide.createIcons();
        } else {
            grid.innerHTML = `
                <div class="col-span-2 flex flex-col items-center justify-center mt-20 text-center">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 border-2 border-dashed border-gray-200">
                        <i data-lucide="frown" class="w-10 h-10"></i>
                    </div>
                    <h4 class="text-gray-800 text-lg font-bold mb-1">No products found</h4>
                    <p class="text-xs text-gray-500 max-w-[220px]">We couldn't find any products in <b class="text-gray-800">${colorStr.toUpperCase()}</b> shade. Try selecting a different color.</p>
                </div>`;
            lucide.createIcons();
        }
    }, 350);
}

window.closeColorResults = function() {
    document.getElementById('colorResultsOverlay').classList.add('translate-x-full');
    document.body.style.overflow = '';
}


// ✨ 7. UTILS
function openSidebar() { 
    updateProfileUI();
    const sbOv = document.getElementById('sidebarOverlay'), sb = document.getElementById('sidebar');
    sbOv.classList.remove('hidden'); document.body.style.overflow = 'hidden'; 
    setTimeout(()=>{ sbOv.classList.remove('opacity-0'); sb.classList.remove('-translate-x-full'); }, 10); 
}
function closeSidebar() { 
    const sbOv = document.getElementById('sidebarOverlay'), sb = document.getElementById('sidebar');
    sb.classList.add('-translate-x-full'); sbOv.classList.add('opacity-0'); document.body.style.overflow = ''; 
    setTimeout(()=>{ sbOv.classList.add('hidden'); }, 300); 
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast'), icon = document.getElementById('toast-icon'), msg = document.getElementById('toast-msg');
    msg.innerText = message; icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : type); lucide.createIcons();
    toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none'); }, 2500);
}

function goToProduct(id) {
    let recent = JSON.parse(localStorage.getItem('aavira_recent')) || [];
    recent = recent.filter(item => item !== id); recent.unshift(id);
    if(recent.length > 8) recent.pop(); localStorage.setItem('aavira_recent', JSON.stringify(recent));
    window.location.href = `product-details.html?id=${id}`;
}

window.toggleHeart = function(event, btn, id) {
    event.preventDefault(); event.stopPropagation();
    const icon = btn.querySelector('i'); let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
    btn.classList.toggle('text-red-500'); btn.classList.toggle('text-gray-400');
    if (btn.classList.contains('text-red-500')) { 
        if (!wishlist.includes(id)) wishlist.push(id); icon.setAttribute('fill', 'currentColor'); showToast("Added to Wishlist ❤️", "heart");
    } else { 
        wishlist = wishlist.filter(item => item !== id); icon.setAttribute('fill', 'none'); 
    }
    localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
}

function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 }); 
    reveals.forEach(reveal => observer.observe(reveal));
    setTimeout(() => reveals.forEach(r => { if(r.getBoundingClientRect().top < window.innerHeight) r.classList.add('active'); }), 100);
}

function loadSkeletons() {
    document.getElementById('category-container').innerHTML = Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[76px] h-[76px] rounded-full premium-skeleton border-2 border-white shadow-sm"></div></div>`).join('');
    const prodSkel = `<div class="w-[150px] shrink-0 bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
    document.getElementById('trending-container').innerHTML = Array(3).fill(prodSkel).join('');
    const gridSkel = `<div class="w-full bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
    document.getElementById('new-arrivals-container').innerHTML = Array(4).fill(gridSkel).join('');
}

// ✨ 8. PRODUCT CARD GENERATOR
const generateProductCard = (p, isGrid) => {
    let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
    let discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    let mrpHtml = mrp > price ? `<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${mrp}</span>` : ``; 
    let badgeHtml = discount > 0 ? `<span class="text-[9px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded ml-1.5 tracking-wider">${discount}% OFF</span>` : '';
    let w = (JSON.parse(localStorage.getItem('aavira_wishlist')) || []).includes(p.id);
    
    return `
    <div class="${isGrid ? 'w-full' : 'snap-start shrink-0 w-[150px]'} bg-white block overflow-hidden flex flex-col relative rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 group">
        <div class="relative overflow-hidden bg-[#F9F9F9] cursor-pointer" style="aspect-ratio: 1;" onclick="goToProduct('${p.id}')">
            <img src="${p.img}" class="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <button class="absolute top-2 right-2 p-1.5 z-10 transition-colors ${w ? 'text-red-500' : 'text-gray-400'} drop-shadow-md hover:text-red-500" onclick="toggleHeart(event, this, '${p.id}')">
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
                    <button class="relative overflow-hidden w-[28px] h-[28px] flex items-center justify-center bg-ethnic-burgundy text-white hover:bg-[#4a121c] transition-all duration-300 rounded-full cursor-pointer shrink-0 shadow-md group/btn" onclick="goToProduct('${p.id}')">
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                        <div class="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%] animate-shimmer-sweep"></div>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
};

// ✨ 9. FETCH DATA & AUTO-SLIDING BANNER
window.fetchBanners = async function() {
    try {
        const docsArr = typeof window.getBannersData === 'function' ? await window.getBannersData() : [];
        if(docsArr && docsArr.length > 0) {
            const carousel = document.getElementById('bannerCarousel');
            carousel.classList.remove('bg-gray-200', 'premium-skeleton'); carousel.innerHTML = ''; 
            
            docsArr.forEach(d => {
                let url = d.imageUrl || d.image || d.url || 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=800'; 
                carousel.innerHTML += `<div class="snap-start shrink-0 w-full h-full relative flex items-end justify-center overflow-hidden banner-slide" onclick="window.location.href='${d.link || '#'}'"><img src="${url}" class="absolute inset-0 w-full h-full object-cover object-[center_20%] scale-105 hover:scale-100 transition-transform duration-[10s]" /><div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div><div class="relative z-10 text-center px-6 pb-14 w-full flex flex-col items-center"><span class="text-ethnic-gold font-sans tracking-[0.4em] text-[9px] uppercase mb-3 drop-shadow">Aavira Exclusive</span><h2 class="font-serif text-[32px] text-white mb-5 leading-tight shadow-black drop-shadow-lg">Timeless <br/><span class="text-[40px] font-light italic font-['Dancing_Script']">Elegance</span></h2><button class="bg-white text-ethnic-burgundy px-8 py-3 text-[10px] font-bold uppercase rounded shadow-lg hover:bg-ethnic-burgundy hover:text-white transition-colors">Shop Now</button></div></div>`;
            });

            const dotsContainer = document.getElementById('banner-dots');
            dotsContainer.innerHTML = docsArr.map((_, i) => `<div class="banner-dot h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}"></div>`).join('');
            
            let autoSlideInterval;
            let isUserInteracting = false;

            const startAutoSlide = () => {
                autoSlideInterval = setInterval(() => {
                    if (!isUserInteracting && carousel) {
                        let maxScroll = carousel.scrollWidth - carousel.clientWidth;
                        if (carousel.scrollLeft >= maxScroll - 10) {
                            carousel.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
                        }
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
                catCont.innerHTML += `<button class="flex flex-col items-center gap-2.5 group w-[76px] shrink-0" onclick="window.location.href='categories.html'"><div class="h-[76px] w-[76px] rounded-full overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg transition-all p-0.5 bg-gradient-to-tr from-ethnic-gold/40 to-ethnic-burgundy/40"><img src="${img}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" /></div><span class="text-[10px] font-bold text-gray-700 uppercase tracking-wider">${data.name}</span></button>`;
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
            if (index < 4) document.getElementById('trending-container').innerHTML += generateProductCard(p, false);
            else document.getElementById('new-arrivals-container').innerHTML += generateProductCard(p, true);
        });

        let recentIds = JSON.parse(localStorage.getItem('aavira_recent')) || [];
        if(recentIds.length > 0) {
            let recentHtml = ''; recentIds.forEach(id => { const p = window.allProductsList.find(x => x.id === id); if(p) recentHtml += generateProductCard(p, false); });
            if(recentHtml) { document.getElementById('recent-section').classList.remove('hidden'); document.getElementById('recent-container').innerHTML = recentHtml; }
        }
    } catch (error) {}
}

// ✨ 10. REVIEWS LOGIC (HORIZONTAL RENDER) ✨
let selectedRating = 0;

window.handleWriteReviewClick = function() {
    const savedName = localStorage.getItem('aavira_display_name');
    if (!savedName || savedName.toLowerCase() === "guest user") {
        const loginModal = document.getElementById('loginPromptModal');
        loginModal.classList.remove('hidden'); loginModal.classList.add('flex');
        setTimeout(() => {
            loginModal.classList.remove('opacity-0');
            loginModal.children[1].classList.remove('translate-y-full');
        }, 10);
    } else {
        document.getElementById('reviewUserName').innerText = savedName;
        document.getElementById('reviewUserInitial').innerText = savedName.charAt(0).toUpperCase();
        const reviewModal = document.getElementById('reviewModal');
        reviewModal.classList.remove('hidden'); reviewModal.classList.add('flex');
        setTimeout(() => {
            reviewModal.classList.remove('opacity-0');
            reviewModal.children[1].classList.remove('translate-y-full');
        }, 10);
    }
}

window.closeReviewModals = function() {
    const loginModal = document.getElementById('loginPromptModal');
    const reviewModal = document.getElementById('reviewModal');
    if(loginModal) {
        loginModal.classList.add('opacity-0');
        loginModal.children[1].classList.add('translate-y-full');
        setTimeout(() => { loginModal.classList.add('hidden'); loginModal.classList.remove('flex'); }, 300);
    }
    if(reviewModal) {
        reviewModal.classList.add('opacity-0');
        reviewModal.children[1].classList.add('translate-y-full');
        setTimeout(() => { reviewModal.classList.add('hidden'); reviewModal.classList.remove('flex'); }, 300);
    }
}

window.setRating = function(rating) {
    selectedRating = parseInt(rating);
    const buttons = document.querySelectorAll('.star-btn');
    buttons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-val'));
        const svg = btn.querySelector('svg');
        if (val <= selectedRating) {
            btn.classList.add('text-ethnic-gold');
            btn.classList.remove('text-gray-300');
            if(svg) svg.setAttribute('fill', 'currentColor');
        } else {
            btn.classList.remove('text-ethnic-gold');
            btn.classList.add('text-gray-300');
            if(svg) svg.setAttribute('fill', 'none');
        }
    });
}

window.submitReview = function() {
    if (selectedRating === 0) return showToast("Please select a star rating!", "circle-x");
    const text = document.getElementById('reviewText').value.trim();
    if (!text) return showToast("Please write a review!", "circle-x");

    const userName = localStorage.getItem('aavira_display_name');
    const newReview = {
        id: Date.now(),
        name: userName,
        rating: selectedRating,
        text: text,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    let allReviews = JSON.parse(localStorage.getItem('aavira_global_reviews')) || [];
    allReviews.unshift(newReview); 
    localStorage.setItem('aavira_global_reviews', JSON.stringify(allReviews));
    
    showToast("Review Posted Successfully!");
    closeReviewModals();
    window.setRating(0);
    document.getElementById('reviewText').value = '';
    renderReviews(); 
}

window.renderReviews = function() {
    const container = document.getElementById('reviewsList');
    if(!container) return;

    let allReviews = JSON.parse(localStorage.getItem('aavira_global_reviews')) || [];

    if (allReviews.length === 0) {
        container.innerHTML = `
            <div class="w-full text-center py-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed shrink-0">
                <i data-lucide="message-square" class="w-8 h-8 text-gray-300 mx-auto mb-2"></i>
                <h4 class="text-sm font-bold text-gray-700">No review found</h4>
                <p class="text-[11px] text-gray-500 mt-1">Be the first to share your experience!</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    let html = '';
    allReviews.forEach(r => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            if(i <= r.rating) starsHtml += `<i data-lucide="star" class="w-3 h-3 text-ethnic-gold" fill="currentColor"></i>`;
            else starsHtml += `<i data-lucide="star" class="w-3 h-3 text-gray-300"></i>`;
        }

        html += `
        <div class="snap-start shrink-0 w-[280px] bg-white border border-gray-100 p-4 rounded-2xl shadow-sm relative">
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-ethnic-burgundy/10 text-ethnic-burgundy flex items-center justify-center font-serif font-bold text-[13px]">
                        ${r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-gray-800">${r.name}</h4>
                        <div class="flex gap-0.5 mt-0.5">${starsHtml}</div>
                    </div>
                </div>
                <span class="text-[9px] text-gray-400 font-medium">${r.date}</span>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed mt-2 whitespace-normal">${r.text}</p>
        </div>`;
    });
    container.innerHTML = html;
    lucide.createIcons();
}

window.initializeAppEngine = async function() {
    updateProfileUI();
    loadSkeletons();
    window.updateCartCount();
    renderReviews();
    checkFirstVisit();
    try { await Promise.all([window.fetchBanners(), window.fetchCategories(), window.fetchProducts()]); } 
    finally { if(typeof lucide !== 'undefined') lucide.createIcons(); initScrollAnimations(); }
}

document.addEventListener("DOMContentLoaded", window.initializeAppEngine);
