let allOrdersData = [];
let currentOrderData = null;

// 🔥 ROBUST DATE PARSER 🔥
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

// 🔥 SMART COLOR FORMATTER 🔥
function formatColor(colorVal) {
    let clr = colorVal || 'Standard';
    if(clr.match(/^https?:\/\//) || clr.includes('cloudinary.com') || clr.includes('data:image') || clr.includes('/')) {
        return 'As Shown';
    }
    return clr;
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => filterOrders('All', document.querySelector('.tab.active')), 100);
    fetchOrders();
});

async function fetchOrders() {
    const userEmail = localStorage.getItem('aavira_user_email');
    let localOrdersArray = [];
    try {
        let stored = JSON.parse(localStorage.getItem('aavira_placed_orders'));
        if (Array.isArray(stored)) localOrdersArray = stored;
    } catch(e) {}

    try {
        const response = await fetch(`https://ssxpq15in.vercel.app/api/orders?nocache=${new Date().getTime()}`);
        const result = await response.json();
        
        document.getElementById('loader').style.display = 'none';

        if (response.ok && result.status === "success" && result.data) {
            const safeEmail = userEmail ? String(userEmail).trim().toLowerCase() : "";
            const safeLocalOrders = localOrdersArray.map(id => String(id).trim().toUpperCase());

            // 🔥 100% STRICT SECURITY - No Demo Bypass 🔥
            if (safeEmail === "" && safeLocalOrders.length === 0) {
                allOrdersData = [];
            } else {
                allOrdersData = result.data.filter(order => {
                    const orderEmail = order.email ? String(order.email).trim().toLowerCase() : "";
                    const orderUserEmail = order.userEmail ? String(order.userEmail).trim().toLowerCase() : "";
                    const matchEmail = safeEmail !== "" && (orderEmail === safeEmail || orderUserEmail === safeEmail);
                    
                    const safeOrderId = order.orderId ? String(order.orderId).trim().toUpperCase() : String(order.id).trim().toUpperCase();
                    const matchLocalId = safeLocalOrders.includes(safeOrderId);
                    
                    return matchEmail || matchLocalId;
                });
            }
            
            // Override Local Cancellations
            let locallyCancelled = JSON.parse(localStorage.getItem('aavira_cancelled_orders')) || [];
            allOrdersData.forEach(o => {
                if(locallyCancelled.includes(o.orderId)) {
                    o.orderStatus = 'Cancelled';
                }
            });

            allOrdersData.sort((a,b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt));

            if (allOrdersData.length === 0) {
                document.getElementById('emptyState').style.display = 'flex';
            } else {
                renderOrdersUI(allOrdersData);
            }
        } else {
            document.getElementById('emptyState').style.display = 'flex';
        }
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
    }
}

window.filterOrders = function(status, btnElement) {
    if (!btnElement) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btnElement.classList.add('active');
    
    const indicator = document.getElementById('tabIndicator');
    if (indicator && btnElement) {
        indicator.style.width = `${btnElement.offsetWidth - 32}px`;
        indicator.style.left = `${btnElement.offsetLeft + 16}px`;
    }

    if(allOrdersData.length === 0) return;

    if(status === 'All') {
        renderOrdersUI(allOrdersData);
    } else {
        const filtered = allOrdersData.filter(o => {
            let s = o.orderStatus || 'Processing';
            if(s === 'Placed' || s === 'Pending') s = 'Processing';
            
            if(status === 'Processing' && (s === 'Processing' || s === 'Confirmed')) return true;
            return s === status;
        });
        renderOrdersUI(filtered);
    }
}

function getSmartExpectedDate(rawDateObj, currentStatus) {
    let expected = new Date(rawDateObj.getTime());
    expected.setDate(expected.getDate() + 5); 
    
    let now = new Date();
    if (currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && expected < now) {
        expected = new Date(now.getTime());
        expected.setDate(expected.getDate() + 1); 
    }
    return expected;
}

