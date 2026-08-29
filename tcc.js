/* =========================================================
   AAVIRA LUXE - ORDERS ENGINE (tcc.js)
   ========================================================= */

let allOrdersData = [];
let currentOrderData = null;
let currentDeliveryOtp = "0000";

// Clean Home Navigation
window.goToHome = function() {
    window.location.href = '/';
};

// Live Refresh
window.refreshOrders = async function() {
    const btn = document.getElementById('btnRefresh');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate-right fa-spin"></i>';
    await fetchOrders();
    setTimeout(() => {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
        showToast("Orders Refreshed!");
    }, 500);
};

// Search Toggle
window.toggleSearch = function(show) {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if(show) {
        overlay.classList.add('active');
        setTimeout(() => input.focus(), 150);
    } else {
        overlay.classList.remove('active');
        input.value = '';
        input.blur();
        handleSearch();
    }
};

window.handleSearch = function() {
    const activeTab = document.querySelector('.tab.active');
    if(activeTab) {
        filterOrders(activeTab.innerText.trim(), activeTab, true);
    }
};

// 🔥 STRICT STATUS NORMALIZER: 'out for' IS MATCHED BEFORE 'deliver' 🔥
function getStrictProductStatus(rawStatus) {
    if (!rawStatus) return "Processing";
    let s = String(rawStatus).trim().toLowerCase();
    
    if (s.includes('cancel')) return 'Cancelled';
    // Matches Out for delivery first so it's not confused with 'Delivered'
    if (s.includes('out for') || s.includes('outfordelivery') || s.includes('out_for_delivery')) return 'Out for Delivery';
    if (s.includes('deliver')) return 'Delivered';
    if (s.includes('ship')) return 'Shipped';
    if (s.includes('confirm')) return 'Confirmed';
    
    return 'Processing';
}

