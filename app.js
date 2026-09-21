/**
 * Homepage interactions, data rendering, and Firebase messaging integration.
 * Loaded before Tailwind so its configuration is available during CDN initialization.
 */
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    theme: {
        extend: {
            colors: { 'rani-pink': '#D81B60', 'ethnic-gold': '#D4AF37', 'luxury-bg': '#FDFBF7' },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
                sans: ['Inter', 'sans-serif'],
                script: ['Dancing Script', 'cursive']
            }
        }
    }
};

let lStartX = 0;
window.allProductsList=[];let lastScrollTop=window.pageYOffset||document.documentElement.scrollTop,isNavManuallyHidden=!1,toastTimeout,scrollTicking=!1,expFile=null,expRating=5;const mainHeader=document.getElementById('main-header');
const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const jsArg=v=>JSON.stringify(String(v??'')).replace(/"/g,'&quot;');
const safeUrl=v=>{let r=String(v??'').trim();if(!r)return'';try{let u=new URL(r,window.location.origin);return['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}};
const safeImageUrl=v=>safeUrl(v)||'https://placehold.co/400x400/f5f5f5/cccccc?text=Aavira';
const safeColor=v=>/^#[0-9a-f]{3,8}$/i.test(String(v))||/^[a-z]+$/i.test(String(v))?String(v):'#d1d5db';
const safeJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}};
const openOverlay=(id,fs)=>{let el=document.getElementById(id);if(el)el.classList.remove('translate-y-full','translate-x-full','hidden');document.body.style.overflow='hidden';if(fs)setTimeout(()=>document.querySelector(fs)?.focus(),300)};
const restoreFocus=()=>{document.body.style.overflow=''};
window.vibrateApp=(m=40)=>{if("vibrate"in navigator)navigator.vibrate(m)};

/* ── LOCAL LOADING HELPERS ──
   Instead of one full-screen loader, we attach a small shimmer overlay
   directly onto the element that was tapped (a card, a button, a link).
   Only that element blurs/shimmers while the action completes. */
window.startLocalLoad=(el)=>{
    if(!el||el.classList.contains('is-loading'))return;
    el.classList.add('is-loading');
    const ov=document.createElement('span');
    ov.className='card-loading-overlay';
    el.appendChild(ov);
};
window.stopLocalLoad=(el)=>{
    if(!el)return;
    el.classList.remove('is-loading');
    const ov=el.querySelector(':scope > .card-loading-overlay');
    if(ov)ov.remove();
};

window.triggerDotAction=(url,el=null)=>{
    window.vibrateApp(30);
    if(el)window.startLocalLoad(el);
    if(!url||url==='#'||url.trim()===''){
        setTimeout(()=>{if(el)window.stopLocalLoad(el);window.showToast("Offer / Page Not Found","error")},450);
    }else{
        setTimeout(()=>window.location.href=url,420);
    }
};

window.goToProduct=(id,el)=>{
    let r=safeJson('aavira_recent',[]);
    r=r.filter(i=>String(i)!==String(id));
    r.unshift(String(id));
    if(r.length>8)r.pop();
    localStorage.setItem('aavira_recent',JSON.stringify(r));
    window.triggerDotAction(`product?id=${id}`,el);
};

/* ── Arrow "View" button on a product card — the icon itself spins while we navigate,
     same idea as the ring-spinner on the Proceed button in the cart page. ── */
window.viewProduct=(e,id)=>{
    if(e){e.preventDefault();e.stopPropagation();}
    const btn=e?e.currentTarget:null;
    if(!btn||btn.disabled)return;
    window.vibrateApp(30);
    btn.disabled=true;
    btn.dataset.originalHtml=btn.innerHTML;
    btn.innerHTML='<span class="mini-spin white"></span>';
    let r=safeJson('aavira_recent',[]);
    r=r.filter(i=>String(i)!==String(id));
    r.unshift(String(id));
    if(r.length>8)r.pop();
    localStorage.setItem('aavira_recent',JSON.stringify(r));
    setTimeout(()=>{ window.location.href=`product?id=${id}`; },480);
};

/* Deterministic pseudo rating/stock so every card shows consistent "social proof"
   (star rating + review count + low-stock urgency) — common on Amazon/Myntra/Flipkart
   listing pages — without needing extra backend fields. */
window.getProductSignals=(id)=>{
    let h=0;const s=String(id);
    for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}
    const rating=(3.8+(h%12)/10).toFixed(1);
    const reviews=42+(h%620);
    const stockLeft=2+(h%9);
    return{rating,reviews,lowStock:stockLeft<=4,stockLeft,bestseller:(h%5)===0};
};

window.revealBottomNav=()=>{isNavManuallyHidden=!1;let n=document.getElementById('bottomNavContainer'),p=document.getElementById('dynamic-action-banner');if(n)n.classList.remove('translate-y-full','nav-hidden');if(p&&!p.classList.contains('hidden'))p.style.transform='translate(-50%, 0)'};
window.hideBottomNav=()=>{isNavManuallyHidden=!0;let n=document.getElementById('bottomNavContainer'),p=document.getElementById('dynamic-action-banner');if(n)n.classList.add('translate-y-full','nav-hidden');if(p&&!p.classList.contains('hidden'))p.style.transform='translate(-50%, 70px)'};

window.closeDynamicBanner=(type)=>{let banner=document.getElementById('dynamic-action-banner');if(banner){banner.style.transform='translate(-50%, 150px)';setTimeout(()=>{banner.classList.add('hidden');banner.classList.remove('flex');if(type==='notif'){sessionStorage.setItem('notifBannerShown','true');setTimeout(window.checkDynamicBanner,100)}else if(type==='login'){sessionStorage.setItem('loginBannerShown','true')}},500)}};

window.checkDynamicBanner=()=>{let banner=document.getElementById('dynamic-action-banner');if(!banner)return;let email=localStorage.getItem('aavira_user_email'),notifGranted=('Notification'in window&&window.Notification.permission==='granted'),notifShown=sessionStorage.getItem('notifBannerShown'),loginShown=sessionStorage.getItem('loginBannerShown');if(email&&notifGranted){banner.classList.add('hidden');banner.classList.remove('flex');return}let content='',currentType='';if(!notifGranted&&!notifShown){currentType='notif';content=`<div class="flex flex-col gap-1 w-full relative"><button onclick="closeDynamicBanner('notif')" class="absolute -top-1 -right-1 text-gray-400 hover:text-white p-1 transition-colors z-10"><i data-lucide="x" class="w-4 h-4"></i></button><div class="flex items-center gap-3 pr-6"><div class="w-10 h-10 shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"><i data-lucide="bell-ring" class="w-5 h-5"></i></div><div class="flex-1"><p class="text-[11px] font-bold text-blue-400 tracking-widest uppercase mb-0.5">Stay Updated</p><p class="text-[10px] text-gray-300 leading-tight">Enable notifications for secret offers.</p></div><button onclick="requestNotificationPermission(event)" class="bg-blue-500 shrink-0 text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm hover:bg-blue-600 transition-colors">Enable</button></div></div>`}else if(!email&&!loginShown){currentType='login';content=`<div class="flex flex-col gap-1 w-full relative"><button onclick="closeDynamicBanner('login')" class="absolute -top-1 -right-1 text-gray-400 hover:text-white p-1 transition-colors z-10"><i data-lucide="x" class="w-4 h-4"></i></button><div class="flex items-center gap-3 pr-6"><div class="w-10 h-10 shrink-0 bg-ethnic-gold/20 rounded-full flex items-center justify-center text-ethnic-gold"><i data-lucide="gift" class="w-5 h-5"></i></div><div class="flex-1"><p class="text-[11px] font-bold text-ethnic-gold tracking-widest uppercase mb-0.5">Flat 20% OFF</p><p class="text-[10px] text-gray-300 leading-tight">Sign in to claim your first order gift.</p></div><button onclick="triggerDotAction('login',this)" class="bg-white shrink-0 text-gray-900 px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm hover:bg-gray-100 transition-colors">Sign In</button></div></div>`}if(content){banner.innerHTML=content;banner.classList.remove('hidden');banner.classList.add('flex');requestAnimationFrame(()=>{requestAnimationFrame(()=>{banner.style.transform=isNavManuallyHidden?'translate(-50%, 70px)':'translate(-50%, 0)'})});if(typeof lucide!=='undefined')lucide.createIcons();clearTimeout(window.bannerTimeout);window.bannerTimeout=setTimeout(()=>{closeDynamicBanner(currentType)},7000)}else{banner.classList.add('hidden');banner.classList.remove('flex')}};

window.addEventListener('scroll',()=>{if(!scrollTicking){window.requestAnimationFrame(()=>{let s=window.pageYOffset||document.documentElement.scrollTop,d=s-lastScrollTop;if(Math.abs(d)>5){if(s>80&&d>0){if(mainHeader)mainHeader.style.transform='translateY(-100%)'}else{if(mainHeader)mainHeader.style.transform='translateY(0)'}if(s>150&&d>0){if(!isNavManuallyHidden)hideBottomNav()}else if(d<0){if(isNavManuallyHidden)revealBottomNav()}}lastScrollTop=s<=0?0:s;scrollTicking=!1});scrollTicking=!0}});

const fadeObserver=new IntersectionObserver((e,o)=>{e.forEach(i=>{if(i.isIntersecting){i.target.classList.add('visible');o.unobserve(i.target)}})},{threshold:0.05,rootMargin:'0px 0px 50px 0px'});
window.initFadeAnimations=()=>document.querySelectorAll('.fade-up').forEach(e=>fadeObserver.observe(e));
window.showToast=(m,t='success')=>{window.vibrateApp(40);let s=document.getElementById('toast'),g=document.getElementById('toast-msg'),i=document.getElementById('toast-icon');if(!s||!g)return;clearTimeout(toastTimeout);g.innerText=m;if(t==='error'){i.setAttribute('data-lucide','circle-alert');i.classList.replace('text-green-500','text-red-500')}else{i.setAttribute('data-lucide','circle-check');i.classList.replace('text-red-500','text-green-500')}if(typeof lucide!=='undefined')lucide.createIcons();s.classList.remove('opacity-0','-translate-y-full','scale-90');s.classList.add('opacity-100','translate-y-0','scale-100');toastTimeout=setTimeout(()=>{s.classList.remove('opacity-100','translate-y-0','scale-100');s.classList.add('opacity-0','-translate-y-full','scale-90')},3000)};
window.subscribeNewsletter=async()=>{let i=document.getElementById('newsletterEmail'),e=i.value.trim();if(!e||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){window.showToast('Valid email required.','error');i.focus();return}let b=document.getElementById('btnNewsletter'),o=b.innerText;b.innerHTML='<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>';b.disabled=true;if(typeof lucide!=='undefined')lucide.createIcons();try{const{getFirestore,doc,setDoc}=await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js');await setDoc(doc(getFirestore(),'newsletter_subscribers',e),{email:e,joinedAt:new Date(),status:'active'});fetch('https://aavira-fashion-backend.vercel.app/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e})}).catch(()=>{});window.showToast('Thanks for joining! 🎉','success');i.value=''}catch(err){window.showToast('Unable to subscribe.','error')}finally{b.innerText=o;b.disabled=false}};
window.updateNotifBadge=()=>{let n=safeJson('aavira_notifications',[]),u=n.filter(x=>!x.read).length,b=document.getElementById('notif-badge');if(b){b.innerText=u;if(u>0)b.classList.remove('hidden');else b.classList.add('hidden')}};
window.renderNotifications=()=>{let n=safeJson('aavira_notifications',[]),l=document.getElementById('notificationList');if(!l)return;if(n.length===0){l.innerHTML=`<div class="flex flex-col items-center justify-center h-full text-gray-400 mt-20"><i data-lucide="bell-off" class="w-12 h-12 mb-3 opacity-30"></i><p class="text-sm">No new updates</p></div>`}else{l.innerHTML=n.map((x,i)=>`<div class="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 transition-all ${!x.read?'border-l-4 border-l-rani-pink bg-red-50/10':''}" onclick="markNotifAsRead(${i})"><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-gray-800 text-[14px] flex items-center gap-1.5">${escapeHtml(x.title)} ${!x.read?'<span class="w-2 h-2 bg-red-500 rounded-full inline-block shadow-[0_0_5px_rgba(239,68,68,0.6)]"></span>':''}</h4><span class="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">${escapeHtml(x.time)}</span></div><p class="text-[12px] text-gray-500 leading-relaxed">${escapeHtml(x.body)}</p>${x.link?`<button type="button" onclick="triggerDotAction('${escapeHtml(x.link)}',this); event.stopPropagation();" class="mt-4 bg-gray-900 text-white text-[11px] px-5 py-2.5 rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-md hover:bg-black hover:scale-[1.02] transition-all w-max"><i data-lucide="link-2" class="w-3.5 h-3.5"></i> Open Link</button>`:''}</div>`).join('')}if(typeof lucide!=='undefined')lucide.createIcons()};
window.markNotifAsRead=i=>{let n=safeJson('aavira_notifications',[]);if(n[i]){n[i].read=true;let r=safeJson('aavira_read_notifs',{});if(n[i].id)r[n[i].id]=true;localStorage.setItem('aavira_read_notifs',JSON.stringify(r))}localStorage.setItem('aavira_notifications',JSON.stringify(n));window.renderNotifications();window.updateNotifBadge()};
window.openNotificationCenter=()=>{window.renderNotifications();openOverlay('notificationCenter','#notificationCenter button');if(typeof window.syncNotificationsFromDB==='function')window.syncNotificationsFromDB()};
window.closeNotificationCenter=()=>{document.getElementById('notificationCenter').classList.add('translate-x-full');restoreFocus()};
window.openReferralCenter=()=>{if(typeof window.closeSidebar==='function')window.closeSidebar();let e=localStorage.getItem('aavira_user_email');if(!e){window.showToast("Please log in!","warning");setTimeout(()=>{window.triggerDotAction('login')},1000);return}document.getElementById('referralLinkInput').value=window.location.origin+window.location.pathname+'?ref='+btoa(e);document.getElementById('referralCenter').classList.remove('translate-x-full');document.body.style.overflow='hidden';if(typeof window.loadReferralStats==='function')window.loadReferralStats(e)};
window.closeReferralCenter=()=>{document.getElementById('referralCenter').classList.add('translate-x-full');document.body.style.overflow=''};
window.copyReferralLink=async()=>{window.vibrateApp();try{await navigator.clipboard.writeText(document.getElementById('referralLinkInput').value);window.showToast('Link copied! 📋','success')}catch{window.showToast('Copy is unavailable.','error')}};
window.shareReferralLink=()=>{let l=document.getElementById('referralLinkInput').value,m=`Discover Aavira! Use my link to sign up and get flat ₹500 OFF your first order! 🎁\n\n${l}`;window.open(`https://wa.me/?text=${encodeURIComponent(m)}`,'_blank')};
window.updateProfileUI=()=>{let s=localStorage.getItem('aavira_display_name'),g=document.getElementById('guestProfileUI'),v=document.getElementById('vipProfileUI'),n=document.getElementById('vipName'),i=document.getElementById('profileInitial');if(s&&s.toLowerCase()!=="guest user"){if(g)g.classList.add('hidden');if(v){v.classList.remove('hidden');v.classList.add('flex')}if(n)n.innerText=s;if(i)i.innerText=s.charAt(0).toUpperCase()}else{if(v){v.classList.add('hidden');v.classList.remove('flex')}if(g)g.classList.remove('hidden')}let a=safeJson('aavira_active_promo',null),p=document.getElementById('activePromoBadge'),pt=document.getElementById('activePromoText');if(a){if(p){p.classList.remove('hidden');p.classList.add('flex')}if(pt)pt.innerText=`${a.code} (-₹${a.discount})`}else{if(p){p.classList.add('hidden');p.classList.remove('flex')}}window.checkDynamicBanner()};
window.handleLogout=()=>{localStorage.removeItem('aavira_display_name');localStorage.removeItem('aavira_user_email');sessionStorage.removeItem('loginBannerShown');window.updateProfileUI();window.showToast("Logged out!","success");window.closeSidebar()};
window.updateCartCount=()=>{let c=safeJson('aavira_cart',[]),b=document.getElementById('cart-badge'),total=c.reduce((sum,item)=>sum+(Number(item.qty)||1),0);if(b){b.innerText=total;if(total>0)b.classList.remove('hidden');else b.classList.add('hidden')}};
window.toggleHeart=async(e,b,id)=>{if(e){e.preventDefault();e.stopPropagation();}window.vibrateApp(50);let i=b.querySelector('svg')||b.querySelector('i'),w=safeJson('aavira_wishlist',[]),s=String(id);b.classList.toggle('text-red-500');b.classList.toggle('text-white/90');if(b.classList.contains('text-red-500')){if(!w.includes(s))w.push(s);if(i)i.setAttribute('fill','currentColor');window.showToast("Added to Wishlist ❤️","success")}else{w=w.filter(x=>String(x)!==s);if(i)i.setAttribute('fill','none');window.showToast("Removed from Wishlist","success")}localStorage.setItem('aavira_wishlist',JSON.stringify(w))};
window.openSearch=()=>openOverlay('searchOverlay','#searchInput');
window.closeSearch=()=>{document.getElementById('searchOverlay').classList.add('translate-y-full');restoreFocus()};
window.handleSearch=()=>{let q=document.getElementById('searchInput').value.toLowerCase().trim(),c=document.getElementById('searchResults');if(!q){c.innerHTML='<div class="text-center text-gray-400 text-xs mt-16 font-serif italic"><div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-3"><i data-lucide="search" class="w-7 h-7 text-gray-300"></i></div>Discover timeless elegance...</div>';if(typeof lucide!=='undefined')lucide.createIcons();return}let f=window.allProductsList.filter(p=>String(p.name||'').toLowerCase().includes(q));if(f.length===0){c.innerHTML='<div class="text-center text-gray-400 text-xs mt-10 font-serif italic">No match found.</div>';return}let h='';f.forEach(p=>{let pr=Number(p.price)||0,m=Number(p.mrp)||pr;h+=`<button type="button" class="flex gap-4 w-full text-left bg-white p-3 rounded-2xl shadow-sm border border-gray-100 cursor-pointer" onclick="goToProduct(${jsArg(p.id)},this)"><img src="${escapeHtml(safeImageUrl(p.img))}" alt="${escapeHtml(p.name)}" class="w-20 h-20 object-cover bg-gray-50 rounded-xl" /><span class="flex-1 flex flex-col justify-center"><span class="text-[9px] text-ethnic-gold uppercase font-bold mb-1">Aavira Luxe</span><span class="text-[13px] font-medium text-gray-800 line-clamp-2">${escapeHtml(p.name)}</span><span class="mt-2 flex items-baseline gap-2"><span class="text-sm font-bold text-gray-900">₹${pr}</span>${m>pr?`<span class="text-[10px] text-gray-400 line-through">₹${m}</span>`:''}</span></span></button>`});c.innerHTML=h};
const ethnicColors=[{name:"Red",hex:"#FF0000"},{name:"Blue",hex:"#0000FF"},{name:"Green",hex:"#008000"},{name:"Yellow",hex:"#FFFF00"},{name:"Orange",hex:"#FFA500"},{name:"Purple",hex:"#800080"},{name:"Pink",hex:"#FFC0CB"},{name:"Brown",hex:"#A52A2A"},{name:"Black",hex:"#000000"},{name:"White",hex:"#FFFFFF"},{name:"Gray",hex:"#808080"},{name:"Sky Blue",hex:"#87CEEB"},{name:"Lime",hex:"#00FF00"},{name:"Navy Blue",hex:"#000080"},{name:"Violet",hex:"#EE82EE"},{name:"Maroon",hex:"#800000"},{name:"Gold",hex:"#FFD700"},{name:"Magenta",hex:"#FF00FF"},{name:"Olive",hex:"#808000"},{name:"Coral",hex:"#FF7F50"}];
window.openColorSheet=()=>{let s=document.getElementById('premiumColorSheet'),c=document.getElementById('colorSheetContent'),b=document.getElementById('colorSheetBg'),ct=document.getElementById('colorSwatchesContainer');if(!s||!c||!ct)return;window.vibrateApp(30);ct.innerHTML=ethnicColors.map(k=>`<div class="flex flex-col items-center gap-1.5 cursor-pointer group" onclick="selectColorAndSearch('${k.name}','${k.hex}')"><div class="w-12 h-12 rounded-full border ${k.hex==='#FFFFFF'?'border-gray-300':'border-black/5'} shadow-[0_4px_15px_rgba(0,0,0,0.08)] group-hover:scale-110 transition-transform flex items-center justify-center relative overflow-hidden"><div class="absolute inset-0 opacity-20 bg-white"></div><div class="w-full h-full" style="background-color:${k.hex}"></div></div><span class="text-[10px] font-semibold text-gray-600 text-center w-full truncate group-hover:text-ethnic-gold">${k.name}</span></div>`).join('');s.classList.remove('hidden');s.classList.add('flex');document.body.style.overflow='hidden';requestAnimationFrame(()=>{requestAnimationFrame(()=>{b.classList.remove('opacity-0');c.classList.remove('translate-y-full')})})};
window.closeColorSheet=()=>{let c=document.getElementById('colorSheetContent'),s=document.getElementById('premiumColorSheet'),b=document.getElementById('colorSheetBg');c.classList.add('translate-y-full');b.classList.add('opacity-0');document.body.style.overflow='';setTimeout(()=>{s.classList.add('hidden');s.classList.remove('flex')},500)};

/* Colour match results now load with a local shimmer inside the grid only — no full-screen dimming. */
window.selectColorAndSearch=(n,h)=>{
    window.closeColorSheet();
    setTimeout(()=>{
        let o=document.getElementById('colorResultsOverlay'),b=document.getElementById('selectedColorBadge'),g=document.getElementById('colorResultsGrid');
        if(!o||!b||!g)return;
        b.style.backgroundColor=safeColor(h);
        o.classList.remove('translate-x-full');
        document.body.style.overflow='hidden';
        document.getElementById('colorMatchText').innerText=`Curated collection in ${n}`;
        g.innerHTML=Array(4).fill(`<div class="relative w-full aspect-[1/1.1] bg-gray-100 rounded-none overflow-hidden"><span class="card-loading-overlay" style="opacity:1;animation:smokeSweep .8s ease-in-out infinite;"></span></div>`).join('');
        setTimeout(()=>{
            let m=window.allProductsList.filter(p=>(Array.isArray(p.colors)?p.colors:[]).some(color=>String(color).toLowerCase()===String(n).toLowerCase()));
            g.innerHTML='';
            if(m.length>0){
                m.forEach(p=>{g.innerHTML+=window.generateProductCard(p,!0)});
                if(typeof lucide!=='undefined')lucide.createIcons();
            }else{
                g.innerHTML=`<div class="col-span-2 flex flex-col items-center justify-center mt-24 text-center px-4"><div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-sm border border-gray-100"><i data-lucide="search-x" class="w-8 h-8"></i></div><h4 class="font-serif text-gray-800 text-xl font-bold mb-2">No Match Found</h4><p class="text-sm text-gray-500 mt-1">Try another shade.</p></div>`;
                if(typeof lucide!=='undefined')lucide.createIcons();
            }
        },500);
    },400);
};

window.closeColorResults=()=>{document.getElementById('colorResultsOverlay').classList.add('translate-x-full');document.body.style.overflow=''};
window.openSidebar=()=>{window.vibrateApp(40);window.updateProfileUI();let o=document.getElementById('sidebarOverlay'),s=document.getElementById('sidebar');o.classList.remove('hidden');document.body.style.overflow='hidden';setTimeout(()=>{o.classList.remove('opacity-0');s.classList.remove('-translate-x-full')},10)};
window.closeSidebar=()=>{window.vibrateApp(30);let o=document.getElementById('sidebarOverlay'),s=document.getElementById('sidebar');s.classList.add('-translate-x-full');o.classList.add('opacity-0');document.body.style.overflow='';setTimeout(()=>{o.classList.add('hidden')},300)};
window.openPromoModal=()=>{if(typeof window.closeSidebar==='function')window.closeSidebar();document.getElementById('promoInput').value='';let m=document.getElementById('promoModal'),o=document.getElementById('promoModalOverlay'),c=document.getElementById('promoModalContent');m.classList.remove('hidden');m.classList.add('flex');document.body.style.overflow='hidden';setTimeout(()=>{if(o)o.classList.remove('opacity-0');if(c)c.classList.remove('translate-y-full','opacity-0')},10)};
window.closePromoModal=()=>{let o=document.getElementById('promoModalOverlay'),c=document.getElementById('promoModalContent');if(o)o.classList.add('opacity-0');if(c)c.classList.add('translate-y-full','opacity-0');document.body.style.overflow='';setTimeout(()=>{let m=document.getElementById('promoModal');if(m){m.classList.add('hidden');m.classList.remove('flex')}},400)};
window.processPromoCode=async()=>{let c=document.getElementById('promoInput').value.trim().toUpperCase();if(!c){window.showToast("Enter a Promo Code!","error");return}let u=safeJson('aavira_used_promos',[]);if(u.includes(c)){window.showToast("Promo code already used once.","error");return}let b=document.getElementById('btnApplyPromo');b.innerHTML='<i data-lucide="loader" class="w-4 h-4 animate-spin inline"></i> Checking...';b.disabled=true;try{let r=await fetch(`https://aavira-fashion-backend.vercel.app/api/promocodes/${c}`),res=await r.json();if(r.ok&&res.status==="success"){let d=Number(res.data.discountAmount)||Number(res.data.amount)||0;window.showToast(`Flat ₹${d} OFF applied! 🎉`,"success");localStorage.setItem('aavira_active_promo',JSON.stringify({code:res.data.id||c,discount:d}));u.push(c);localStorage.setItem('aavira_used_promos',JSON.stringify(u));window.updateProfileUI();setTimeout(()=>window.closePromoModal(),1200)}else{window.showToast(res.message||"Invalid code.","error")}}catch(e){window.showToast("Network Error.","error")}b.innerHTML='Verify & Apply';b.disabled=false;if(typeof lucide!=='undefined')lucide.createIcons()};
window.removePromoCode=()=>{localStorage.removeItem('aavira_active_promo');window.updateProfileUI();window.showToast("Promo Code Removed","success")};
window.loadSkeletons=()=>{document.getElementById('category-container').innerHTML=Array(4).fill(`<div class="flex flex-col items-center gap-2"><div class="w-[72px] h-[72px] rounded-full bg-gray-200 animate-pulse shadow-sm"></div></div>`).join('');let p=`<div class="w-[160px] shrink-0 bg-white border border-gray-100 p-2.5 shadow-sm rounded-none"><div class="w-full aspect-[1/1.1] bg-gray-100 animate-pulse mb-3 rounded-none"></div><div class="h-2 bg-gray-200 animate-pulse w-3/4 mb-2"></div><div class="h-2 bg-gray-200 animate-pulse w-1/2 mb-4"></div></div>`;document.getElementById('trending-container').innerHTML=Array(3).fill(p).join('');let exP=`<div class="bg-white flex flex-col relative shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] border border-gray-100"><div class="w-full aspect-[4/5] bg-gray-100 animate-pulse"></div><div class="p-4"><div class="h-4 bg-gray-200 animate-pulse w-1/2 mb-2"></div><div class="h-3 bg-gray-200 animate-pulse w-1/3 mb-4"></div><div class="flex justify-between items-end mt-4"><div class="h-4 bg-gray-200 animate-pulse w-1/4"></div><div class="h-8 bg-gray-200 animate-pulse w-1/3 rounded-lg"></div></div></div></div>`;document.getElementById('exclusive-container').innerHTML=Array(2).fill(exP).join('');document.getElementById('new-arrivals-container').innerHTML=Array(4).fill(p.replace('w-[160px] shrink-0','w-full')).join('')};

/* ── PRODUCT CARD (small / grid) — "Add to Cart" button removed; rating + urgency tag
     added (a la Amazon/Myntra listing cards); arrow "View" button spins itself on tap ── */
window.generateProductCard=(p,i)=>{
    let pr=Number(p.price)||0,m=Number(p.mrp)||pr,d=m>pr?Math.round(((m-pr)/m)*100):0,mh=m>pr?`<span class="text-[10px] text-gray-400 line-through font-sans ml-1">₹${m}</span>`:'',w=safeJson('aavira_wishlist',[]).map(String).includes(String(p.id)),ca=Array.isArray(p.colors)?p.colors:[],ch='',id=jsArg(p.id),name=escapeHtml(p.name),image=escapeHtml(safeImageUrl(p.img)),sig=window.getProductSignals(p.id);
    if(ca.length>0){let sw=ca.slice(0,3).map(c=>`<span class="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style="background-color:${safeColor(c)}"></span>`).join(''),mt=ca.length>1?`${ca.length} Colours`:'1 Colour';ch=`<div class="flex items-center gap-1.5 mb-2"><div class="flex -space-x-1">${sw}</div><span class="text-[9px] text-gray-400 font-medium tracking-wider uppercase ml-1">${mt}</span></div>`}else{ch=`<div class="mb-2"><span class="text-[9px] text-gray-400 font-medium tracking-wider uppercase">1 Colour</span></div>`}
    let dh=d>0?`<div class="absolute top-2 left-2 z-10 bg-white px-2 py-0.5 text-[9px] font-bold text-rani-pink uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.1)] rounded-none">${d}% OFF</div>`:'';
    let ratingRow=`<div class="flex items-center gap-1 mb-1.5"><span class="flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-[1px] rounded"><i data-lucide="star" class="w-2.5 h-2.5" fill="currentColor"></i>${sig.rating}</span></div>`;
    let urgencyTag=sig.lowStock?`<p class="text-[9px] font-bold text-orange-600 mb-1 flex items-center gap-1"><i data-lucide="flame" class="w-3 h-3"></i>Only ${sig.stockLeft} left</p>`:'';
    return `<div class="product-card ${i?'w-full':'snap-start shrink-0 w-[160px]'} bg-white block flex flex-col relative rounded-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div class="relative bg-gray-50 cursor-pointer overflow-hidden w-full aspect-[1/1.1]" role="link" tabindex="0" aria-label="View ${name}" onclick="goToProduct(${id},this.closest('.product-card'))">
            <img src="${image}" alt="${name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" onerror="this.src='https://placehold.co/400x400/f5f5f5/cccccc?text=Aavira'" />
            ${dh}
            ${sig.bestseller?`<div class="absolute bottom-0 left-0 right-0 z-10 bg-gray-900/85 text-white text-[8px] font-bold uppercase tracking-widest text-center py-1">Bestseller</div>`:''}
            <button type="button" aria-label="Toggle ${name} in wishlist" class="absolute top-2 right-2 p-1 z-10 drop-shadow-md transition-transform hover:scale-110 ${w?'text-red-500':'text-white/90'}" onclick="toggleHeart(event, this, ${id})"><i data-lucide="heart" class="w-4 h-4" fill="${w?'currentColor':'rgba(0,0,0,0.5)'}"></i></button>
        </div>
        <div class="px-3 pt-3 pb-3 flex-1 flex flex-col bg-white">
            <button type="button" class="font-sans text-[13px] text-left font-semibold text-gray-800 line-clamp-1 mb-1 cursor-pointer hover:text-rani-pink transition-colors" onclick="goToProduct(${id},this.closest('.product-card'))">${name}</button>
            ${ratingRow}
            ${ch}
            ${urgencyTag}
            <div class="flex items-center justify-between pt-2.5 mt-auto border-t border-gray-50 relative z-20">
                <div class="flex items-baseline gap-1.5"><span class="text-[15px] font-bold text-gray-900 leading-none">₹${pr}</span>${mh}</div>
                <button type="button" aria-label="View ${name}" class="w-7 h-7 flex items-center justify-center bg-rani-pink text-white hover:bg-[#c21554] transition-all rounded-full cursor-pointer shrink-0 shadow-sm" onclick="viewProduct(event,${id})"><i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></button>
            </div>
        </div>
    </div>`;
};

/* ── FEATURED CARD (large) — "Add to Cart" button removed; rating + Bestseller ribbon
     added (a la Amazon/Myntra); arrow View button spins itself on tap ── */
window.generateFeaturedCard=(p)=>{
    let pr=Number(p.price)||0,m=Number(p.mrp)||pr,d=m>pr?Math.round(((m-pr)/m)*100):0,mh=m>pr?`<span class="text-[12px] text-gray-400 line-through font-sans ml-2">₹${m}</span>`:'',w=safeJson('aavira_wishlist',[]).map(String).includes(String(p.id)),id=jsArg(p.id),name=escapeHtml(p.name),image=escapeHtml(safeImageUrl(p.img)),sig=window.getProductSignals(p.id);
    let dh=d>0?`<div class="absolute top-3 left-3 z-10 bg-white px-3 py-1 text-[10px] font-bold text-rani-pink uppercase tracking-widest shadow-md">${d}% OFF</div>`:'';
    let bsRibbon=sig.bestseller?`<div class="absolute bottom-3 left-3 z-10 bg-gray-900/90 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md"><i data-lucide="crown" class="w-3 h-3 text-ethnic-gold"></i>Bestseller</div>`:'';
    let ratingRow=`<div class="flex items-center gap-1.5 mb-1.5"><span class="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded"><i data-lucide="star" class="w-3 h-3" fill="currentColor"></i>${sig.rating}</span>${sig.lowStock?`<span class="text-[9px] font-bold text-orange-600 flex items-center gap-0.5 ml-auto"><i data-lucide="flame" class="w-3 h-3"></i>${sig.stockLeft} left</span>`:''}</div>`;
    return `<div class="product-card bg-white flex flex-col relative shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div class="relative overflow-hidden w-full aspect-[4/5] cursor-pointer" role="link" tabindex="0" onclick="goToProduct(${id},this.closest('.product-card'))">
            <img src="${image}" alt="${name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onerror="this.src='https://placehold.co/800x1000/f5f5f5/cccccc?text=Aavira'" />
            ${dh}
            ${bsRibbon}
            <button type="button" class="absolute top-3 right-3 p-2 z-10 drop-shadow-md transition-transform hover:scale-110 ${w?'text-red-500':'text-white/90'}" onclick="toggleHeart(event, this, ${id})"><i data-lucide="heart" class="w-5 h-5" fill="${w?'currentColor':'rgba(0,0,0,0.4)'}"></i></button>
        </div>
        <div class="p-4 flex flex-col bg-white">
            <h4 class="font-serif text-[18px] font-bold text-gray-900 line-clamp-1 mb-1 cursor-pointer hover:text-rani-pink transition-colors" onclick="goToProduct(${id},this.closest('.product-card'))">${name}</h4>
            ${ratingRow}
            <p class="text-[11px] text-gray-500 uppercase tracking-widest mb-3">Premium Exclusive</p>
            <div class="flex items-center justify-between mt-auto">
                <div class="flex items-baseline"><span class="text-[18px] font-bold text-gray-900">₹${pr}</span>${mh}</div>
                <button type="button" aria-label="View ${name}" class="w-10 h-10 flex items-center justify-center bg-rani-pink text-white hover:bg-[#c21554] transition-all rounded-full cursor-pointer shrink-0 shadow-md" onclick="viewProduct(event,${id})"><i data-lucide="arrow-up-right" class="w-4 h-4"></i></button>
            </div>
        </div>
    </div>`;
};

window.fetchBanners=async()=>{const c=document.getElementById('bannerCarousel'),dots=document.getElementById('banner-dots');try{let d=typeof window.getBannersData==='function'?await window.getBannersData():[];if(!Array.isArray(d)||d.length===0)throw new Error('No banners');c.innerHTML='';d.forEach(b=>{const image=escapeHtml(safeImageUrl(b.imageUrl||b.image||b.url)),link=b.link?safeUrl(b.link):'#';c.innerHTML+=`<button type="button" class="snap-start shrink-0 w-full h-full relative text-left" onclick="triggerDotAction('${link}',this)"><img src="${image}" alt="Featured collection" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/1200x800/f5f5f5/cccccc?text=Aavira'" /><span class="absolute inset-0 bg-black/20"></span></button>`});dots.innerHTML=d.map((_,i)=>`<span class="banner-dot h-1.5 ${i===0?'w-5 bg-white':'w-2 bg-white/50'}"></span>`).join('');if(window.bannerInterval)clearInterval(window.bannerInterval);window.bannerInterval=setInterval(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;let m=c.scrollWidth-c.clientWidth;if(c.scrollLeft>=m-10)c.scrollTo({left:0,behavior:'smooth'});else c.scrollBy({left:c.clientWidth,behavior:'smooth'})},3500);c.addEventListener('scroll',()=>{let ix=Math.round(c.scrollLeft/c.offsetWidth);document.querySelectorAll('.banner-dot').forEach((dt,i)=>dt.className=`banner-dot h-1.5 ${i===ix?'w-5 bg-white':'w-2 bg-white/50'}`)},{passive:true})}catch(e){c.innerHTML='<div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-center p-6"><p class="font-serif text-xl text-gray-700">New collections are arriving soon.</p><button type="button" onclick="fetchBanners()" class="mt-4 text-sm font-bold text-rani-pink underline">Try again</button></div>';dots.innerHTML=''}};
window.fetchCategories=async()=>{let c=document.getElementById('category-container');try{let a=typeof window.getCategoriesData==='function'?await window.getCategoriesData():[];if(!Array.isArray(a)||a.length===0)throw new Error('No categories');c.innerHTML='';a.forEach(d=>{let image=escapeHtml(safeImageUrl(d.image||d.imageUrl||d.url)),name=escapeHtml(d.name);c.innerHTML+=`<button type="button" aria-label="Browse ${name}" onclick="triggerDotAction('categories',this)" class="flex flex-col items-center gap-3 w-[72px] shrink-0"><span class="h-[72px] w-[72px] rounded-full overflow-hidden border border-gray-200 p-0.5 bg-white"><img src="${image}" alt="${name}" class="w-full h-full object-cover rounded-full" onerror="this.src='https://placehold.co/144x144/f5f5f5/cccccc?text=Aavira'"></span><span class="text-[9px] font-semibold text-gray-700 uppercase">${name}</span></button>`})}catch(e){c.innerHTML='<div class="w-full text-center text-sm text-gray-500 py-6">Collections are unavailable. <button type="button" onclick="fetchCategories()" class="font-bold text-rani-pink underline">Try again</button></div>'}};

window.fetchProducts=async()=>{
    let trending=document.getElementById('trending-container'),exclusives=document.getElementById('exclusive-container'),arrivals=document.getElementById('new-arrivals-container');
    try{
        let d=typeof window.getVercelData==='function'?await window.getVercelData():[];
        if(!Array.isArray(d)||d.length===0)throw new Error('No products');
        window.allProductsList=d.map(x=>({
            id:     x.id,
            name:   x.name,
            price:  x.price,
            mrp:    x.mrp,
            colors: Array.isArray(x.colors)?x.colors:[],
            img:    x.imageMain||x.image||x.imageUrl||''
        }));
        trending.innerHTML='';exclusives.innerHTML='';arrivals.innerHTML='';
        window.allProductsList.forEach((p,i)=>{
            if(i<4)trending.innerHTML+=window.generateProductCard(p,!1);
            else if(i>=4&&i<6)exclusives.innerHTML+=window.generateFeaturedCard(p);
            else arrivals.innerHTML+=window.generateProductCard(p,!0);
        });
        if(window.allProductsList.length<6)arrivals.innerHTML='<p class="col-span-2 text-center text-sm text-gray-500 py-6">More new arrivals are coming soon.</p>';
        window.initFadeAnimations();
        if(typeof lucide!=='undefined')lucide.createIcons();
    }catch(e){
        const retry='<div class="w-full text-center text-sm text-gray-500 py-8">Products are unavailable. <button type="button" onclick="fetchProducts()" class="font-bold text-rani-pink underline">Try again</button></div>';
        trending.innerHTML=retry;exclusives.innerHTML=retry;arrivals.innerHTML=retry;
    }
};

window.photoExps=[];window.lbIndex=0;
window.setRating=(val)=>{expRating=val;document.querySelectorAll('.star-btn').forEach((btn,idx)=>{btn.innerHTML=idx<val?'★':'☆'});window.vibrateApp(20)};
window.renderExperiences=()=>{let x=safeJson('aavira_experiences',[]),c=document.getElementById('experience-container');if(!c)return;if(x.length===0){c.innerHTML=`<div class="w-full py-8 mx-1 text-center flex flex-col items-center justify-center bg-white border border-gray-100 shadow-sm"><div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-2"><i data-lucide="message-square" class="w-5 h-5"></i></div><p class="text-[13px] font-bold text-gray-900">No Reviews Yet</p><p class="text-[10px] text-gray-500 mt-0.5">Be the first to share your style!</p></div>`;if(typeof lucide!=='undefined')lucide.createIcons();return}window.photoExps=x.filter(e=>e.photo&&e.photo.trim()!=="");c.innerHTML=x.map((e)=>{let pi=window.photoExps.indexOf(e);let rating=Math.max(1,Math.min(5,Number(e.rating)||5)),stars='★'.repeat(rating)+'☆'.repeat(5-rating),name=escapeHtml(e.name||'User'),text=escapeHtml(e.text||'');return `<div class="snap-center shrink-0 w-[90%] max-w-[300px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col group rounded-none overflow-hidden">${(e.photo&&e.photo.trim()!=="")?`<button type="button" aria-label="Open photo from ${name}" class="w-full aspect-[1/1.1] bg-gray-50 flex items-center justify-center p-2 overflow-hidden cursor-pointer border-b border-gray-50" onclick="openLightbox(${pi})"><img src="${escapeHtml(safeUrl(e.photo))}" alt="Review photo" onerror="this.parentElement.style.display='none'" class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-sm rounded-md"></button>`:''}<div class="p-5 flex flex-col gap-1.5"><div class="text-ethnic-gold text-[16px] tracking-widest">${stars}</div><h4 class="text-[14px] font-bold text-gray-900 flex items-center gap-1.5">${name} <i data-lucide="circle-check" class="w-3.5 h-3.5 text-green-500 inline"></i></h4><p class="text-[12px] text-gray-600 leading-relaxed mt-1">"${text}"</p></div></div>`}).join('');if(typeof lucide!=='undefined')lucide.createIcons()};
window.openExpModal=()=>{let e=localStorage.getItem('aavira_user_email');if(!e){window.showToast("Please log in to share!","warning");setTimeout(()=>{window.triggerDotAction('login')},1000);return}document.getElementById('expText').value='';expFile=null;window.setRating(5);document.getElementById('expPhotoPreview').src='';document.getElementById('expPhotoPreview').classList.add('hidden');document.getElementById('expPhotoAddBox').classList.remove('hidden');document.getElementById('expOverlay').classList.remove('hidden');setTimeout(()=>{document.getElementById('expOverlay').classList.remove('opacity-0');document.getElementById('expModal').classList.remove('translate-y-full')},10)};
window.closeExpModal=()=>{document.getElementById('expModal').classList.add('translate-y-full');document.getElementById('expOverlay').classList.add('opacity-0');setTimeout(()=>document.getElementById('expOverlay').classList.add('hidden'),300)};
window.handleExpPhoto=e=>{let f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')||f.size>5*1024*1024){window.showToast('Choose an image under 5 MB.','error');e.target.value='';return}expFile=f;document.getElementById('expPhotoPreview').src=URL.createObjectURL(f);document.getElementById('expPhotoPreview').classList.remove('hidden');document.getElementById('expPhotoAddBox').classList.add('hidden')};
window.submitExperience=async()=>{let t=document.getElementById('expText').value.trim();if(!t&&!expFile){window.showToast('Add text or photo!','error');return}let b=document.getElementById('btnSubmitExp'),o=b.innerText;b.innerHTML='<i data-lucide="loader" class="w-4 h-4 animate-spin inline"></i> Posting...';if(typeof lucide!=='undefined')lucide.createIcons();b.disabled=true;try{let pu="";if(expFile){let fd=new FormData();fd.append("file",expFile);fd.append("upload_preset","hcfer3tk");fd.append("cloud_name","lqbslpty");let cr=await fetch("https://api.cloudinary.com/v1_1/lqbslpty/image/upload",{method:"POST",body:fd});let cd=await cr.json();pu=cd.secure_url||""}let p={name:localStorage.getItem('aavira_display_name')||'User',email:localStorage.getItem('aavira_user_email'),text:t,photo:safeUrl(pu),rating:Math.max(1,Math.min(5,Number(expRating)||5)),date:new Date().toISOString()};let saved=false;if(typeof window.sendToVercelExperience==='function')saved=await window.sendToVercelExperience(p);else{let response=await fetch('https://aavira-fashion-backend.vercel.app/api/experience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});saved=response.ok}if(!saved)throw new Error('Review was not saved');let x=safeJson('aavira_experiences',[]);x.unshift(p);localStorage.setItem('aavira_experiences',JSON.stringify(x));window.renderExperiences();window.showToast('Review submitted! 🎉','success');window.closeExpModal()}catch(e){window.showToast('Unable to share your review. Please try again.','error')}finally{b.innerText=o;b.disabled=false}};
window.fetchExperiences=async()=>{try{let d=typeof window.getVercelExperiences==='function'?await window.getVercelExperiences():[];if(d&&d.length>0){localStorage.setItem('aavira_experiences',JSON.stringify(d))}else{localStorage.removeItem('aavira_experiences')}window.renderExperiences()}catch(e){}};
window.openLightbox=(i)=>{if(window.photoExps.length===0)return;window.lbIndex=i;window.updateLbUI();let lb=document.getElementById('imageLightbox');lb.classList.remove('hidden');setTimeout(()=>lb.classList.remove('opacity-0'),10);document.body.style.overflow='hidden'};
window.closeLightbox=()=>{let lb=document.getElementById('imageLightbox');lb.classList.add('opacity-0');setTimeout(()=>lb.classList.add('hidden'),300);document.body.style.overflow=''};
window.updateLbUI=()=>{if(window.lbIndex<0)window.lbIndex=window.photoExps.length-1;if(window.lbIndex>=window.photoExps.length)window.lbIndex=0;let e=window.photoExps[window.lbIndex],rating=Math.max(1,Math.min(5,Number(e.rating)||5));document.getElementById('lbImg').src=safeUrl(e.photo);document.getElementById('lbName').innerHTML=`${escapeHtml(e.name||'User')} <i data-lucide="circle-check" class="w-4 h-4 text-green-500 inline"></i>`;document.getElementById('lbStars').innerText='★'.repeat(rating)+'☆'.repeat(5-rating);document.getElementById('lbText').innerText=e.text?`"${escapeHtml(e.text)}"`:''};
window.lbNext=(e)=>{if(e)e.stopPropagation();window.lbIndex++;window.updateLbUI()};
window.lbPrev=(e)=>{if(e)e.stopPropagation();window.lbIndex--;window.updateLbUI()};
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(!document.getElementById('imageLightbox').classList.contains('hidden'))window.closeLightbox();else if(!document.getElementById('searchOverlay').classList.contains('translate-y-full'))window.closeSearch();else if(!document.getElementById('notificationCenter').classList.contains('translate-x-full'))window.closeNotificationCenter();else if(!document.getElementById('referralCenter').classList.contains('translate-x-full'))window.closeReferralCenter();else if(!document.getElementById('sidebarOverlay').classList.contains('hidden'))window.closeSidebar()});
document.addEventListener("DOMContentLoaded",()=>{let lt=document.getElementById('lightboxTouchArea');if(lt){lt.addEventListener('touchstart',e=>lStartX=e.changedTouches[0].screenX,{passive:!0});lt.addEventListener('touchend',e=>{let d=lStartX-e.changedTouches[0].screenX;if(d>50)window.lbNext();else if(d<-50)window.lbPrev()},!0)}});

window.initializeAppEngine=()=>{window.updateProfileUI();window.updateNotifBadge();window.loadSkeletons();window.updateCartCount();window.initFadeAnimations();window.renderExperiences();if(typeof window.syncNotificationsFromDB==='function')window.syncNotificationsFromDB();if(typeof lucide!=='undefined')lucide.createIcons();let s=document.getElementById('sidebar'),tx=0;s.addEventListener('touchstart',e=>{tx=e.changedTouches[0].screenX},{passive:!0});s.addEventListener('touchend',e=>{if(tx-e.changedTouches[0].screenX>50)window.closeSidebar()},{passive:!0});setTimeout(async()=>{let nm=localStorage.getItem('aavira_display_name'),dbP=Promise.resolve();if(nm&&nm.toLowerCase()!=="guest user"&&typeof window.getWishlistFromDB==='function'){dbP=window.getWishlistFromDB(nm).then(w=>{if(w&&w.length>0)localStorage.setItem('aavira_wishlist',JSON.stringify(w.map(String)))}).catch(()=>{})}try{await Promise.all([typeof window.fetchBanners==='function'?window.fetchBanners():Promise.resolve(),typeof window.fetchCategories==='function'?window.fetchCategories():Promise.resolve(),typeof window.fetchProducts==='function'?window.fetchProducts():Promise.resolve(),typeof window.fetchExperiences==='function'?window.fetchExperiences():Promise.resolve(),dbP])}finally{if(typeof lucide!=='undefined')lucide.createIcons()}},50)};


Promise.all([
    import('https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js'),
    import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js')
]).then(([firebaseApp, firebaseMessaging, firebaseFirestore]) => {
    const { initializeApp } = firebaseApp;
    const { getMessaging, getToken, onMessage, isSupported } = firebaseMessaging;
    const { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy } = firebaseFirestore;

const c={apiKey:"AIzaSyAzuolDDiCoMWiJeSRmpo9my2DcxyBj_jA",authDomain:"messaging-d0a0c.firebaseapp.com",projectId:"messaging-d0a0c",storageBucket:"messaging-d0a0c.firebasestorage.app",messagingSenderId:"271709445992",appId:"1:271709445992:web:7a0c706288d88fee6a80dd"},a=initializeApp(c),d=getFirestore(a);let m=null;
window.syncNotificationsFromDB=async()=>{try{let q=query(collection(d,"admin_broadcasts"),orderBy("createdAt","desc")),s=await getDocs(q),n=[],r=JSON.parse(localStorage.getItem('aavira_read_notifs'))||{};s.forEach(x=>{let dt=x.data(),t=dt.createdAt?dt.createdAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):new Date().toLocaleTimeString();n.push({id:x.id,title:dt.title,body:dt.body,link:dt.link||'',time:t,read:r[x.id]?!0:!1})});localStorage.setItem('aavira_notifications',JSON.stringify(n));if(typeof window.renderNotifications==='function')window.renderNotifications();if(typeof window.updateNotifBadge==='function')window.updateNotifBadge()}catch(e){}};
window.loadReferralStats=async(e)=>{try{let s=await getDoc(doc(d,"users",e));if(s.exists()){let x=s.data();document.getElementById('refCount').innerText=x.referralCount||0;document.getElementById('refEarned').innerText="₹"+(x.referralEarned||0)}}catch(e){}};
isSupported().then((s)=>{if(s){m=getMessaging(a);onMessage(m,(p)=>{let t=p.notification?.title||"Update";if(typeof window.showToast==='function')window.showToast(`🔔 ${t}`,"success");window.vibrateApp(100);window.syncNotificationsFromDB()})}});
window.requestNotificationPermission=async(e)=>{if(e)e.preventDefault();if(typeof window.closeSidebar==='function')window.closeSidebar();if(!('Notification'in window)){window.showToast("Notifications not supported in this browser.","error");return}try{if(!m){window.showToast("Not supported.","error");return}let p=await Notification.requestPermission();if(p==='granted'){window.showToast("Connecting...","success");let sw=await navigator.serviceWorker.register('./firebase-messaging-sw.js'),t=await getToken(m,{vapidKey:'BIvjJEeeRfowF8ZpdgRKn-vH_rNOzW48Rd9Y37kNdeISUsmKkiihJtFPc4c0rWbFBOhb4kJ3Yj-5jTl2kO9-yAU',serviceWorkerRegistration:sw});if(t){let ue=localStorage.getItem('aavira_user_email')||'guest_user',un=localStorage.getItem('aavira_display_name')||'Guest';await setDoc(doc(d,"fcm_tokens",t),{token:t,email:ue,name:un,platform:navigator.userAgent,createdAt:new Date()});window.showToast("Enabled! 🔔","success");window.closeDynamicBanner('notif');fetch(`https://ssxpq15in.vercel.app/api/broadcast`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tokens:[t],title:"🎉 Welcome!",body:`Hi ${un}, thanks for enabling notifications!`})}).catch(()=>{});setTimeout(()=>{if(typeof window.openNotificationCenter==='function')window.openNotificationCenter()},1500)}else{window.showToast("Failed.","error")}}else{window.showToast("Denied.","error")}}catch(err){window.showToast("Error.","error")}};
    if (document.readyState !== 'loading') window.syncNotificationsFromDB();
}).catch((error) => {
    console.error('Firebase services could not be initialized.', error);
});

document.addEventListener('DOMContentLoaded', () => {
    window.initializeAppEngine();
});