function renderOrdersUI(ordersArray) {
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
        
        let status = order.orderStatus || "Processing"; 
        if(status === 'Placed' || status === 'Pending') status = 'Processing'; 

        let expectedDate = getSmartExpectedDate(rawDate, status);
        
        let titleStr = "Exclusive Ethnic Wear";
        let mainImg = "";
        let itemsCount = order.items ? order.items.length : 1;

        if(order.items && order.items.length > 0) {
            mainImg = order.items[0].image || "";
            titleStr = order.items[0].name || titleStr;
        }

        const total = order.totalAmount || order.total || 0;
        const orderId = order.orderId || '#AVF' + Math.floor(Math.random()*10000);
        
        let statusClass = "st-Processing";
        let bottomLine = `<i class="fa-solid fa-truck"></i> Expected by ${formatDateOnly(expectedDate)}, 9:00 PM`;
        
        if(status === 'Confirmed') statusClass = 'st-Confirmed';
        if(status === 'Shipped') statusClass = 'st-Shipped';
        if(status === 'Out for Delivery') statusClass = 'st-OutforDelivery';
        if(status === 'Delivered') { 
            statusClass = 'st-Delivered'; 
            bottomLine = `<i class="fa-solid fa-circle-check" style="color:var(--status-green);"></i> Delivered on ${displayDate}`; 
        }
        if(status === 'Cancelled') { 
            statusClass = 'st-Cancelled'; 
            bottomLine = `<i class="fa-solid fa-circle-xmark" style="color:var(--status-gray);"></i> Cancelled on ${displayDate}`; 
        }

        let delay = index * 0.1;
        const imgTag = mainImg ? `<img src="${mainImg}" class="oc-img" alt="Product" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : `<img style="display:none;">`;

        const html = `
            <div class="order-card" style="animation-delay: ${delay}s" onclick="openOrderDetails('${order.id}')">
                <div class="oc-top">
                    <div class="img-wrapper">
                        ${imgTag}
                        <div class="oc-img-fallback" style="display:${mainImg?'none':'flex'};"><i class="fa-solid fa-shirt"></i></div>
                    </div>
                    <div class="oc-info">
                        <div class="oc-header">
                            <div style="flex:1;">
                                <div class="oc-label">Order ID</div>
                                <div class="oc-id">${orderId}</div>
                            </div>
                            <div class="status-badge ${statusClass}">${status}</div>
                        </div>
                        <div class="oc-meta">${displayDate} • ${itemsCount} Item${itemsCount>1?'s':''}</div>
                        <div class="oc-price">₹${Number(total).toLocaleString('en-IN')}.00</div>
                    </div>
                </div>
                <div class="oc-divider"></div>
                <div class="oc-bottom">
                    <div>${bottomLine}</div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc;"></i>
                </div>
            </div>
        `;
        wrapper.innerHTML += html;
    });
    
    wrapper.innerHTML += `<div style="text-align:center; font-size:12px; font-weight:600; color:var(--text-light); margin: 24px 0;">That's all your orders</div>`;
}

