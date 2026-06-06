// ==========================================
// user_data.js (DATA PROVIDER)
// ==========================================

const VERSEL_URL = "https://server-js-bay.vercel.app";

// 1. Products lane ka function
window.getVercelData = async function() {
    try {
        const response = await fetch(`${VERSEL_URL}/api/products`);
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

// 2. Banners lane ka function (Naya Add Kiya)
window.getBannersData = async function() {
    try {
        const response = await fetch(`${VERSEL_URL}/api/banners`);
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

// 3. Auth Functions (Jab Vercel par login banega tab isme code likhenge)
window.checkUserLogin = async function() {
    // Abhi ke liye null return karega (Yani sab Guest User hain)
    return null; 
};

window.logoutUser = function() {
    console.log("User Logged Out");
};
