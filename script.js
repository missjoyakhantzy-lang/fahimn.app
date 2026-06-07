window.allProductsList = [];
window.productsCache = {};
window.currentMagicColor = ''; 

window.updateConnectionStatus = function() {
    if (!navigator.onLine) {
        window.showCustomAlert("Offline", "No Internet Connection. Please check your network.", "error");
    }
}

window.addEventListener('online', window.updateConnectionStatus);
window.addEventListener('offline', window.updateConnectionStatus);

window.openMagicScreen = function(color) {
    window.currentMagicColor = color;
    document.getElementById('magicTitle').innerText = `${color} Magic ✨`;
    document.getElementById('magicScreen').classList.add('active');
    const chips = document.querySelectorAll('.magic-chip');
    chips.forEach(c => c.classList.remove('active'));
    if(chips.length > 0) chips[0].classList.add('active');
    window.renderAdvancedMagicLayout('All Designs');
}

window.filterMagicProducts = function(element, filterType) {
    const chips = document.querySelectorAll('.magic-chip');
    chips.forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    window.renderAdvancedMagicLayout(filterType);
}

window.renderAdvancedMagicLayout = function(filterType) {
    const container = document.getElementById('magicProductsContainer');
    container.innerHTML = `
        <div style="width:100%; text-align:center; padding: 60px 0;">
            <i class="fa-solid fa-wand-magic-sparkles fa-spin" style="font-size: 30px; color: var(--primary-color);"></i>
            <p style="margin-top:15px; font-size:12px; font-weight:600; color:var(--text-muted);">Brewing Magic...</p>
        </div>
    `;
    setTimeout(() => {
        let filtered = window.allProductsList.filter(p => {
            return (p.color && p.color.toLowerCase() === window.currentMagicColor.toLowerCase()) || p.name.toLowerCase().includes(window.currentMagicColor.toLowerCase());
        });
        if(filterType === 'Premium Silk') {
            filtered = filtered.filter(p => p.name.toLowerCase().includes('silk'));
        } else if (filterType === 'Hand Embroidered') {
            filtered = filtered.filter(p => p.name.toLowerCase().includes('embroider') || p.name.toLowerCase().includes('work'));
        } else if (filterType === 'Trending Now') {
            filtered = [...filtered].reverse(); 
        }
        
        if(filtered.length === 0) {
            container.innerHTML = `
                <div style="width:100%; text-align:center; padding: 60px 20px;">
                    <i class="fa-regular fa-face-frown" style="font-size: 45px; color: rgba(0,0,0,0.1); margin-bottom:15px;"></i>
                    <p style="font-size:13px; color:var(--text-muted);">No items match this filter in ${window.currentMagicColor}.<br>Try another category!</p>
                </div>
            `;
            return;
        }

        let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
        let wishlistIds = wishlist.map(item => typeof item === 'object' ? item.productId : item);

        let html = '';
        if(filtered.length >= 1) {
            let p = filtered[0];
            let w = wishlistIds.includes(p.id);
            html += `
                <div style="padding:0 20px;">
                    <div class="magic-hero-card" style="animation: fadeInUp 0.4s ease forwards;">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product_details.html?id=${p.id}" style="text-decoration:none;">
                            <div class="magic-img-bg" style="background-image: url('${p.img}');"></div>
                            <div class="magic-overlay">
                                <span class="hero-badge"><i class="fa-solid fa-crown"></i> Masterpiece</span>
                                <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 4px; line-height: 1.2;">${p.name}</h4>
                                <p style="font-size: 16px; font-weight: 600; color: var(--secondary-color);">₹${p.price}</p>
                            </div>
                        </a>
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
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="magic-h-card">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product_details.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
                            <div class="magic-img-bg" style="background-image: url('${p.img}');"></div>
                            <div style="padding: 10px; text-align:left;">
                                <h4 style="font-size: 13px; font-family:'Poppins', sans-serif; font-weight:600; margin-bottom: 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-dark);">${p.name}</h4>
                                <p style="font-size: 14px; font-weight: 700; color:var(--primary-color);">₹${p.price}</p>
                            </div>
                        </a>
                    </div>
                `;
            }
            html += `</div>`;
        }
        if(filtered.length >= 4) {
            html += `<h4 style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 5px 20px 10px; animation: fadeInUp 0.6s ease forwards;">Explore More Styles</h4>`;
            html += `<div class="magic-masonry" style="padding-bottom: 80px; animation: fadeInUp 0.6s ease forwards;">`;
            for(let i = 4; i < filtered.length; i++) {
                let p = filtered[i];
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="product-card-adv">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product_details.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
                            <div class="magic-img-bg" style="background-image: url('${p.img}');"></div>
                            <div style="padding: 10px; text-align:left;">
                                <h4 style="font-size: 13px; font-weight:600; margin-bottom:4px; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h4>
                                <p style="font-size: 14px; font-weight:700; color:var(--primary-color);">₹${p.price}</p>
                            </div>
                        </a>
                    </div>
                `;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
    }, 600);
}

window.closeMagicScreen = function() { 
    const magicScreen = document.getElementById('magicScreen');
    if (magicScreen) {
        magicScreen.classList.remove('active'); 
    }
}

window.checkAndShowWelcomePopup = function() {
    let shownLogin = localStorage.getItem('aavira_login_shown');
    let notifStatus = 'default';
    if (typeof Notification !== 'undefined') {
        notifStatus = Notification.permission;
    }

    if (!shownLogin) {
        setTimeout(() => {
            const overlay = document.getElementById('welcomeLoginOverlay');
            if (overlay) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden'; 
                localStorage.setItem('aavira_login_shown', 'true');
            }
        }, 2500);
    } else if (notifStatus === 'default') {
        const notifOverlay = document.getElementById('notificationOverlay');
        if (notifOverlay) {
            setTimeout(() => { 
                notifOverlay.classList.add('show'); 
                document.body.style.overflow = 'hidden'; 
            }, 3000);
        }
    }
}

window.closeWelcomePopup = function() {
    const overlay = document.getElementById('welcomeLoginOverlay');
    if (overlay) overlay.classList.remove('show'); 
    document.body.style.overflow = 'auto'; 

    setTimeout(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            const notifOverlay = document.getElementById('notificationOverlay');
            if (notifOverlay) {
                notifOverlay.classList.add('show');
                document.body.style.overflow = 'hidden'; 
            }
        }
    }, 1200);
}

window.closeNotificationPopup = function() {
    const overlay = document.getElementById('notificationOverlay');
    if (overlay) overlay.classList.remove('show'); 
    document.body.style.overflow = 'auto'; 
}

window.showCustomAlert = function(title, message, type = 'success') {
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    const iconEl = document.getElementById('alertIcon');
    const overlay = document.getElementById('alertOverlay');
    
    if(titleEl) titleEl.innerText = title; 
    if(msgEl) msgEl.innerHTML = message;
    
    if (iconEl) {
        if (type === 'success') { 
            iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--success-green); font-size: 55px;"></i>'; 
        } else { 
            iconEl.innerHTML = '<i class="fa-solid fa-bell animated-bell" style="color: var(--secondary-color); font-size: 55px;"></i>'; 
        }
    }
    if (overlay) overlay.classList.add('show');
}

window.closeAlertModal = function() { 
    const overlay = document.getElementById('alertOverlay');
    if(overlay) overlay.classList.remove('show'); 
}

const initAppUI = () => {
    window.updateCartBadge = function() {
        let cart = JSON.parse(localStorage.getItem('aavira_cart')) || [];
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const badge = document.getElementById('topCartBadge');
        if(badge) badge.innerText = totalItems;
    }
    window.updateCartBadge();

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
            this.classList.add('active'); 
            moveIndicator();
        });
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    window.toggleSidebar = () => { 
        if (sidebar && overlay) {
            sidebar.classList.toggle('active'); 
            overlay.classList.toggle('active'); 
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : 'auto';
        }
    };
    
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', window.toggleSidebar);
    
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', window.toggleSidebar);
    
    if (overlay) overlay.addEventListener('click', window.toggleSidebar);

    const mainScrollArea = document.getElementById('mainScrollArea');
    const bottomNav = document.getElementById('bottomNav');
    const topHeader = document.getElementById('mainHeader');
    
    if(mainScrollArea && bottomNav && topHeader) {
        let lastScrollY = mainScrollArea.scrollTop;
        mainScrollArea.addEventListener('scroll', () => {
            const currentScrollY = mainScrollArea.scrollTop;
            if (currentScrollY > lastScrollY && currentScrollY > 50) { 
                bottomNav.classList.add('hidden'); 
                topHeader.classList.add('hidden'); 
            } else { 
                bottomNav.classList.remove('hidden'); 
                topHeader.classList.remove('hidden'); 
            }
            lastScrollY = currentScrollY;
        });
    }

    if(typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notifText = document.getElementById('sidebarNotifText');
        const notifIcon = document.getElementById('sidebarNotifIcon');
        if(notifText) notifText.innerText = "Notifications Enabled";
        if(notifIcon) notifIcon.style.color = "var(--success-green)";
    }

    window.updateConnectionStatus();

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
                } 
                catch (error) { console.log('Error sharing:', error); }
            } else {
                window.showCustomAlert("Share App", "Link copied to clipboard! Share it with your friends.", "success");
                navigator.clipboard.writeText(window.location.origin);
            }
        });
    }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initAppUI); } else { initAppUI(); }

window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    if(!overlay) return;
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : 'auto';
    if(overlay.classList.contains('active')) {
        setTimeout(() => { document.getElementById('searchInput').focus(); }, 100);
    } else {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = `
            <p class="search-empty-text">
                <i class="fa-solid fa-magnifying-glass"></i>Type to search amazing products...
            </p>
        `;
    }
}

window.handleSearch = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('searchResults');
    if(!container) return;
    container.innerHTML = '';
    if(!query) {
        container.innerHTML = `<p class="search-empty-text"><i class="fa-solid fa-magnifying-glass"></i>Type to search amazing products...</p>`;
        return;
    }
    const filtered = window.allProductsList.filter(p => p.name.toLowerCase().includes(query));
    if(filtered.length === 0) {
        container.innerHTML = `<p class="search-empty-text"><i class="fa-regular fa-face-frown"></i>No product found matching your search.</p>`;
        return;
    }
    filtered.forEach(p => {
        container.innerHTML += `
            <a href="product_details.html?id=${p.id}" class="s-result-item">
                <div class="s-result-img" style="background-image: url('${p.img}');"></div>
                <div class="s-result-info">
                    <h4>${p.name}</h4>
                    <p>₹${p.price}</p>
                </div>
            </a>
        `;
    });
}

window.toggleHeart = function(event, button, productId) {
    event.preventDefault(); 
    event.stopPropagation();
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
    } else { 
        wishlist = wishlist.filter(item => {
            let id = typeof item === 'object' ? item.productId : item;
            return id !== productId;
        });
        localStorage.setItem('aavira_wishlist', JSON.stringify(wishlist));
        icon.classList.replace('fa-solid', 'fa-regular'); 
        icon.style.color = 'var(--icon-color)'; 
    }
}

window.initializeAuth = async function() {
    let loggedInUser = null;
    if (typeof window.checkUserLogin === 'function') {
        loggedInUser = await window.checkUserLogin();
    }
    
    const nameField = document.getElementById('sidebarName');
    const emailField = document.getElementById('sidebarEmail');
    const avatarField = document.getElementById('sidebarAvatar');
    const loginBtn = document.getElementById('headerLoginBtn');
    const authBtn = document.getElementById('sidebarAuthBtn');
    const bottomDivider = document.getElementById('bottomDivider');

    if (loggedInUser) {
        if(nameField) nameField.innerText = loggedInUser.name || "Aavira User"; 
        if(emailField) emailField.innerText = loggedInUser.email || loggedInUser.phone || "user@aavira.com";
        if(avatarField) avatarField.innerText = loggedInUser.name ? loggedInUser.name[0].toUpperCase() : "U"; 
        if(loginBtn) loginBtn.style.display = 'none';
        if(authBtn) {
            authBtn.style.display = 'flex'; 
            authBtn.onclick = (e) => { 
                e.preventDefault(); 
                if(typeof window.logoutUser === 'function') window.logoutUser(); 
                window.location.reload(); 
            }; 
        }
        if(bottomDivider) bottomDivider.style.display = 'block';
        
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            setTimeout(() => { 
                const notifOverlay = document.getElementById('notificationOverlay');
                if(notifOverlay) notifOverlay.classList.add('show'); 
            }, 3000);
        }
    } else {
        if(nameField) nameField.innerText = "Guest User"; 
        if(emailField) emailField.innerText = "Welcome to Aavira";
        if(avatarField) avatarField.innerHTML = `<i class="fa-regular fa-user"></i>`;
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(authBtn) authBtn.style.display = 'none'; 
        if(bottomDivider) bottomDivider.style.display = 'none';
        window.checkAndShowWelcomePopup();
    }
};

window.fetchBanners = async function() {
    const carousel = document.getElementById('bannerCarousel');
    const dotsContainer = document.getElementById('bannerDots');
    if(!carousel) return;

    try {
        if (typeof window.getBannersData !== 'function') return;
        const docsArr = await window.getBannersData();
        if(docsArr && docsArr.length > 0) {
            docsArr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            carousel.innerHTML = ''; 
            if(dotsContainer) dotsContainer.innerHTML = '';
            let count = 0;
            docsArr.forEach(d => {
                let mediaHtml = '';
                let url = d.imageUrl || d.image || d.url || ''; 
                if(d.type === 'video' || (url && url.includes('.mp4'))) {
                    mediaHtml = `<video src="${url}" autoplay loop muted playsinline webkit-playsinline disablepictureinpicture controlslist="nodownload noplaybackrate" style="width:100%; height:100%; object-fit:cover; pointer-events:none; transform: translateZ(0);"></video>`;
                } else {
                    mediaHtml = `<img src="${url}" style="width:100%; height:100%; object-fit:cover; transform: translateZ(0);">`;
                }
                if(d.link) mediaHtml = `<a href="${d.link}" style="display:block; width:100%; height:100%;">${mediaHtml}</a>`;
                carousel.innerHTML += `<div class="banner-slide">${mediaHtml}</div>`;
                if(dotsContainer) dotsContainer.innerHTML += `<div class="b-dot ${count===0?'active':''}"></div>`;
                count++;
            });
            if(count > 1) {
                let currentIndex = 0;
                setInterval(() => {
                    currentIndex = (currentIndex + 1) % count;
                    const slide = carousel.children[currentIndex];
                    if (slide) carousel.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
                }, 4000); 
                carousel.addEventListener('scroll', () => {
                    let idx = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                    document.querySelectorAll('.b-dot').forEach((dot, i) => { dot.classList.toggle('active', i === idx); });
                });
            }
        } else {
            carousel.innerHTML = `
                <div class="banner-slide">
                    <div class="hero-banner-fallback">
                        <div class="hero-content">
                            <h2>Elegant Blouses<br>For Every You</h2>
                            <p>Premium quality designs.</p>
                            <a href="categories.html" class="shop-btn">SHOP NOW</a>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {}
}

window.fetchCategories = async function() {
    const catContainer = document.getElementById('categoriesContainer');
    if(!catContainer) return;
    try {
        if (typeof window.getCategoriesData !== 'function') return;
        const categoriesArr = await window.getCategoriesData();
        if (!categoriesArr || categoriesArr.length === 0) { 
            catContainer.innerHTML = `<p style="padding:20px; font-size:12px; color:var(--text-muted);">No categories yet.</p>`; 
            return; 
        }
        catContainer.innerHTML = ''; 
        categoriesArr.forEach((data) => {
            let img = data.image || data.imageUrl || data.url || '';
            catContainer.innerHTML += `
                <a href="categories.html?cat=${data.name}" class="cat-item">
                    <div class="cat-ring"><div class="cat-img" style="background-image: url('${img}');"></div></div>
                    <span>${data.name}</span>
                </a>
            `;
        });
    } catch (error) {}
}

window.fetchProducts = async function() {
    const productsContainer = document.getElementById('productsContainer');
    if(!productsContainer) return;
    try {
        if (typeof window.getVercelData !== 'function') return;
        const dataArray = await window.getVercelData();
        if (!dataArray || dataArray.length === 0) { 
            productsContainer.innerHTML = `<p style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted);">No products currently available.</p>`; 
            return; 
        }
        
        window.allProductsList = []; 
        let wishlist = JSON.parse(localStorage.getItem('aavira_wishlist')) || [];
        let wishlistIds = wishlist.map(item => typeof item === 'object' ? item.productId : item);

        dataArray.forEach((data) => {
            const imageUrl = data.imageMain || data.image || data.imageUrl || '';
            window.productsCache[data.id] = { id: data.id, name: data.name, brand: data.brand || 'Aavira', price: data.price, img: imageUrl, description: data.description };
            window.allProductsList.push({ id: data.id, name: data.name, price: data.price, img: imageUrl, color: data.color || '' });
        });

        let html = '';
        if(window.allProductsList.length > 0) {
            let p0 = window.allProductsList[0];
            let w0 = wishlistIds.includes(p0.id);
            html += `
                <div style="padding: 0 20px 25px;">
                    <div class="magic-hero-card">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p0.id}')" style="top:15px; right:15px; width:32px; height:32px; font-size:16px;">
                            <i class="${w0 ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w0 ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product_details.html?id=${p0.id}" style="display:block; text-decoration:none; color:inherit;">
                            <div class="magic-img-bg" style="height: 280px; background-image: url('${p0.img}');"></div>
                            <div class="magic-overlay">
                                <div>
                                    <span class="hero-badge"><i class="fa-solid fa-crown"></i> Masterpiece</span>
                                    <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 4px; line-height: 1.2;">${p0.name}</h4>
                                    <p style="font-size: 16px; font-weight: 600; color: var(--secondary-color);">₹${p0.price}</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        }

        if(window.allProductsList.length > 1) {
            html += `
                <div class="section-title"><h3>Trending Spots</h3></div>
                <div class="magic-h-scroll">
            `;
            let limit = Math.min(4, window.allProductsList.length);
            for(let i=1; i<limit; i++) {
                let p = window.allProductsList[i];
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="magic-h-card">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product_details.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
                            <div class="magic-img-bg" style="background-image: url('${p.img}');"></div>
                            <div class="magic-text">
                                <h4>${p.name}</h4>
                                <p>₹${p.price}</p>
                            </div>
                        </a>
                    </div>
                `;
            }
            html += `</div>`;
        }

        if(window.allProductsList.length > 4) {
            html += `
                <div class="section-title" style="margin-top: 10px;"><h3>More Elegant Styles</h3></div>
                <div class="products-grid" style="padding-bottom: 20px;">
            `;
            for(let i=4; i<window.allProductsList.length; i++) {
                let p = window.allProductsList[i];
                let w = wishlistIds.includes(p.id);
                html += `
                    <div class="product-card">
                        <button class="heart-btn" onclick="toggleHeart(event, this, '${p.id}')">
                            <i class="${w ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${w ? 'var(--primary-color)' : 'var(--icon-color)'};"></i>
                        </button>
                        <a href="product-details.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
                            <div class="product-image-box" style="background-image: url('${p.img}');"></div>
                            <div class="product-details-area">
                                <h4>${p.name}</h4>
                                <p>₹${p.price}</p>
                            </div>
                        </a>
                    </div>
                `;
            }
            html += `</div>`;
        }
        productsContainer.innerHTML = html;
    } catch (error) {}
}

window.initializeAppEngine = async function() {
    if (!navigator.onLine) { 
        window.updateConnectionStatus(); 
        return; 
    }
    await window.initializeAuth();
    try { 
        await Promise.all([
            window.fetchBanners(), 
            window.fetchCategories(),
            window.fetchProducts()
        ]); 
    } 
    catch(e) {} 
}

window.initializeAppEngine();
