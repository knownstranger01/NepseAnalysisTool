/**
 * Main application module for NEPSE Stock Analyzer
 * Handles UI interactions and coordinates other modules
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    App.init();
});

const App = (function() {
    // Current state
    let currentSymbol = null;
    let currentPeriod = '1M';
    let currentChartType = 'candle';
    let currentTab = 'overview';
    let stockData = [];
    let isUpdating = false;
    
    // DOM elements
    const elements = {
        stockList: document.getElementById('stock-list'),
        stockSearch: document.getElementById('stock-search'),
        stockDetails: document.getElementById('stock-details'),
        stockAnalysis: document.getElementById('stock-analysis'),
        lastUpdated: document.getElementById('last-updated'),
        themeToggle: document.getElementById('theme-toggle'),
        refreshData: document.getElementById('refresh-data'),
        updateModal: document.getElementById('update-modal'),
        updateProgress: document.getElementById('update-progress'),
        progressText: document.getElementById('progress-text'),
        updateLog: document.getElementById('update-log'),
        cancelUpdate: document.getElementById('cancel-update'),
        closeModal: document.querySelector('.close-modal'),
        periodBtns: document.querySelectorAll('.period-btn'),
        chartTypeBtns: document.querySelectorAll('.chart-type-btn'),
        tabBtns: document.querySelectorAll('.tab-btn')
    };
    
    /**
     * Initialize the application
     */
    async function init() {
        // Initialize database
        await DB.init();
        
        // Initialize charts
        Charts.init();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load stocks from database
        await loadStocks();
        
        // Check if we need to update data
        checkDataStatus();
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // Refresh data
        elements.refreshData.addEventListener('click', startDataUpdate);
        
        // Stock search
        elements.stockSearch.addEventListener('input', filterStocks);
        
        // Period buttons
        elements.periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setActivePeriod(btn.dataset.period);
            });
        });
        
        // Chart type buttons
        elements.chartTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveChartType(btn.dataset.type);
            });
        });
        
        // Tab buttons
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveTab(btn.dataset.tab);
            });
        });
        
        // Update modal
        elements.cancelUpdate.addEventListener('click', cancelDataUpdate);
        elements.closeModal.addEventListener('click', hideUpdateModal);
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
    }
    
    /**
     * Load stocks from database
     */
    async function loadStocks() {
        try {
            // Show loading indicator
            elements.stockList.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i> Loading stocks...
                </div>
            `;
            
            // Check if we have stocks in the database
            const hasStocks = await DB.hasStocks();
            
            if (hasStocks) {
                // Get stocks from database
                const stocks = await DB.getStocks();
                
                // Sort stocks by symbol
                stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
                
                // Render stock list
                renderStockList(stocks);
                
                // Update last updated timestamp
                updateLastUpdatedTimestamp();
            } else {
                // No stocks in database, show message
                elements.stockList.innerHTML = `
                    <div class="no-data">
                        <p>No stock data available.</p>
                        <p>Click "Update Data" to fetch the latest data.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load stocks:', error);
            elements.stockList.innerHTML = `
                <div class="error">
                    <p>Failed to load stocks.</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Render the stock list
     * @param {Array} stocks - Array of stock objects
     */
    function renderStockList(stocks) {
        if (!stocks || stocks.length === 0) {
            elements.stockList.innerHTML = `
                <div class="no-data">
                    <p>No stocks found.</p>
                </div>
            `;
            return;
        }
        
        // Clear stock list
        elements.stockList.innerHTML = '';
        
        // Create stock items
        stocks.forEach(stock => {
            const stockItem = document.createElement('div');
            stockItem.className = 'stock-item';
            stockItem.dataset.symbol = stock.symbol;
            stockItem.innerHTML = `
                <span class="symbol">${stock.symbol}</span>
                <span class="name">${stock.name}</span>
            `;
            
            // Add click event
            stockItem.addEventListener('click', () => {
                selectStock(stock.symbol);
            });
            
            // Add to stock list
            elements.stockList.appendChild(stockItem);
        });
    }
    
    /**
     * Filter stocks based on search input
     */
    async function filterStocks() {
        const searchTerm = elements.stockSearch.value.trim().toUpperCase();
        
        if (searchTerm === '') {
            // Reset filter
            const stocks = await DB.getStocks();
            renderStockList(stocks);
            return;
        }
        
        // Get all stocks
        const stocks = await DB.getStocks();
        
        // Filter stocks
        const filteredStocks = stocks.filter(stock => {
            return stock.symbol.includes(searchTerm) || 
                   stock.name.toUpperCase().includes(searchTerm);
        });
        
        // Render filtered stocks
        renderStockList(filteredStocks);
    }
    
    /**
     * Select a stock and show its details
     * @param {string} symbol - Stock symbol
     */
    async function selectStock(symbol) {
        try {
            // Update current symbol
            currentSymbol = symbol;
            
            // Update active stock item
            const stockItems = elements.stockList.querySelectorAll('.stock-item');
            stockItems.forEach(item => {
                if (item.dataset.symbol === symbol) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Show loading state
            elements.stockDetails.classList.add('hidden');
            elements.stockAnalysis.classList.remove('hidden');
            elements.stockAnalysis.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i> Loading data for ${symbol}...
                </div>
            `;
            
            // Get stock details
            const stock = await DB.getStock(symbol);
            
            // Check if we have price data
            const hasPrices = await DB.hasPrices(symbol);
            
            if (!hasPrices) {
                // No price data, show message
                elements.stockAnalysis.innerHTML = `
                    <div class="no-data">
                        <p>No price data available for ${symbol}.</p>
                        <p>Click "Update Data" to fetch the latest data.</p>
                    </div>
                `;
                return;
            }
            
            // Get price data
            const prices = await DB.getPrices(symbol);
            
            // Store price data
            stockData = prices;
            
            // Render stock details
            renderStockDetails(stock, prices);
            
            // Update charts
            updateCharts();
            
            // Show stock analysis
            elements.stockDetails.classList.add('hidden');
            elements.stockAnalysis.classList.remove('hidden');
        } catch (error) {
            console.error(`Failed to load data for ${symbol}:`, error);
            elements.stockAnalysis.innerHTML = `
                <div class="error">
                    <p>Failed to load data for ${symbol}.</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Render stock details
     * @param {Object} stock - Stock object
     * @param {Array} prices - Array of price objects
     */
    function renderStockDetails(stock, prices) {
        // Get latest price
        const latestPrice = prices[prices.length - 1];
        
        // Calculate price change
        const previousPrice = prices.length > 1 ? prices[prices.length - 2].close : latestPrice.open;
        const priceChange = latestPrice.close - previousPrice;
        const priceChangePercent = (priceChange / previousPrice) * 100;
        
        // Update stock header
        document.getElementById('stock-name').textContent = stock.name;
        document.getElementById('stock-symbol').textContent = stock.symbol;
        document.getElementById('current-price').textContent = latestPrice.close.toFixed(2);
        
        const priceChangeElement = document.getElementById('price-change');
        priceChangeElement.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)`;
        
        if (priceChange >= 0) {
            priceChangeElement.className = 'price-up';
        } else {
            priceChangeElement.className = 'price-down';
        }
        
        // Update overview tab
        document.getElementById('open-price').textContent = latestPrice.open.toFixed(2);
        document.getElementById('high-price').textContent = latestPrice.high.toFixed(2);
        document.getElementById('low-price').textContent = latestPrice.low.toFixed(2);
        document.getElementById('close-price').textContent = latestPrice.close.toFixed(2);
        document.getElementById('volume').textContent = latestPrice.volume.toLocaleString();
        
        // Calculate 52-week high and low
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const yearPrices = prices.filter(price => new Date(price.date) >= oneYearAgo);
        
        if (yearPrices.length > 0) {
            const high52w = Math.max(...yearPrices.map(price => price.high));
            const low52w = Math.min(...yearPrices.map(price => price.low));
            
            document.getElementById('52w-high').textContent = high52w.toFixed(2);
            document.getElementById('52w-low').textContent = low52w.toFixed(2);
        } else {
            document.getElementById('52w-high').textContent = 'N/A';
            document.getElementById('52w-low').textContent = 'N/A';
        }
        
        // Calculate market cap
        const marketCap = stock.listedShares * latestPrice.close;
        document.getElementById('market-cap').textContent = formatCurrency(marketCap);
        
        // Update technical indicators
        const indicators = Indicators.getLatestValues(prices);
        
        // RSI
        if (indicators.rsi !== null) {
            document.getElementById('rsi-value').textContent = indicators.rsi.toFixed(2);
            document.getElementById('rsi-interpretation').textContent = Indicators.getInterpretation('rsi', indicators.rsi);
            
            if (indicators.rsi > 70) {
                document.getElementById('rsi-interpretation').className = 'indicator-interpretation text-red';
            } else if (indicators.rsi < 30) {
                document.getElementById('rsi-interpretation').className = 'indicator-interpretation text-green';
            } else {
                document.getElementById('rsi-interpretation').className = 'indicator-interpretation';
            }
        }
        
        // MACD
        if (indicators.macd.histogram !== null) {
            document.getElementById('macd-value').textContent = indicators.macd.histogram.toFixed(2);
            document.getElementById('macd-interpretation').textContent = Indicators.getInterpretation('macd', indicators.macd.histogram);
            
            if (indicators.macd.histogram > 0) {
                document.getElementById('macd-interpretation').className = 'indicator-interpretation text-green';
            } else {
                document.getElementById('macd-interpretation').className = 'indicator-interpretation text-red';
            }
        }
        
        // Moving Averages
        if (indicators.sma.sma20 !== null) {
            document.getElementById('ma20-value').textContent = indicators.sma.sma20.toFixed(2);
        }
        
        if (indicators.sma.sma50 !== null) {
            document.getElementById('ma50-value').textContent = indicators.sma.sma50.toFixed(2);
        }
        
        if (indicators.sma.sma200 !== null) {
            document.getElementById('ma200-value').textContent = indicators.sma.sma200.toFixed(2);
        }
        
        // MA interpretation
        let maInterpretation = 'Neutral';
        let maClass = 'indicator-interpretation';
        
        if (indicators.sma.sma20 !== null && indicators.sma.sma50 !== null) {
            if (latestPrice.close > indicators.sma.sma20 && latestPrice.close > indicators.sma.sma50) {
                maInterpretation = 'Bullish';
                maClass = 'indicator-interpretation text-green';
            } else if (latestPrice.close < indicators.sma.sma20 && latestPrice.close < indicators.sma.sma50) {
                maInterpretation = 'Bearish';
                maClass = 'indicator-interpretation text-red';
            }
        }
        
        document.getElementById('ma-interpretation').textContent = maInterpretation;
        document.getElementById('ma-interpretation').className = maClass;
        
        // Bollinger Bands
        if (indicators.bollingerBands.upper !== null) {
            document.getElementById('bb-upper').textContent = indicators.bollingerBands.upper.toFixed(2);
        }
        
        if (indicators.bollingerBands.middle !== null) {
            document.getElementById('bb-middle').textContent = indicators.bollingerBands.middle.toFixed(2);
        }
        
        if (indicators.bollingerBands.lower !== null) {
            document.getElementById('bb-lower').textContent = indicators.bollingerBands.lower.toFixed(2);
        }
        
        // BB interpretation
        let bbInterpretation = 'Neutral';
        let bbClass = 'indicator-interpretation';
        
        if (indicators.bollingerBands.upper !== null && indicators.bollingerBands.lower !== null) {
            if (latestPrice.close > indicators.bollingerBands.upper) {
                bbInterpretation = 'Overbought';
                bbClass = 'indicator-interpretation text-red';
            } else if (latestPrice.close < indicators.bollingerBands.lower) {
                bbInterpretation = 'Oversold';
                bbClass = 'indicator-interpretation text-green';
            } else if (latestPrice.close > indicators.bollingerBands.middle) {
                bbInterpretation = 'Bullish';
                bbClass = 'indicator-interpretation text-green';
            } else {
                bbInterpretation = 'Bearish';
                bbClass = 'indicator-interpretation text-red';
            }
        }
        
        document.getElementById('bb-interpretation').textContent = bbInterpretation;
        document.getElementById('bb-interpretation').className = bbClass;
        
        // Update fundamental data
        document.getElementById('sector').textContent = stock.sector || 'N/A';
        document.getElementById('industry').textContent = stock.industry || 'N/A';
        document.getElementById('listed-shares').textContent = stock.listedShares ? stock.listedShares.toLocaleString() : 'N/A';
        document.getElementById('market-lot').textContent = stock.marketLot || 'N/A';
        
        document.getElementById('eps').textContent = stock.eps ? stock.eps.toFixed(2) : 'N/A';
        document.getElementById('pe-ratio').textContent = stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A';
        document.getElementById('book-value').textContent = stock.bookValue ? stock.bookValue.toFixed(2) : 'N/A';
        document.getElementById('pb-ratio').textContent = stock.pbRatio ? stock.pbRatio.toFixed(2) : 'N/A';
        document.getElementById('dividend-yield').textContent = stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A';
        document.getElementById('roe').textContent = stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A';
        
        // Update recommendation
        const signals = indicators.signals;
        
        if (signals && signals.recommendation) {
            let recommendationText;
            let meterWidth;
            
            switch (signals.recommendation) {
                case 'STRONG_BUY':
                    recommendationText = 'STRONG BUY';
                    meterWidth = '90%';
                    break;
                case 'BUY':
                    recommendationText = 'BUY';
                    meterWidth = '70%';
                    break;
                case 'NEUTRAL':
                    recommendationText = 'NEUTRAL';
                    meterWidth = '50%';
                    break;
                case 'SELL':
                    recommendationText = 'SELL';
                    meterWidth = '30%';
                    break;
                case 'STRONG_SELL':
                    recommendationText = 'STRONG SELL';
                    meterWidth = '10%';
                    break;
                default:
                    recommendationText = 'NEUTRAL';
                    meterWidth = '50%';
            }
            
            document.querySelector('.recommendation-value').textContent = recommendationText;
            document.querySelector('.meter-fill').style.width = meterWidth;
        }
    }
    
    /**
     * Update charts with current data
     */
    function updateCharts() {
        if (!stockData || stockData.length === 0) return;
        
        Charts.updateCharts(stockData, {
            period: currentPeriod,
            chartType: currentChartType,
            showSMA: true,
            showEMA: false,
            showBB: false
        });
    }
    
    /**
     * Set active period
     * @param {string} period - Period to set active
     */
    function setActivePeriod(period) {
        currentPeriod = period;
        
        // Update active button
        elements.periodBtns.forEach(btn => {
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update charts
        updateCharts();
    }
    
    /**
     * Set active chart type
     * @param {string} type - Chart type to set active
     */
    function setActiveChartType(type) {
        currentChartType = type;
        
        // Update active button
        elements.chartTypeBtns.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update charts
        updateCharts();
    }
    
    /**
     * Set active tab
     * @param {string} tab - Tab to set active
     */
    function setActiveTab(tab) {
        currentTab = tab;
        
        // Update active button
        elements.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update active tab pane
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            if (pane.id === `${tab}-tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }
    
    /**
     * Toggle theme between light and dark
     */
    function toggleTheme() {
        const body = document.body;
        const themeIcon = elements.themeToggle.querySelector('i');
        
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        
        // Update charts to reflect theme change
        if (currentSymbol) {
            updateCharts();
        }
    }
    
    /**
     * Check data status and update UI
     */
    async function checkDataStatus() {
        try {
            // Get last updated timestamp
            const lastUpdated = await DB.getStocksLastUpdated();
            
            if (lastUpdated) {
                // Format timestamp
                const date = new Date(lastUpdated);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                // Update UI
                elements.lastUpdated.textContent = `Last updated: ${formattedDate}`;
            } else {
                elements.lastUpdated.textContent = 'Last updated: Never';
            }
        } catch (error) {
            console.error('Failed to check data status:', error);
            elements.lastUpdated.textContent = 'Last updated: Unknown';
        }
    }
    
    /**
     * Update last updated timestamp
     */
    async function updateLastUpdatedTimestamp() {
        try {
            // Get last updated timestamp
            const lastUpdated = await DB.getStocksLastUpdated();
            
            if (lastUpdated) {
                // Format timestamp
                const date = new Date(lastUpdated);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                // Update UI
                elements.lastUpdated.textContent = `Last updated: ${formattedDate}`;
            }
        } catch (error) {
            console.error('Failed to update timestamp:', error);
        }
    }
    
    /**
     * Start data update process
     */
    function startDataUpdate() {
        if (isUpdating) return;
        
        // Show update modal
        showUpdateModal();
        
        // Set updating flag
        isUpdating = true;
        
        // Reset progress
        elements.updateProgress.style.width = '0%';
        elements.progressText.textContent = 'Preparing to update data...';
        elements.updateLog.innerHTML = '';
        
        // Start update
        API.updateAllData(updateProgress)
            .then(result => {
                // Update complete
                elements.progressText.textContent = 'Update complete!';
                elements.updateProgress.style.width = '100%';
                
                // Add log entry
                addUpdateLogEntry(`Updated ${result.stocksUpdated} stocks and ${result.pricesUpdated} price histories.`);
                
                // Reload stocks
                loadStocks();
                
                // Reset updating flag
                isUpdating = false;
                
                // Hide modal after delay
                setTimeout(hideUpdateModal, 2000);
            })
            .catch(error => {
                // Update failed
                elements.progressText.textContent = `Update failed: ${error.message}`;
                elements.updateProgress.style.width = '0%';
                
                // Add log entry
                addUpdateLogEntry(`Error: ${error.message}`, true);
                
                // Reset updating flag
                isUpdating = false;
            });
    }
    
    /**
     * Update progress callback
     * @param {Object} progress - Progress object
     */
    function updateProgress(progress) {
        // Update progress bar
        elements.updateProgress.style.width = `${progress.progress}%`;
        
        // Update progress text
        elements.progressText.textContent = progress.message;
        
        // Add log entry
        addUpdateLogEntry(progress.message);
    }
    
    /**
     * Add entry to update log
     * @param {string} message - Log message
     * @param {boolean} isError - Whether this is an error message
     */
    function addUpdateLogEntry(message, isError = false) {
        const entry = document.createElement('div');
        entry.className = isError ? 'log-entry error' : 'log-entry';
        
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;
        
        elements.updateLog.appendChild(entry);
        elements.updateLog.scrollTop = elements.updateLog.scrollHeight;
    }
    
    /**
     * Show update modal
     */
    function showUpdateModal() {
        elements.updateModal.classList.add('show');
    }
    
    /**
     * Hide update modal
     */
    function hideUpdateModal() {
        elements.updateModal.classList.remove('show');
    }
    
    /**
     * Cancel data update
     */
    function cancelDataUpdate() {
        if (!isUpdating) return;
        
        // Add log entry
        addUpdateLogEntry('Update cancelled by user.');
        
        // Reset updating flag
        isUpdating = false;
        
        // Hide modal
        hideUpdateModal();
    }
    
    /**
     * Handle window resize
     */
    function handleResize() {
        // Update charts
        if (currentSymbol) {
            updateCharts();
        }
    }
    
    /**
     * Format currency value
     * @param {number} value - Value to format
     * @returns {string} - Formatted currency string
     */
    function formatCurrency(value) {
        if (value === null || value === undefined) return 'N/A';
        
        if (value >= 1e9) {
            return `${(value / 1e9).toFixed(2)}B`;
        } else if (value >= 1e6) {
            return `${(value / 1e6).toFixed(2)}M`;
        } else if (value >= 1e3) {
            return `${(value / 1e3).toFixed(2)}K`;
        } else {
            return value.toFixed(2);
        }
    }
    
    // Public API
    return {
        init
    };
})(); 