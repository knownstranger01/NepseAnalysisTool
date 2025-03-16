// DOM लोड भएपछि कोड चलाउनुहोस्
document.addEventListener('DOMContentLoaded', function() {
    // भाषा स्विचर
    initLanguageSwitcher();
    
    // मेनु टगल
    initMenuToggle();
    
    // स्क्रोल टप बटन
    initScrollTopButton();
    
    // लगइन स्टेटस जाँच
    checkLoginStatus();
    
    // सक्रिय मेनु आइटम हाइलाइट गर्नुहोस्
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (currentPage === linkPage || 
            (currentPage === '' && linkPage === 'index.html') || 
            (currentPage === '/' && linkPage === 'index.html') ||
            (currentPage === 'index-en.html' && linkPage === 'index.html') ||
            (currentPage === 'companies-en.html' && linkPage === 'companies.html') ||
            (currentPage === 'analysis-en.html' && linkPage === 'analysis.html') ||
            (currentPage === 'about-en.html' && linkPage === 'about.html')) {
            link.classList.add('active');
        }
    });
    
    // स्क्रोल गर्दा हेडर स्टाइल परिवर्तन गर्नुहोस्
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // खोज कार्यक्षमता
    const searchBox = document.querySelector('.search-box');
    
    if (searchBox) {
        const searchInput = searchBox.querySelector('input');
        const searchButton = searchBox.querySelector('button');
        
        searchButton.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
    }
});

// खोज फंक्सन
function performSearch(query) {
    if (!query.trim()) return;
    
    // खोज क्वेरी URL मा थप्ने
    window.location.href = `companies.html?search=${encodeURIComponent(query)}`;
}

// नोटिफिकेसन एलिमेन्ट सिर्जना गर्ने फंक्सन
function createNotificationElement() {
    // नोटिफिकेसन एलिमेन्ट छ कि छैन जाँच गर्ने
    if (document.getElementById('notification')) return;
    
    // नोटिफिकेसन एलिमेन्ट सिर्जना गर्ने
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    
    const notificationContent = document.createElement('div');
    notificationContent.className = 'notification-content';
    
    notificationContent.innerHTML = `
        <i class="fas fa-bell"></i>
        <div class="notification-text">
            <p id="notification-message"></p>
        </div>
        <span class="close-notification">&times;</span>
    `;
    
    notification.appendChild(notificationContent);
    document.body.appendChild(notification);
    
    // बन्द बटनमा इभेन्ट लिस्नर थप्ने
    document.querySelector('.close-notification').addEventListener('click', function() {
        notification.classList.remove('show');
    });
}

// नोटिफिकेसन देखाउने फंक्सन
function showNotification(message) {
    const notification = document.getElementById('notification');
    
    if (!notification) {
        createNotificationElement();
        return showNotification(message);
    }
    
    // नोटिफिकेसन सन्देश अपडेट गर्ने
    document.getElementById('notification-message').textContent = message;
    notification.classList.add('show');
    
    // 5 सेकेन्डपछि नोटिफिकेसन हटाउने
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// URL बाट प्यारामिटर प्राप्त गर्ने फंक्सन
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// यादृच्छिक संख्या प्राप्त गर्ने फंक्सन
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// मिति फर्म्याट गर्ने फंक्सन
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('ne-NP', options);
}

// संख्या फर्म्याट गर्ने फंक्सन
function formatNumber(number) {
    return number.toLocaleString('ne-NP');
}

// मूल्य फर्म्याट गर्ने फंक्सन
function formatPrice(price) {
    return 'रु ' + price.toFixed(2).toLocaleString('ne-NP');
}

// प्रतिशत फर्म्याट गर्ने फंक्सन
function formatPercent(percent) {
    const sign = percent >= 0 ? '+' : '';
    return sign + percent.toFixed(2) + '%';
}

// वाचलिस्टमा शेयर छ कि छैन जाँच गर्ने फंक्सन
function isInWatchlist(symbol) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    return watchlist.some(stock => stock.symbol === symbol);
}

// लोकल स्टोरेजमा डेटा सेट गर्ने फंक्सन
function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// लोकल स्टोरेजबाट डेटा प्राप्त गर्ने फंक्सन
function getLocalData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// भाषा स्विचर
function initLanguageSwitcher() {
    const languageSelect = document.getElementById('language-select');
    
    if (languageSelect) {
        // लोकल स्टोरेजबाट भाषा प्राप्त गर्ने
        const savedLanguage = localStorage.getItem('language') || 'ne';
        
        // HTML लैंग एट्रिब्युट सेट गर्ने
        document.documentElement.lang = savedLanguage;
        
        // सेलेक्ट भ्यालु सेट गर्ने
        languageSelect.value = savedLanguage;
        
        // भाषा परिवर्तन इभेन्ट
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            
            // HTML लैंग एट्रिब्युट अपडेट गर्ने
            document.documentElement.lang = selectedLanguage;
            
            // लोकल स्टोरेजमा सेभ गर्ने
            localStorage.setItem('language', selectedLanguage);
            
            // अर्को भाषाको पृष्ठमा रिडाइरेक्ट गर्ने
            redirectToLanguagePage(selectedLanguage);
        });
    }
}

