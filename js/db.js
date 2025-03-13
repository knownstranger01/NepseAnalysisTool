/**
 * Database module for NEPSE Stock Analyzer
 * Handles data storage and retrieval using IndexedDB
 */

const DB = (function() {
    // Database name and version
    const DB_NAME = 'NepseStockAnalyzer';
    const DB_VERSION = 1;
    
    // Store names
    const STORES = {
        STOCKS: 'stocks',
        PRICES: 'prices',
        SETTINGS: 'settings'
    };
    
    // Database connection
    let db = null;
    
    /**
     * Initialize the database
     * @returns {Promise} - Resolves when database is ready
     */
    function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('Failed to open database:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(STORES.STOCKS)) {
                    db.createObjectStore(STORES.STOCKS, { keyPath: 'symbol' });
                }
                
                if (!db.objectStoreNames.contains(STORES.PRICES)) {
                    const pricesStore = db.createObjectStore(STORES.PRICES, { keyPath: ['symbol', 'date'] });
                    pricesStore.createIndex('by_symbol', 'symbol');
                }
                
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }
            };
        });
    }
    
    /**
     * Save multiple stocks to the database
     * @param {Array} stocks - Array of stock objects
     * @returns {Promise} - Resolves when all stocks are saved
     */
    function saveStocks(stocks) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.STOCKS], 'readwrite');
            const store = transaction.objectStore(STORES.STOCKS);
            
            transaction.onerror = () => {
                console.error('Failed to save stocks:', transaction.error);
                reject(transaction.error);
            };
            
            transaction.oncomplete = () => {
                resolve();
            };
            
            stocks.forEach(stock => {
                store.put(stock);
            });
        });
    }
    
    /**
     * Save a single stock to the database
     * @param {Object} stock - Stock object
     * @returns {Promise} - Resolves when stock is saved
     */
    function saveStock(stock) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.STOCKS], 'readwrite');
            const store = transaction.objectStore(STORES.STOCKS);
            
            const request = store.put(stock);
            
            request.onerror = () => {
                console.error('Failed to save stock:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    
    /**
     * Get all stocks from the database
     * @returns {Promise<Array>} - Resolves with array of stock objects
     */
    function getStocks() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.STOCKS], 'readonly');
            const store = transaction.objectStore(STORES.STOCKS);
            const request = store.getAll();
            
            request.onerror = () => {
                console.error('Failed to get stocks:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }
    
    /**
     * Get a single stock from the database
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} - Resolves with stock object
     */
    function getStock(symbol) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.STOCKS], 'readonly');
            const store = transaction.objectStore(STORES.STOCKS);
            const request = store.get(symbol);
            
            request.onerror = () => {
                console.error('Failed to get stock:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }
    
    /**
     * Check if we have any stocks in the database
     * @returns {Promise<boolean>} - Resolves with true if we have stocks
     */
    function hasStocks() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.STOCKS], 'readonly');
            const store = transaction.objectStore(STORES.STOCKS);
            const request = store.count();
            
            request.onerror = () => {
                console.error('Failed to count stocks:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result > 0);
            };
        });
    }
    
    /**
     * Save price data for a stock
     * @param {string} symbol - Stock symbol
     * @param {Array} prices - Array of price objects
     * @returns {Promise} - Resolves when all prices are saved
     */
    function savePrices(symbol, prices) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.PRICES], 'readwrite');
            const store = transaction.objectStore(STORES.PRICES);
            
            transaction.onerror = () => {
                console.error('Failed to save prices:', transaction.error);
                reject(transaction.error);
            };
            
            transaction.oncomplete = () => {
                resolve();
            };
            
            // Delete existing prices for this symbol
            const index = store.index('by_symbol');
            const request = index.openKeyCursor(IDBKeyRange.only(symbol));
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    // Add new prices
                    prices.forEach(price => {
                        store.put({
                            symbol,
                            date: price.date,
                            open: price.open,
                            high: price.high,
                            low: price.low,
                            close: price.close,
                            volume: price.volume
                        });
                    });
                }
            };
        });
    }
    
    /**
     * Get price data for a stock
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Array>} - Resolves with array of price objects
     */
    function getPrices(symbol) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.PRICES], 'readonly');
            const store = transaction.objectStore(STORES.PRICES);
            const index = store.index('by_symbol');
            const request = index.getAll(IDBKeyRange.only(symbol));
            
            request.onerror = () => {
                console.error('Failed to get prices:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                // Sort prices by date
                const prices = request.result.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                resolve(prices);
            };
        });
    }
    
    /**
     * Check if we have price data for a stock
     * @param {string} symbol - Stock symbol
     * @returns {Promise<boolean>} - Resolves with true if we have prices
     */
    function hasPrices(symbol) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.PRICES], 'readonly');
            const store = transaction.objectStore(STORES.PRICES);
            const index = store.index('by_symbol');
            const request = index.count(IDBKeyRange.only(symbol));
            
            request.onerror = () => {
                console.error('Failed to count prices:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result > 0);
            };
        });
    }
    
    /**
     * Get the last updated timestamp for stocks
     * @returns {Promise<string>} - Resolves with ISO timestamp string
     */
    function getStocksLastUpdated() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.SETTINGS], 'readonly');
            const store = transaction.objectStore(STORES.SETTINGS);
            const request = store.get('stocksLastUpdated');
            
            request.onerror = () => {
                console.error('Failed to get last updated:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
        });
    }
    
    /**
     * Set the last updated timestamp for stocks
     * @param {string} timestamp - ISO timestamp string
     * @returns {Promise} - Resolves when timestamp is saved
     */
    function setStocksLastUpdated(timestamp) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
            const store = transaction.objectStore(STORES.SETTINGS);
            const request = store.put({
                key: 'stocksLastUpdated',
                value: timestamp
            });
            
            request.onerror = () => {
                console.error('Failed to set last updated:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    
    /**
     * Clear all data from the database
     * @returns {Promise} - Resolves when database is cleared
     */
    function clearDatabase() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(Object.values(STORES), 'readwrite');
            
            transaction.onerror = () => {
                console.error('Failed to clear database:', transaction.error);
                reject(transaction.error);
            };
            
            transaction.oncomplete = () => {
                resolve();
            };
            
            Object.values(STORES).forEach(storeName => {
                const store = transaction.objectStore(storeName);
                store.clear();
            });
        });
    }
    
    // Public API
    return {
        init,
        saveStocks,
        saveStock,
        getStocks,
        getStock,
        hasStocks,
        savePrices,
        getPrices,
        hasPrices,
        getStocksLastUpdated,
        setStocksLastUpdated,
        clearDatabase
    };
})(); 