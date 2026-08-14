// 🔥 FIREBASE MODULE FOR SUPPORT QUERIES 🔥
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Primary Firebase logic
const primaryConfig = {
    apiKey: "AIzaSyCMGx6C5_al22KjCmdhGVKugJoR2UmZ1Ng",
    authDomain: "aavira-co-in.firebaseapp.com",
    projectId: "aavira-co-in",
    storageBucket: "aavira-co-in.firebasestorage.app",
    messagingSenderId: "247971292356",
    appId: "1:247971292356:web:82780c6dffe9ba530f9591"
};
const app = initializeApp(primaryConfig, "supportApp");
const db = getFirestore(app);

window.submitHelpQueryToFirebase = async function(text) {
    try {
        const { orderId, cleanName } = window.currentHelpContext;
        const userEmail = localStorage.getItem('aavira_user_email') || 'Guest';
        const userName = localStorage.getItem('aavira_display_name') || 'Guest';
        
        await addDoc(collection(db, "support_queries"), {
            orderId: orderId,
            productName: cleanName,
            userEmail: userEmail,
            userName: userName,
            message: text,
            status: "Pending",
            createdAt: serverTimestamp()
        });
    } catch(e) {
        console.error("Firebase Support Query Error:", e);
        throw e;
    }
}


// ✨ CORE JAVASCRIPT LOGIC ✨
document.addEventListener('DOMContentLoaded', () => {
    window.checkAuthAndLoadOrders();
});

window.checkAuthAndLoadOrders = function() {
    const userEmail = localStorage.getItem('aavira_user_email');
    
    let localOrdersArray = [];
    try {
        let stored = JSON.parse(localStorage.getItem('aavira_placed_orders'));
        if (Array.isArray(stored)) { localOrdersArray = stored; }
    } catch(e) { localOrdersArray = []; }
    
    document.getElementById('loadingView').style.display = 'block';
    document.getElementById('emptyOrdersView').style.display = 'none';
    document.getElementById('ordersContainer').style.display = 'none';
    document.getElementById('guestSyncBanner').style.display = 'none';

    if (!userEmail && localOrdersArray.length === 0) {
        document.getElementById('loadingView').style.display = 'none';
        document.getElementById('emptyOrdersView').style.display = 'flex';
        document.getElementById('emptyStateText').innerText = "You haven't placed any orders yet. Discover our premium ethnic collection today!";
    } else {
        fetchOrdersFromVercel(userEmail, localOrdersArray);
    }
}

async function fetchOrdersFromVercel(email, localOrdersArray) {
    try {
        const VERCEL_URL = "https://ssxpq15in.vercel.app";
        const response = await fetch(`${VERCEL_URL}/api/orders?nocache=${new Date().getTime()}`);
        const textResponse = await response.text();
        
        let result;
        try { result = JSON.parse(textResponse); } 
        catch (err) {
            document.getElementById('loadingView').style.display = 'none';
            document.getElementById('emptyOrdersView').style.display = 'flex';
            return;
        }
        
        document.getElementById('loadingView').style.display = 'none';

        if (response.ok && result.status === "success" && result.data && result.data.length > 0) {
            const safeEmail = email ? String(email).trim().toLowerCase() : "";
            const safeLocalOrders = localOrdersArray.map(id => String(id).trim().toUpperCase());

            let myOrders = result.data.filter(order => {
                const orderEmail = order.email ? String(order.email).trim().toLowerCase() : "";
                const orderUserEmail = order.userEmail ? String(order.userEmail).trim().toLowerCase() : "";
                const matchEmail = safeEmail !== "" && (orderEmail === safeEmail || orderUserEmail === safeEmail);
                
                const safeOrderId = order.orderId ? String(order.orderId).trim().toUpperCase() : String(order.id).trim().toUpperCase();
                const matchLocalId = safeLocalOrders.includes(safeOrderId);
                
                return matchEmail || matchLocalId;
            });
            
            if (myOrders.length === 0) {
                document.getElementById('emptyOrdersView').style.display = 'flex';
                return;
            }

            if (!email && myOrders.length > 0) {
                document.getElementById('guestSyncBanner').style.display = 'flex';
            }

            renderOrdersUI(myOrders);

        } else {
            document.getElementById('emptyOrdersView').style.display = 'flex';
        }
    } catch (error) {
        document.getElementById('loadingView').style.display = 'none';
        document.getElementById('emptyOrdersView').style.display = 'flex';
    }
}

