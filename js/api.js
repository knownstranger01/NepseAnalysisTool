/**
 * API module for NEPSE Stock Analyzer
 * Handles communication with NEPSE API and data updates
 */

const API = (function() {
    // API endpoints
    const ENDPOINTS = {
        SYMBOLS: 'https://api.sharesansar.com/v1/stocks',
        PRICE_HISTORY: 'https://api.sharesansar.com/v1/stocks/history',
        COMPANY_INFO: 'https://api.sharesansar.com/v1/company'
    };

    // Fallback endpoints (use if primary fails)
    const FALLBACK_ENDPOINTS = {
        SYMBOLS: 'https://nepalstock.com.np/api/v1/stocks',
        PRICE_HISTORY: 'https://nepalstock.com.np/api/v1/stocks/history',
        COMPANY_INFO: 'https://nepalstock.com.np/api/v1/company'
    };
    
    // API configuration
    const CONFIG = {
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        HEADERS: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        },
        // CORS Proxy URLs (try these if direct access fails)
        CORS_PROXIES: [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://cors-proxy.htmldriven.com/?url='
        ]
    };
    
    /**
     * Fetch with retry functionality and CORS proxy fallback
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} - Promise that resolves with the response
     */
    async function fetchWithRetry(url, options = {}) {
        let lastError;
        
        // Try direct access first
        for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...CONFIG.HEADERS,
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                lastError = error;
                console.warn(`Direct attempt ${i + 1} failed:`, error);
                
                if (i < CONFIG.MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                }
            }
        }
        
        // If direct access fails, try CORS proxies
        for (const proxy of CONFIG.CORS_PROXIES) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    ...options,
                    headers: {
                        ...CONFIG.HEADERS,
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.warn(`Proxy attempt failed for ${proxy}:`, error);
                lastError = error;
            }
        }
        
        // If all attempts fail, try fallback endpoint
        try {
            const fallbackUrl = url.replace(
                Object.values(ENDPOINTS).find(endpoint => url.includes(endpoint)),
                Object.values(FALLBACK_ENDPOINTS).find(endpoint => url.replace(ENDPOINTS.SYMBOLS, '').includes(endpoint.replace(FALLBACK_ENDPOINTS.SYMBOLS, '')))
            );
            
            const response = await fetch(fallbackUrl, {
                ...options,
                headers: {
                    ...CONFIG.HEADERS,
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Fallback attempt failed:', error);
            lastError = error;
        }
        
        throw new Error(`Failed after all attempts: ${lastError.message}`);
    }
    
    /**
     * Fetch all stock symbols from NEPSE
     * @returns {Promise<Array>} - Array of stock objects
     */
    async function fetchSymbols() {
        try {
            const data = await fetchWithRetry(ENDPOINTS.SYMBOLS);
            
            // Transform data to our format
            return Array.isArray(data) ? data.map(item => ({
                symbol: item.symbol || item.stockSymbol,
                name: item.securityName || item.companyName,
                sector: item.sector || item.sectorName,
                industry: item.industry || null,
                listedShares: item.listedShares || 0,
                marketLot: item.marketLot || 10,
                eps: item.eps || null,
                peRatio: item.pe || item.peRatio || null,
                bookValue: item.bookValue || null,
                pbRatio: item.pbr || item.pbRatio || null,
                dividendYield: item.dividendYield || null,
                roe: item.roe || null
            })) : [];
        } catch (error) {
            console.error('Error fetching symbols:', error);
            throw new Error(`Failed to fetch symbols: ${error.message}`);
        }
    }
    
    /**
     * Fetch price history for a specific symbol
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Array>} - Array of price objects
     */
    async function fetchPriceHistory(symbol) {
        try {
            // Get current date
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1); // Get 1 year of data
            
            const params = new URLSearchParams({
                symbol: symbol,
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            });
            
            const data = await fetchWithRetry(`${ENDPOINTS.PRICE_HISTORY}?${params}`);
            
            // Transform data to our format
            return Array.isArray(data) ? data.map(item => ({
                date: item.businessDate || item.date,
                open: parseFloat(item.openPrice || item.open),
                high: parseFloat(item.highPrice || item.high),
                low: parseFloat(item.lowPrice || item.low),
                close: parseFloat(item.closePrice || item.close),
                volume: parseInt(item.volume || item.shareTraded, 10)
            })) : [];
        } catch (error) {
            console.error(`Error fetching price history for ${symbol}:`, error);
            throw error;
        }
    }
    
    /**
     * Fetch company information for a specific symbol
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} - Company information object
     */
    async function fetchCompanyInfo(symbol) {
        try {
            const data = await fetchWithRetry(`${ENDPOINTS.COMPANY_INFO}/${symbol}`);
            
            // Transform data to our format
            return {
                symbol: data.symbol || data.stockSymbol,
                name: data.companyName || data.securityName,
                sector: data.sectorName || data.sector,
                industry: data.industry || null,
                listedShares: data.listedShares || 0,
                marketLot: data.marketLot || 10,
                eps: data.eps || null,
                peRatio: data.pe || data.peRatio || null,
                bookValue: data.bookValue || null,
                pbRatio: data.pbr || data.pbRatio || null,
                dividendYield: data.dividendYield || null,
                roe: data.roe || null
            };
        } catch (error) {
            console.error(`Error fetching company info for ${symbol}:`, error);
            throw error;
        }
    }
    
    /**
     * Update all data in the database
     * @param {Function} progressCallback - Callback function for progress updates
     * @returns {Promise<Object>} - Result object with counts of updated items
     */
    async function updateAllData(progressCallback) {
        try {
            // Initialize counters
            let stocksUpdated = 0;
            let pricesUpdated = 0;
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    progress: 0,
                    message: 'Fetching stock symbols...'
                });
            }
            
            // Fetch all symbols
            const symbols = await fetchSymbols();
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    progress: 10,
                    message: `Fetched ${symbols.length} stock symbols.`
                });
            }
            
            // Save symbols to database
            await DB.saveStocks(symbols);
            stocksUpdated = symbols.length;
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    progress: 20,
                    message: 'Saved stock symbols to database.'
                });
            }
            
            // Fetch price history for each symbol
            const totalSymbols = symbols.length;
            let processedSymbols = 0;
            
            for (const stock of symbols) {
                try {
                    // Update progress
                    if (progressCallback) {
                        const progress = 20 + Math.floor((processedSymbols / totalSymbols) * 80);
                        progressCallback({
                            progress,
                            message: `Fetching price history for ${stock.symbol} (${processedSymbols + 1}/${totalSymbols})...`
                        });
                    }
                    
                    // Fetch price history
                    const prices = await fetchPriceHistory(stock.symbol);
                    
                    // Save prices to database
                    await DB.savePrices(stock.symbol, prices);
                    pricesUpdated++;
                    
                    // Increment counter
                    processedSymbols++;
                } catch (error) {
                    console.error(`Failed to update price history for ${stock.symbol}:`, error);
                    
                    // Update progress with error
                    if (progressCallback) {
                        progressCallback({
                            progress: 20 + Math.floor((processedSymbols / totalSymbols) * 80),
                            message: `Error fetching price history for ${stock.symbol}: ${error.message}`
                        });
                    }
                    
                    // Increment counter
                    processedSymbols++;
                }
                
                // Add a small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Update last updated timestamp
            await DB.setStocksLastUpdated(new Date().toISOString());
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    progress: 100,
                    message: `Update complete. Updated ${stocksUpdated} stocks and ${pricesUpdated} price histories.`
                });
            }
            
            return {
                stocksUpdated,
                pricesUpdated
            };
        } catch (error) {
            console.error('Error updating data:', error);
            throw error;
        }
    }
    
    /**
     * Update data for a specific symbol
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} - Updated stock and price data
     */
    async function updateSymbolData(symbol) {
        try {
            // Fetch company info
            const stockInfo = await fetchCompanyInfo(symbol);
            
            // Save stock to database
            await DB.saveStock(stockInfo);
            
            // Fetch price history
            const prices = await fetchPriceHistory(symbol);
            
            // Save prices to database
            await DB.savePrices(symbol, prices);
            
            return {
                stock: stockInfo,
                prices
            };
        } catch (error) {
            console.error(`Error updating data for ${symbol}:`, error);
            throw error;
        }
    }
    
    // Public API
    return {
        fetchSymbols,
        fetchPriceHistory,
        fetchCompanyInfo,
        updateAllData,
        updateSymbolData
    };
})(); 