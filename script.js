const originalWarn = console.warn;
        console.warn = function(...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
            originalWarn.apply(console, args);
        };

tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'ethnic-burgundy': '#6A1B29',
                        'ethnic-gold': '#E5C158',
                        'modal-dark': '#151517',
                        'modal-card': '#1c1c1f',
                        'modal-stroke': '#2d2d30'
                    }
                }
            }
        }

window.allProductsList = [];

    // ✨ SCROLL: HIDE/SHOW HEADER & GLASS EFFECT ✨
    let lastScrollTop = 0;
    const mainHeader = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 1. Glass Effect
        if(scrollTop > 10) {
            mainHeader.classList.add('shadow-md', 'bg-white/90', 'border-b', 'border-gray-200/50');
            mainHeader.classList.remove('bg-[#FAF8F5]/60');
        } else {
            mainHeader.classList.remove('shadow-md', 'bg-white/90', 'border-b', 'border-gray-200/50');
            mainHeader.classList.add('bg-[#FAF8F5]/60');
        }

        // 2. Hide/Show Animation on Scroll
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            // Scrolling down -> Hide
            mainHeader.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up -> Show
            mainHeader.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Editable Display Name Logic
    function saveProfileName() {
        const nameNode = document.getElementById('profileName');
        const name = nameNode.innerText.trim();
        if (name === "") {
            nameNode.innerText = "Guest User";
            localStorage.setItem('aavira_display_name', "Guest User");
        } else {
            localStorage.setItem('aavira_display_name', name);
            showToast("Profile name updated!", "check-circle");
        }
    }

    // ==========================================
    // CART LOGIC
    // ==========================================
    window.updateCartCount = function() {
        let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
        const badge = document.getElementById('cart-badge');
        badge.innerText = cart.length;
        if(cart.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }

    // ==========================================
    // SEARCH OVERLAY LOGIC
    // ==========================================
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
            container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No products found matching your search.</div>';
            return;
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
    // COLOR WHEEL MATH
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

    function updateColorUI() {
        colorData.hex = hslToHex(colorData.h, colorData.s, colorData.l);
        preview.style.backgroundColor = colorData.hex; hexText.innerText = colorData.hex;
        satInput.style.background = `linear-gradient(to right, #808080, ${hslToHex(colorData.h, 100, colorData.l)})`;
        lightInput.style.background = `linear-gradient(to right, #000000, ${hslToHex(colorData.h, colorData.s, 50)}, #FFFFFF)`;
        document.getElementById('satVal').innerText = `${colorData.s}%`; document.getElementById('lightVal').innerText = `${colorData.l}%`;
    }

    function setWheelAngle(angleDeg) {
        colorData.h = Math.round(angleDeg); const rad = (angleDeg - 90) * (Math.PI / 180);
        const centerX = wheel.offsetWidth / 2, centerY = wheel.offsetHeight / 2, radius = centerX - 13;
        const x = Math.cos(rad) * radius + centerX, y = Math.sin(rad) * radius + centerY;
        thumb.style.left = `${x}px`; thumb.style.top = `${y}px`; updateColorUI();
    }

    function handleWheelMove(e) {
        if (!isDragging) return;
        const rect = wheel.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX, clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left - (rect.width / 2), y = clientY - rect.top - (rect.height / 2);
        let angleDeg = Math.atan2(y, x) * (180 / Math.PI) + 90; if (angleDeg < 0) angleDeg += 360;
        setWheelAngle(angleDeg);
    }

    wheel.addEventListener('mousedown', (e) => { isDragging = true; handleWheelMove(e); });
    wheel.addEventListener('touchstart', (e) => { isDragging = true; handleWheelMove(e); });
    document.addEventListener('mousemove', handleWheelMove);
    document.addEventListener('touchmove', handleWheelMove, {passive: false});
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
    satInput.addEventListener('input', (e) => { colorData.s = e.target.value; updateColorUI(); });
    lightInput.addEventListener('input', (e) => { colorData.l = e.target.value; updateColorUI(); });

    function copyHex() { navigator.clipboard.writeText(colorData.hex); showToast("Color Code Copied!", "check-circle"); }

    function openColorModal() {
        document.getElementById('colorPickerModal').classList.remove('hidden');
        document.getElementById('colorPickerModal').classList.add('flex');
        document.body.style.overflow = 'hidden';
        setTimeout(() => { setWheelAngle(45); document.getElementById('colorModalOverlay').classList.remove('opacity-0'); document.getElementById('colorModalContent').classList.remove('scale-95', 'opacity-0'); }, 10);
    }

    function closeColorModal() {
        document.getElementById('colorModalOverlay').classList.add('opacity-0'); document.getElementById('colorModalContent').classList.add('scale-95', 'opacity-0');
        document.body.style.overflow = '';
        setTimeout(() => { document.getElementById('colorPickerModal').classList.add('hidden'); document.getElementById('colorPickerModal').classList.remove('flex'); }, 300);
    }

    function applyColor() { closeColorModal(); setTimeout(() => showToast(`Searching styles in ${colorData.hex} ✨`, 'check-circle'), 300); }

    // --- SCROLL ANIMATIONS ---
    function initScrollAnimations() {
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 });
        reveals.forEach(reveal => observer.observe(reveal));
        setTimeout(() => reveals.forEach(r => { if(r.getBoundingClientRect().top < window.innerHeight) r.classList.add('active'); }), 100);
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast'), icon = document.getElementById('toast-icon'), msg = document.getElementById('toast-msg');
        msg.innerText = message;
        icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : type);
        lucide.createIcons();
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

        btn.classList.toggle('text-red-500');
        btn.classList.toggle('text-gray-400');

        if (btn.classList.contains('text-red-500')) {
            if (!wishlist.includes(id)) wishlist.push(id);
            icon.setAttribute('fill', 'currentColor');
            showToast("Added to Wishlist ❤️", "heart");
        } else {
            wishlist = wishlist.filter(item => item !== id);
            icon.setAttribute('fill', 'none');
        }
        localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
    }

    const sb = document.getElementById('sidebar'), sbOv = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sbOv.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(()=>{
            sbOv.classList.remove('opacity-0');
            sb.classList.remove('-translate-x-full');
        }, 10);
    }
    function closeSidebar() {
        sb.classList.add('-translate-x-full');
        sbOv.classList.add('opacity-0');
        document.body.style.overflow = '';
        setTimeout(()=>{sbOv.classList.add('hidden');}, 300);
    }

    function loadSkeletons() {
        document.getElementById('category-container').innerHTML = Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[76px] h-[76px] rounded-full premium-skeleton border-2 border-white shadow-sm"></div></div>`).join('');
        const prodSkel = `<div class="w-[150px] shrink-0 bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
        document.getElementById('trending-container').innerHTML = Array(3).fill(prodSkel).join('');
        const gridSkel = `<div class="w-full bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded w-3/4"></div><div class="mt-2 h-3 premium-skeleton rounded w-1/2 mb-2"></div></div>`;
        document.getElementById('new-arrivals-container').innerHTML = Array(4).fill(gridSkel).join('');
    }

    // ==========================================
    // PRODUCT CARD
    // ==========================================
    const generateProductCard = (p, isGrid) => {
        let price = Number(p.price) || 0; let mrp = Number(p.mrp) || price;
        let discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        let mrpHtml = mrp > price ? `<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${mrp}</span>` : ``;
        let badgeHtml = discount > 0 ? `<span class="text-[9px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded ml-1.5 tracking-wider">${discount}% OFF</span>` : '';
        let w = (JSON.parse(localStorage.getItem('aavira_wishlist')) || []).includes(p.id);

        return `
        <div class="${isGrid ? 'w-full' : 'snap-start shrink-0 w-[150px]'} bg-white block overflow-hidden flex flex-col relative rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 group">

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
                        <div class="flex items-center">
                            <span class="text-[14px] font-bold text-ethnic-burgundy font-sans leading-none">₹${price}</span>
                            ${badgeHtml}
                        </div>
                        <div class="mt-1 leading-none h-[12px]">
                            ${mrpHtml}
                        </div>
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

    // ==========================================
    // DATA FETCHING
    // ==========================================
    window.fetchBanners = async function() {
        try {
            const docsArr = typeof window.getBannersData === 'function' ? await window.getBannersData() : [];
            if(docsArr && docsArr.length > 0) {
                const carousel = document.getElementById('bannerCarousel');
                carousel.classList.remove('bg-gray-200', 'premium-skeleton'); carousel.innerHTML = '';

                docsArr.forEach(d => {
                    let url = d.imageUrl || d.image || d.url || 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=800';
                    carousel.innerHTML += `<div class="snap-start shrink-0 w-full h-full relative flex items-end justify-center overflow-hidden" onclick="window.location.href='${d.link || '#'}'"><img src="${url}" class="absolute inset-0 w-full h-full object-cover object-[center_20%] scale-105 hover:scale-100 transition-transform duration-[10s]" /><div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div><div class="relative z-10 text-center px-6 pb-14 w-full flex flex-col items-center"><span class="text-ethnic-gold font-sans tracking-[0.4em] text-[9px] uppercase mb-3 drop-shadow">Aavira Exclusive</span><h2 class="font-serif text-[32px] text-white mb-5 leading-tight shadow-black drop-shadow-lg">Timeless <br/><span class="text-[40px] font-light italic font-['Dancing_Script']">Elegance</span></h2><button class="bg-white text-ethnic-burgundy px-8 py-3 text-[10px] font-bold uppercase rounded shadow-lg hover:bg-ethnic-burgundy hover:text-white transition-colors">Shop Now</button></div></div>`;
                });

                const dotsContainer = document.getElementById('banner-dots');
                dotsContainer.innerHTML = docsArr.map((_, i) => `<div class="banner-dot h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}"></div>`).join('');

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
                if (index < 4) {
                    document.getElementById('trending-container').innerHTML += generateProductCard(p, false);
                } else {
                    document.getElementById('new-arrivals-container').innerHTML += generateProductCard(p, true);
                }
            });

            let recentIds = JSON.parse(localStorage.getItem('aavira_recent')) || [];
            if(recentIds.length > 0) {
                let recentHtml = ''; recentIds.forEach(id => { const p = window.allProductsList.find(x => x.id === id); if(p) recentHtml += generateProductCard(p, false); });
                if(recentHtml) { document.getElementById('recent-section').classList.remove('hidden'); document.getElementById('recent-container').innerHTML = recentHtml; }
            }
        } catch (error) {}
    }

    window.initializeAppEngine = async function() {
        const savedName = localStorage.getItem('aavira_display_name');
        if (savedName) document.getElementById('profileName').innerText = savedName;

        loadSkeletons();
        updateCartCount();
        try { await Promise.all([window.fetchBanners(), window.fetchCategories(), window.fetchProducts()]); }
        finally { if(typeof lucide !== 'undefined') lucide.createIcons(); initScrollAnimations(); }
    }
    document.addEventListener("DOMContentLoaded", window.initializeAppEngine);