// Consistent 4-digit PIN generation
function generateOrderDeliveryOtp(orderId) {
    const cleanStr = String(orderId || '1000').replace(/[^a-zA-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanStr.length; i++) {
        hash = ((hash << 5) - hash) + cleanStr.charCodeAt(i);
        hash |= 0;
    }
    const otpNum = Math.abs(hash) % 9000 + 1000;
    return String(otpNum);
}

function parseOrderDate(dateVal) {
    if (!dateVal) return new Date();
    if (typeof dateVal === 'object') {
        if (dateVal._seconds) return new Date(dateVal._seconds * 1000);
        if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    }
    let d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
}

function formatDateTime(dateObj) {
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return dateObj.toLocaleDateString('en-IN', options).replace(' am', ' AM').replace(' pm', ' PM');
}

function formatDateOnly(dateObj) {
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatColor(colorVal) {
    let clr = colorVal || 'Standard';
    if(clr.match(/^https?:\/\//) || clr.includes('cloudinary.com') || clr.includes('data:image') || clr.includes('/')) return 'As Shown';
    return clr;
}

document.addEventListener('DOMContentLoaded', () => {
    updateTabIndicator(document.querySelector('.tab.active'));
    fetchOrders();
});

// 🔥 STRICT DEVICE/USER ORDER ISOLATION FILTER 🔥
async function fetchOrders() {
    const userEmail = (localStorage.getItem('aavira_user_email') || localStorage.getItem('user_email') || '').trim().toLowerCase();
    const rawUserPhone = (localStorage.getItem('aavira_user_phone') || localStorage.getItem('user_phone') || '').replace(/[^0-9]/g, '');
    const userPhone = rawUserPhone.length >= 10 ? rawUserPhone.slice(-10) : '';
    const userId = (localStorage.getItem('aavira_user_id') || localStorage.getItem('user_id') || '').trim();

    let localPlacedOrderIds = [];
    try {
        const stored = JSON.parse(localStorage.getItem('aavira_placed_orders') || '[]');
        if (Array.isArray(stored)) {
            localPlacedOrderIds = stored.map(id => String(id).trim().toUpperCase()).filter(id => id && id !== 'UNDEFINED' && id !== 'NULL');
        }
    } catch(e) {
        localPlacedOrderIds = [];
    }

    const isUserIdentified = (userEmail && userEmail !== 'undefined' && userEmail !== 'null') ||
                             (userPhone && userPhone !== '') ||
                             (userId && userId !== 'undefined' && userId !== 'null') ||
                             (localPlacedOrderIds.length > 0);

    try {
        const response = await fetch(`https://ssxpq15in.vercel.app/api/orders?nocache=${new Date().getTime()}`);
        const result = await response.json();
        
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';

        if (response.ok && result.status === "success" && Array.isArray(result.data) && isUserIdentified) {
            
            allOrdersData = result.data.filter(order => {
                if (!order) return false;

                const oId = String(order.orderId || order.id || order._id || '').trim().toUpperCase();
                if (oId && localPlacedOrderIds.includes(oId)) return true;

                const oUserId = String(order.userId || order.user_id || order.uid || '').trim();
                if (userId && oUserId && userId === oUserId) return true;

                const oEmail = String(order.email || order.userEmail || order.customerEmail || '').trim().toLowerCase();
                if (userEmail && oEmail && userEmail === oEmail) return true;

                const rawOPhone = String(order.phone || order.userPhone || order.customerPhone || '').replace(/[^0-9]/g, '');
                const oPhone = rawOPhone.length >= 10 ? rawOPhone.slice(-10) : '';
                if (userPhone && oPhone && userPhone === oPhone) return true;

                return false;
            });

            let locallyCancelled = [];
            try {
                locallyCancelled = JSON.parse(localStorage.getItem('aavira_cancelled_orders') || '[]');
            } catch(e) {}

            allOrdersData.forEach(o => {
                const checkId = o.orderId || o.id || o._id;
                if(locallyCancelled.includes(checkId)) {
                    o.orderStatus = 'Cancelled';
                }
            });

            allOrdersData.sort((a,b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt));

            if (allOrdersData.length === 0) {
                document.getElementById('emptyState').style.display = 'flex';
                document.getElementById('cardsWrapper').innerHTML = '';
            } else {
                document.getElementById('emptyState').style.display = 'none';
                handleSearch();
            }

        } else {
            allOrdersData = [];
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('cardsWrapper').innerHTML = '';
        }
    } catch (error) {
        console.error("Order fetch error:", error);
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
    }
}

function updateTabIndicator(btnElement) {
    if (!btnElement) return;
    const indicator = document.getElementById('tabIndicator');
    if (indicator) {
        indicator.style.width = `${Math.max(20, btnElement.offsetWidth - 28)}px`;
        indicator.style.left = `${btnElement.offsetLeft + 14}px`;
    }
}

window.filterOrders = function(status, btnElement, skipAnim = false) {
    if (!btnElement) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btnElement.classList.add('active');
    updateTabIndicator(btnElement);

    if(allOrdersData.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('cardsWrapper').innerHTML = '';
        return;
    }

    let filtered = allOrdersData;

    if(status !== 'All') {
        filtered = filtered.filter(o => {
            let s = getStrictProductStatus(o.orderStatus);
            if(status === 'Processing' && (s === 'Processing' || s === 'Confirmed')) return true;
            if(status === 'Shipped' && (s === 'Shipped' || s === 'Out for Delivery')) return true;
            return s === status;
        });
    }

    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if(query) {
        filtered = filtered.filter(o => {
            let id = String(o.orderId || o.id || '').toLowerCase();
            let title = (o.items && o.items.length > 0 && o.items[0].name) ? String(o.items[0].name).toLowerCase() : '';
            return id.includes(query) || title.includes(query);
        });
    }

    renderOrdersUI(filtered, skipAnim);
};

function getSmartExpectedDate(rawDateObj, currentStatus) {
    let expected = new Date(rawDateObj.getTime());
    expected.setDate(expected.getDate() + 5); 
    let now = new Date();
    if (currentStatus === 'Out for Delivery') {
        return now;
    }
    if (currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && expected < now) {
        expected = new Date(now.getTime());
        expected.setDate(expected.getDate() + 1); 
    }
    return expected;
}

function renderOrdersUI(ordersArray, skipAnim = false) {
    const wrapper = document.getElementById('cardsWrapper');
    wrapper.innerHTML = '';
    
    if(ordersArray.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
        return;
    }
    document.getElementById('emptyState').style.display = 'none';

    ordersArray.forEach((order, index) => {
        let rawDate = parseOrderDate(order.createdAt);
        let displayDate = formatDateTime(rawDate).split(',')[0]; 
        let status = getStrictProductStatus(order.orderStatus); 
        let expectedDate = getSmartExpectedDate(rawDate, status);
        
        let titleStr = "Exclusive Ethnic Wear";
        let mainImg = "";
        let itemsCount = order.items ? order.items.length : 1;

        if(order.items && order.items.length > 0) {
            mainImg = order.items[0].image || "";
            titleStr = order.items[0].name || titleStr;
        }

        const total = Number(order.totalAmount || order.total || 0);
        const safeKeyId = order.id || order._id || order.orderId;
        const displayOrderId = order.orderId || ('#AVF' + String(safeKeyId).slice(-5));
        
        let statusClass = "st-Processing";
        let bottomLine = `<i class="fa-solid fa-truck"></i> <span>Expected by ${formatDateOnly(expectedDate)}, 9:00 PM</span>`;
        
        if(status === 'Confirmed') statusClass = 'st-Confirmed';
        if(status === 'Shipped') statusClass = 'st-Shipped';
        if(status === 'Out for Delivery') {
            statusClass = 'st-OutforDelivery';
            bottomLine = `<i class="fa-solid fa-truck-fast" style="color:#E11D48;"></i> <span style="color:#E11D48; font-weight:700;">Out for Delivery Today!</span>`;
        }
        if(status === 'Delivered') { 
            statusClass = 'st-Delivered'; 
            bottomLine = `<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> <span>Delivered on ${displayDate}</span>`; 
        }
        if(status === 'Cancelled') { 
            statusClass = 'st-Cancelled'; 
            bottomLine = `<i class="fa-solid fa-circle-xmark" style="color:var(--text-light);"></i> <span>Cancelled on ${displayDate}</span>`; 
        }

        let delay = skipAnim ? 0 : Math.min(index * 0.06, 0.35);
        
        let imageElement = mainImg 
            ? `<img src="${mainImg}" class="oc-img" alt="Product" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="oc-img-fallback" style="display:none; width:100%; height:100%; border-radius:12px; background:#f3f4f6; align-items:center; justify-content:center; color:#ccc; font-size:24px;"><i class="fa-solid fa-shirt"></i></div>`
            : `<div class="oc-img-fallback" style="display:flex; width:100%; height:100%; border-radius:12px; background:#f3f4f6; align-items:center; justify-content:center; color:#ccc; font-size:24px;"><i class="fa-solid fa-shirt"></i></div>`;

        const html = `
            <div class="order-card" style="animation-delay: ${delay}s" onclick="openOrderDetails('${safeKeyId}')">
                <div class="oc-top">
                    <div class="img-wrapper">${imageElement}</div>
                    <div class="oc-info">
                        <div class="oc-header">
                            <div class="oc-label">Order ID</div>
                            <div class="status-badge ${statusClass}">${status}</div>
                        </div>
                        <div class="oc-id">${displayOrderId}</div>
                        <div class="oc-meta">${displayDate} &bull; ${itemsCount} Item${itemsCount > 1 ? 's' : ''}</div>
                        <div class="oc-price">₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                </div>
                <div class="oc-divider"></div>
                <div class="oc-bottom">
                    <div style="display:flex; align-items:center;">${bottomLine}</div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc;"></i>
                </div>
            </div>
        `;
        wrapper.innerHTML += html;
    });
    
    wrapper.innerHTML += `<div style="text-align:center; font-size:12px; font-weight:600; color:var(--text-light); margin: 16px 0;">That's all your orders</div>`;
}

// ==========================================
// ORDER DETAILS VIEW
// ==========================================
window.openOrderDetails = function(internalId) {
    const order = allOrdersData.find(o => (o.id === internalId || o._id === internalId || o.orderId === internalId));
    if(!order) return;
    currentOrderData = order;

    let rawDate = parseOrderDate(order.createdAt);
    let status = getStrictProductStatus(order.orderStatus);
    let expectedDate = getSmartExpectedDate(rawDate, status);

    document.getElementById('dtOrderId').innerText = order.orderId || order.id || '#AVF';
    document.getElementById('dtDate').innerText = `Placed on ${formatDateTime(rawDate)}`;
    
    const itemsContainer = document.getElementById('dtItemsContainer');
    itemsContainer.innerHTML = '';
    
    const itemsList = (order.items && order.items.length > 0) ? order.items : [{
        name: "Exclusive Ethnic Wear",
        image: "",
        size: "Free Size",
        color: "Standard",
        qty: 1,
        price: order.totalAmount || 0
    }];

    itemsList.forEach(itm => {
        let itmImg = itm.image ? `<img src="${itm.image}" class="oc-img" style="width:100%; height:100%; border-radius:10px; object-fit:cover; border:1px solid #eee;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                  <div style="display:none; width:100%; height:100%; border-radius:10px; background:#f0f0f0; align-items:center; justify-content:center; color:#ccc; font-size:24px;"><i class="fa-solid fa-shirt"></i></div>`
                               : `<div style="display:flex; width:100%; height:100%; border-radius:10px; background:#f0f0f0; align-items:center; justify-content:center; color:#ccc; font-size:24px;"><i class="fa-solid fa-shirt"></i></div>`;
        
        itemsContainer.innerHTML += `
            <div class="dv-item-card">
                <div class="img-wrapper" style="width:75px; height:75px;">${itmImg}</div>
                <div style="flex:1;">
                    <h4 style="font-size:13.5px; font-weight:700; color:var(--text-dark); margin-bottom:3px; line-height:1.3;">${itm.name || 'Exclusive Wear'}</h4>
                    <p style="font-size:11.5px; color:var(--text-muted); font-weight:500; margin-bottom:6px;">Size: ${itm.size || 'Free Size'} | Color: ${formatColor(itm.color)}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="font-size:14.5px; font-weight:800; color:var(--text-dark);">₹${Number(itm.price || (order.totalAmount / itemsList.length)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
                        <p style="font-size:11.5px; color:var(--text-dark); font-weight:600;">Qty: ${itm.qty || 1}</p>
                    </div>
                </div>
            </div>
        `;
    });

    // 🔥 DELIVERY OTP CARD DISPLAY 🔥
    const otpCard = document.getElementById('dtDeliveryOtpCard');
    if(status === 'Out for Delivery') {
        otpCard.style.display = 'flex';
        currentDeliveryOtp = generateOrderDeliveryOtp(order.orderId || order.id);
        
        const otpDigits = currentDeliveryOtp.split('');
        document.getElementById('dtOtpBoxes').innerHTML = otpDigits.map(d => `<div class="otp-digit">${d}</div>`).join('');
    } else {
        otpCard.style.display = 'none';
    }

    let total = Number(order.totalAmount || order.total || 0);
    let ship = (total > 1500 || total === 0) ? 0 : 40; 
    let sub = total > 0 ? Math.max(0, total - ship) : 0;
    let disc = Number(order.promoDiscount || 0);

    document.getElementById('dtSubtotal').innerText = `₹${sub.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('dtShipping').innerText = ship > 0 ? `₹${ship.toFixed(2)}` : 'FREE';
    document.getElementById('dtTotal').innerText = `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('dtDiscount').innerText = disc > 0 ? `- ₹${disc.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : `- ₹0.00`;

    document.getElementById('dtAddressName').innerText = order.customerName || order.name || "Customer";
    document.getElementById('dtAddressFull').innerText = order.address || "Address not provided";
    document.getElementById('dtAddressPhone').innerText = `Phone: ${order.phone || order.customerPhone || "N/A"}`;

    const dtCancelBtn = document.getElementById('dtCancelBtn');
    if(['Processing', 'Confirmed'].includes(status)) {
        dtCancelBtn.style.display = 'flex';
    } else {
        dtCancelBtn.style.display = 'none';
    }

    // Payment UI
    let pStatus = String(order.paymentStatus || 'Pending').toLowerCase();
    let pMethod = String(order.paymentMethod || 'Online');
    let payColor, payBg, payText, payIcon, payActionHtml;

    if (pStatus === 'success' || pStatus === 'paid') {
        payColor = "var(--success)"; payBg = "var(--success-light)"; 
        payText = "Payment Received"; 
        payIcon = "fa-circle-check";
        payActionHtml = `<div class="pay-banner success-banner"><i class="fa-solid fa-circle-check" style="font-size:15px;"></i> Payment Received Successfully</div>`;
    } else if (pStatus === 'failed' || pStatus === 'error') {
        payColor = "var(--error)"; payBg = "var(--error-light)"; 
        payText = "Payment Failed"; 
        payIcon = "fa-circle-xmark";
        payActionHtml = `<button class="btn-pay-action btn-pay-retry" onclick="payViaWhatsApp('${order.orderId || order.id}', ${total})">Retry Payment ₹${total.toLocaleString('en-IN')} <i class="fa-brands fa-whatsapp"></i></button>`;
    } else if (pStatus === 'cod' || pMethod.toLowerCase() === 'cod') {
        payColor = "var(--warning)"; payBg = "var(--warning-light)"; 
        payText = "Pending (COD)"; 
        payIcon = "fa-clock";
        payActionHtml = `
            <div class="pay-banner" style="background:#EFF6FF; color:#1E3A8A; border:1px solid #BFDBFE;">
                <i class="fa-solid fa-hand-holding-dollar" style="font-size:15px;"></i> Cash on delivery chosen. Pay online for instant contactless delivery.
            </div>
            <button class="btn-pay-action btn-pay-now" onclick="payViaWhatsApp('${order.orderId || order.id}', ${total})">
                Pay Online Now ₹${total.toLocaleString('en-IN')} <i class="fa-brands fa-whatsapp"></i>
            </button>`;
    } else {
        payColor = "var(--warning)"; payBg = "var(--warning-light)"; 
        payText = "Payment Pending"; 
        payIcon = "fa-clock";
        payActionHtml = `<button class="btn-pay-action btn-pay-now" onclick="payViaWhatsApp('${order.orderId || order.id}', ${total})">Pay Now ₹${total.toLocaleString('en-IN')} <i class="fa-brands fa-whatsapp"></i></button>`;
    }

    document.getElementById('dtPaymentStatusBox').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="color:var(--text-muted); font-size:12.5px; font-weight:600;">Payment Method</span>
            <span style="color:var(--text-dark); font-size:12.5px; font-weight:800; text-transform:uppercase;">${pMethod}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:var(--text-muted); font-size:12.5px; font-weight:600;">Payment Status</span>
            <div class="payment-status-badge" style="background:${payBg}; color:${payColor};">
                <i class="fa-solid ${payIcon}"></i> ${payText}
            </div>
        </div>
        ${payActionHtml}
    `;

    generateAdvancedTimeline(status, rawDate, expectedDate);
    document.getElementById('detailsView').classList.add('show');
};

window.copyDeliveryOtp = async function() {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(currentDeliveryOtp);
        }
        showToast(`Delivery PIN ${currentDeliveryOtp} Copied!`);
    } catch(e) {
        showToast(`PIN: ${currentDeliveryOtp}`);
    }
};

window.shareOrder = function() {
    if(!currentOrderData) return;
    const oId = currentOrderData.orderId || currentOrderData.id;
    const shareData = {
        title: 'My Aavira Luxe Order',
        text: `Tracking details for my Order #${oId} from Aavira Luxe.`,
        url: window.location.href
    };
    if(navigator.share) {
        navigator.share(shareData).catch(()=>{});
    } else {
        copyOrderId();
    }
};

window.openInvoiceModal = function() {
    if(!currentOrderData) return;
    document.getElementById('invOrderId').innerText = currentOrderData.orderId || currentOrderData.id;
    document.getElementById('invDate').innerText = formatDateOnly(parseOrderDate(currentOrderData.createdAt));
    document.getElementById('invName').innerText = currentOrderData.customerName || "Customer";
    
    const invList = document.getElementById('invItemsList');
    invList.innerHTML = '';
    const items = currentOrderData.items || [{ name: "Ethnic Blouse/Wear", qty: 1, price: currentOrderData.totalAmount || 0 }];
    items.forEach(itm => {
        invList.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>${itm.name} (x${itm.qty||1})</span>
                <strong>₹${Number(itm.price||0).toLocaleString('en-IN')}</strong>
            </div>
        `;
    });
    document.getElementById('invTotal').innerText = `₹${Number(currentOrderData.totalAmount || 0).toLocaleString('en-IN')}`;
    
    const modal = document.getElementById('invoiceModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 20);
};

window.reorderCurrent = function() {
    if(!currentOrderData) return;
    const itm = (currentOrderData.items && currentOrderData.items.length > 0) ? currentOrderData.items[0].name : "Exclusive Wear";
    let msg = `Hi Aavira Support,\n\nI want to re-order (*${itm}* - Order #${currentOrderData.orderId}). Please assist me.`;
    window.open(`https://wa.me/919608720622?text=${encodeURIComponent(msg)}`, '_blank');
};

window.payViaWhatsApp = function(orderId, amount) {
    let msg = `Hi Aavira Support,\n\nI want to complete payment for Order: *${orderId}*.\n*Total Amount: ₹${amount.toLocaleString('en-IN')}*\nPlease share Payment QR / Link.`;
    window.open(`https://wa.me/919608720622?text=${encodeURIComponent(msg)}`, '_blank');
};

window.closeOrderDetails = function() {
    document.getElementById('detailsView').classList.remove('show');
};

function generateAdvancedTimeline(status, rawDate, expDate) {
    const tlContainer = document.getElementById('dtStepsContainer');
    const expBox = document.getElementById('dtExpectedBox');
    const progressLine = document.getElementById('tlProgress');
    progressLine.style.height = '0%'; 
    
    if(status === 'Delivered') {
        expBox.style.background = 'var(--status-green-light)';
        expBox.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--status-green);"></i><div><p style="color:var(--status-green);">Delivery Status</p><h4 style="color:var(--status-green);">Delivered Successfully</h4></div>`;
    } else if(status === 'Out for Delivery') {
        expBox.style.background = '#FFF1F2';
        expBox.innerHTML = `<i class="fa-solid fa-truck-fast" style="color:#E11D48;"></i><div><p style="color:#E11D48;">Delivery Status</p><h4 style="color:#BE123C;">Arriving Today By 9:00 PM</h4></div>`;
    } else if(status === 'Cancelled') {
        expBox.style.background = 'var(--status-gray-light)';
        expBox.innerHTML = `<i class="fa-solid fa-ban" style="color:var(--status-gray);"></i><div><p style="color:var(--status-gray);">Delivery Status</p><h4 style="color:var(--status-gray);">Order Cancelled</h4></div>`;
    } else {
        expBox.style.background = 'var(--primary-light)';
        expBox.innerHTML = `<i class="fa-solid fa-truck-fast" style="color:var(--primary);"></i><div><p>Expected Delivery</p><h4 style="color:var(--text-dark);">${formatDateOnly(expDate)} <br><span style="font-size:11px; font-weight:500; color:var(--text-muted);">By 9:00 PM</span></h4></div>`;
    }

    const stepsData = [
        { id: 'Processing', title: 'Order Processing', desc: 'We are processing your order.' },
        { id: 'Confirmed', title: 'Order Confirmed', desc: 'Your order has been verified.' }, 
        { id: 'Shipped', title: 'Shipped', desc: 'Handed over to courier partner.' },
        { id: 'Out for Delivery', title: 'Out for Delivery', desc: 'Delivery partner is delivering today.' },
        { id: 'Delivered', title: 'Delivered', desc: 'Package delivered.' }
    ];

    let html = '';
    
    if(status === 'Cancelled') {
        html += getStepHtml(true, false, 'Order Processing', 'Order placed & processed.', formatDateTime(rawDate));
        html += getStepHtml(false, true, 'Cancelled', 'Your order has been cancelled.', 'N/A', true);
        setTimeout(() => progressLine.style.height = '30%', 200);
    } else {
        let currentIdx = 0; 
        if(status === 'Confirmed') currentIdx = 1;
        if(status === 'Shipped') currentIdx = 2;
        if(status === 'Out for Delivery') currentIdx = 3;
        if(status === 'Delivered') currentIdx = 4;

        let heightPercentage = (currentIdx / (stepsData.length - 1)) * 100;
        setTimeout(() => progressLine.style.height = `${heightPercentage}%`, 200);

        stepsData.forEach((step, index) => {
            let isDone = index < currentIdx;
            let isCurrent = index === currentIdx;
            
            let stepDate = new Date(rawDate.getTime());
            stepDate.setDate(stepDate.getDate() + Math.floor(index * 1.5)); 
            if(index === 1) stepDate.setHours(stepDate.getHours() + 4); 
            
            let dateTxt = (isDone || isCurrent) ? formatDateTime(stepDate) : ''; 
            html += getStepHtml(isDone, isCurrent, step.title, step.desc, dateTxt);
        });
    }
    
    tlContainer.innerHTML = html;
}

function getStepHtml(isDone, isCurrent, title, desc, dateTxt, isCancel = false) {
    let iconClass = 'pending';
    let iconMarkup = '<i class="fa-solid fa-cube"></i>';
    let titleClass = 'pending';
    
    if(isDone) {
        iconClass = 'done'; iconMarkup = '<i class="fa-solid fa-check"></i>'; titleClass = ''; 
    } else if (isCurrent) {
        iconClass = 'current';
        if(isCancel) { 
            iconClass = 'pending'; 
            iconMarkup = '<i class="fa-solid fa-xmark" style="color:var(--error);"></i>'; 
        } else { 
            iconMarkup = '<i class="fa-solid fa-truck-fast"></i>'; 
        }
        titleClass = '';
    }

    return `
        <div class="tl-step">
            <div class="tl-icon ${iconClass}">${iconMarkup}</div>
            <div class="tl-content">
                <div class="tl-title ${titleClass}">${title}</div>
                <div class="tl-desc">${desc}</div>
                ${dateTxt ? `<div class="tl-date">${dateTxt}</div>` : ''}
            </div>
        </div>
    `;
}

window.copyOrderId = async function() {
    if(!currentOrderData) return;
    const targetId = currentOrderData.orderId || currentOrderData.id || '';
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(targetId);
        }
        showToast("Order ID Copied!");
    } catch(e) {
        showToast("ID: " + targetId);
    }
};

function showToast(msg) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};

window.openWhatsApp = function() {
    if(!currentOrderData) return;
    let title = currentOrderData.items && currentOrderData.items.length > 0 ? currentOrderData.items[0].name : "Product";
    let oId = currentOrderData.orderId || currentOrderData.id || "N/A";
    let msg = `Hi Aavira Support,\n\nI need help regarding my Order: *${oId}*.\nProduct: ${title}\n\nPlease assist me.`;
    window.open(`https://wa.me/919608720622?text=${encodeURIComponent(msg)}`, '_blank');
};

window.triggerCancelOrder = function() {
    if(!currentOrderData) return;
    document.getElementById('cancelModalOrderId').innerText = currentOrderData.orderId || currentOrderData.id;
    const modal = document.getElementById('cancelModal');
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('show'); }, 20);
};

window.executeCancelOrder = function() {
    const btn = document.getElementById('btnConfirmCancel');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cancelling...';
    
    setTimeout(() => {
        if(currentOrderData) {
            currentOrderData.orderStatus = 'Cancelled';
            const oId = currentOrderData.orderId || currentOrderData.id;
            
            let locallyCancelled = [];
            try {
                locallyCancelled = JSON.parse(localStorage.getItem('aavira_cancelled_orders') || '[]');
            } catch(e) {}
            
            if (!locallyCancelled.includes(oId)) {
                locallyCancelled.push(oId);
                localStorage.setItem('aavira_cancelled_orders', JSON.stringify(locallyCancelled));
            }
            
            openOrderDetails(currentOrderData.id || currentOrderData._id || currentOrderData.orderId);
            handleSearch();
        }

        closeModal('cancelModal');
        btn.innerHTML = 'Yes, Cancel Order';
        showToast("Order Cancelled Successfully!");
    }, 600);
};
