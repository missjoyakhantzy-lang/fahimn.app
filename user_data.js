// user_data.js
// Is file ka kaam sirf Vercel se data laana hai, HTML ko design karna nahi.

window.getVercelData = async function() {
    try {
        const response = await fetch("https://server-js-bay.vercel.app/api/products");
        const result = await response.json();
        
        if (result.status === "success") {
            return result.data; // Yeh array wapas bhej diya script.js ko
        } else {
            return []; // Error par khali list
        }
    } catch (error) {
        console.error("Vercel Fetch Error:", error);
        return [];
    }
};
