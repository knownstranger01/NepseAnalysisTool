/**
 * रियल-टाइम डाटा इन्टिग्रेसन
 * NEPSE बाट लाइभ स्टक प्राइस, भोल्युम, मार्केट इन्डेक्स र अन्य आवश्यक डाटा प्राप्त गर्ने
 */

// WebSocket कनेक्सन
let socket;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 सेकेन्ड
const FALLBACK_POLLING_INTERVAL = 15000; // 15 सेकेन्ड
let pollingInterval = null;

// सब्स्क्राइब गरिएका सिम्बलहरू
const subscribedSymbols = new Set();
const subscribedIndices = new Set(['NEPSE', 'SENSITIVE', 'FLOAT', 'SENSITIVE_FLOAT']);

// डाटा क्यास
const liveDataCache = {
    stocks: {},
    indices: {},
    lastUpdated: null,
    marketStatus: {
        isOpen: false,
        message: "बजार बन्द छ",
        nextOpenTime: null
    }
};

// कलब्याक फंक्सनहरू
const callbacks = {
    onStockUpdate: [],
    onIndexUpdate: [],
    onMarketStatusUpdate: [],
    onConnect: [],
    onDisconnect: [],
    onError: []
};

/**
 * WebSocket कनेक्सन स्थापना गर्ने
 */
function initializeWebSocket() {
    try {
        // WebSocket URL (यो तपाईंको वास्तविक WebSocket सर्भर URL संग बदल्नुहोस्)
        const wsUrl = 'wss://api.nepsetracker.com/ws';
        
        // पहिले अवस्थित कनेक्सन बन्द गर्ने
        if (socket) {
            socket.close();
        }
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = handleSocketOpen;
        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketClose;
        socket.onerror = handleSocketError;
        
        console.log('WebSocket कनेक्सन स्थापना गर्दै...');
    } catch (error) {
        console.error('WebSocket कनेक्सन स्थापना गर्न असफल:', error);
        switchToFallbackAPI();
    }
}

/**
 * WebSocket खुल्दा ह्यान्डलर
 */
function handleSocketOpen() {
    console.log('WebSocket कनेक्सन स्थापित');
    isConnected = true;
    reconnectAttempts = 0;
    
    // पहिले सब्स्क्राइब गरिएका सिम्बलहरू पुन: सब्स्क्राइब गर्ने
    resubscribeAll();
    
    // कलब्याक फंक्सनहरू कल गर्ने
    callbacks.onConnect.forEach(callback => callback());
}

/**
 * WebSocket मेसेज ह्यान्डलर
 * @param {MessageEvent} event - WebSocket मेसेज इभेन्ट
 */
function handleSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        // डाटा प्रकार अनुसार प्रोसेस गर्ने
        if (data.type === 'stock_update') {
            processStockUpdate(data.payload);
        } else if (data.type === 'index_update') {
            processIndexUpdate(data.payload);
        } else if (data.type === 'market_status') {
            processMarketStatus(data.payload);
        } else if (data.type === 'error') {
            console.error('सर्भर त्रुटि:', data.message);
            callbacks.onError.forEach(callback => callback(data.message));
        }
    } catch (error) {
        console.error('मेसेज प्रोसेसिङ त्रुटि:', error);
    }
}

/**
 * WebSocket बन्द हुँदा ह्यान्डलर
 * @param {CloseEvent} event - WebSocket क्लोज इभेन्ट
 */