// ==========================================
// ORDER DETAILS SLIDE IN LOGIC
// ==========================================
window.openOrderDetails = function(internalId) {
    const order = allOrdersData.find(o => o.id === internalId);
    if(!order) return;
    currentOrderData = order;

    let rawDate = parseOrderDate(order.createdAt);
    let status = order.orderStatus || "Processing"; 
    if(status === 'Placed' || status === 'Pending') status = 'Processing';
    
    let expectedDate = getSmartExpectedDate(rawDate, status);

    document.getElementById('dtOrderId').innerText = order.orderId;
    document.getElementById('dtDate').innerText = `Placed on ${formatDateTime(rawDate)}`;
    
    let statusClass = "st-Processing";
    if(status === 'Confirmed') statusClass = 'st-Confirmed';
    if(status === 'Shipped') statusClass = 'st-Shipped';
    if(status === 'Out for Delivery') statusClass = 'st-OutforDelivery';
    if(status === 'Delivered') statusClass = 'st-Delivered';
    if(status === 'Cancelled') statusClass = 'st-Cancelled';
    
    let badge = document.getElementById('dtStatusBadge');
    badge.className = `status-badge ${statusClass}`;
    badge.innerText = status;

    let itmName = "Exclusive Ethnic Wear";
    if(order.items && order.items.length > 0) {
        let itm = order.items[0];
        itmName = itm.name || itmName;
        
        let imgEl = document.getElementById('dtImg');
        let fbEl = document.getElementById('dtImgFallback');
        if(itm.image) {
            imgEl.src = itm.image;
            imgEl.style.display = 'block';
            fbEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            fbEl.style.display = 'flex';
        }
        
        document.getElementById('dtName').innerText = itmName;
        
        let smartColor = formatColor(itm.color);
        document.getElementById('dtMeta').innerText = `Size: ${itm.size||'Free Size'} | Color: ${smartColor}`;
        
        document.getElementById('dtQty').innerText = `Qty: ${itm.qty||1}`;
    }

    let total = order.totalAmount || 0;
    let ship = total > 1500 ? 0 : 40; 
    let sub = total - ship;
    document.getElementById('dtPrice').innerText = `₹${Number(total).toLocaleString('en-IN')}.00`;
    document.getElementById('dtSubtotal').innerText = `₹${Number(sub).toLocaleString('en-IN')}.00`;
    document.getElementById('dtTotal').innerText = `₹${Number(total).toLocaleString('en-IN')}.00`;
    
    let disc = order.promoDiscount || 0;
    if(disc > 0) document.getElementById('dtDiscount').innerText = `- ₹${Number(disc).toLocaleString('en-IN')}.00`;
    else document.getElementById('dtDiscount').innerText = `- ₹0.00`;

    document.getElementById('dtAddressName').innerText = order.customerName || "Customer";
    document.getElementById('dtAddressFull').innerText = order.address || "Address not provided";
    document.getElementById('dtAddressPhone').innerText = `Phone: ${order.phone || "N/A"}`;

    // 🔥 CANCEL BUTTON ONLY ON DETAILS PAGE 🔥
    const dtCancelBtn = document.getElementById('dtCancelBtn');
    if(['Placed', 'Pending', 'Processing', 'Confirmed'].includes(status)) {
        dtCancelBtn.style.display = 'flex';
    } else {
        dtCancelBtn.style.display = 'none';
    }

    generateAdvancedTimeline(status, rawDate, expectedDate);

    document.getElementById('detailsView').classList.add('show');
}

window.closeOrderDetails = function() {
    document.getElementById('detailsView').classList.remove('show');
}

