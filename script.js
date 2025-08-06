// Global Variables
let products = [];
let categories = [];
let cart = [];
let currentUser = null;
let allProducts = [];
let users = [];
let pageHistory = ['home-page']; // Track page history for back navigation

// JSONBin Configuration
const JSONBIN_ACCESS_KEY = '$2a$10$bxi8oJTKvRSnSmPoOiKwD.4WzU1xd.eYGIjkLK6Y/8pY6ruKM48gO'; // Replace with your actual key
const JSONBIN_BIN_ID = '689368e97b4b8670d8aec6bc'; // Replace with your actual bin ID

// DOM Elements
const pages = document.querySelectorAll('.page');
const loadingSpinner = document.getElementById('loading-spinner');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const cartCount = document.getElementById('cart-count');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUsers();
    checkUserLogin();
});

// Initialize Application
async function initializeApp() {
    showLoading();
    try {
        await loadCategories();
        await loadProducts();
        await loadFeaturedProducts();
        populateCategories();
        updateCartDisplay();
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('שגיאה בטעינת האתר', 'error');
        hideLoading();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('cart-icon').addEventListener('click', () => showPage('cart-page'));
    document.getElementById('login-btn').addEventListener('click', () => showPage('login-page'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Add event listener for user profile access
    document.getElementById('username').addEventListener('click', () => showPage('profile-page'));
    
    // Search
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    
    // Form switches
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register-page');
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login-page');
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortProducts(this.dataset.sort);
        });
    });
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Notification close
    document.querySelector('.notification-close').addEventListener('click', hideNotification);
    
    // Logo click - go to home
    document.querySelector('.logo').addEventListener('click', () => showPage('home-page'));
}

