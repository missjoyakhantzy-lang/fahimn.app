import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCMGx6C5_al22KjCmdhGVKugJoR2UmZ1Ng",
    authDomain: "aavira-co-in.firebaseapp.com",
    projectId: "aavira-co-in",
    storageBucket: "aavira-co-in.firebasestorage.app",
    messagingSenderId: "247971292356",
    appId: "1:247971292356:web:82780c6dffe9ba530f9591"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.allProductsList = [];
window.productsCache = {};
window.currentMagicColor = ''; 

/* PRELOADER CONTROLLER FUNCTIONS */
window.showPreloader = function(text = "Loading Aavira...") {
    const preloader = document.getElementById('appPreloader');
    const dots = document.querySelector('.loader-dots');
    const pText = document.getElementById('preloaderText');
    const offlineBox = document.getElementById('offlineBox');
    
    if (preloader) {
        if (dots) dots.style.display = 'flex';
        if (pText) { pText.innerText = text; pText.style.display = 'block'; }
        if (offlineBox) offlineBox.style.display = 'none';
        preloader.style.opacity = '1'; preloader.style.visibility = 'visible';
    }
}

window.hidePreloader = function() {
    const preloader = document.getElementById('appPreloader');
    if (preloader) { preloader.style.opacity = '0'; preloader.style.visibility = 'hidden'; }
}

/* OFFLINE STATUS CONTROLLER */
window.updateConnectionStatus = function() {
    const dots = document.querySelector('.loader-dots');
    const pText = document.getElementById('preloaderText');
    const offlineBox = document.getElementById('offlineBox');
    const preloader = document.getElementById('appPreloader');

    if (!navigator.onLine) {
        if (dots) dots.style.display = 'none';
        if (pText) pText.style.display = 'none';
        if (offlineBox) offlineBox.style.display = 'flex';
        if (preloader) { preloader.style.opacity = '1'; preloader.style.visibility = 'visible'; }
    } else {
        if (offlineBox) offlineBox.style.display = 'none';
    }
}

window.checkInternetRetry = function() {
    if (navigator.onLine) {
        const dots = document.querySelector('.loader-dots');
        const pText = document.getElementById('preloaderText');
        const offlineBox = document.getElementById('offlineBox');
        if (offlineBox) offlineBox.style.display = 'none';
        if (dots) dots.style.display = 'flex';
        if (pText) { pText.innerText = "Reconnecting..."; pText.style.display = 'block'; }
        setTimeout(() => { window.location.reload(); }, 1000);
    } else {
        showCustomAlert("Offline", "Still offline. Please check your network settings.", "error");
    }
}
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

/* ==============================================================
    ADVANCED LUXURY MAGIC SCREEN ENGINE
============================================================== */
window.openMagicScreen = function(color) {
    window.currentMagicColor = color;
    const screen = document.getElementById('magicScreen');
    const title = document.getElementById('magicTitle');
    
    title.innerText = `${color} Magic ✨`;
    screen.classList.add('active');
    
    const chips = document.querySelectorAll('.magic-chip');
    chips.forEach(c => c.classList.remove('active'));
    if(chips.length > 0) chips[0].classList.add('active');

    renderAdvancedMagicLayout('All Designs');
}

window.filterMagicProducts = function(element, filterType) {
    const chips = document.querySelectorAll('.magic-chip');
    chips.forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    renderAdvancedMagicLayout(filterType);
}

