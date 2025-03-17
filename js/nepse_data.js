/**
 * NEPSE डाटा मोड्युल
 * NEPSE बाट लाइभ स्टक प्राइस, भोल्युम, र अन्य डाटा प्राप्त गर्ने
 */

// अन्तिम अपडेट समय
let lastUpdated = null;

// अपडेट इन्टरभल (मिलिसेकेन्डमा)
const UPDATE_INTERVAL = 15000; // 15 सेकेन्ड
let updateInterval = null;

// सब्स्क्राइब गरिएका सिम्बलहरू
const subscribedSymbols = new Set();

/**
 * NEPSE डाटा इनिसियलाइज गर्ने
 */
function initializeNepseData() {
    // पृष्ठ लोड हुँदा NEPSE डाटा प्रदर्शन गर्ने
    document.addEventListener('DOMContentLoaded', () => {
        // URL बाट सिम्बल प्राप्त गर्ने
        const urlParams = new URLSearchParams(window.location.search);
        const symbol = urlParams.get('symbol');
        
        // सिम्बल छ भने त्यसको डाटा लोड गर्ने
        if (symbol) {
            loadStockData(symbol);
            
            // रियलटाइम अपडेटको लागि सिम्बल सब्स्क्राइब गर्ने
            if (window.RealTimeData) {
                window.RealTimeData.subscribeStock(symbol);
                subscribedSymbols.add(symbol);
                
                // स्टक अपडेटको लागि कलब्याक रजिस्टर गर्ने
                window.RealTimeData.addCallback('stockUpdate', (stockData) => {
                    if (stockData.symbol === symbol) {
                        updateStockDisplay(stockData);
                    }
                });
            }
        } else {
            // सबै स्टक्स लोड गर्ने
            loadAllStocks();
            
            // नियमित अन्तरालमा अपडेट गर्ने
            updateInterval = setInterval(loadAllStocks, UPDATE_INTERVAL);
        }
        
        // पृष्ठ बन्द हुँदा इन्टरभल क्लियर गर्ने र सब्स्क्रिप्सन हटाउने
        window.addEventListener('beforeunload', () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
            
            // सबै सब्स्क्राइब गरिएका सिम्बलहरू अनसब्स्क्राइब गर्ने
            if (window.RealTimeData) {
                subscribedSymbols.forEach(sym => {
                    window.RealTimeData.unsubscribeStock(sym);
                });
            }
        });
    });
}

/**
 * सबै स्टक्स लोड गर्ने
 */
async function loadAllStocks() {
    try {
        // लोडिङ स्टेट देखाउने
        showLoadingState();
        
        // फिल्टरहरू प्राप्त गर्ने
        const filters = getFilters();
        
        // सर्टिङ प्राप्त गर्ने
        const sorting = getSorting();
        
        // स्टक डाटा प्राप्त गर्ने
        const response = await window.ApiService.getLiveStockData(filters, sorting, null, true);
        
        // स्टक्स प्रदर्शन गर्ने
        displayStocks(response.stocks);
        
        // अन्तिम अपडेट समय अपडेट गर्ने
        lastUpdated = response.meta.last_updated || new Date().toISOString();
        updateLastUpdatedTime();
        
        // लोडिङ स्टेट हटाउने
        hideLoadingState();
        
        // रियलटाइम अपडेटको लागि सिम्बलहरू सब्स्क्राइब गर्ने
        if (window.RealTimeData) {
            // पहिले सबै अनसब्स्क्राइब गर्ने
            subscribedSymbols.forEach(sym => {
                window.RealTimeData.unsubscribeStock(sym);
            });
            subscribedSymbols.clear();
            
            // पहिलो 20 सिम्बलहरू सब्स्क्राइब गर्ने
            const stocksToSubscribe = response.stocks.slice(0, 20);
            stocksToSubscribe.forEach(stock => {
                window.RealTimeData.subscribeStock(stock.symbol);
                subscribedSymbols.add(stock.symbol);
            });
            
            // स्टक अपडेटको लागि कलब्याक रजिस्टर गर्ने
            window.RealTimeData.addCallback('stockUpdate', updateStockDisplay);
        }
    } catch (error) {
        console.error('स्टक डाटा लोड गर्न असफल:', error);
        
        // लोडिङ स्टेट हटाउने
        hideLoadingState();
        
        // त्रुटि सन्देश देखाउने
        showErrorMessage('स्टक डाटा लोड गर्न असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।');
    }
}

