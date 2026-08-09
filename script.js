// Safe, hardened script.js — guards against missing DOM nodes and global errors
(function(){
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
    };

    // Global state
    window.allProductsList = [];
    let bannerAutoTimer = null;
    let bannerCurrentIndex = 0;

    // Helpers
    function $id(id) { return document.getElementById(id) || null; }
    function safeCall(fn){ try{ fn(); }catch(e){ console.error('SafeCall error', e); }}

    // Global error handlers so JS failures don't leave a blank page
    window.addEventListener('error', function(e){
        console.error('Global error caught', e.error || e.message || e);
        // show toast if available
        const toast = $id('toast'); const msg = $id('toast-msg');
        if(toast && msg){ msg.innerText = `Error: ${ (e && e.message) || 'Unexpected error' }`; toast.classList.remove('opacity-0'); setTimeout(()=>toast.classList.add('opacity-0'), 4000); }
    });
    window.addEventListener('unhandledrejection', function(e){
        console.error('Unhandled rejection', e.reason);
    });

    // Public functions that use safe DOM lookups each time
    window.openSearch = function(){
        const overlay = $id('searchOverlay'); if(!overlay) return;
        overlay.classList.remove('translate-x-full'); document.body.style.overflow = 'hidden';
        const inp = $id('searchInput'); if(inp) setTimeout(()=> inp.focus(), 250);
    };

    window.closeSearch = function(){ const overlay = $id('searchOverlay'); if(!overlay) return; overlay.classList.add('translate-x-full'); document.body.style.overflow = ''; };

    window.handleSearch = function(){
        try{
            const input = $id('searchInput'); const container = $id('searchResults');
            if(!container || !input) return;
            const query = (input.value || '').toLowerCase().trim();
            if(!query){
                container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic flex flex-col items-center gap-2"><i data-lucide="search" class="w-8 h-8 opacity-20"></i>Type something to search our collection...</div>';
                if(typeof lucide !== 'undefined') safeCall(()=>lucide.createIcons());
                return;
            }

            const filtered = (window.allProductsList || []).filter(p => {
                if(!p) return false;
                const hay = `${p.name||''} ${p.description||''} ${p.category||''} ${(p.tags||[]).join(' ')} ${(p.colors||[]).join(' ')} ${p.color||''}`.toLowerCase();
                return hay.includes(query);
            });

            if(filtered.length === 0){ container.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No products found matching your search.</div>'; return; }
            let html = filtered.map(p => {
                const price = Number(p.price)||0; const mrp = Number(p.mrp)||price;
                return `\n<div class="flex gap-3 bg-white/80 p-2.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/50 cursor-pointer hover:shadow-md transition-shadow" onclick="goToProduct('${p.id}')">\n  <img src="${p.img}" class="w-[72px] h-[72px] object-cover rounded-lg bg-[#F9F9F9]" />\n  <div class="flex-1 flex flex-col justify-center">\n    <p class="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-0.5">Aavira Luxe</p>\n    <h4 class="text-xs font-medium text-gray-800 line-clamp-2">${p.name}</h4>\n    <div class="mt-1.5 flex items-baseline gap-2">\n      <span class="text-sm font-bold text-ethnic-burgundy">₹${price}</span>\n      ${mrp>price?`<span class="text-[10px] text-gray-400 line-through">₹${mrp}</span>`:''}\n    </div>\n  </div>\n</div>`;
            }).join('\n');
            container.innerHTML = html;
            if(typeof lucide !== 'undefined') safeCall(()=>lucide.createIcons());
        }catch(err){ console.error('handleSearch error', err); }
    };

    // Color wheel helpers (kept minimal & safe)
    function hslToHex(h, s, l){
        l /= 100; const a = s * Math.min(l, 1 - l) / 100;
        const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    // Copy hex if available
    window.copyHex = function(){ const previewHex = $id('previewHex'); if(previewHex){ navigator.clipboard.writeText(previewHex.innerText).then(()=> window.showToast && showToast('Color Code Copied!', 'check-circle')).catch(()=>{}); } };

    // Color search (simple matching against name/tags/colors)
    window.searchProductsByColor = function(hex){
        try{
            if(!hex) return;
            const nameMap = { '#FFB04B':'orange','#FF4B4B':'red','#2D56E5':'blue','#1EB842':'green','#F5780A':'orange','#7D2DE5':'purple','#6A1B29':'burgundy','#E5C158':'gold' };
            const name = nameMap[(hex||'').toUpperCase()]||'';
            const results = (window.allProductsList||[]).filter(p => {
                if(!p) return false;
                const props = `${p.color||''} ${(p.colors||[]).join(' ')} ${(p.tags||[]).join(' ')} ${p.name||''} ${p.description||''} ${p.category||''}`.toLowerCase();
                if(props.includes((hex||'').toLowerCase().replace('#',''))) return true;
                if(name && props.includes(name)) return true;
                return false;
            });
            openSearch(); const container = $id('searchResults'); if(!container) return;
            if(results.length===0){ container.innerHTML = `<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No products found for ${hex}.</div>`; return; }
            let html = results.map(p=>{ const price = Number(p.price)||0; const mrp = Number(p.mrp)||price; return `\n<div class="flex gap-3 bg-white/80 p-2.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/50 cursor-pointer hover:shadow-md transition-shadow" onclick="goToProduct('${p.id}')">\n  <img src="${p.img}" class="w-[72px] h-[72px] object-cover rounded-lg bg-[#F9F9F9]" />\n  <div class="flex-1 flex flex-col justify-center">\n    <p class="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-0.5">Aavira Luxe</p>\n    <h4 class="text-xs font-medium text-gray-800 line-clamp-2">${p.name}</h4>\n    <div class="mt-1.5 flex items-baseline gap-2">\n      <span class="text-sm font-bold text-ethnic-burgundy">₹${price}</span>\n      ${mrp>price?`<span class="text-[10px] text-gray-400 line-through">₹${mrp}</span>`:''}\n    </div>\n  </div>\n</div>`; }).join('\n');
            container.innerHTML = html; if(typeof lucide !== 'undefined') safeCall(()=>lucide.createIcons());
        }catch(e){ console.error('searchProductsByColor error', e); }
    };

    // Toast helper (safe)
    window.showToast = function(message, type='success'){
        const toast = $id('toast'), icon = $id('toast-icon'), msg = $id('toast-msg');
        if(!toast || !msg) return console.log(message);
        msg.innerText = message || '';
        if(icon) icon.setAttribute('data-lucide', type==='success'?'check-circle':type);
        if(typeof lucide !== 'undefined') safeCall(()=>lucide.createIcons());
        toast.classList.remove('opacity-0','translate-y-10','pointer-events-none');
        setTimeout(()=>{ toast.classList.add('opacity-0','translate-y-10','pointer-events-none'); }, 2500);
    };

    // Simple product navigation
    window.goToProduct = function(id){ try{ let recent = JSON.parse(localStorage.getItem('aavira_recent'))||[]; recent = recent.filter(x=>x!==id); recent.unshift(id); if(recent.length>8) recent.pop(); localStorage.setItem('aavira_recent', JSON.stringify(recent)); window.location.href = `product-details.html?id=${id}`;}catch(e){console.error(e);} };

    // Initialize after DOM ready
    window.initializeAppEngine = async function(){
        try{
            // assign DOM refs
            const mainHeader = $id('main-header');
            const sidebar = $id('sidebar'), sidebarOverlay = $id('sidebarOverlay');
            const pickerWheel = $id('pickerWheel'), pickerThumb = $id('pickerThumb');
            const preview = $id('previewColor'), previewHex = $id('previewHex');
            const satSlider = $id('satSlider'), lightSlider = $id('lightSlider');
            const bannerCarousel = $id('bannerCarousel'), bannerDots = $id('banner-dots');

            // Load saved name
            const savedName = localStorage.getItem('aavira_display_name'); if(savedName) { const pn = $id('profileName'); if(pn) pn.innerText = savedName; }

            // Scroll header behavior (guarded)
            let lastScrollTop = 0;
            if(mainHeader){
                window.addEventListener('scroll', ()=>{
                    try{
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        if(scrollTop > 10){ mainHeader.classList.add('shadow-md','bg-white/90','border-b','border-gray-200/50'); mainHeader.classList.remove('bg-[#FAF8F5]/60'); }
                        else{ mainHeader.classList.remove('shadow-md','bg-white/90','border-b','border-gray-200/50'); mainHeader.classList.add('bg-[#FAF8F5]/60'); }
                        if(scrollTop > lastScrollTop && scrollTop > 80){ mainHeader.style.transform = 'translateY(-100%)'; } else { mainHeader.style.transform = 'translateY(0)'; }
                        lastScrollTop = scrollTop<=0?0:scrollTop;
                    }catch(e){ console.error('header scroll handler', e); }
                });
            }

            // Sidebar
            window.openSidebar = function(){ if(!sidebar || !sidebarOverlay) return; sidebarOverlay.classList.remove('hidden'); document.body.style.overflow='hidden'; setTimeout(()=>{ sidebarOverlay.classList.remove('opacity-0'); sidebar.classList.remove('-translate-x-full'); },10); };
            window.closeSidebar = function(){ if(!sidebar||!sidebarOverlay) return; sidebar.classList.add('-translate-x-full'); sidebarOverlay.classList.add('opacity-0'); document.body.style.overflow=''; setTimeout(()=>sidebarOverlay.classList.add('hidden'),300); };

            // Color wheel interactions (best-effort)
            let colorState = {h:45,s:100,l:50,hex:'#FFB04B'};
            function updateColorUI(){ if(preview) preview.style.backgroundColor = colorState.hex; if(previewHex) previewHex.innerText = colorState.hex; if(satSlider) satSlider.style.background = `linear-gradient(to right, #808080, ${hslToHex(colorState.h,100,colorState.l)})`; if(lightSlider) lightSlider.style.background = `linear-gradient(to right, #000000, ${hslToHex(colorState.h,colorState.s,50)}, #FFFFFF)`; const sv = $id('satVal'), lv = $id('lightVal'); if(sv) sv.innerText = `${colorState.s}%`; if(lv) lv.innerText = `${colorState.l}%`; }
            function setWheelAngle(angleDeg){ colorState.h = Math.round(angleDeg); if(!pickerWheel || !pickerThumb) return; const rad = (angleDeg-90)*(Math.PI/180); const centerX = pickerWheel.offsetWidth/2, centerY = pickerWheel.offsetHeight/2, radius = centerX-13; const x = Math.cos(rad)*radius + centerX, y = Math.sin(rad)*radius + centerY; pickerThumb.style.left = `${x}px`; pickerThumb.style.top = `${y}px`; colorState.hex = hslToHex(colorState.h,colorState.s,colorState.l); updateColorUI(); }
            let dragging=false;
            function handleWheelMove(e){ try{ if(!dragging) return; if(!pickerWheel) return; const rect = pickerWheel.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX, clientY = e.touches ? e.touches[0].clientY : e.clientY; const x = clientX - rect.left - rect.width/2, y = clientY - rect.top - rect.height/2; let angleDeg = Math.atan2(y,x)*(180/Math.PI)+90; if(angleDeg<0) angleDeg +=360; setWheelAngle(angleDeg); }catch(e){console.error(e);} }
            if(pickerWheel){ pickerWheel.addEventListener('mousedown', ()=>{ dragging=true; }); pickerWheel.addEventListener('touchstart', ()=>{ dragging=true; }); document.addEventListener('mousemove', handleWheelMove); document.addEventListener('touchmove', handleWheelMove, {passive:false}); document.addEventListener('mouseup', ()=>dragging=false); document.addEventListener('touchend', ()=>dragging=false); }
            if(satSlider) satSlider.addEventListener('input', (e)=>{ colorState.s = e.target.value; updateColorUI(); });
            if(lightSlider) lightSlider.addEventListener('input', (e)=>{ colorState.l = e.target.value; updateColorUI(); });
            window.applyColor = function(){ try{ window.closeColorModal && window.closeColorModal(); setTimeout(()=>{ window.showToast && window.showToast(`Searching styles in ${colorState.hex} ✨`, 'check-circle'); window.searchProductsByColor && window.searchProductsByColor(colorState.hex); },300);}catch(e){console.error(e);} };
            window.openColorModal = function(){ const modal = $id('colorPickerModal'), overlay = $id('colorModalOverlay'), content = $id('colorModalContent'); if(!modal) return; modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow='hidden'; setTimeout(()=>{ if(overlay) overlay.classList.remove('opacity-0'); if(content) content.classList.remove('scale-95','opacity-0'); setWheelAngle(colorState.h||45); updateColorUI(); },60); };
            window.closeColorModal = function(){ const modal = $id('colorPickerModal'), overlay = $id('colorModalOverlay'), content = $id('colorModalContent'); if(overlay) overlay.classList.add('opacity-0'); if(content) content.classList.add('scale-95','opacity-0'); document.body.style.overflow=''; setTimeout(()=>{ if(modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); } },300); };

            // Banner fetch + autoplay (guarded)
            window.fetchBanners = async function(){ try{
                const docsArr = typeof window.getBannersData === 'function' ? await window.getBannersData() : [];
                if(!docsArr || docsArr.length===0) return;
                if(!bannerCarousel) return;
                bannerCarousel.classList.remove('bg-gray-200','premium-skeleton'); bannerCarousel.innerHTML = '';
                const styleClasses = ['banner-style-slide','banner-style-fade','banner-style-zoom'];
                docsArr.forEach((d,i)=>{
                    const url = d.imageUrl || d.image || d.url || 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=800';
                    const styleClass = styleClasses[i % styleClasses.length];
                    const slide = document.createElement('div');
                    slide.className = `snap-start shrink-0 w-full h-full relative flex items-end justify-center overflow-hidden banner-slide ${styleClass}`;
                    slide.setAttribute('onclick', `window.location.href='${d.link||'#'}'`);
                    slide.innerHTML = `\n  <img src="${url}" class="w-full h-full object-cover absolute inset-0" />\n  <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>\n  <div class="relative z-10 p-6 w-full max-w-[420px] text-white">\n    <h2 class="font-serif text-3xl font-semibold">${d.title||''}</h2>\n    <p class="text-sm opacity-90 mt-2">${d.subtitle||''}</p>\n  </div>`;
                    bannerCarousel.appendChild(slide);
                });
                const dotsContainer = bannerDots; if(dotsContainer) dotsContainer.innerHTML = docsArr.map((_,i)=>`<div class="banner-dot h-1.5 rounded-full transition-all duration-300 ${i===0?'w-4 bg-white':'w-1.5 bg-white/50'}"></div>`).join('');
                const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
                function updateDots(index=null){ if(!dotsContainer || !bannerCarousel) return; const idx = index!==null?index:Math.round(bannerCarousel.scrollLeft / bannerCarousel.offsetWidth); dots.forEach((dot,i)=>{ if(i===idx){ dot.classList.add('w-4','bg-white'); dot.classList.remove('w-1.5','bg-white/50'); } else { dot.classList.remove('w-4','bg-white'); dot.classList.add('w-1.5','bg-white/50'); }}); }
                bannerCarousel.addEventListener('scroll', ()=>{ const index = Math.round(bannerCarousel.scrollLeft / bannerCarousel.offsetWidth); bannerCurrentIndex = index; updateDots(index); });
                function startBannerAutoPlay(){ clearInterval(bannerAutoTimer); bannerAutoTimer = setInterval(()=>{ try{ const slidesCount = docsArr.length; bannerCurrentIndex = (bannerCurrentIndex + 1) % slidesCount; bannerCarousel.scrollTo({ left: bannerCurrentIndex * bannerCarousel.offsetWidth, behavior: 'smooth' }); updateDots(bannerCurrentIndex); }catch(e){console.error(e);} }, 4500); }
                startBannerAutoPlay(); if(bannerCarousel){ bannerCarousel.addEventListener('mouseenter', ()=>clearInterval(bannerAutoTimer)); bannerCarousel.addEventListener('mouseleave', startBannerAutoPlay); }
            }catch(e){ console.error('fetchBanners error', e); } };

            // Categories & products
            window.fetchCategories = async function(){ try{ const arr = typeof window.getCategoriesData === 'function' ? await window.getCategoriesData() : []; if(!arr || arr.length===0) return; const catCont = $id('category-container'); if(!catCont) return; catCont.innerHTML=''; arr.forEach(data=>{ const img = data.image || data.imageUrl || data.url || 'https://via.placeholder.com/150'; catCont.innerHTML += `<button class="flex flex-col items-center gap-2.5 group w-[76px] shrink-0" onclick="window.location.href='categories.html'"><div class="h-[76px] w-[76px] rounded-full overflow-hidden border border-gray-100 shadow-sm"><img src="${img}" class="w-full h-full object-cover" /></div><div class="text-[11px] font-medium text-gray-700 mt-1">${data.name}</div></button>`; }); }catch(e){console.error(e);} };

            window.fetchProducts = async function(){ try{ const dataArray = typeof window.getVercelData === 'function' ? await window.getVercelData() : []; if(!dataArray || dataArray.length===0) return; window.allProductsList = dataArray.map(data => ({ id:data.id, name:data.name, price:data.price, mrp:data.mrp, img:data.imageMain||data.image||data.imageUrl||'https://via.placeholder.com/300', description:data.description||'', category:data.category||'', color:(data.color||'').toString(), colors:data.colors||[], tags:data.tags||[] })); const trending = $id('trending-container'), newArr = $id('new-arrivals-container'); if(trending) trending.innerHTML=''; if(newArr) newArr.innerHTML=''; window.allProductsList.forEach((p,i)=>{ if(i<4){ if(trending) trending.innerHTML += generateProductCard(p,false); } else { if(newArr) newArr.innerHTML += generateProductCard(p,true); } }); const recentIds = JSON.parse(localStorage.getItem('aavira_recent'))||[]; if(recentIds.length>0){ let recentHtml=''; recentIds.forEach(id=>{ const p = window.allProductsList.find(x=>x.id===id); if(p) recentHtml += generateProductCard(p,false); }); if(recentHtml){ const rsec = $id('recent-section'); const rcont = $id('recent-container'); if(rsec) rsec.classList.remove('hidden'); if(rcont) rcont.innerHTML = recentHtml; } } }catch(e){console.error('fetchProducts error', e);} };

            // product card generator (safe)
            window.generateProductCard = function(p,isGrid){ try{ const price = Number(p.price)||0; const mrp = Number(p.mrp)||price; const discount = mrp>price?Math.round(((mrp-price)/mrp)*100):0; const mrpHtml = mrp>price?`<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${mrp}</span>`:''; const badgeHtml = discount>0?`<span class="text-[9px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded ml-1.5 tracking-wider">${discount}% OFF</span>`:''; const w = (JSON.parse(localStorage.getItem('aavira_wishlist'))||[]).includes(p.id); return `\n<div class="${isGrid?'w-full':'snap-start shrink-0 w-[150px]'} bg-white block overflow-hidden flex flex-col relative rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">\n  <div class="relative overflow-hidden bg-[#F9F9F9] cursor-pointer" style="aspect-ratio:1;" onclick="goToProduct('${p.id}')">\n    <img src="${p.img}" class="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"/>\n    <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>\n    <button class="absolute top-2 right-2 p-1.5 z-10 transition-colors ${w? 'text-red-500':'text-gray-400'} drop-shadow-md hover:text-red-500" onclick="toggleHeart(event,this,'${p.id}')">\n      <i data-lucide="heart" class="w-4 h-4 stroke-[2]" fill="${w? 'currentColor':'none'}"></i>\n    </button>\n  </div>\n  <div class="p-2.5 flex-1 flex flex-col bg-white">\n    <h4 class="font-sans text-[12px] font-medium text-[#2D2D2D] truncate cursor-pointer group-hover:text-ethnic-burgundy transition-colors" onclick="goToProduct('${p.id}')">${p.name}</h4>\n    <div class="flex items-end justify-between mt-2 pt-1 border-t border-gray-50">\n      <div class="flex flex-col">\n        <div class="flex items-center">\n          <span class="text-[14px] font-bold text-ethnic-burgundy font-sans leading-none">₹${price}</span>\n          ${badgeHtml}\n        </div>\n        <div class="mt-1 leading-none h-[12px]">\n          ${mrpHtml}\n        </div>\n      </div>\n      <div class="flex items-center gap-1.5">\n        <button class="relative overflow-hidden w-[28px] h-[28px] flex items-center justify-center bg-ethnic-burgundy text-white hover:bg-[#4a121c] transition-all duration-300 rounded-lg">\n          <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>\n          <div class="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%] animate-shimmer-sweep"></div>\n        </button>\n      </div>\n    </div>\n  </div>\n</div>`;}catch(e){console.error('generateProductCard error', e); return ''; }};

            // load skeletons
            function loadSkeletons(){ try{ const catCont = $id('category-container'); if(catCont) catCont.innerHTML = Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[76px] h-[76px] rounded-full premium-skeleton border-2"></div><div class="h-2.5 w-16 premium-skeleton rounded mt-2"></div></div>`).join(''); const trending = $id('trending-container'); if(trending) trending.innerHTML = Array(3).fill(`<div class="w-[150px] shrink-0 bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded"></div></div>`).join(''); const newArr = $id('new-arrivals-container'); if(newArr) newArr.innerHTML = Array(4).fill(`<div class="w-full bg-white rounded-xl border border-gray-100 p-2"><div class="w-full aspect-square premium-skeleton rounded-lg"></div><div class="mt-3 h-2.5 premium-skeleton rounded"></div></div>`).join(''); }catch(e){console.error(e);} }

            loadSkeletons();

            // update cart count
            window.updateCartCount = function(){ try{ const badge = $id('cart-badge'); const cart = JSON.parse(localStorage.getItem('aavira_cart'))||[]; if(!badge) return; badge.innerText = cart.length; if(cart.length>0) badge.classList.remove('hidden'); else badge.classList.add('hidden'); }catch(e){console.error(e);} };
            updateCartCount();

            // fetch data (best-effort)
            try{ await Promise.all([ window.fetchBanners(), window.fetchCategories(), window.fetchProducts() ]); }catch(e){ console.error('initial fetch error', e); }

            if(typeof lucide !== 'undefined') safeCall(()=>lucide.createIcons());

            // scroll reveal init
            try{
                const reveals = document.querySelectorAll('.reveal');
                const observer = new IntersectionObserver((entries)=>{ entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 });
                reveals.forEach(r=>observer.observe(r));
                setTimeout(()=>reveals.forEach(r=>{ if(r.getBoundingClientRect().top < window.innerHeight) r.classList.add('active'); }), 100);
            }catch(e){console.error(e);}            

        }catch(e){ console.error('initializeAppEngine error', e); }
    };

    document.addEventListener('DOMContentLoaded', window.initializeAppEngine);
})();
