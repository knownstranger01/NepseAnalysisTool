// कम्पनीहरू पृष्ठको लागि JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // कन्फिगरेसन
    const API_BASE_URL = 'https://merolagani.com/';
    const REFRESH_INTERVAL = 60 * 1000; // 1 मिनेट (मिलिसेकेन्डमा)
    
    // स्टेट भेरिएबलहरू
    let allStocks = [];
    let stocksMap = {};
    let sectors = [];
    let currentTab = 'all';
    let currentPage = 1;
    let itemsPerPage = 25;
    let sortBy = 'symbol';
    let sortOrder = 'asc';
    let searchTerm = '';
    let selectedSector = '';
    
    // DOM एलिमेन्टहरू
    const companiesTableBody = document.getElementById('companies-table-body');
    const paginationContainer = document.getElementById('pagination');
    const marketStatusIndicator = document.getElementById('market-status-indicator');
    const marketStatusText = document.getElementById('market-status-text');
    const lastUpdatedText = document.getElementById('last-updated');
    const companySearch = document.getElementById('company-search');
    const sectorFilter = document.getElementById('sector-filter');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // इनिसियलाइजेसन
    init();
    
    // मुख्य इनिसियलाइजेसन फंक्सन
    function init() {
        // इभेन्ट लिसनरहरू सेटअप गर्ने
        setupEventListeners();
        
        // क्षेत्रहरू लोड गर्ने
        loadSectors();
        
        // सबै स्टक्स लोड गर्ने
        loadAllStocks();
        
        // नियमित अपडेट सेटअप गर्ने
        setInterval(refreshData, REFRESH_INTERVAL);
    }
    
    // इभेन्ट लिसनरहरू सेटअप गर्ने
    function setupEventListeners() {
        // खोज इनपुट
        companySearch.addEventListener('input', function() {
            searchTerm = this.value.trim();
            currentPage = 1;
            renderStocksTable();
        });
        
        // क्षेत्र फिल्टर
        sectorFilter.addEventListener('change', function() {
            selectedSector = this.value;
            currentPage = 1;
            renderStocksTable();
        });
        
        // सर्ट बाइ
        sortBySelect.addEventListener('change', function() {
            sortBy = this.value;
            renderStocksTable();
        });
        
        // सर्ट अर्डर
        sortOrderSelect.addEventListener('change', function() {
            sortOrder = this.value;
            renderStocksTable();
        });
        
        // प्रति पेज आइटमहरू
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            renderStocksTable();
        });
        
        // ट्याब बटनहरू
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // सक्रिय ट्याब अपडेट गर्ने
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // ट्याब परिवर्तन गर्ने
                currentTab = this.getAttribute('data-tab');
                currentPage = 1;
                
                // टेबल रेन्डर गर्ने
                renderStocksTable();
            });
        });
    }
    
    // सबै क्षेत्रहरू लोड गर्ने
    function loadSectors() {
        fetch(`${API_BASE_URL}/sectors`)
            .then(response => response.json())
            .then(data => {
                sectors = data;
                
                // क्षेत्र फिल्टर अपडेट गर्ने
                let options = '<option value="">सबै क्षेत्रहरू</option>';
                sectors.forEach(sector => {
                    options += `<option value="${sector}">${sector}</option>`;
                });
                sectorFilter.innerHTML = options;
            })
            .catch(error => {
                console.error('Error loading sectors:', error);
            });
    }
    
    // सबै स्टक्स लोड गर्ने
    function loadAllStocks() {
        // लोडिङ स्टेट देखाउने
        companiesTableBody.innerHTML = '<tr><td colspan="11" class="text-center"><i class="fas fa-spinner fa-spin"></i> डाटा लोड हुँदैछ...</td></tr>';
        
        // स्टक्स लिस्ट प्राप्त गर्ने
        fetch(`${API_BASE_URL}/stocks_list`)
            .then(response => response.json())
            .then(stocksData => {
                // स्टक्स म्याप बनाउने
                stocksData.data.forEach(stock => {
                    stocksMap[stock.symbol] = {
                        symbol: stock.symbol,
                        company_name: stock.company_name,
                        sector: stock.sector
                    };
                });
                
                // वास्तविक समयको मूल्य डाटा प्राप्त गर्ने
                return fetch(`${API_BASE_URL}/nepse_data`);
            })
            .then(response => response.json())
            .then(priceData => {
                // मार्केट स्टेटस अपडेट गर्ने
                updateMarketStatus(priceData.meta);
                
                // स्टक्स डाटा मर्ज गर्ने
                allStocks = priceData.data.map(stock => {
                    const stockInfo = stocksMap[stock.symbol] || { 
                        company_name: 'अज्ञात कम्पनी', 
                        sector: 'अज्ञात क्षेत्र' 
                    };
                    
                    return {
                        ...stock,
                        company_name: stockInfo.company_name,
                        sector: stockInfo.sector
                    };
                });
                
                // टेबल रेन्डर गर्ने
                renderStocksTable();
            })
            .catch(error => {
                console.error('Error loading stocks:', error);
                companiesTableBody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">डाटा लोड गर्न समस्या भयो: ${error.message}</td></tr>`;
            });
    }
    
    // डाटा रिफ्रेस गर्ने
    function refreshData() {
        fetch(`${API_BASE_URL}/nepse_data`)
            .then(response => response.json())
            .then(priceData => {
                // मार्केट स्टेटस अपडेट गर्ने
                updateMarketStatus(priceData.meta);
                
                // स्टक्स डाटा अपडेट गर्ने
                allStocks = priceData.data.map(stock => {
                    const stockInfo = stocksMap[stock.symbol] || { 
                        company_name: 'अज्ञात कम्पनी', 
                        sector: 'अज्ञात क्षेत्र' 
                    };
                    
                    return {
                        ...stock,
                        company_name: stockInfo.company_name,
                        sector: stockInfo.sector
                    };
                });
                
                // टेबल रेन्डर गर्ने
                renderStocksTable();
            })
            .catch(error => {
                console.error('Error refreshing data:', error);
            });
    }
    
    // मार्केट स्टेटस अपडेट गर्ने
    function updateMarketStatus(meta) {
        const isOpen = meta.market_status === 'open';
        
        // स्टेटस इन्डिकेटर अपडेट गर्ने
        marketStatusIndicator.className = isOpen ? 'status-indicator open' : 'status-indicator closed';
        
        // स्टेटस टेक्स्ट अपडेट गर्ने
        marketStatusText.textContent = isOpen ? 'बजार खुला छ' : 'बजार बन्द छ';
        marketStatusText.className = isOpen ? 'status-text open' : 'status-text closed';
        
        // अन्तिम अपडेट समय अपडेट गर्ने
        lastUpdatedText.textContent = `अन्तिम अपडेट: ${meta.last_updated}`;
    }
    
    // स्टक्स टेबल रेन्डर गर्ने
    function renderStocksTable() {
        // फिल्टर गरिएको स्टक्स प्राप्त गर्ने
        let filteredStocks = filterStocks();
        
        // कुल पेजहरू गणना गर्ने
        const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
        
        // पेज भ्यालिडेसन
        if (currentPage > totalPages) {
            currentPage = totalPages > 0 ? totalPages : 1;
        }
        
        // वर्तमान पेजको स्टक्स प्राप्त गर्ने
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentStocks = filteredStocks.slice(startIndex, endIndex);
        
        // टेबल HTML बनाउने
        let tableHTML = '';
        
        if (currentStocks.length === 0) {
            tableHTML = '<tr><td colspan="11" class="text-center">कुनै परिणाम फेला परेन</td></tr>';
        } else {
            currentStocks.forEach(stock => {
                const changeClass = parseFloat(stock.percent_change) > 0 ? 'positive' : (parseFloat(stock.percent_change) < 0 ? 'negative' : '');
                
                tableHTML += `
                    <tr>
                        <td class="symbol"><a href="company.html?symbol=${stock.symbol}">${stock.symbol}</a></td>
                        <td class="company">${stock.company_name}</td>
                        <td class="sector">${stock.sector}</td>
                        <td class="price">रु. ${stock.ltp}</td>
                        <td class="change ${changeClass}">${stock.change}</td>
                        <td class="percent-change ${changeClass}">
                            ${parseFloat(stock.percent_change) > 0 ? '+' : ''}${stock.percent_change}%
                        </td>
                        <td class="high">रु. ${stock.high}</td>
                        <td class="low">रु. ${stock.low}</td>
                        <td class="open">रु. ${stock.open}</td>
                        <td class="volume">${formatNumber(stock.qty)}</td>
                        <td class="actions">
                            <button class="add-watchlist-btn" data-symbol="${stock.symbol}" title="वाचलिस्टमा थप्नुहोस्">
                                <i class="far fa-star"></i>
                            </button>
                            <button class="add-portfolio-btn" data-symbol="${stock.symbol}" title="पोर्टफोलियोमा थप्नुहोस्">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        // टेबल अपडेट गर्ने
        companiesTableBody.innerHTML = tableHTML;
        
        // पेजिनेसन रेन्डर गर्ने
        renderPagination(totalPages);
        
        // वाचलिस्ट र पोर्टफोलियो बटनहरूमा इभेन्ट लिसनरहरू थप्ने
        setupActionButtons();
    }
    
    // स्टक्स फिल्टर गर्ने
    function filterStocks() {
        let filteredStocks = [...allStocks];
        
        // ट्याब अनुसार फिल्टर गर्ने
        if (currentTab === 'gainers') {
            filteredStocks = filteredStocks.filter(stock => parseFloat(stock.percent_change) > 0);
        } else if (currentTab === 'losers') {
            filteredStocks = filteredStocks.filter(stock => parseFloat(stock.percent_change) < 0);
        }
        
        // खोज अनुसार फिल्टर गर्ने
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredStocks = filteredStocks.filter(stock => 
                stock.symbol.toLowerCase().includes(searchLower) || 
                stock.company_name.toLowerCase().includes(searchLower)
            );
        }
        
        // क्षेत्र अनुसार फिल्टर गर्ने
        if (selectedSector) {
            filteredStocks = filteredStocks.filter(stock => stock.sector === selectedSector);
        }
        
        // सर्ट गर्ने
        filteredStocks.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'ltp':
                    valueA = parseFloat(a.ltp.replace(/,/g, ''));
                    valueB = parseFloat(b.ltp.replace(/,/g, ''));
                    break;
                case 'change':
                    valueA = parseFloat(a.change);
                    valueB = parseFloat(b.change);
                    break;
                case 'percent_change':
                    valueA = parseFloat(a.percent_change);
                    valueB = parseFloat(b.percent_change);
                    break;
                case 'qty':
                    valueA = parseInt(a.qty.replace(/,/g, ''));
                    valueB = parseInt(b.qty.replace(/,/g, ''));
                    break;
                default: // symbol
                    valueA = a.symbol;
                    valueB = b.symbol;
                    return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            }
            
            if (sortOrder === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });
        
        return filteredStocks;
    }
    
    // पेजिनेसन रेन्डर गर्ने
    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // पहिलो पेज बटन
        paginationHTML += `<button class="pagination-btn first-page ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
        </button>`;
        
        // अघिल्लो पेज बटन
        paginationHTML += `<button class="pagination-btn prev-page ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
        </button>`;
        
        // पेज नम्बरहरू
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // पछिल्लो पेज बटन
        paginationHTML += `<button class="pagination-btn next-page ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
        </button>`;
        
        // अन्तिम पेज बटन
        paginationHTML += `<button class="pagination-btn last-page ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
        </button>`;
        
        // पेजिनेसन अपडेट गर्ने
        paginationContainer.innerHTML = paginationHTML;
        
        // पेजिनेसन बटनहरूमा इभेन्ट लिसनरहरू थप्ने
        setupPaginationListeners(totalPages);
    }
    
    // पेजिनेसन बटनहरूमा इभेन्ट लिसनरहरू थप्ने
    function setupPaginationListeners(totalPages) {
        // पेज नम्बर बटनहरू
        const pageNumberButtons = document.querySelectorAll('.pagination-btn.page-number');
        pageNumberButtons.forEach(button => {
            button.addEventListener('click', function() {
                currentPage = parseInt(this.getAttribute('data-page'));
                renderStocksTable();
            });
        });
        
        // पहिलो पेज बटन
        const firstPageButton = document.querySelector('.pagination-btn.first-page');
        if (firstPageButton) {
            firstPageButton.addEventListener('click', function() {
                if (currentPage !== 1) {
                    currentPage = 1;
                    renderStocksTable();
                }
            });
        }
        
        // अघिल्लो पेज बटन
        const prevPageButton = document.querySelector('.pagination-btn.prev-page');
        if (prevPageButton) {
            prevPageButton.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderStocksTable();
                }
            });
        }
        
        // पछिल्लो पेज बटन
        const nextPageButton = document.querySelector('.pagination-btn.next-page');
        if (nextPageButton) {
            nextPageButton.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderStocksTable();
                }
            });
        }
        
        // अन्तिम पेज बटन
        const lastPageButton = document.querySelector('.pagination-btn.last-page');
        if (lastPageButton) {
            lastPageButton.addEventListener('click', function() {
                if (currentPage !== totalPages) {
                    currentPage = totalPages;
                    renderStocksTable();
                }
            });
        }
    }
    
    // वाचलिस्ट र पोर्टफोलियो बटनहरूमा इभेन्ट लिसनरहरू थप्ने
    function setupActionButtons() {
        // वाचलिस्ट बटनहरू
        const watchlistButtons = document.querySelectorAll('.add-watchlist-btn');
        watchlistButtons.forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                addToWatchlist(symbol);
            });
        });
        
        // पोर्टफोलियो बटनहरू
        const portfolioButtons = document.querySelectorAll('.add-portfolio-btn');
        portfolioButtons.forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                addToPortfolio(symbol);
            });
        });
    }
    
    // वाचलिस्टमा थप्ने
    function addToWatchlist(symbol) {
        // यहाँ वाचलिस्टमा थप्ने लजिक थप्नुहोस्
        alert(`${symbol} वाचलिस्टमा थपियो! (डेमो मात्र)`);
    }
    
    // पोर्टफोलियोमा थप्ने
    function addToPortfolio(symbol) {
        // यहाँ पोर्टफोलियोमा थप्ने लजिक थप्नुहोस्
        window.location.href = `portfolio.html?add=${symbol}`;
    }
    
    // संख्या फर्म्याट गर्ने
    function formatNumber(num) {
        if (!num) return '0';
        
        // कमा हटाउने
        num = num.toString().replace(/,/g, '');
        
        // संख्यामा परिवर्तन गर्ने
        return parseInt(num).toLocaleString('en-IN');
    }
}); 