function handleSocketClose(event) {
    console.log(`WebSocket कनेक्सन बन्द भयो: ${event.code} ${event.reason}`);
    isConnected = false;
    
    // कलब्याक फंक्सनहरू कल गर्ने
    callbacks.onDisconnect.forEach(callback => callback(event.code, event.reason));
    
    // पुन: कनेक्ट गर्ने प्रयास
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`${RECONNECT_DELAY / 1000} सेकेन्डमा पुन: कनेक्ट गर्दै... (प्रयास ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
            initializeWebSocket();
        }, RECONNECT_DELAY);
    } else {
        console.error('अधिकतम पुन: कनेक्ट प्रयासहरू समाप्त भए');
        // फलब्याक API मा स्विच गर्ने
        switchToFallbackAPI();
    }
}

/**
 * WebSocket त्रुटि ह्यान्डलर
 * @param {Event} error - WebSocket त्रुटि इभेन्ट
 */
function handleSocketError(error) {
    console.error('WebSocket त्रुटि:', error);
    callbacks.onError.forEach(callback => callback(error));
}

/**
 * स्टक अपडेट प्रोसेस गर्ने
 * @param {Object} data - स्टक अपडेट डाटा
 */
function processStockUpdate(data) {
    // क्यासमा डाटा अपडेट गर्ने
    liveDataCache.stocks[data.symbol] = {
        ...data,
        lastUpdated: new Date()
    };
    
    // कलब्याक फंक्सनहरू कल गर्ने
    callbacks.onStockUpdate.forEach(callback => callback(data));
    
    // UI अपडेट गर्ने
    updateStockUI(data);
}

/**
 * इन्डेक्स अपडेट प्रोसेस गर्ने
 * @param {Object} data - इन्डेक्स अपडेट डाटा
 */
function processIndexUpdate(data) {
    // क्यासमा डाटा अपडेट गर्ने
    liveDataCache.indices[data.index] = {
        ...data,
        lastUpdated: new Date()
    };
    
    // कलब्याक फंक्सनहरू कल गर्ने
    callbacks.onIndexUpdate.forEach(callback => callback(data));
    
    // UI अपडेट गर्ने
    updateIndexUI(data);
}

/**
 * मार्केट स्टेटस प्रोसेस गर्ने
 * @param {Object} data - मार्केट स्टेटस डाटा
 */
function processMarketStatus(data) {
    // मार्केट स्टेटस अपडेट गर्ने
    const marketStatusElement = document.getElementById('market-status');
    if (marketStatusElement) {
        const statusIndicator = marketStatusElement.querySelector('.status-indicator');
        const statusText = marketStatusElement.querySelector('.status-text');
        
        if (data.isOpen) {
            statusIndicator.classList.remove('closed');
            statusIndicator.classList.add('open');
            statusText.textContent = 'बजार खुला छ';
            statusText.classList.remove('closed');
            statusText.classList.add('open');
        } else {
            statusIndicator.classList.remove('open');
            statusIndicator.classList.add('closed');
            statusText.textContent = 'बजार बन्द छ';
            statusText.classList.remove('open');
            statusText.classList.add('closed');
        }
        
        // अन्तिम अपडेट समय अपडेट गर्ने
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `अन्तिम अपडेट: ${now.toLocaleTimeString()}`;
        }
    }
}

/**
 * स्टक UI अपडेट गर्ने
 * @param {Object} data - स्टक डाटा
 */
function updateStockUI(data) {
    // टेबलमा स्टक डाटा अपडेट गर्ने
    const stockRow = document.querySelector(`tr[data-symbol="${data.symbol}"]`);
    if (stockRow) {
        // मूल्य अपडेट गर्ने
        const priceCell = stockRow.querySelector('.price');
        if (priceCell) {
            const oldPrice = parseFloat(priceCell.textContent);
            const newPrice = parseFloat(data.ltp);
            
            priceCell.textContent = newPrice.toFixed(2);
            
            // मूल्य परिवर्तन अनुसार एनिमेसन थप्ने
            if (newPrice > oldPrice) {
                priceCell.classList.remove('negative');
                priceCell.classList.add('positive', 'price-up');
                setTimeout(() => priceCell.classList.remove('price-up'), 1000);
            } else if (newPrice < oldPrice) {
                priceCell.classList.remove('positive');
                priceCell.classList.add('negative', 'price-down');
                setTimeout(() => priceCell.classList.remove('price-down'), 1000);
            }
        }
        
        // परिवर्तन अपडेट गर्ने
        const changeCell = stockRow.querySelector('.change');
        if (changeCell) {
            const change = parseFloat(data.change);
            const changePercent = parseFloat(data.changePercent);
            
            changeCell.textContent = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            
            if (change > 0) {
                changeCell.classList.remove('negative');
                changeCell.classList.add('positive');
            } else if (change < 0) {
                changeCell.classList.remove('positive');
                changeCell.classList.add('negative');
            } else {
                changeCell.classList.remove('positive', 'negative');
            }
        }
        
        // भोल्युम अपडेट गर्ने
        const volumeCell = stockRow.querySelector('.volume');
        if (volumeCell) {
            volumeCell.textContent = formatNumber(data.volume);
        }
    }
    
    // चार्ट अपडेट गर्ने (यदि हालको सिम्बल देखाइएको छ भने)
    const currentSymbolElement = document.getElementById('current-symbol');
    if (currentSymbolElement && currentSymbolElement.textContent === data.symbol) {
        updateLiveChart(data);
    }
}

/**
 * इन्डेक्स UI अपडेट गर्ने
 * @param {Object} data - इन्डेक्स डाटा
 */
function updateIndexUI(data) {
    // इन्डेक्स भ्यालु अपडेट गर्ने
    const indexElement = document.querySelector(`.index-value[data-index="${data.index}"]`);
    if (indexElement) {
        const valueElement = indexElement.querySelector('.value');
        const changeElement = indexElement.querySelector('.change');
        
        if (valueElement) {
            const oldValue = parseFloat(valueElement.textContent);
            const newValue = parseFloat(data.value);
            
            valueElement.textContent = newValue.toFixed(2);
            
            // मूल्य परिवर्तन अनुसार एनिमेसन थप्ने
            if (newValue > oldValue) {
                valueElement.classList.remove('negative');
                valueElement.classList.add('positive', 'price-up');
                setTimeout(() => valueElement.classList.remove('price-up'), 1000);
            } else if (newValue < oldValue) {
                valueElement.classList.remove('positive');
                valueElement.classList.add('negative', 'price-down');
                setTimeout(() => valueElement.classList.remove('price-down'), 1000);
            }
        }
        
        if (changeElement) {
            const change = parseFloat(data.change);
            const changePercent = parseFloat(data.changePercent);
            
            changeElement.textContent = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            
            if (change > 0) {
                changeElement.classList.remove('negative');
                changeElement.classList.add('positive');
            } else if (change < 0) {
                changeElement.classList.remove('positive');
                changeElement.classList.add('negative');
            } else {
                changeElement.classList.remove('positive', 'negative');
            }
        }
    }
    
    // इन्डेक्स चार्ट अपडेट गर्ने
    updateIndexChart(data);
}

/**
 * स्टक सब्स्क्राइब गर्ने
 * @param {string} symbol - स्टक सिम्बल
 */
function subscribeStock(symbol) {
    if (!symbol) return;
    
    if (isConnected && !subscribedSymbols.has(symbol)) {
        socket.send(JSON.stringify({
            action: 'subscribe',
            type: 'stock',
            symbol: symbol
        }));
        
        subscribedSymbols.add(symbol);
        console.log(`सब्स्क्राइब गरियो: ${symbol}`);
    }
}

/**
 * स्टक अनसब्स्क्राइब गर्ने
 * @param {string} symbol - स्टक सिम्बल
 */
function unsubscribeStock(symbol) {
    if (!symbol) return;
    
    if (isConnected && subscribedSymbols.has(symbol)) {
        socket.send(JSON.stringify({
            action: 'unsubscribe',
            type: 'stock',
            symbol: symbol
        }));
        
        subscribedSymbols.delete(symbol);
        console.log(`अनसब्स्क्राइब गरियो: ${symbol}`);
    }
}

/**
 * इन्डेक्स सब्स्क्राइब गर्ने
 * @param {string} index - इन्डेक्स नाम
 */
function subscribeIndex(index) {
    if (!index) return;
    
    if (isConnected && !subscribedIndices.has(index)) {
        socket.send(JSON.stringify({
            action: 'subscribe',
            type: 'index',
            index: index
        }));
        
        subscribedIndices.add(index);
        console.log(`सब्स्क्राइब गरियो: ${index}`);
    }
}

/**
 * इन्डेक्स अनसब्स्क्राइब गर्ने
 * @param {string} index - इन्डेक्स नाम
 */
function unsubscribeIndex(index) {
    if (!index) return;
    
    if (isConnected && subscribedIndices.has(index)) {
        socket.send(JSON.stringify({
            action: 'unsubscribe',
            type: 'index',
            index: index
        }));
        
        subscribedIndices.delete(index);
        console.log(`अनसब्स्क्राइब गरियो: ${index}`);
    }
}

/**
 * सबै सब्स्क्रिप्सनहरू पुन: सब्स्क्राइब गर्ने
 */
function resubscribeAll() {
    // सबै स्टक सिम्बलहरू पुन: सब्स्क्राइब गर्ने
    subscribedSymbols.forEach(symbol => {
        socket.send(JSON.stringify({
            action: 'subscribe',
            type: 'stock',
            symbol: symbol
        }));
    });
    
    // सबै इन्डेक्सहरू पुन: सब्स्क्राइब गर्ने
    subscribedIndices.forEach(index => {
        socket.send(JSON.stringify({
            action: 'subscribe',
            type: 'index',
            index: index
        }));
    });
    
    console.log('सबै सब्स्क्रिप्सनहरू पुन: स्थापित गरियो');
}

/**
 * फलब्याक API मा स्विच गर्ने
 */
function switchToFallbackAPI() {
    console.log('फलब्याक API मा स्विच गर्दै...');
    
    // पहिले अवस्थित पोलिङ इन्टरभल क्लियर गर्ने
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // तुरुन्तै एक पटक डाटा प्राप्त गर्ने
    fetchDataFromAPI();
    
    // नियमित अन्तरालमा डाटा प्राप्त गर्ने
    pollingInterval = setInterval(fetchDataFromAPI, FALLBACK_POLLING_INTERVAL);
    
    // कनेक्सन स्थिति अपडेट गर्ने
    isConnected = false;
    triggerDisconnectCallbacks();
}

/**
 * फलब्याक API मार्फत डाटा प्राप्त गर्ने
 */
async function fetchDataFromAPI() {
    try {
        // बजार स्थिति प्राप्त गर्ने
        const marketOverviewResponse = await fetch('/api/market_overview');
        const marketOverviewData = await marketOverviewResponse.json();
        
        if (marketOverviewData.success) {
            processMarketStatus(marketOverviewData.data);
        }
        
        // सब्स्क्राइब गरिएका स्टक्सको डाटा प्राप्त गर्ने
        if (subscribedSymbols.size > 0) {
            const symbolsParam = Array.from(subscribedSymbols).join(',');
            const stocksResponse = await fetch(`/api/nepse_data?symbol=${symbolsParam}`);
            const stocksData = await stocksResponse.json();
            
            if (stocksData.success && stocksData.data) {
                stocksData.data.forEach(stock => {
                    processStockUpdate(stock);
                });
            }
        }
        
        // सब्स्क्राइब गरिएका इन्डेक्सको डाटा प्राप्त गर्ने
        if (subscribedIndices.size > 0) {
            const indicesResponse = await fetch('/api/indices');
            const indicesData = await indicesResponse.json();
            
            if (indicesData.success && indicesData.data) {
                indicesData.data.forEach(index => {
                    if (subscribedIndices.has(index.symbol)) {
                        processIndexUpdate(index);
                    }
                });
            }
        }
        
        // अन्तिम अपडेट समय अद्यावधिक गर्ने
        liveDataCache.lastUpdated = new Date();
        
        // UI अपडेट गर्ने
        updateAllUI();
        
    } catch (error) {
        console.error('फलब्याक API बाट डाटा प्राप्त गर्न असफल:', error);
        triggerErrorCallbacks(error);
    }
}

/**
 * संख्या फर्म्याट गर्ने
 * @param {number} num - फर्म्याट गर्ने संख्या
 * @returns {string} - फर्म्याटेड संख्या
 */
function formatNumber(num) {
    return new Intl.NumberFormat('ne-NP').format(num);
}

/**
 * कलब्याक फंक्सन थप्ने
 * @param {string} event - इभेन्ट नाम
 * @param {Function} callback - कलब्याक फंक्सन
 */
function addCallback(event, callback) {
    if (typeof callback !== 'function') return;
    
    switch (event) {
        case 'stockUpdate':
            callbacks.onStockUpdate.push(callback);
            break;
        case 'indexUpdate':
            callbacks.onIndexUpdate.push(callback);
            break;
        case 'marketStatusUpdate':
            callbacks.onMarketStatusUpdate.push(callback);
            break;
        case 'connect':
            callbacks.onConnect.push(callback);
            break;
        case 'disconnect':
            callbacks.onDisconnect.push(callback);
            break;
        case 'error':
            callbacks.onError.push(callback);
            break;
    }
}

/**
 * कलब्याक फंक्सन हटाउने
 * @param {string} event - इभेन्ट नाम
 * @param {Function} callback - कलब्याक फंक्सन
 */
function removeCallback(event, callback) {
    if (typeof callback !== 'function') return;
    
    switch (event) {
        case 'stockUpdate':
            callbacks.onStockUpdate = callbacks.onStockUpdate.filter(cb => cb !== callback);
            break;
        case 'indexUpdate':
            callbacks.onIndexUpdate = callbacks.onIndexUpdate.filter(cb => cb !== callback);
            break;
        case 'marketStatusUpdate':
            callbacks.onMarketStatusUpdate = callbacks.onMarketStatusUpdate.filter(cb => cb !== callback);
            break;
        case 'connect':
            callbacks.onConnect = callbacks.onConnect.filter(cb => cb !== callback);
            break;
        case 'disconnect':
            callbacks.onDisconnect = callbacks.onDisconnect.filter(cb => cb !== callback);
            break;
        case 'error':
            callbacks.onError = callbacks.onError.filter(cb => cb !== callback);
            break;
    }
}

/**
 * सबै UI अपडेट गर्ने
 */
function updateAllUI() {
    // स्टक्स UI अपडेट गर्ने
    Object.values(liveDataCache.stocks).forEach(stock => {
        updateStockUI(stock);
    });
    
    // इन्डेक्स UI अपडेट गर्ने
    Object.values(liveDataCache.indices).forEach(index => {
        updateIndexUI(index);
    });
    
    // बजार स्थिति UI अपडेट गर्ने
    updateMarketStatusUI();
}

/**
 * बजार स्थिति UI अपडेट गर्ने
 */
function updateMarketStatusUI() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const lastUpdated = document.getElementById('last-updated');
    
    if (statusIndicator && statusText) {
        if (liveDataCache.marketStatus.isOpen) {
            statusIndicator.classList.remove('closed');
            statusIndicator.classList.add('open');
            statusText.classList.remove('closed');
            statusText.classList.add('open');
            statusText.textContent = 'बजार खुला छ';
        } else {
            statusIndicator.classList.remove('open');
            statusIndicator.classList.add('closed');
            statusText.classList.remove('open');
            statusText.classList.add('closed');
            statusText.textContent = 'बजार बन्द छ';
        }
    }
    
    if (lastUpdated && liveDataCache.lastUpdated) {
        const formattedTime = new Date(liveDataCache.lastUpdated).toLocaleTimeString('ne-NP');
        lastUpdated.textContent = `अन्तिम अपडेट: ${formattedTime}`;
    }
}

/**
 * रियल-टाइम डाटा इन्टिग्रेसन प्रारम्भ गर्ने
 */
function initializeRealTimeData() {
    // WebSocket कनेक्सन प्रारम्भ गर्ने
    initializeWebSocket();
    
    // पृष्ठ लोड हुँदा सबै UI अपडेट गर्ने
    document.addEventListener('DOMContentLoaded', () => {
        updateAllUI();
    });
    
    // पृष्ठ बन्द हुँदा WebSocket कनेक्सन बन्द गर्ने
    window.addEventListener('beforeunload', () => {
        if (socket) {
            socket.close();
        }
        
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    });
    
    return {
        subscribeStock,
        unsubscribeStock,
        subscribeIndex,
        unsubscribeIndex,
        addCallback,
        removeCallback,
        getStockData: (symbol) => liveDataCache.stocks[symbol],
        getIndexData: (index) => liveDataCache.indices[index],
        getMarketStatus: () => liveDataCache.marketStatus,
        getLastUpdated: () => liveDataCache.lastUpdated
    };
}

// रियल-टाइम डाटा इन्टिग्रेसन प्रारम्भ गर्ने र एक्सपोर्ट गर्ने
const RealTimeData = initializeRealTimeData();

// ग्लोबल स्कोपमा उपलब्ध गराउने
window.RealTimeData = RealTimeData; 