// API Functions
async function loadCategories() {
    try {
        const response = await fetch('https://dummyjson.com/products/category-list');
        categories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}

async function loadProducts(category = null) {
    try {
        let url = 'https://dummyjson.com/products';
        if (category) {
            url = `https://dummyjson.com/products/category/${category}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        products = data.products;
        allProducts = [...products];
        
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

async function loadFeaturedProducts() {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=6');
        const data = await response.json();
        displayFeaturedProducts(data.products);
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function searchProducts(query) {
    try {
        showLoading();
        const response = await fetch(`https://dummyjson.com/products/search?q=${query}`);
        const data = await response.json();
        products = data.products;
        
        document.getElementById('products-title').textContent = `תוצאות חיפוש: "${query}"`;
        displayProducts();
        showPage('products-page');
        hideLoading();
    } catch (error) {
        console.error('Error searching products:', error);
        showNotification('שגיאה בחיפוש מוצרים', 'error');
        hideLoading();
    }
}

async function getProductDetails(id) {
    try {
        const response = await fetch(`https://dummyjson.com/products/${id}`);
        const product = await response.json();
        displayProductDetails(product);
    } catch (error) {
        console.error('Error loading product details:', error);
        showNotification('שגיאה בטעינת פרטי המוצר', 'error');
    }
}

// Display Functions
function populateCategories() {
    const categoriesDropdown = document.getElementById('categories-dropdown');
    const featuredCategories = document.getElementById('featured-categories');
    
    categoriesDropdown.innerHTML = '';
    featuredCategories.innerHTML = '';
    
    // Filter to show only interesting categories
    const featuredCategoryList = [
        'smartphones', 'laptops', 'fragrances', 'skincare', 
        'womens-dresses', 'mens-shirts', 'womens-bags', 'sunglasses'
    ];
    
    categories.forEach(category => {
        // Dropdown menu
        const categoryItem = document.createElement('div');
        categoryItem.className = 'dropdown-item';
        categoryItem.textContent = translateCategory(category);
        categoryItem.addEventListener('click', () => loadCategoryProducts(category));
        categoriesDropdown.appendChild(categoryItem);
    });
    
    // Featured categories on home page - cute card style
    featuredCategoryList.forEach(category => {
        if (categories.includes(category)) {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="fas fa-${getCategoryIcon(category)}"></i>
                </div>
                <h3>${translateCategory(category)}</h3>
                <p>גלה מוצרים מדהימים</p>
            `;
            categoryCard.addEventListener('click', () => loadCategoryProducts(category));
            featuredCategories.appendChild(categoryCard);
        }
    });
}

function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function displayFeaturedProducts(products) {
    const featuredGrid = document.getElementById('featured-products');
    featuredGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        featuredGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
        <h3>${product.title}</h3>
        <p class="price">₪${product.price}</p>
        <div class="rating">
            ${generateStars(product.rating)}
            <span>(${product.rating})</span>
        </div>
        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
            <i class="fas fa-cart-plus"></i> הוסף לסל
        </button>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.add-to-cart-btn')) {
            showProductDetails(product.id);
        }
    });
    
    return card;
}

function displayProductDetails(product) {
    const container = document.querySelector('.product-details-container');
    container.innerHTML = `
        <div class="product-details-header">
            <button class="back-btn" onclick="goBack()">
                <i class="fas fa-arrow-right"></i> חזור
            </button>
        </div>
        
        <div class="product-details-content">
            <div class="product-images">
                <div class="main-image">
                    <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
                </div>
                <div class="thumbnail-images">
                    ${product.images.map(img => `
                        <img src="${img}" alt="${product.title}" 
                             onclick="document.getElementById('main-product-image').src='${img}'">
                    `).join('')}
                </div>
            </div>
            
            <div class="product-info">
                <h1>${product.title}</h1>
                <div class="product-rating">
                    ${generateStars(product.rating)}
                    <span>(${product.rating})</span>
                </div>
                <p class="product-price">₪${product.price}</p>
                <p class="product-description">${product.description}</p>
                
                <div class="product-specs">
                    <h3>מפרט טכני</h3>
                    <ul>
                        <li><strong>מותג:</strong> ${product.brand}</li>
                        <li><strong>קטגוריה:</strong> ${translateCategory(product.category)}</li>
                        <li><strong>מלאי:</strong> ${product.stock} יחידות</li>
                        ${product.dimensions ? `
                            <li><strong>משקל:</strong> ${product.dimensions.weight} ק"ג</li>
                            <li><strong>רוחב:</strong> ${product.dimensions.width} ס"מ</li>
                            <li><strong>גובה:</strong> ${product.dimensions.height} ס"מ</li>
                            <li><strong>עומק:</strong> ${product.dimensions.depth} ס"מ</li>
                        ` : ''}
                    </ul>
                </div>
                
                <div class="product-actions">
                    <button class="add-to-cart-btn large" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> הוסף לסל
                    </button>
                </div>
            </div>
        </div>
        
        <div class="product-reviews">
            <h3>ביקורות לקוחות</h3>
            <div class="reviews-list">
                ${product.reviews ? product.reviews.map(review => `
                    <div class="review">
                        <div class="review-header">
                            <strong>${review.reviewerName}</strong>
                            <div class="review-rating">${generateStars(review.rating)}</div>
                        </div>
                        <p>${review.comment}</p>
                        <small>${new Date(review.date).toLocaleDateString('he-IL')}</small>
                    </div>
                `).join('') : '<p>אין ביקורות עדיין</p>'}
            </div>
        </div>
    `;
    
    showPage('product-details');
}

// Cart Functions
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            price: product.price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveUserData();
    showNotification('המוצר נוסף לסל בהצלחה!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    displayCart();
    saveUserData();
    showNotification('המוצר הוסר מהסל', 'info');
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        updateCartDisplay();
        displayCart();
        saveUserData();
    }
}

function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (document.getElementById('cart-page').classList.contains('active')) {
        displayCart();
    }
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart empty-cart-icon"></i>
                <p>הסל ריק</p>
                <button class="continue-shopping-btn" onclick="showPage('home-page')">
                    <i class="fas fa-arrow-left"></i> המשך קניות
                </button>
            </div>
        `;
        totalPrice.textContent = '₪0.00';
        return;
    }
    
    cartItems.innerHTML = `
        <div class="cart-header">
            <button class="back-btn" onclick="goBack()">
                <i class="fas fa-arrow-right"></i> חזור לקניות
            </button>
        </div>
        ${cart.map(item => `
            <div class="cart-item">
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="item-details">
                    <h4>${item.title}</h4>
                    <p class="item-price">₪${item.price}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="item-total">₪${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('')}
    `;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `₪${total.toFixed(2)}`;
    
    document.getElementById('checkout-btn').disabled = cart.length === 0;
}

// User Management Functions
async function loadUsers() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Access-Key': JSONBIN_ACCESS_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            users = data.record.users || [];
        }
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
    }
}

async function saveUsers() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': JSONBIN_ACCESS_KEY
            },
            body: JSON.stringify({ users })
        });
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

function checkUserLogin() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
        loadUserCart();
    }
}

function updateUserInterface() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const username = document.getElementById('username');
    
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        username.textContent = currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

function loadUserCart() {
    if (currentUser && currentUser.cart) {
        cart = currentUser.cart;
        updateCartDisplay();
    }
}

function saveUserData() {
    if (currentUser) {
        currentUser.cart = cart;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update user in users array
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            saveUsers();
        }
    }
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserInterface();
        loadUserCart();
        showNotification('התחברת בהצלחה!', 'success');
        showPage('home-page');
    } else {
        showNotification('אימייל או סיסמה שגויים', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const address = document.getElementById('register-address').value;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('משתמש עם אימייל זה כבר קיים', 'error');
        return;
    }
    
    const newUser = {
        name,
        email,
        password,
        address,
        cart: [],
        orders: []
    };
    
    users.push(newUser);
    await saveUsers();
    
    showNotification('נרשמת בהצלחה! אנא התחבר', 'success');
    showPage('login-page');
}

async function handleCheckout(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('אנא התחבר לביצוע הזמנה', 'error');
        showPage('login-page');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('הסל ריק', 'error');
        return;
    }
    
    const shippingAddress = document.getElementById('shipping-address').value;
    const creditCard = document.getElementById('credit-card').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    
    // Create order
    const order = {
        id: Date.now(),
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingAddress,
        creditCard: creditCard.replace(/\d(?=\d{4})/g, '*'),
        date: new Date().toISOString(),
        status: 'confirmed'
    };
    
    // Add order to user's orders
    currentUser.orders.push(order);
    
    // Clear cart
    cart = [];
    currentUser.cart = [];
    
    // Save user data
    await saveUserData();
    
    // Clear page history and go to home
    pageHistory = ['home-page'];
    showNotification('ההזמנה בוצעה בהצלחה! המוצרים בדרך אליך', 'success');
    showPage('home-page');
    updateCartDisplay();
}

function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    updateUserInterface();
    updateCartDisplay();
    showNotification('התנתקת בהצלחה', 'info');
    showPage('home-page');
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('cart-icon').addEventListener('click', () => showPage('cart-page'));
    document.getElementById('login-btn').addEventListener('click', () => showPage('login-page'));
    document.getElementById('logout-btn').addEventListener('click', logout);

    // הוספת event listener לכפתור פרופיל משתמש
    document.getElementById('username').addEventListener('click', () => showPage('profile-page'));

    // הוספה לכפתור תשלום
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (!currentUser) {
            showNotification('עליך להתחבר כדי להמשיך לתשלום', 'error');
            showPage('login-page');
            return;
        }

        if (cart.length === 0) {
            showNotification('הסל שלך ריק', 'error');
            return;
        }

        showPage('checkout-page');
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // Form switches
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register-page');
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login-page');
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortProducts(this.dataset.sort);
        });
    });

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Notification close
    document.querySelector('.notification-close').addEventListener('click', hideNotification);

    // Logo click - go to home
    document.querySelector('.logo').addEventListener('click', () => showPage('home-page'));
}

// Utility Functions
function showPage(pageId) {
    // Add current page to history if it's not already the last page
    const currentActivePage = document.querySelector('.page.active');
    if (currentActivePage && currentActivePage.id !== pageId) {
        if (pageHistory[pageHistory.length - 1] !== currentActivePage.id) {
            pageHistory.push(currentActivePage.id);
        }
    }
    
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Load page-specific content
    if (pageId === 'cart-page') {
        displayCart();
    } else if (pageId === 'profile-page') {
        displayUserProfile();
    }
}

function showProductDetails(productId) {
    getProductDetails(productId);
}

function goBack() {
    // Go back to previous page or home if no history
    if (pageHistory.length > 1) {
        pageHistory.pop(); // Remove current page
        const previousPage = pageHistory[pageHistory.length - 1];
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(previousPage).classList.add('active');
        
        // Load page-specific content
        if (previousPage === 'cart-page') {
            displayCart();
        } else if (previousPage === 'profile-page') {
            displayUserProfile();
        }
    } else {
        showPage('home-page');
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        searchProducts(query);
    }
}

async function loadCategoryProducts(category) {
    showLoading();
    await loadProducts(category);
    document.getElementById('products-title').textContent = translateCategory(category);
    showPage('products-page');
    hideLoading();
}

function sortProducts(sortType) {
    switch (sortType) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            products.sort((a, b) => b.rating - a.rating);
            break;
        default:
            products = [...allProducts];
    }
    displayProducts();
}

function displayUserProfile() {
    if (!currentUser) {
        showPage('login-page');
        return;
    }
    
    const profileDetails = document.getElementById('profile-details');
    const ordersList = document.getElementById('orders-list');
    
    // Add back button to profile page
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer.querySelector('.back-btn')) {
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '<i class="fas fa-arrow-right"></i> חזור';
        backBtn.onclick = goBack;
        profileContainer.insertBefore(backBtn, profileContainer.firstChild);
    }
    
    profileDetails.innerHTML = `
        <p><strong>שם:</strong> ${currentUser.name}</p>
        <p><strong>אימייל:</strong> ${currentUser.email}</p>
        <p><strong>כתובת:</strong> ${currentUser.address}</p>
    `;
    
    if (currentUser.orders && currentUser.orders.length > 0) {
        ordersList.innerHTML = currentUser.orders.map(order => `
            <div class="order-item">
                <h4>הזמנה #${order.id}</h4>
                <p><strong>תאריך:</strong> ${new Date(order.date).toLocaleDateString('he-IL')}</p>
                <p><strong>סטטוס:</strong> ${order.status === 'confirmed' ? 'אושר' : order.status}</p>
                <p><strong>סכום:</strong> ₪${order.total.toFixed(2)}</p>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-product">
                            <img src="${item.thumbnail}" alt="${item.title}">
                            <span>${item.title} x${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } else {
        ordersList.innerHTML = '<p>אין הזמנות קודמות</p>';
    }
}

function setupEventListeners() {
    // Navigation
    document.getElementById('cart-icon').addEventListener('click', () => showPage('cart-page'));
    document.getElementById('login-btn').addEventListener('click', () => showPage('login-page'));
    document.getElementById('logout-btn').addEventListener('click', logout);

    // הוספת event listener לכפתור פרופיל משתמש
    document.getElementById('username').addEventListener('click', () => showPage('profile-page'));

    // הוספה לכפתור תשלום
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (!currentUser) {
            showNotification('עליך להתחבר כדי להמשיך לתשלום', 'error');
            showPage('login-page');
            return;
        }

        if (cart.length === 0) {
            showNotification('הסל שלך ריק', 'error');
            return;
        }

        showPage('checkout-page');
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // Form switches
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register-page');
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login-page');
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortProducts(this.dataset.sort);
        });
    });

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Notification close
    document.querySelector('.notification-close').addEventListener('click', hideNotification);

    // Logo click - go to home
    document.querySelector('.logo').addEventListener('click', () => showPage('home-page'));
}