function renderOrdersUI(orders) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';
    document.getElementById('emptyOrdersView').style.display = 'none';
    container.style.display = 'flex';

    orders.forEach(order => {
        let dateStr = "Processing...";
        if (order.createdAt) {
            let orderDate = new Date();
            if (order.createdAt._seconds) {
                orderDate = new Date(order.createdAt._seconds * 1000);
            } else if (order.createdAt.seconds) {
                orderDate = new Date(order.createdAt.seconds * 1000);
            } else {
                orderDate = new Date(order.createdAt);
            }
            dateStr = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        let mainImg = "https://via.placeholder.com/150";
        let titleStr = "Premium Items";
        let metaStr = "0 Item(s)";

        if(order.items && order.items.length > 0) {
            mainImg = order.items[0].image || mainImg;
            titleStr = order.items[0].name;
            metaStr = `${order.items.length} Item(s)`;
            if(order.items.length > 1) {
                titleStr += ` <span style="color:var(--primary); font-weight:700;">+${order.items.length - 1} more</span>`;
            }
        }

        const total = order.totalAmount || order.total || 0;
        const status = order.orderStatus || "Placed"; 
        const method = order.paymentMethod ? order.paymentMethod.toUpperCase() : "PREPAID";
        const orderId = order.orderId || '#AAV-' + Math.floor(Math.random()*10000);
        
        // Safe title for HTML injection
        const safeTitle = encodeURIComponent(titleStr);

        // 🔥 ADVANCED HELP & TRACKING BUTTONS 🔥
        const cardHtml = `
            <div class="order-card" data-status="${status}">
                <div class="o-header">
                    <div>
                        <div class="o-id">${orderId}</div>
                        <div class="o-date">Placed on ${dateStr}</div>
                    </div>
                    <div class="o-status status-${status}">${status}</div>
                </div>
                
                <div class="o-body">
                    <div class="o-img" style="background-image: url('${mainImg}');"></div>
                    <div class="o-details">
                        <h4 class="o-title">${titleStr}</h4>
                        <p class="o-meta">${metaStr} | ${method}</p>
                    </div>
                </div>

                <div class="o-footer">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="o-total">Total Amount <span>₹${Number(total).toLocaleString('en-IN')}</span></div>
                    </div>
                    <div class="action-row">
                        <button type="button" class="help-btn" onclick="openHelpModal('${orderId}', '${safeTitle}', '${mainImg}')">
                            <i class="fa-solid fa-headset"></i> Need Help
                        </button>
                        <button type="button" class="track-btn" onclick="openTrackingModal('${orderId}', '${status}', '${dateStr}')">
                            Track <i class="fa-solid fa-satellite-dish"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// ==========================================
// ✨ NEED HELP MODAL & WHATSAPP LOGIC ✨
// ==========================================
window.currentHelpContext = {};

window.openHelpModal = function(orderId, encodedName, imageUrl) {
    window.currentHelpContext = { orderId, encodedName, imageUrl };
    document.getElementById('helpOrderId').innerText = orderId;
    
    // Clean up the name (remove HTML tags like +2 more span)
    let decodedName = decodeURIComponent(encodedName);
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedName;
    let cleanName = tempDiv.textContent || tempDiv.innerText || "";
    window.currentHelpContext.cleanName = cleanName;
    
    document.getElementById('helpProductName').innerText = cleanName;
    document.getElementById('helpProductImg').src = imageUrl;
    document.getElementById('helpQueryText').value = '';
    
    document.getElementById('helpModal').style.display = 'flex';
    setTimeout(() => document.getElementById('helpModal').classList.add('show'), 10);
}

window.closeHelpModal = function() {
    document.getElementById('helpModal').classList.remove('show');
    setTimeout(() => document.getElementById('helpModal').style.display = 'none', 300);
}

window.openWhatsAppHelp = function() {
    const { orderId, cleanName } = window.currentHelpContext;
    const text = document.getElementById('helpQueryText').value.trim();
    let msg = `Hi Aavira Support,\n\nI need help regarding my Order: *${orderId}*.\nProduct: ${cleanName}`;
    if(text) msg += `\n\nMy Query:\n${text}`;
    
    const waUrl = `https://wa.me/919608720622?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
}

window.submitHelpQuery = async function() {
    const text = document.getElementById('helpQueryText').value.trim();
    if(!text) { alert("Please describe your issue."); return; }
    
    const btn = document.getElementById('btnSubmitHelp');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    // Trigger the Firebase module function
    if(typeof window.submitHelpQueryToFirebase === 'function') {
        await window.submitHelpQueryToFirebase(text);
        alert("Your request has been submitted to Support. We will contact you soon.");
        closeHelpModal();
    } else {
        alert("System error. Please use WhatsApp instead.");
    }
    btn.innerHTML = 'Submit Request';
    btn.disabled = false;
}

// ==========================================
// PREMIUM TRACKING TIMELINE MODAL 
// ==========================================
window.openTrackingModal = function(orderId, status, dateStr) {
    document.getElementById('trackOrderIdTxt').innerText = orderId;
    const container = document.getElementById('trackingTimelineContainer');
    
    let placedDate = new Date(dateStr);
    if(isNaN(placedDate)) placedDate = new Date();
    let estDate = new Date(placedDate);
    estDate.setDate(estDate.getDate() + 5);
    let estDateStr = estDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if(status === 'Delivered') {
        document.getElementById('estTitleText').innerText = "Status";
        document.getElementById('estDateText').innerText = "Delivered Successfully";
        document.getElementById('estDateText').style.color = "var(--success)";
    } else if (status === 'Cancelled') {
        document.getElementById('estTitleText').innerText = "Status";
        document.getElementById('estDateText').innerText = "Order Cancelled";
        document.getElementById('estDateText').style.color = "var(--error)";
    } else {
        document.getElementById('estTitleText').innerText = "Estimated Delivery";
        document.getElementById('estDateText').innerText = estDateStr;
        document.getElementById('estDateText').style.color = "var(--primary)";
    }

    const steps = [
        { name: "Order Placed", icon: "fa-solid fa-clipboard-check", desc: "We have received your order" },
        { name: "Processing", icon: "fa-solid fa-box-open", desc: "Your order is being packed" },
        { name: "Shipped", icon: "fa-solid fa-truck-fast", desc: "Order is on the way" },
        { name: "Delivered", icon: "fa-solid fa-house-circle-check", desc: "Package delivered to you" }
    ];

    let timelineHtml = '';

    if (status === 'Cancelled') {
        timelineHtml += `
            <div class="step completed">
                <div class="step-icon"><i class="fa-solid fa-check"></i></div>
                <div class="step-text"><h4>Order Placed</h4><p>${dateStr}</p></div>
            </div>
            <div class="step cancelled current">
                <div class="step-icon"><i class="fa-solid fa-xmark"></i></div>
                <div class="step-text"><h4>Order Cancelled</h4><p>Your order has been cancelled</p></div>
            </div>
        `;
    } else {
        let mappedStatus = status;
        if(status === 'Placed') mappedStatus = 'Order Placed';
        
        let currentIndex = steps.findIndex(s => s.name === mappedStatus);
        if (currentIndex === -1) currentIndex = 0; 

        steps.forEach((step, idx) => {
            let stepClass = '';
            let iconHtml = `<i class="${step.icon}"></i>`;
            let descText = step.desc;

            if (idx < currentIndex) {
                stepClass = 'completed';
                iconHtml = `<i class="fa-solid fa-check"></i>`;
                descText = "Successfully Completed";
            } else if (idx === currentIndex) {
                stepClass = 'current';
                descText = "Currently Active";
            }

            if(idx === 0) descText = dateStr; 

            timelineHtml += `
            <div class="step ${stepClass}">
                <div class="step-icon">${iconHtml}</div>
                <div class="step-text">
                    <h4>${step.name}</h4>
                    <p>${descText}</p>
                </div>
            </div>`;
        });
    }
    
    container.innerHTML = timelineHtml;
    
    document.getElementById('trackingModal').style.display = 'flex';
    setTimeout(() => { document.getElementById('trackingModal').classList.add('show'); }, 10);
}

window.closeTrackingModal = function() {
    document.getElementById('trackingModal').classList.remove('show');
    setTimeout(() => { document.getElementById('trackingModal').style.display = 'none'; }, 300);
}

// ==========================================
// LOGIN MODAL LOGIC 
// ==========================================
let tempSignupData = { name: "", email: "", pwd: "" };

window.clearAuthInputs = function() {
    ['signupName', 'signupEmail', 'signupPassword', 'loginEmail', 'loginPassword', 'otpInput'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}
window.toggleAuthView = function(viewMode) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none'; 
    document.getElementById('otpView').style.display = 'none';
    document.getElementById(viewMode + 'View').style.display = 'block';
    
    const titleEl = document.getElementById('authTitle');
    if(viewMode === 'signup') titleEl.innerText = 'Create Account';
    if(viewMode === 'login') titleEl.innerText = 'Welcome Back';
    if(viewMode === 'otp') titleEl.innerText = 'Verify OTP';
}
window.openLoginModal = function() {
    window.clearAuthInputs(); 
    document.getElementById('loginModal').style.display = 'flex'; 
    document.body.style.overflow = 'hidden'; 
    window.toggleAuthView('signup');
    setTimeout(() => { document.getElementById('loginModal').classList.add('show'); }, 10);
}
window.closeLoginModal = function() {
    document.getElementById('loginModal').classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => { document.getElementById('loginModal').style.display = 'none'; window.clearAuthInputs(); }, 300);
}

window.processSignup = async function() {
    const name = document.getElementById('signupName').value.trim(); const email = document.getElementById('signupEmail').value.trim(); const pwd = document.getElementById('signupPassword').value.trim();
    if(!name || !email || !pwd) { alert("Please fill all fields!"); return; }
    const btn = document.getElementById('btnSignupAction'); btn.innerHTML = 'Processing...'; btn.disabled = true;
    try {
        const checkRes = await window.DeliveryBoy.checkEmailExists(email);
        if (checkRes && checkRes.exists) { alert("Email already registered. Please Login."); window.toggleAuthView('login'); btn.innerHTML = 'Get Secure OTP'; btn.disabled = false; return; }
    } catch(e) {}
    tempSignupData = { name, email, pwd };
    try {
        const result = await window.DeliveryBoy.sendOTP(email, name);
        if(result && result.ok && result.data && result.data.success) { document.getElementById('otpSubText').innerText = `Code sent to ${email}`; window.toggleAuthView('otp'); } 
        else alert("Failed to send OTP.");
    } catch (error) { alert("Network Error!"); }
    btn.innerHTML = 'Get Secure OTP'; btn.disabled = false;
}

window.verifySignupOTP = async function() {
    const otpVal = document.getElementById('otpInput').value.trim();
    if(otpVal.length !== 6) { alert("Enter 6-digit OTP!"); return; }
    const vBtn = document.getElementById('btnOtpAction'); vBtn.innerHTML = 'Finalizing...'; vBtn.disabled = true;
    try {
        const result = await window.DeliveryBoy.verifyOTP(tempSignupData.email, otpVal, tempSignupData.name, tempSignupData.pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', tempSignupData.name); localStorage.setItem('aavira_user_email', tempSignupData.email);
            alert("Verified Successfully!"); window.closeLoginModal(); 
            checkAuthAndLoadOrders(); 
        } else alert("Invalid OTP!");
    } catch (error) { alert("Network Error!"); }
    vBtn.innerHTML = 'Verify & Login'; vBtn.disabled = false; 
}

window.processLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim(); const pwd = document.getElementById('loginPassword').value.trim();
    if(!email || !pwd) { alert("Fields required!"); return; }
    const btn = document.getElementById('btnLoginAction'); btn.innerHTML = 'Checking...'; btn.disabled = true;
    try {
        const result = await window.DeliveryBoy.login(email, pwd);
        if(result && result.ok && result.data && result.data.success) {
            localStorage.setItem('aavira_display_name', result.data.userName); localStorage.setItem('aavira_user_email', email);
            alert("Login Successful!"); window.closeLoginModal(); 
            checkAuthAndLoadOrders(); 
        } else alert("Invalid Email or Password.");
    } catch(e) { alert("Network Error!"); }
    btn.innerHTML = 'Secure Login'; btn.disabled = false;
}