function generateAdvancedTimeline(status, rawDate, expDate) {
    const tlContainer = document.getElementById('dtStepsContainer');
    const expBox = document.getElementById('dtExpectedBox');
    const progressLine = document.getElementById('tlProgress');
    progressLine.style.height = '0%'; 
    
    if(status === 'Delivered') {
        expBox.style.background = 'var(--status-green-light)';
        expBox.innerHTML = `<i class="fa-solid fa-gift" style="color:var(--status-green);"></i><div><p style="color:var(--status-green);">Status</p><h4 style="color:var(--status-green);">Delivered Successfully</h4></div>`;
    } else if(status === 'Cancelled') {
        expBox.style.background = 'var(--status-gray-light)';
        expBox.innerHTML = `<i class="fa-solid fa-ban" style="color:var(--status-gray);"></i><div><p style="color:var(--status-gray);">Status</p><h4 style="color:var(--status-gray);">Order Cancelled</h4></div>`;
    } else {
        expBox.style.background = 'var(--primary-light)';
        expBox.innerHTML = `<i class="fa-solid fa-truck-fast" style="color:var(--primary);"></i><div><p>Expected Delivery</p><h4 style="color:var(--text-dark);">${formatDateOnly(expDate)} <br><span style="font-size:11px; font-weight:500; color:var(--text-muted);">By 9:00 PM</span></h4></div>`;
    }

    const stepsData = [
        { id: 'Processing', title: 'Order Processing', desc: 'We are processing your order.' },
        { id: 'Confirmed', title: 'Order Confirmed', desc: 'Your order has been confirmed.' }, 
        { id: 'Shipped', title: 'Shipped', desc: 'Your order has been shipped.' },
        { id: 'Out for Delivery', title: 'Out for Delivery', desc: 'Your order is out for delivery.' },
        { id: 'Delivered', title: 'Delivered', desc: 'Your order will be delivered soon.' }
    ];

    let html = '';
    
    if(status === 'Cancelled') {
        html += getStepHtml(true, false, 'Order Processing', 'We verified your order.', formatDateTime(rawDate));
        html += getStepHtml(false, true, 'Cancelled', 'Your order has been cancelled.', 'N/A', true);
        setTimeout(() => progressLine.style.height = '25%', 400);
    } else {
        let currentIdx = 0; 
        if(status === 'Confirmed') currentIdx = 1;
        if(status === 'Shipped') currentIdx = 2;
        if(status === 'Out for Delivery') currentIdx = 3;
        if(status === 'Delivered') currentIdx = 4;

        let heightPercentage = (currentIdx / (stepsData.length - 1)) * 100;
        setTimeout(() => progressLine.style.height = `${heightPercentage}%`, 400);

        stepsData.forEach((step, index) => {
            let isDone = index < currentIdx;
            let isCurrent = index === currentIdx;
            
            let stepDate = new Date(rawDate.getTime());
            stepDate.setDate(stepDate.getDate() + Math.floor(index * 1.5)); 
            if(index === 1) stepDate.setHours(stepDate.getHours() + 5); 
            
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
        if(isCancel) { iconClass = 'pending'; iconMarkup = '<i class="fa-solid fa-xmark" style="color:var(--error);"></i>'; } 
        else { iconMarkup = '<i class="fa-solid fa-check"></i>'; }
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

window.copyOrderId = function() {
    if(!currentOrderData) return;
    try {
        navigator.clipboard.writeText(currentOrderData.orderId);
        const toast = document.getElementById('toastMsg');
        toast.innerText = "Order ID Copied!";
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    } catch(e) {}
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('show');
    setTimeout(() => { document.getElementById(id).style.display = 'none'; }, 400);
}

window.openWhatsApp = function() {
    if(!currentOrderData) return;
    let title = currentOrderData.items && currentOrderData.items.length > 0 ? currentOrderData.items[0].name : "Product";
    let msg = `Hi Aavira Support,\n\nI need help regarding my Order: *${currentOrderData.orderId}*.\nProduct: ${title}\n\nPlease assist me.`;
    window.open(`https://wa.me/919608720622?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// DIRECT CANCEL ORDER FLOW
// ==========================================
window.triggerCancelOrder = function() {
    if(!currentOrderData) return;
    document.getElementById('cancelModalOrderId').innerText = currentOrderData.orderId;
    document.getElementById('cancelModal').style.display = 'flex';
    setTimeout(() => { document.getElementById('cancelModal').classList.add('show'); }, 50);
}

window.executeCancelOrder = function() {
    const btn = document.getElementById('btnConfirmCancel');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cancelling...';
    
    setTimeout(() => {
        currentOrderData.orderStatus = 'Cancelled';
        
        let locallyCancelled = JSON.parse(localStorage.getItem('aavira_cancelled_orders')) || [];
        if (!locallyCancelled.includes(currentOrderData.orderId)) {
            locallyCancelled.push(currentOrderData.orderId);
            localStorage.setItem('aavira_cancelled_orders', JSON.stringify(locallyCancelled));
        }
        
        if(document.getElementById('detailsView').classList.contains('show')) {
            openOrderDetails(currentOrderData.id);
        }
        const activeTab = document.querySelector('.tab.active');
        if(activeTab) filterOrders(activeTab.innerText.trim(), activeTab);

        closeModal('cancelModal');
        btn.innerHTML = 'Yes, Cancel Order';
        
        const toast = document.getElementById('toastMsg');
        toast.innerText = "Order Cancelled Successfully!";
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
        
    }, 800);
}