// भाषा अनुसार पृष्ठ रिडाइरेक्ट
function redirectToLanguagePage(language) {
    // वर्तमान पेज URL प्राप्त गर्ने
    const currentPage = window.location.pathname.split('/').pop();
    
    // अंग्रेजी र नेपाली पेजहरूको म्यापिङ
    const pageMapping = {
        'index.html': 'index-en.html',
        'index-en.html': 'index.html',
        'companies.html': 'companies-en.html',
        'companies-en.html': 'companies.html',
        'analysis.html': 'analysis-en.html',
        'analysis-en.html': 'analysis.html',
        'about.html': 'about-en.html',
        'about-en.html': 'about.html',
        'portfolio.html': 'portfolio-en.html',
        'portfolio-en.html': 'portfolio.html',
        'watchlist.html': 'watchlist-en.html',
        'watchlist-en.html': 'watchlist.html'
    };
    
    // यदि वर्तमान पेजको म्यापिङ छ भने
    if (pageMapping[currentPage]) {
        // भाषा अनुसार पेज परिवर्तन गर्ने
        if (language === 'en' && !currentPage.includes('-en')) {
            window.location.href = pageMapping[currentPage];
        } else if (language === 'ne' && currentPage.includes('-en')) {
            window.location.href = pageMapping[currentPage];
        }
    }
}

// मेनु टगल
function initMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }
}

// स्क्रोल टप बटन
function initScrollTopButton() {
    // स्क्रोल टप बटन बनाउने
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.classList.add('scroll-top-btn');
    scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollTopBtn);
    
    // स्क्रोल इभेन्ट
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    
    // बटन क्लिक इभेन्ट
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// लगइन स्टेटस जाँच
function checkLoginStatus() {
    // लोकल स्टोरेजबाट टोकन प्राप्त गर्ने
    const userToken = localStorage.getItem('userToken');
    const isLoggedIn = !!userToken;
    
    // UI अपडेट गर्ने
    updateUIBasedOnLoginStatus(isLoggedIn);
    
    // प्रतिबन्धित पेजहरूमा पहुँच जाँच गर्ने
    checkRestrictedPageAccess(isLoggedIn);
}

// लगइन स्टेटस अनुसार UI अपडेट गर्ने
function updateUIBasedOnLoginStatus(isLoggedIn) {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (authButtons && userProfile) {
        if (isLoggedIn) {
            // लगइन भएको छ भने
            authButtons.style.display = 'none';
            userProfile.style.display = 'flex';
            
            // प्रयोगकर्ता नाम सेट गर्ने
            const userName = localStorage.getItem('userName') || 'प्रयोगकर्ता';
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
        } else {
            // लगइन भएको छैन भने
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }
}

// प्रतिबन्धित पेजहरूमा पहुँच जाँच गर्ने
function checkRestrictedPageAccess(isLoggedIn) {
    // वर्तमान पेज URL प्राप्त गर्ने
    const currentPage = window.location.pathname.split('/').pop();
    
    // प्रतिबन्धित पेजहरू
    const restrictedPages = ['portfolio.html', 'watchlist.html', 'portfolio-en.html', 'watchlist-en.html'];
    
    // यदि प्रतिबन्धित पेज हो र लगइन छैन भने
    if (restrictedPages.includes(currentPage) && !isLoggedIn) {
        // लगइन पेजमा रिडाइरेक्ट गर्ने
        window.location.href = 'login.html';
    }
}

// लगआउट फंक्सन
function logout() {
    // लोकल स्टोरेजबाट टोकन हटाउने
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    
    // होम पेजमा रिडाइरेक्ट गर्ने
    window.location.href = 'index.html';
}

// प्रयोगकर्ता प्रोफाइल ड्रपडाउन टगल
document.addEventListener('click', function(e) {
    const profileButton = document.querySelector('.profile-button');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileButton && profileDropdown) {
        if (profileButton.contains(e.target)) {
            // प्रोफाइल बटनमा क्लिक गर्दा ड्रपडाउन टगल गर्ने
            profileDropdown.classList.toggle('active');
        } else if (!profileDropdown.contains(e.target)) {
            // बाहिर क्लिक गर्दा ड्रपडाउन बन्द गर्ने
            profileDropdown.classList.remove('active');
        }
    }
});

// लगआउट बटन इभेन्ट
document.addEventListener('click', function(e) {
    if (e.target.closest('.logout-button')) {
        logout();
    }
});

// नम्बर फर्म्याट गर्ने
function formatNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// पैसा फर्म्याट गर्ने
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return 'Rs. ' + formatNumber(parseFloat(amount).toFixed(2));
}

// प्रतिशत फर्म्याट गर्ने
function formatPercent(percent) {
    if (percent === null || percent === undefined) return '';
    const value = parseFloat(percent);
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
}

// मिति फर्म्याट गर्ने
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ne-NP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// API कल गर्ने
async function fetchApi(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, options);
        
        if (!response.ok) {
            throw new Error(`API कल असफल: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API कल त्रुटि:', error);
        return null;
    }
} 