// ==========================================
// user_data.js (DATA PROVIDER)
// ==========================================

const VERCEL_URL = "https://server-js-bay.vercel.app";

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

// 3. Categories lane ka function (Gol-Gol images ke liye)
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

// 4. Order Data Vercel par bhejne ka function (Checkout ke liye)
window.sendOrderToVercel = async function(orderPayload) {
    try {
        // Yahan tumhara order data aayega. 
        // Abhi ke liye yeh successfully pass ho jayega taaki app na ruke.
        console.log("Order Data Ready:", orderPayload);
        return true;
    } catch (error) {
        console.error("Order Send Error:", error);
        throw error;
    }
};

// 5. Auth Functions (Jab Vercel par login banega tab isme code likhenge)
window.checkUserLogin = async function() {
    // Abhi ke liye null return karega (Yani sab Guest User hain)
    return null; 
};

window.logoutUser = function() {
    console.log("User Logged Out");
};