// Helper Functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    notification.classList.remove('show');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function translateCategory(category) {
    const translations = {
        'smartphones': 'סמארטפונים',
        'laptops': 'מחשבים ניידים',
        'fragrances': 'בשמים',
        'skincare': 'טיפוח עור',
        'groceries': 'מזון',
        'home-decoration': 'עיצוב הבית',
        'furniture': 'רהיטים',
        'tops': 'חולצות',
        'womens-dresses': 'שמלות נשים',
        'womens-shoes': 'נעלי נשים',
        'mens-shirts': 'חולצות גברים',
        'mens-shoes': 'נעלי גברים',
        'mens-watches': 'שעוני גברים',
        'womens-watches': 'שעוני נשים',
        'womens-bags': 'תיקי נשים',
        'womens-jewellery': 'תכשיטי נשים',
        'sunglasses': 'משקפי שמש',
        'automotive': 'רכב',
        'motorcycle': 'אופנועים',
        'lighting': 'תאורה'
    };
    
    return translations[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'smartphones': 'mobile-alt',
        'laptops': 'laptop',
        'fragrances': 'spray-can',
        'skincare': 'leaf',
        'groceries': 'shopping-basket',
        'home-decoration': 'home',
        'furniture': 'couch',
        'tops': 'tshirt',
        'womens-dresses': 'female',
        'womens-shoes': 'shoe-prints',
        'mens-shirts': 'male',
        'mens-shoes': 'shoe-prints',
        'mens-watches': 'clock',
        'womens-watches': 'clock',
        'womens-bags': 'handbag',
        'womens-jewellery': 'gem',
        'sunglasses': 'glasses',
        'automotive': 'car',
        'motorcycle': 'motorcycle',
        'lighting': 'lightbulb'
    };
    
    return icons[category] || 'tag';
}