/**
 * एउटा स्टकको डाटा लोड गर्ने
 * @param {string} symbol - स्टक सिम्बल
 */
async function loadStockData(symbol) {
    try {
        // लोडिङ स्टेट देखाउने
        showLoadingState();
        
        // स्टक डाटा प्राप्त गर्ने
        const response = await window.ApiService.getLiveStockData({ symbol }, {}, null, true);
        
        if (response.stocks && response.stocks.length > 0) {
            // स्टक डिस्प्ले अपडेट गर्ने
            updateStockDisplay(response.stocks[0]);
            
            // अन्तिम अपडेट समय अपडेट गर्ने
            lastUpdated = response.meta.last_updated || new Date().toISOString();
            updateLastUpdatedTime();
        } else {
            showErrorMessage(`सिम्बल '${symbol}' को डाटा प्राप्त गर्न असफल भयो।`);
        }
        
        // लोडिङ स्टेट हटाउने
        hideLoadingState();
    } catch (error) {
        console.error(`स्टक डाटा लोड गर्न असफल (${symbol}):`, error);
        
        // लोडिङ स्टेट हटाउने
        hideLoadingState();
        
        // त्रुटि सन्देश देखाउने
        showErrorMessage(`सिम्बल '${symbol}' को डाटा प्राप्त गर्न असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।`);
    }
}

/**
 * स्टक्स प्रदर्शन गर्ने
 * @param {Array} stocks - स्टक्स डाटा
 */