window.renderAdvancedMagicLayout = function(filterType) {
    const container = document.getElementById('magicProductsContainer');
    container.innerHTML = '<div style="width:100%; text-align:center; padding: 60px 0;"><i class="fa-solid fa-wand-magic-sparkles fa-spin" style="font-size: 30px; color: var(--primary-color);"></i><p style="margin-top:15px; font-size:12px; font-weight:600; color:var(--text-muted);">Brewing Magic...</p></div>';
    
    setTimeout(() => {
        let filtered = window.allProductsList.filter(p => {
            return (p.color && p.color.toLowerCase() === window.currentMagicColor.toLowerCase()) || p.name.toLowerCase().includes(window.currentMagicColor.toLowerCase());
        });

        if(filterType === 'Premium Silk') {
            let temp = filtered.filter(p => p.name.toLowerCase().includes('silk'));
            if(temp.length > 0) filtered = temp;
            else filtered = filtered.slice(0, Math.ceil(filtered.length / 2)); 
        } else if (filterType === 'Hand Embroidered') {
            let temp = filtered.filter(p => p.name.toLowerCase().includes('embroider') || p.name.toLowerCase().includes('work'));
            if(temp.length > 0) filtered = temp;
            else filtered = filtered.slice(Math.floor(filtered.length / 2)); 
        } else if (filterType === 'Trending Now') {
            filtered = [...filtered].reverse(); 
        }

        if(filtered.length === 0) {
            container.innerHTML = `<div style="width:100%; text-align:center; padding: 60px 20px;"><i class="fa-regular fa-face-frown" style="font-size: 45px; color: #ddd; margin-bottom:15px;"></i><p style="font-size:13px; color:var(--text-muted);">No items match this filter in ${window.currentMagicColor}.<br>Try another category!</p></div>`;
            return;
        }

        let html = '';
        if(filtered.length >= 1) {
            let p = filtered[0];
            html += `
                <div style="padding:0 20px;">
                    <div class="magic-hero-card" onclick="window.location.href='product-details.html?id=${p.id}'" style="animation: fadeInUp 0.4s ease forwards;">
                        <div class="magic-img-bg" style="height: 300px; background-image: url('${p.img}');"></div>
                        <div class="magic-overlay">
                            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h4>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <p>₹${p.price}</p>
                                <span style="background:var(--primary-color); color:#fff; font-size:10px; padding:6px 14px; border-radius:12px;"><i class="fa-solid fa-bag-shopping"></i> View</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        if(filtered.length >= 2) {
            html += `<h4 style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 5px 20px 10px; animation: fadeInUp 0.5s ease forwards;">Top Picks in ${window.currentMagicColor}</h4>`;
            html += `<div class="magic-h-scroll" style="animation: fadeInUp 0.5s ease forwards;">`;
            let scrollLimit = Math.min(4, filtered.length); 
            for(let i = 1; i < scrollLimit; i++) {
                let p = filtered[i];
                html += `
                    <div class="magic-h-card" onclick="window.location.href='product-details.html?id=${p.id}'">
                        <div class="magic-img-bg" style="height: 160px; background-image: url('${p.img}');"></div>
                        <div style="padding: 10px; background:var(--white);">
                            <h4 style="font-size: 11px; margin-bottom: 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-dark);">${p.name}</h4>
                            <p style="font-size: 12px; font-weight: 700; color:var(--primary-color);">₹${p.price}</p>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        }
        if(filtered.length >= 4) {
            html += `<h4 style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 5px 20px 10px; animation: fadeInUp 0.6s ease forwards;">Explore More Styles</h4>`;
            html += `<div class="magic-masonry" style="animation: fadeInUp 0.6s ease forwards;">`;
            for(let i = 4; i < filtered.length; i++) {
                let p = filtered[i];
                let h = (i % 2 === 0) ? '200px' : '140px'; 
                html += `
                    <div class="product-card-adv" onclick="window.location.href='product-details.html?id=${p.id}'">
                        <div class="magic-img-bg" style="height: ${h}; background-image: url('${p.img}');"></div>
                        <div style="padding: 10px; background:var(--white);">
                            <h4 style="font-size: 11px; font-weight:600; margin-bottom:4px; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h4>
                            <p style="font-size: 12px; font-weight:700; color:var(--primary-color);">₹${p.price}</p>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
    }, 600);
}

window.closeMagicScreen = function() { document.getElementById('magicScreen').classList.remove('active'); }

/* SMART WELCOME LOGIN POPUP LOGIC */
window.checkAndShowWelcomePopup = function() {
    let shownCount = parseInt(localStorage.getItem('aavira_welcome_shown_count') || '0');
    if (shownCount < 2) {
        setTimeout(() => {
            const overlay = document.getElementById('welcomeLoginOverlay');
            if(overlay) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden'; 
                localStorage.setItem('aavira_welcome_shown_count', (shownCount + 1).toString());
            }
        }, 3000);
    }
}
window.closeWelcomePopup = function() {
    const overlay = document.getElementById('welcomeLoginOverlay');
    if(overlay) { overlay.classList.remove('show'); document.body.style.overflow = 'auto'; }
}

/* CUSTOM PROFESSIONAL ALERT DIALOG */
window.showCustomAlert = function(title, message, type = 'success') {
    const overlay = document.getElementById('alertOverlay');
    const iconEl = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    titleEl.innerText = title; msgEl.innerHTML = message;
    if (type === 'success') { iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--success-green); font-size: 45px;"></i>'; } 
    else if (type === 'error') { iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #d32f2f; font-size: 45px;"></i>'; } 
    else { iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: var(--secondary-color); font-size: 45px;"></i>'; }
    overlay.classList.add('show');
}
window.closeAlertModal = function() { document.getElementById('alertOverlay').classList.remove('show'); }

/* SAME SCREEN QUICK DETAILS MODAL ENGINE */
window.openQuickDetails = function(event, productId) {
    event.preventDefault(); event.stopPropagation();
    const product = window.productsCache[productId];
    if (!product) return;
    document.getElementById('sheetImg').style.backgroundImage = `url('${product.img}')`;
    document.getElementById('sheetBrand').innerText = product.brand;
    document.getElementById('sheetTitle').innerText = product.name;
    document.getElementById('sheetPrice').innerText = `₹${product.price}`;
    document.getElementById('sheetDesc').innerText = product.description;
    document.getElementById('sheetBuyBtn').onclick = () => { window.location.href = `product-details.html?id=${productId}`; };
    document.getElementById('quickDetailsOverlay').classList.add('show');
    document.getElementById('quickDetailsSheet').classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.closeQuickDetails = function() {
    document.getElementById('quickDetailsOverlay').classList.remove('show');
    document.getElementById('quickDetailsSheet').classList.remove('active');
    document.body.style.overflow = 'auto';
}

/* --- INIT UI WRAPPER FOR SAFE EXECUTION --- */
const initAppUI = () => {
    /* DYNAMIC LINK TRANSITIONS FOR APP */
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.getAttribute('href') && !target.getAttribute('href').startsWith('#') && !target.getAttribute('href').startsWith('javascript:') && target.id !== 'nativeShareBtn' && target.getAttribute('target') !== '_blank') {
            e.preventDefault();
            const url = target.getAttribute('href');
            showPreloader("Loading Page...");
            setTimeout(() => { window.location.href = url; }, 400); 
        }
    });

    window.updateCartBadge = function() {
        let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const badge = document.getElementById('topCartBadge');
        if(badge) badge.innerText = totalItems;
    }
    updateCartBadge();

    const indicator = document.getElementById('navIndicator');
    const navItems = document.querySelectorAll('.nav-list-item');
    function moveIndicator() {
        const activeItem = document.querySelector('.nav-list-item.active');
        if (activeItem && indicator) {
            const targetLeft = activeItem.offsetLeft + (activeItem.offsetWidth / 2) - (indicator.offsetWidth / 2);
            indicator.style.transform = `translateX(${targetLeft}px)`;
        }
    }
    moveIndicator(); window.addEventListener('resize', moveIndicator);
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active'); moveIndicator();
        });
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleSidebar = () => { 
        sidebar.classList.toggle('active'); 
        overlay.classList.toggle('active'); 
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : 'auto';
    };
    
    // Check if buttons exist before adding listeners to avoid null errors
    if(document.getElementById('openSidebarBtn')) {
        document.getElementById('openSidebarBtn').addEventListener('click', toggleSidebar);
    }
    if(document.getElementById('closeSidebarBtn')) {
        document.getElementById('closeSidebarBtn').addEventListener('click', toggleSidebar);
    }
    if(overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    const mainScrollArea = document.getElementById('mainScrollArea');
    const bottomNav = document.getElementById('bottomNav');
    if(mainScrollArea && bottomNav) {
        let lastScrollY = mainScrollArea.scrollTop;
        mainScrollArea.addEventListener('scroll', () => {
            const currentScrollY = mainScrollArea.scrollTop;
            if (currentScrollY > lastScrollY && currentScrollY > 50) { bottomNav.classList.add('hidden'); } 
            else { bottomNav.classList.remove('hidden'); }
            lastScrollY = currentScrollY;
        });
    }

    updateConnectionStatus();

    const shareBtn = document.getElementById('nativeShareBtn');
    if(shareBtn) {
        shareBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Aavira - Ethnic Elegance',
                        text: 'Check out premium designer blouses on Aavira!',
                        url: window.location.origin
                    });
                } catch (error) { console.log('Error sharing:', error); }
            } else {
                window.showCustomAlert("Share App", "Link copied to clipboard! Share it with your friends.", "success");
                navigator.clipboard.writeText(window.location.origin);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppUI);
} else {
    initAppUI();
}

/* SEARCH OVERLAY LOGIC */
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : 'auto';
    if(overlay.classList.contains('active')) {
        setTimeout(()=> document.getElementById('searchInput').focus(), 100);
    } else {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:30px;"><i class="fa-solid fa-magnifying-glass" style="font-size: 30px; color: #ddd; margin-bottom:10px; display:block;"></i>Type to search amazing products...</p>';
    }
}
window.handleSearch = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    if(!query) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:30px;"><i class="fa-solid fa-magnifying-glass" style="font-size: 30px; color: #ddd; margin-bottom:10px; display:block;"></i>Type to search amazing products...</p>';
        return;
    }
    const filtered = window.allProductsList.filter(p => p.name.toLowerCase().includes(query));
    if(filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:30px;"><i class="fa-regular fa-face-frown" style="font-size: 30px; color: #ddd; margin-bottom:10px; display:block;"></i>No product found matching your search.</p>';
        return;
    }
    filtered.forEach(p => {
        container.innerHTML += `
            <a href="product-details.html?id=${p.id}" class="s-result-item">
                <div class="s-result-img" style="background-image: url('${p.img}');"></div>
                <div class="s-result-info">
                    <h4>${p.name}</h4><p>₹${p.price}</p>
                </div>
            </a>`;
    });
}

window.toggleHeart = function(event, button, productId) {
    event.preventDefault(); event.stopPropagation();
    const icon = button.querySelector('i');
    let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
    let wishlistIds = wishlist.map(item => typeof item === 'object' ? item.productId : item);

    if (icon.classList.contains('fa-regular')) { 
        if (!wishlistIds.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
        }
        icon.classList.replace('fa-regular', 'fa-solid'); 
        icon.style.color = 'var(--primary-color)'; 
        showCustomAlert("Added to Wishlist", "This item has been successfully added to your wishlist.", "success");
    } else { 
        wishlist = wishlist.filter(item => {
            let id = typeof item === 'object' ? item.productId : item;
            return id !== productId;
        });
        localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
        icon.classList.replace('fa-solid', 'fa-regular'); 
        icon.style.color = 'var(--icon-color)'; 
        showCustomAlert("Removed", "This item has been removed from your wishlist.", "success");
    }
}

window.addToCartOnly = function(event, productId) {
    event.preventDefault(); event.stopPropagation();
    let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
    const existingIndex = cart.findIndex(item => item.productId === productId && item.size === 'M' && item.color === 'Original');
    if (existingIndex > -1) { cart[existingIndex].qty += 1; } 
    else { cart.push({ productId: productId, size: 'M', color: 'Original', qty: 1 }); }
    localStorage.setItem('aavira_cart', JSON.stringify(cart));
    window.updateCartBadge();
    showCustomAlert("Cart Updated", "Added size 'M' to your shopping cart.", "success"); 
}

window.buyNow = function(event, productId) {
    event.preventDefault(); event.stopPropagation();
    window.location.href = "product-details.html?id=" + productId;
}

// --- AUTH & SMART LOGIN LOGIC ---
onAuthStateChanged(auth, (user) => {
    const nameField = document.getElementById('sidebarName'); 
    const emailField = document.getElementById('sidebarEmail');
    const avatarField = document.getElementById('sidebarAvatar'); 
    const authBtn = document.getElementById('sidebarAuthBtn');
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    const bottomDivider = document.getElementById('bottomDivider');

    if (user) {
        if(nameField) nameField.innerText = user.displayName || "Display Name"; 
        if(emailField) emailField.innerText = user.email;
        if(avatarField) avatarField.innerText = user.email[0].toUpperCase(); 
        if(headerLoginBtn) headerLoginBtn.style.display = 'none';
        if(authBtn) { authBtn.style.display = 'flex'; authBtn.addEventListener('click', (e) => { e.preventDefault(); signOut(auth).then(() => window.location.reload()); }); }
        if(bottomDivider) bottomDivider.style.display = 'block';
    } else {
        if(nameField) nameField.innerText = "Guest User"; 
        if(emailField) emailField.innerText = "Welcome to Aavira";
        if(avatarField) avatarField.innerHTML = `<i class="fa-regular fa-user"></i>`;
        if(headerLoginBtn) headerLoginBtn.style.display = 'inline-block';
        if(authBtn) authBtn.style.display = 'none'; 
        if(bottomDivider) bottomDivider.style.display = 'none';
        window.checkAndShowWelcomePopup();
    }
});

// --- FETCH DYNAMIC BANNERS ---
async function fetchBanners() {
    const carousel = document.getElementById('bannerCarousel');
    const dotsContainer = document.getElementById('bannerDots');
    try {
        const snap = await getDocs(collection(db, "banners"));
        
        if(!snap.empty) {
            let docsArr = [];
            snap.forEach(doc => docsArr.push(doc.data()));
            docsArr.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            if(carousel) carousel.innerHTML = ''; 
            if(dotsContainer) dotsContainer.innerHTML = '';
            let count = 0;
            
            docsArr.forEach(d => {
                let mediaHtml = '';
                if(d.type === 'video' || d.videoUrl) {
                    mediaHtml = `<video src="${d.videoUrl || d.url}" autoplay loop muted playsinline webkit-playsinline disablepictureinpicture controlslist="nodownload noplaybackrate" style="width:100%; height:100%; object-fit:cover; pointer-events:none; transform: translateZ(0);"></video>`;
                } else {
                    mediaHtml = `<img src="${d.imageUrl || d.url}" alt="Banner" style="width:100%; height:100%; object-fit:cover; transform: translateZ(0);">`;
                }
                if(d.link) { mediaHtml = `<a href="${d.link}" style="display:block; width:100%; height:100%;">${mediaHtml}</a>`; }
                
                if(carousel) carousel.innerHTML += `<div class="banner-slide">${mediaHtml}</div>`;
                if(dotsContainer) dotsContainer.innerHTML += `<div class="b-dot ${count===0?'active':''}"></div>`;
                count++;
            });
            
            if(count > 1 && carousel) {
                let currentIndex = 0;
                setInterval(() => {
                    currentIndex = (currentIndex + 1) % count;
                    const slide = carousel.children[currentIndex];
                    if (slide) { carousel.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' }); }
                }, 4000); 

                carousel.addEventListener('scroll', () => {
                    let idx = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                    document.querySelectorAll('.b-dot').forEach((dot, i) => { dot.classList.toggle('active', i === idx); });
                });
            }
        }
    } catch (error) { 
        console.error("Error loading banners:", error); 
        if(carousel) carousel.innerHTML = '<div class="banner-slide"><div class="hero-banner-fallback"><div class="hero-content"><h2>Elegant Blouses<br>For Every You</h2><p>Premium quality designs.</p><a href="categories.html" class="shop-btn">SHOP NOW</a></div></div></div>';
    }
}

// --- FETCH CATEGORIES ---
async function fetchCategories() {
    const catContainer = document.getElementById('categoriesContainer');
    try {
        const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (snap.empty) { if(catContainer) catContainer.innerHTML = '<p class="no-data-msg" style="padding:20px; font-size:12px; color:var(--text-muted);">No categories yet.</p>'; return; }
        if(catContainer) catContainer.innerHTML = ''; 
        snap.forEach((doc) => {
            const data = doc.data();
            if(catContainer) catContainer.innerHTML += `<a href="categories.html?cat=${data.name}" class="cat-item"><div class="cat-ring"><div class="cat-img" style="background-image: url('${data.image}');"></div></div><span>${data.name}</span></a>`;
        });
    } catch (error) { 
        console.error("Error loading categories:", error); 
        if(catContainer) catContainer.innerHTML = '<p style="text-align:center; padding:10px 20px; width:100%; color:#d32f2f; font-size:12px;">Failed to load categories.</p>';
    }
}

// --- FETCH PRODUCTS & RENDER IN ADVANCED MULTIPLE STYLES ---
async function fetchProducts() {
    const productsContainer = document.getElementById('productsContainer');
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) { if(productsContainer) productsContainer.innerHTML = '<p class="no-data-msg" style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted);">No products currently available.</p>'; return; }
        
        window.allProductsList = []; 
        let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
        let wishlistIds = wishlist.map(item => typeof item === 'object' ? item.productId : item);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = data.imageMain || data.image || '';
            window.productsCache[doc.id] = {
                id: doc.id, name: data.name, brand: data.brand || 'Aavira', price: data.price, img: imageUrl,
                description: data.description || 'Exclusive ethnic blouse designed with meticulous attention to detail.'
            };
            window.allProductsList.push({ id: doc.id, name: data.name, price: data.price, img: imageUrl, color: data.color || '' });
        });

        if(!productsContainer) return;
        let html = '';
        
        if(window.allProductsList.length > 0) {
            let p0 = window.allProductsList[0];
            let w0 = wishlistIds.includes(p0.id);
            html += `
                <div style="padding: 0 20px 25px;">
                    <div class="magic-hero-card" style="margin-bottom:0; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" onclick="window.location.href='product-details.html?id=${p0.id}'">
                        <div class="magic-img-bg" style="height: 280px; background-image: url('${p0.img}');"></div>
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p0.id}')" style="top:15px; right:15px; z-index:15; width:32px; height:32px; font-size:16px;">
                            <i class="${w0 ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w0 ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <div class="magic-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                                <div style="width:70%;">
                                    <span style="background:rgba(255,255,255,0.2); color:#fff; font-size:9px; padding:4px 10px; border-radius:12px; margin-bottom:6px; display:inline-block; backdrop-filter:blur(4px);"><i class="fa-solid fa-crown" style="margin-right:4px;"></i>Masterpiece</span>
                                    <h4 style="font-size:18px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p0.name}</h4>
                                    <p style="font-size:15px; color:var(--secondary-color);">₹${p0.price}</p>
                                </div>
                                <button class="solid-buy-btn" onclick="buyNow(event, '${p0.id}')" style="width:auto; padding:0 20px; height:36px; border-radius:20px; font-size:13px; box-shadow:none;">Buy</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if(window.allProductsList.length > 1) {
            html += `
                <div style="padding: 0 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="font-size:16px; font-weight:700; color:var(--text-dark);">Trending Spots</h3>
                </div>
                <div class="magic-h-scroll" style="padding: 0 20px 25px;">
            `;
            let limit = Math.min(4, window.allProductsList.length);
            for(let i=1; i<limit; i++) {
                let p = window.allProductsList[i];
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="magic-h-card" style="width: 155px; background:#fff; border:1px solid var(--border-color);">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product-details.html?id=${p.id}" style="text-decoration:none;">
                            <div class="magic-img-bg" style="height: 180px; background-image: url('${p.img}');"></div>
                        </a>
                        <div style="padding: 12px;">
                            <h4 style="font-size: 11px; margin-bottom: 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-dark);">${p.name}</h4>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <p style="font-size: 14px; font-weight: 700; color:var(--primary-color);">₹${p.price}</p>
                                <div onclick="addToCartOnly(event, '${p.id}')" style="width:28px; height:28px; border-radius:50%; background:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-plus" style="font-size:13px;"></i></div>
                            </div>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        }

        if(window.allProductsList.length > 4) {
            html += `
                <div style="padding: 0 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="font-size:16px; font-weight:700; color:var(--text-dark);">More Elegant Styles</h3>
                </div>
                <div class="products-grid" style="padding-bottom:15px;">
            `;
            for(let i=4; i<window.allProductsList.length; i++) {
                let p = window.allProductsList[i];
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="product-card">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product-details.html?id=${p.id}" style="text-decoration:none;">
                            <div class="product-image-box" style="background-image: url('${p.img}');"></div>
                        </a>
                        <div class="product-details-area">
                            <h4 style="margin-bottom: 4px;">${p.name}</h4>
                            <p style="font-size: 14px; font-weight: 700; color: var(--primary-color); margin-bottom: 12px; margin-top: auto;">₹${p.price}</p>
                            <div class="card-actions">
                                <button class="outline-icon-btn" onclick="addToCartOnly(event, '${p.id}')" title="Add to Cart"><i class="fa-solid fa-cart-plus"></i></button>
                                <button class="solid-buy-btn" onclick="buyNow(event, '${p.id}')" title="Buy"><i class="fa-solid fa-bag-shopping"></i> Buy</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        }

        productsContainer.innerHTML = html;

    } catch (error) { 
        console.error("Error loading products:", error); 
        if(productsContainer) productsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#d32f2f; font-size:12px;">Failed to load products. Please check your connection.</p>';
        window.showCustomAlert("Connection Error", "Failed to load products from server.", "error");
    }
}

// --- PAGE INITIALIZATION PROCESS WITH PRELOADER ---
async function initializeAppEngine() {
    if (!navigator.onLine) {
        updateConnectionStatus();
        return;
    }
    try {
        await Promise.all([fetchBanners(), fetchCategories(), fetchProducts()]);
    } catch(e) {
        console.error("Initialization Failed: ", e);
    } finally {
        setTimeout(() => { hidePreloader(); }, 600);
    }
}

initializeAppEngine();
