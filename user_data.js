// ==========================================
// user_data.js (DATA PROVIDER)
// ==========================================

// 🔥 TUMHARA EXACT VERCEL URL (https:// ke sath) 🔥
const VERCEL_URL = "https://aavira-fashion-backend.vercel.app";

// 1. Products lane ka function
window.getVercelData = async function() {
    try {
        const response = await fetch(`${VERCEL_URL}/api/products`);
        const result = await response.json();
        
        if (result.status === "success") {
            return result.data; 
        } else {
            return []; 
        }
    } catch (error) {
        console.error("Vercel Fetch Error (Products):", error);
        return [];
    }
};

// 2. Banners lane ka function
window.getBannersData = async function() {
    try {
        const response = await fetch(`${VERCEL_URL}/api/banners`);
        const result = await response.json();
        
        if (result.status === "success") {
            return result.data; 
        } else {
            return [];
        }
    } catch (error) {
        console.error("Vercel Fetch Error (Banners):", error);
        return [];
    }
};

// 3. Categories lane ka function
window.getCategoriesData = async function() {
    try {
        const response = await fetch(`${VERCEL_URL}/api/categories`);
        const result = await response.json();
        
        if (result.status === "success") {
            return result.data; 
        } else {
            return [];
        }
    } catch (error) {
        console.error("Vercel Fetch Error (Categories):", error);
        return [];
    }
};

// 4. Order Data Vercel par bhejne ka function
window.sendOrderToVercel = async function(orderPayload) {
    try {
        const response = await fetch(`${VERCEL_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });
        
        if(response.ok) {
            console.log("Order successfully sent to Vercel!");
        }
        return true;
    } catch (error) {
        console.error("Order Send Error:", error);
        return true; 
    }
};

// 5. Auth Functions
window.checkUserLogin = async function() {
    return null; 
};

window.logoutUser = function() {
    console.log("User Logged Out");
};