function displayStocks(stocks) {
    const tableBody = document.querySelector('.companies-table tbody');
    
    if (!tableBody) return;
    
    // टेबल खाली गर्ने
    tableBody.innerHTML = '';
    
    // स्टक्स प्रदर्शन गर्ने
    stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.setAttribute('data-symbol', stock.symbol);
        
        const changeClass = parseFloat(stock.change) > 0 ? 'positive' : (parseFloat(stock.change) < 0 ? 'negative' : '');
        const changeSign = parseFloat(stock.change) > 0 ? '+' : '';
        
        row.innerHTML = `
            <td class="symbol"><a href="companies.html?symbol=${stock.symbol}">${stock.symbol}</a></td>
            <td class="company">${stock.companyName || ''}</td>
            <td class="ltp">${parseFloat(stock.ltp).toFixed(2)}</td>
            <td class="change ${changeClass}">${changeSign}${parseFloat(stock.change).toFixed(2)}</td>
            <td class="percent ${changeClass}">${changeSign}${parseFloat(stock.percentChange).toFixed(2)}%</td>
            <td class="volume">${formatNumber(stock.qty)}</td>
            <td class="actions">
                <button class="add-watchlist-btn" title="वाचलिस्टमा थप्नुहोस्" data-symbol="${stock.symbol}">
                    <i class="fas fa-star"></i>
                </button>
                <button class="add-portfolio-btn" title="पोर्टफोलियोमा थप्नुहोस्" data-symbol="${stock.symbol}">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // वाचलिस्ट र पोर्टफोलियो बटनहरूमा इभेन्ट लिस्नरहरू थप्ने
    addWatchlistButtonListeners();
    addPortfolioButtonListeners();
}

/**
 * स्टक डिस्प्ले अपडेट गर्ने
 * @param {Object} stockData - स्टक डाटा
 */
function updateStockDisplay(stockData) {
    // स्टक डिटेल पेजमा अपडेट गर्ने
    const stockDetailContainer = document.querySelector('.stock-detail');
    if (stockDetailContainer) {
        updateStockDetailPage(stockData);
        return;
    }
    
    // स्टक्स टेबलमा अपडेट गर्ने
    const row = document.querySelector(`.companies-table tr[data-symbol="${stockData.symbol}"]`);
    if (!row) return;
    
    // LTP अपडेट गर्ने
    const ltpCell = row.querySelector('.ltp');
    if (ltpCell) {
        const oldValue = parseFloat(ltpCell.textContent);
        const newValue = parseFloat(stockData.ltp);
        
        ltpCell.textContent = newValue.toFixed(2);
        
        // मूल्य परिवर्तन भएमा हाइलाइट गर्ने
        if (oldValue !== newValue) {
            ltpCell.classList.add(newValue > oldValue ? 'highlight-up' : 'highlight-down');
            
            // 1 सेकेन्ड पछि हाइलाइट हटाउने
            setTimeout(() => {
                ltpCell.classList.remove('highlight-up', 'highlight-down');
            }, 1000);
        }
    }
    
    // परिवर्तन अपडेट गर्ने
    const changeCell = row.querySelector('.change');
    if (changeCell) {
        const changeValue = parseFloat(stockData.change);
        const changeSign = changeValue > 0 ? '+' : '';
        
        changeCell.textContent = `${changeSign}${changeValue.toFixed(2)}`;
        
        // परिवर्तन अनुसार क्लास अपडेट गर्ने
        changeCell.classList.remove('positive', 'negative');
        if (changeValue > 0) {
            changeCell.classList.add('positive');
        } else if (changeValue < 0) {
            changeCell.classList.add('negative');
        }
    }
    
    // प्रतिशत परिवर्तन अपडेट गर्ने
    const percentCell = row.querySelector('.percent');
    if (percentCell) {
        const percentValue = parseFloat(stockData.percentChange);
        const percentSign = percentValue > 0 ? '+' : '';
        
        percentCell.textContent = `${percentSign}${percentValue.toFixed(2)}%`;
        
        // परिवर्तन अनुसार क्लास अपडेट गर्ने
        percentCell.classList.remove('positive', 'negative');
        if (percentValue > 0) {
            percentCell.classList.add('positive');
        } else if (percentValue < 0) {
            percentCell.classList.add('negative');
        }
    }
    
    // भोल्युम अपडेट गर्ने
    const volumeCell = row.querySelector('.volume');
    if (volumeCell) {
        volumeCell.textContent = formatNumber(stockData.qty);
    }
}

/**
 * स्टक डिटेल पेज अपडेट गर्ने
 * @param {Object} stockData - स्टक डाटा
 */
function updateStockDetailPage(stockData) {
    // LTP अपडेट गर्ने
    const ltpElement = document.querySelector('.stock-price .value');
    if (ltpElement) {
        const oldValue = parseFloat(ltpElement.textContent);
        const newValue = parseFloat(stockData.ltp);
        
        ltpElement.textContent = newValue.toFixed(2);
        
        // मूल्य परिवर्तन भएमा हाइलाइट गर्ने
        if (oldValue !== newValue) {
            ltpElement.classList.add(newValue > oldValue ? 'highlight-up' : 'highlight-down');
            
            // 1 सेकेन्ड पछि हाइलाइट हटाउने
            setTimeout(() => {
                ltpElement.classList.remove('highlight-up', 'highlight-down');
            }, 1000);
        }
    }
    
    // परिवर्तन अपडेट गर्ने
    const changeElement = document.querySelector('.stock-change .value');
    if (changeElement) {
        const changeValue = parseFloat(stockData.change);
        const percentValue = parseFloat(stockData.percentChange);
        const changeSign = changeValue > 0 ? '+' : '';
        
        changeElement.textContent = `${changeSign}${changeValue.toFixed(2)} (${changeSign}${percentValue.toFixed(2)}%)`;
        
        // परिवर्तन अनुसार क्लास अपडेट गर्ने
        changeElement.classList.remove('positive', 'negative');
        if (changeValue > 0) {
            changeElement.classList.add('positive');
        } else if (changeValue < 0) {
            changeElement.classList.add('negative');
        }
    }
    
    // भोल्युम अपडेट गर्ने
    const volumeElement = document.querySelector('.stock-volume .value');
    if (volumeElement) {
        volumeElement.textContent = formatNumber(stockData.qty);
    }
    
    // अन्य डाटा अपडेट गर्ने
    updateOtherStockData(stockData);
}

/**
 * अन्य स्टक डाटा अपडेट गर्ने
 * @param {Object} stockData - स्टक डाटा
 */
function updateOtherStockData(stockData) {
    // अधिकतम मूल्य अपडेट गर्ने
    const highElement = document.querySelector('.stock-high .value');
    if (highElement && stockData.high) {
        highElement.textContent = parseFloat(stockData.high).toFixed(2);
    }
    
    // न्यूनतम मूल्य अपडेट गर्ने
    const lowElement = document.querySelector('.stock-low .value');
    if (lowElement && stockData.low) {
        lowElement.textContent = parseFloat(stockData.low).toFixed(2);
    }
    
    // खुला मूल्य अपडेट गर्ने
    const openElement = document.querySelector('.stock-open .value');
    if (openElement && stockData.open) {
        openElement.textContent = parseFloat(stockData.open).toFixed(2);
    }
    
    // अघिल्लो बन्द मूल्य अपडेट गर्ने
    const prevCloseElement = document.querySelector('.stock-prev-close .value');
    if (prevCloseElement && stockData.previousClose) {
        prevCloseElement.textContent = parseFloat(stockData.previousClose).toFixed(2);
    }
}

/**
 * फिल्टरहरू प्राप्त गर्ने
 * @returns {Object} - फिल्टरहरू
 */
function getFilters() {
    const filters = {};
    
    // सिम्बल फिल्टर
    const symbolInput = document.getElementById('symbol-filter');
    if (symbolInput && symbolInput.value.trim()) {
        filters.symbol = symbolInput.value.trim();
    }
    
    // क्षेत्र फिल्टर
    const sectorSelect = document.getElementById('sector-filter');
    if (sectorSelect && sectorSelect.value && sectorSelect.value !== 'all') {
        filters.sector = sectorSelect.value;
    }
    
    return filters;
}

/**
 * सर्टिङ प्राप्त गर्ने
 * @returns {Object} - सर्टिङ
 */
function getSorting() {
    const sorting = {
        sort_by: 'symbol',
        sort_order: 'asc'
    };
    
    // सर्ट फिल्ड
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect && sortSelect.value) {
        sorting.sort_by = sortSelect.value;
    }
    
    // सर्ट अर्डर
    const sortOrderSelect = document.getElementById('sort-order');
    if (sortOrderSelect && sortOrderSelect.value) {
        sorting.sort_order = sortOrderSelect.value;
    }
    
    return sorting;
}

/**
 * वाचलिस्ट बटनहरूमा इभेन्ट लिस्नरहरू थप्ने
 */
function addWatchlistButtonListeners() {
    const watchlistButtons = document.querySelectorAll('.add-watchlist-btn');
    
    watchlistButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            
            const symbol = button.getAttribute('data-symbol');
            addToWatchlist(symbol);
        });
    });
}

/**
 * पोर्टफोलियो बटनहरूमा इभेन्ट लिस्नरहरू थप्ने
 */
function addPortfolioButtonListeners() {
    const portfolioButtons = document.querySelectorAll('.add-portfolio-btn');
    
    portfolioButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            
            const symbol = button.getAttribute('data-symbol');
            addToPortfolio(symbol);
        });
    });
}

/**
 * वाचलिस्टमा थप्ने
 * @param {string} symbol - स्टक सिम्बल
 */
function addToWatchlist(symbol) {
    // यहाँ वाचलिस्टमा थप्ने लजिक थप्नुहोस्
    console.log(`वाचलिस्टमा थपिँदै: ${symbol}`);
    
    // यदि अथेन्टिकेट छैन भने लगइन पेजमा रिडाइरेक्ट गर्ने
    if (!isAuthenticated()) {
        showLoginPrompt('वाचलिस्टमा थप्नको लागि लगइन गर्नुहोस्');
        return;
    }
    
    // वाचलिस्टमा थप्ने API कल
    // ...
    
    // सफलता सन्देश देखाउने
    showSuccessMessage(`${symbol} वाचलिस्टमा थपियो`);
}

/**
 * पोर्टफोलियोमा थप्ने
 * @param {string} symbol - स्टक सिम्बल
 */
function addToPortfolio(symbol) {
    // यहाँ पोर्टफोलियोमा थप्ने लजिक थप्नुहोस्
    console.log(`पोर्टफोलियोमा थपिँदै: ${symbol}`);
    
    // यदि अथेन्टिकेट छैन भने लगइन पेजमा रिडाइरेक्ट गर्ने
    if (!isAuthenticated()) {
        showLoginPrompt('पोर्टफोलियोमा थप्नको लागि लगइन गर्नुहोस्');
        return;
    }
    
    // पोर्टफोलियो मोडल देखाउने
    showPortfolioModal(symbol);
}

/**
 * अथेन्टिकेट छ कि छैन जाँच गर्ने
 * @returns {boolean} - अथेन्टिकेट छ कि छैन
 */
function isAuthenticated() {
    // यहाँ अथेन्टिकेसन जाँच गर्ने लजिक थप्नुहोस्
    return localStorage.getItem('auth_token') !== null;
}

/**
 * लगइन प्रम्प्ट देखाउने
 * @param {string} message - सन्देश
 */
function showLoginPrompt(message) {
    // यहाँ लगइन प्रम्प्ट देखाउने लजिक थप्नुहोस्
    alert(`${message}. लगइन पेजमा रिडाइरेक्ट गर्दै...`);
    window.location.href = 'login.html';
}

/**
 * पोर्टफोलियो मोडल देखाउने
 * @param {string} symbol - स्टक सिम्बल
 */
function showPortfolioModal(symbol) {
    // यहाँ पोर्टफोलियो मोडल देखाउने लजिक थप्नुहोस्
    // ...
}

/**
 * अन्तिम अपडेट समय अपडेट गर्ने
 */
function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('last-updated');
    
    if (lastUpdatedElement && lastUpdated) {
        const date = new Date(lastUpdated);
        const formattedTime = date.toLocaleTimeString('ne-NP');
        lastUpdatedElement.textContent = `अन्तिम अपडेट: ${formattedTime}`;
    }
}

/**
 * लोडिङ स्टेट देखाउने
 */
function showLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(element => {
        element.style.display = 'block';
    });
}

/**
 * लोडिङ स्टेट हटाउने
 */
function hideLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(element => {
        element.style.display = 'none';
    });
}

/**
 * त्रुटि सन्देश देखाउने
 * @param {string} message - त्रुटि सन्देश
 */
function showErrorMessage(message) {
    const errorContainer = document.querySelector('.error-message');
    
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // 5 सेकेन्ड पछि त्रुटि सन्देश हटाउने
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

/**
 * सफलता सन्देश देखाउने
 * @param {string} message - सफलता सन्देश
 */
function showSuccessMessage(message) {
    const successContainer = document.querySelector('.success-message');
    
    if (successContainer) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        
        // 3 सेकेन्ड पछि सफलता सन्देश हटाउने
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

/**
 * संख्या फर्म्याट गर्ने
 * @param {number|string} num - संख्या
 * @returns {string} - फर्म्याटेड संख्या
 */
function formatNumber(num) {
    if (!num) return '0';
    
    const number = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    
    return new Intl.NumberFormat('ne-NP').format(number);
}

// NEPSE डाटा इनिसियलाइज गर्ने
initializeNepseData();

// ग्लोबल स्कोपमा उपलब्ध गराउने
window.NepseData = {
    loadAllStocks,
    loadStockData,
    updateStockDisplay
}; 