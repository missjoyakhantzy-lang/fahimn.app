// Aapka Vercel Backend URL
const backendURL = "https://server-js-bay.vercel.app";

// Data fetch karne ka function
async function loadPublicProducts() {
    const productGrid = document.getElementById('public-product-grid');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Agar HTML mein yeh id na mile toh code crash hone se bachane ke liye
    if (!productGrid || !loadingSpinner) {
        console.error("HTML elements missing! Ensure 'public-product-grid' and 'loading-spinner' IDs exist in your HTML.");
        return;
    }

    try {
        // Vercel se sirf products ka data maang rahe hain
        const response = await fetch(`${backendURL}/api/products`);
        const result = await response.json();

        if (result.status === "success") {
            const products = result.data;
            let htmlContent = '';

            if (products.length === 0) {
                htmlContent = `<div class="col-12 text-center text-muted">No products available right now.</div>`;
            } else {
                // Har product ka ek sundar card banana
                products.forEach(product => {
                    // Agar photo nahi hai toh ek default placeholder dikhega
                    const imageUrl = product.imageMain || product.image || 'https://via.placeholder.com/300x250?text=Aavira+Product';
                    
                    htmlContent += `
                        <div class="col-md-4 col-sm-6 mb-4">
                            <div class="card h-100 product-card border-0 shadow-sm">
                                <img src="${imageUrl}" class="card-img-top product-img" alt="Product Image">
                                <div class="card-body text-center">
                                    <h6 class="card-title fw-bold text-truncate">${product.name || 'Beautiful Design'}</h6>
                                    <p class="card-text text-muted small mb-2">${product.category || 'Premium Fabric'}</p>
                                    <h5 class="text-success fw-bold">₹${product.price || '0'}</h5>
                                    <button class="btn btn-primary btn-sm w-100 mt-2">Add to Cart</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            // HTML file ke andar cards ko bhej dena
            productGrid.innerHTML = htmlContent;
        } else {
            console.error("Backend Error:", result.message);
            productGrid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load products.</div>`;
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        productGrid.innerHTML = `<div class="col-12 text-center text-danger">Server connection error!</div>`;
    } finally {
        // Loading wala text hata dena
        loadingSpinner.style.display = 'none';
    }
}

// Jaise hi HTML page load ho, yeh function apne aap chal jayega
window.onload = loadPublicProducts;
