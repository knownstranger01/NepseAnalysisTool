// वाचलिस्ट र मूल्य अलर्ट व्यवस्थापन
document.addEventListener('DOMContentLoaded', function() {
    // कन्फिगरेसन
    const API_BASE_URL = 'http://localhost:5000';
    const REFRESH_INTERVAL = 60 * 1000; // 1 मिनेट (मिलिसेकेन्डमा)
    
    // DOM एलिमेन्टहरू
    const addStockBtn = document.getElementById('add-stock-btn');
    const addStockModal = document.getElementById('add-stock-modal');
    const editAlertModal = document.getElementById('edit-alert-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const cancelAddStockBtn = document.getElementById('cancel-add-stock');
    const confirmAddStockBtn = document.getElementById('confirm-add-stock');
    const cancelEditAlertBtn = document.getElementById('cancel-edit-alert');
    const confirmEditAlertBtn = document.getElementById('confirm-edit-alert');
    const stockSymbolInput = document.getElementById('stock-symbol');
    const alertPriceInput = document.getElementById('alert-price');
    const alertConditionSelect = document.getElementById('alert-condition');
    const editAlertPriceInput = document.getElementById('edit-alert-price');
    const editAlertConditionSelect = document.getElementById('edit-alert-condition');
    const watchlistTableContainer = document.getElementById('watchlist-table-container');
    const watchlistTableBody = document.getElementById('watchlist-table-body');
    const emptyWatchlist = document.getElementById('empty-watchlist');
    const alertsList = document.getElementById('alerts-list');
    const emptyAlerts = document.getElementById('empty-alerts');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotification = document.querySelector('.close-notification');
    const totalStocksElement = document.getElementById('total-stocks');
    const avgChangeElement = document.getElementById('avg-change');
    const refreshBtn = document.getElementById('refresh-btn');
    const clearWatchlistBtn = document.getElementById('clear-watchlist-btn');
    
    // अलर्ट मोडल एलिमेन्टहरू
    const alertModal = document.getElementById('alert-modal');
    const alertStockInfo = document.getElementById('alert-stock-info');
    const alertForm = document.getElementById('alert-form');
    const alertSymbolInput = document.getElementById('alert-symbol');
    const removeAlertBtn = document.getElementById('remove-alert-btn');

    // वाचलिस्ट र अलर्टहरू स्टोरेज
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    let currentEditingStock = null;
    let allStocks = [];
    let isLoggedIn = false; // डेमोको लागि, वास्तविक एप्लिकेशनमा यो सर्भरबाट आउनेछ

    // मोडल खोल्ने र बन्द गर्ने फंक्सनहरू
    function openModal(modal) {
        modal.classList.add('show');
    }

    function closeModal(modal) {
        modal.classList.remove('show');
    }

    // नोटिफिकेसन देखाउने फंक्सन
    function showNotification(message) {
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        // 5 सेकेन्डपछि नोटिफिकेसन हटाउने
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // वाचलिस्ट अपडेट गर्ने फंक्सन
    function updateWatchlist() {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        renderWatchlist();
        renderAlerts();
    }

    // वाचलिस्ट रेन्डर गर्ने फंक्सन
    function renderWatchlist() {
        if (watchlist.length === 0) {
            watchlistTableContainer.style.display = 'none';
            emptyWatchlist.style.display = 'block';
            totalStocksElement.textContent = '0';
            avgChangeElement.textContent = '0.00%';
            return;
        }

        watchlistTableContainer.style.display = 'block';
        emptyWatchlist.style.display = 'none';
        
        // वाचलिस्ट टेबल अपडेट गर्ने
        watchlistTableBody.innerHTML = '';
        
        // स्टक्स काउन्टर र औसत परिवर्तन गणना गर्ने
        totalStocksElement.textContent = watchlist.length;
        
        let totalChange = 0;
        
        watchlist.forEach(stock => {
            // परिवर्तन प्रतिशत गणना गर्ने
            totalChange += stock.changePercent;
            
            // परिवर्तन क्लास
            const changeClass = stock.changePercent >= 0 ? 'positive' : 'negative';
            const changeSymbol = stock.changePercent >= 0 ? '+' : '';
            
            // अलर्ट जानकारी
            let alertInfo = 'अलर्ट सेट गर्नुहोस्';
            let alertClass = '';
            
            if (stock.alertPrice && stock.alertCondition) {
                const condition = stock.alertCondition === 'above' ? 'माथि' : 'तल';
                alertInfo = `रु ${stock.alertPrice} ${condition}`;
                alertClass = 'has-alert';
            }
            
            // रो सिर्जना गर्ने
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="symbol"><a href="analysis.html?symbol=${stock.symbol}">${stock.symbol}</a></td>
                <td class="company-name">${stock.name}</td>
                <td class="price">रु ${stock.price.toFixed(2)}</td>
                <td class="change ${changeClass}">${changeSymbol}${stock.changePercent.toFixed(2)}%</td>
                <td class="alert ${alertClass}">
                    <button class="alert-btn" data-symbol="${stock.symbol}">
                        ${alertInfo}
                    </button>
                </td>
                <td class="actions">
                    <button class="remove-btn" data-symbol="${stock.symbol}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            watchlistTableBody.appendChild(row);
        });
        
        // औसत परिवर्तन गणना गर्ने
        const avgChange = totalChange / watchlist.length;
        const avgChangeClass = avgChange >= 0 ? 'positive' : 'negative';
        const avgChangeSymbol = avgChange >= 0 ? '+' : '';
        
        avgChangeElement.textContent = `${avgChangeSymbol}${avgChange.toFixed(2)}%`;
        avgChangeElement.className = 'stat-value ' + avgChangeClass;
        
        // अलर्ट बटनहरूमा इभेन्ट लिस्नर थप्ने
        document.querySelectorAll('.alert-btn').forEach(button => {
            button.addEventListener('click', function() {
                openAlertModal(this.getAttribute('data-symbol'));
            });
        });
        
        // हटाउने बटनहरूमा इभेन्ट लिस्नर थप्ने
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                removeFromWatchlist(this.getAttribute('data-symbol'));
            });
        });
    }

    // अलर्टहरू रेन्डर गर्ने फंक्सन
    function renderAlerts() {
        const stocksWithAlerts = watchlist.filter(stock => stock.alertPrice);
        
        if (stocksWithAlerts.length === 0) {
            alertsList.style.display = 'none';
            emptyAlerts.style.display = 'block';
            return;
        }
        
        alertsList.style.display = 'grid';
        emptyAlerts.style.display = 'none';
        
        // अलर्ट कार्डहरू अपडेट गर्ने
        alertsList.innerHTML = '';
        
        stocksWithAlerts.forEach(stock => {
            const alertCard = document.createElement('div');
            alertCard.className = 'alert-card';
            
            // अलर्ट स्थिति निर्धारण गर्ने
            let alertStatus = 'active';
            let isTriggered = false;
            
            if (stock.alertCondition === 'above' && stock.price >= stock.alertPrice) {
                alertStatus = 'triggered';
                isTriggered = true;
            } else if (stock.alertCondition === 'below' && stock.price <= stock.alertPrice) {
                alertStatus = 'triggered';
                isTriggered = true;
            }
            
            // अलर्ट अवस्था अनुसार सन्देश
            const conditionText = stock.alertCondition === 'above' 
                ? `मूल्य रु ${stock.alertPrice} भन्दा माथि जाँदा`
                : `मूल्य रु ${stock.alertPrice} भन्दा तल जाँदा`;
            
            alertCard.innerHTML = `
                <div class="status ${alertStatus}"></div>
                <div class="symbol">${stock.symbol}</div>
                <div class="company">${stock.name}</div>
                <div class="price-info">
                    <div class="current-price">रु ${stock.price.toFixed(2)}</div>
                    <div class="alert-price">रु ${stock.alertPrice}</div>
                </div>
                <div class="condition">
                    ${conditionText}
                    ${isTriggered ? '<span class="triggered-text">(अलर्ट सक्रिय!)</span>' : ''}
                </div>
                <div class="actions">
                    <button class="action-btn edit-alert" data-symbol="${stock.symbol}" title="अलर्ट सम्पादन गर्नुहोस्">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-alert" data-symbol="${stock.symbol}" title="अलर्ट हटाउनुहोस्">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            alertsList.appendChild(alertCard);
        });
        
        // अलर्ट कार्ड बटनहरूमा इभेन्ट लिस्नरहरू थप्ने फंक्सन
        addAlertCardListeners();
    }

    // कार्य बटनहरूमा इभेन्ट लिस्नरहरू थप्ने फंक्सन
    function addActionButtonListeners() {
        // अलर्ट सम्पादन बटनहरू
        document.querySelectorAll('.action-btn.edit-alert').forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                editAlert(symbol);
            });
        });
        
        // विश्लेषण हेर्ने बटनहरू
        document.querySelectorAll('.action-btn.view-analysis').forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                window.location.href = `analysis.html?symbol=${symbol}`;
            });
        });
        
        // हटाउने बटनहरू
        document.querySelectorAll('.action-btn.delete').forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                removeFromWatchlist(symbol);
            });
        });
    }

    // अलर्ट कार्ड बटनहरूमा इभेन्ट लिस्नरहरू थप्ने फंक्सन
    function addAlertCardListeners() {
        // अलर्ट सम्पादन बटनहरू
        document.querySelectorAll('.alert-card .edit-alert').forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                editAlert(symbol);
            });
        });
        
        // अलर्ट हटाउने बटनहरू
        document.querySelectorAll('.alert-card .delete-alert').forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                removeAlert(symbol);
            });
        });
    }

    // वाचलिस्टमा शेयर थप्ने फंक्सन
    function addToWatchlist(symbol, alertPrice, alertCondition) {
        // सिम्बल खाली छ कि छैन जाँच गर्ने
        if (!symbol.trim()) {
            showNotification('कृपया शेयर सिम्बल प्रविष्ट गर्नुहोस्');
            return false;
        }
        
        // सिम्बल पहिले नै वाचलिस्टमा छ कि छैन जाँच गर्ने
        if (watchlist.some(stock => stock.symbol === symbol.toUpperCase())) {
            showNotification(`${symbol.toUpperCase()} पहिले नै तपाईंको वाचलिस्टमा छ`);
            return false;
        }
        
        // अलर्ट मूल्य वैध छ कि छैन जाँच गर्ने
        if (alertPrice && (isNaN(alertPrice) || alertPrice <= 0)) {
            showNotification('कृपया वैध अलर्ट मूल्य प्रविष्ट गर्नुहोस्');
            return false;
        }
        
        // नयाँ शेयर डेटा सिर्जना गर्ने (वास्तविक API बाट आउने डेटाको सट्टा डेमो डेटा)
        const newStock = {
            symbol: symbol.toUpperCase(),
            name: getCompanyName(symbol.toUpperCase()),
            price: getRandomPrice(500, 2000),
            changePercent: getRandomChange(-5, 5),
            alertPrice: alertPrice ? parseFloat(alertPrice) : null,
            alertCondition: alertCondition
        };
        
        // वाचलिस्टमा थप्ने
        watchlist.push(newStock);
        updateWatchlist();
        
        // अलर्ट सेट गरिएको छ भने नोटिफिकेसन देखाउने
        if (alertPrice) {
            const conditionText = alertCondition === 'above' ? 'माथि जाँदा' : 'तल जाँदा';
            showNotification(`${symbol.toUpperCase()} लाई वाचलिस्टमा थपियो र मूल्य रु ${alertPrice} भन्दा ${conditionText} अलर्ट सेट गरियो`);
        } else {
            showNotification(`${symbol.toUpperCase()} लाई वाचलिस्टमा थपियो`);
        }
        
        return true;
    }

    // वाचलिस्टबाट शेयर हटाउने फंक्सन
    function removeFromWatchlist(symbol) {
        watchlist = watchlist.filter(stock => stock.symbol !== symbol);
        updateWatchlist();
        showNotification(`${symbol} लाई वाचलिस्टबाट हटाइयो`);
    }

    // अलर्ट सम्पादन गर्ने फंक्सन
    function editAlert(symbol) {
        const stock = watchlist.find(stock => stock.symbol === symbol);
        
        if (!stock) return;
        
        currentEditingStock = stock;
        
        // मोडलमा अहिलेको मान भर्ने
        editAlertPriceInput.value = stock.alertPrice || '';
        editAlertConditionSelect.value = stock.alertCondition || 'above';
        
        // मोडल खोल्ने
        openModal(editAlertModal);
    }

    // अलर्ट अपडेट गर्ने फंक्सन
    function updateAlert(symbol, alertPrice, alertCondition) {
        const stockIndex = watchlist.findIndex(stock => stock.symbol === symbol);
        
        if (stockIndex === -1) return false;
        
        // अलर्ट मूल्य वैध छ कि छैन जाँच गर्ने
        if (alertPrice && (isNaN(alertPrice) || alertPrice <= 0)) {
            showNotification('कृपया वैध अलर्ट मूल्य प्रविष्ट गर्नुहोस्');
            return false;
        }
        
        // अलर्ट अपडेट गर्ने
        watchlist[stockIndex].alertPrice = alertPrice ? parseFloat(alertPrice) : null;
        watchlist[stockIndex].alertCondition = alertCondition;
        
        updateWatchlist();
        
        // नोटिफिकेसन देखाउने
        if (alertPrice) {
            const conditionText = alertCondition === 'above' ? 'माथि जाँदा' : 'तल जाँदा';
            showNotification(`${symbol} को अलर्ट अपडेट गरियो: मूल्य रु ${alertPrice} भन्दा ${conditionText}`);
        } else {
            showNotification(`${symbol} को अलर्ट हटाइयो`);
        }
        
        return true;
    }

    // अलर्ट हटाउने फंक्सन
    function removeAlert(symbol) {
        const stockIndex = watchlist.findIndex(stock => stock.symbol === symbol);
        
        if (stockIndex === -1) return;
        
        // अलर्ट हटाउने तर शेयर वाचलिस्टमा राख्ने
        watchlist[stockIndex].alertPrice = null;
        watchlist[stockIndex].alertCondition = null;
        
        updateWatchlist();
        showNotification(`${symbol} को अलर्ट हटाइयो`);
    }

    // कम्पनी नाम प्राप्त गर्ने फंक्सन (वास्तविक API को सट्टा)
    function getCompanyName(symbol) {
        const companies = {
            'NABIL': 'नबिल बैंक लिमिटेड',
            'NRIC': 'नेपाल पुनर्बीमा कम्पनी लिमिटेड',
            'UPPER': 'अपर तामाकोशी हाइड्रोपावर लिमिटेड',
            'NTC': 'नेपाल टेलिकम',
            'NHPC': 'नेशनल हाइड्रोपावर कम्पनी लिमिटेड',
            'ADBL': 'कृषि विकास बैंक लिमिटेड',
            'CHCL': 'सोल्टी होटल लिमिटेड',
            'GBIME': 'ग्लोबल आईएमई बैंक लिमिटेड',
            'NICA': 'एनआईसी एशिया बैंक लिमिटेड',
            'NIFRA': 'नेपाल इन्फ्रास्ट्रक्चर बैंक लिमिटेड',
            'PRVU': 'प्रभु बैंक लिमिटेड',
            'SBI': 'नेपाल एसबिआई बैंक लिमिटेड',
            'SCB': 'स्ट्यान्डर्ड चार्टर्ड बैंक नेपाल लिमिटेड',
            'SHIVM': 'शिभम् सिमेन्ट्स लिमिटेड'
        };
        
        return companies[symbol] || `${symbol} कम्पनी`;
    }

    // यादृच्छिक मूल्य प्राप्त गर्ने फंक्सन (डेमो डेटाको लागि)
    function getRandomPrice(min, max) {
        return Math.random() * (max - min) + min;
    }

    // यादृच्छिक परिवर्तन प्रतिशत प्राप्त गर्ने फंक्सन (डेमो डेटाको लागि)
    function getRandomChange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // अलर्टहरू जाँच गर्ने फंक्सन (वास्तविक डेटामा यो API कलबाट अपडेट हुनेछ)
    function checkAlerts() {
        // वास्तविक अवस्थामा, यो फंक्सनले API बाट ताजा मूल्यहरू प्राप्त गर्नेछ
        // र अलर्ट अवस्थाहरू जाँच गर्नेछ
        
        // डेमो उद्देश्यको लागि, हामी केही शेयरहरूको मूल्य यादृच्छिक रूपमा अपडेट गर्छौं
        if (watchlist.length > 0) {
            // यादृच्छिक रूपमा एउटा शेयर छान्ने
            const randomIndex = Math.floor(Math.random() * watchlist.length);
            const stock = watchlist[randomIndex];
            
            // मूल्य अपडेट गर्ने
            const oldPrice = stock.price;
            const newPrice = getRandomPrice(oldPrice * 0.95, oldPrice * 1.05);
            const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
            
            watchlist[randomIndex].price = newPrice;
            watchlist[randomIndex].changePercent = priceChange;
            
            // अलर्ट जाँच गर्ने
            if (stock.alertPrice) {
                let isTriggered = false;
                
                if (stock.alertCondition === 'above' && newPrice >= stock.alertPrice && oldPrice < stock.alertPrice) {
                    isTriggered = true;
                } else if (stock.alertCondition === 'below' && newPrice <= stock.alertPrice && oldPrice > stock.alertPrice) {
                    isTriggered = true;
                }
                
                if (isTriggered) {
                    const conditionText = stock.alertCondition === 'above' ? 'माथि पुग्यो' : 'तल झर्‍यो';
                    showNotification(`अलर्ट: ${stock.symbol} को मूल्य रु ${stock.alertPrice} भन्दा ${conditionText}!`);
                }
            }
            
            // वाचलिस्ट अपडेट गर्ने
            updateWatchlist();
        }
    }

    // इभेन्ट लिस्नरहरू
    addStockBtn.addEventListener('click', function() {
        // मोडल खोल्ने
        stockSymbolInput.value = '';
        alertPriceInput.value = '';
        alertConditionSelect.value = 'above';
        openModal(addStockModal);
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // मोडल बन्द गर्ने
            closeModal(addStockModal);
            closeModal(editAlertModal);
        });
    });

    cancelAddStockBtn.addEventListener('click', function() {
        closeModal(addStockModal);
    });

    confirmAddStockBtn.addEventListener('click', function() {
        const symbol = stockSymbolInput.value;
        const alertPrice = alertPriceInput.value;
        const alertCondition = alertConditionSelect.value;
        
        if (addToWatchlist(symbol, alertPrice, alertCondition)) {
            closeModal(addStockModal);
        }
    });

    cancelEditAlertBtn.addEventListener('click', function() {
        closeModal(editAlertModal);
    });

    confirmEditAlertBtn.addEventListener('click', function() {
        if (!currentEditingStock) return;
        
        const alertPrice = editAlertPriceInput.value;
        const alertCondition = editAlertConditionSelect.value;
        
        if (updateAlert(currentEditingStock.symbol, alertPrice, alertCondition)) {
            closeModal(editAlertModal);
            currentEditingStock = null;
        }
    });

    closeNotification.addEventListener('click', function() {
        notification.classList.remove('show');
    });

    // प्रारम्भिक रेन्डरिङ
    renderWatchlist();
    renderAlerts();
    
    // नियमित रूपमा अलर्टहरू जाँच गर्ने (हरेक 30 सेकेन्डमा)
    setInterval(checkAlerts, 30000);

    // वाचलिस्ट रिफ्रेश गर्ने फंक्सन
    refreshBtn.addEventListener('click', function() {
        refreshWatchlist();
    });
    
    // सबै हटाउनुहोस् बटनमा इभेन्ट लिस्नर थप्ने
    clearWatchlistBtn.addEventListener('click', function() {
        clearWatchlist();
    });
    
    // अलर्ट फर्ममा इभेन्ट लिस्नर थप्ने
    alertForm.addEventListener('submit', function(e) {
        e.preventDefault();
        setAlert();
    });
    
    // अलर्ट हटाउने बटनमा इभेन्ट लिस्नर थप्ने
    removeAlertBtn.addEventListener('click', function() {
        removeAlert();
    });

    // इनिसियलाइजेसन
    init();
});

// लोकल स्टोरेजबाट डेटा प्राप्त गर्ने फंक्सन
function getLocalData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// लोकल स्टोरेजमा डेटा सेट गर्ने फंक्सन
function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// वाचलिस्ट रिफ्रेश गर्ने फंक्सन
function refreshWatchlist() {
    // लोकल स्टोरेजबाट वाचलिस्ट प्राप्त गर्ने
    let watchlist = getLocalData('watchlist') || [];
    
    if (watchlist.length === 0) {
        return;
    }
    
    // प्रत्येक स्टकको मूल्य र परिवर्तन अपडेट गर्ने
    watchlist = watchlist.map(stock => {
        // वास्तविक अवस्थामा, यहाँ API बाट नयाँ मूल्य प्राप्त गर्ने लजिक हुनेछ
        // डेमो उद्देश्यको लागि, हामी यादृच्छिक परिवर्तन प्रयोग गर्छौं
        
        // यादृच्छिक मूल्य परिवर्तन (-2% देखि +2%)
        const priceChange = stock.price * (Math.random() * 0.04 - 0.02);
        const newPrice = stock.price + priceChange;
        
        // यादृच्छिक परिवर्तन प्रतिशत (-3% देखि +3%)
        const newChangePercent = Math.random() * 6 - 3;
        
        // अलर्ट जाँच गर्ने
        checkAlert(stock.symbol, stock.name, newPrice, stock.alertPrice, stock.alertCondition);
        
        return {
            ...stock,
            price: newPrice,
            changePercent: newChangePercent
        };
    });
    
    // अपडेट गरिएको वाचलिस्ट सेभ गर्ने
    setLocalData('watchlist', watchlist);
    
    // वाचलिस्ट टेबल अपडेट गर्ने
    renderWatchlist();
    
    // नोटिफिकेसन देखाउने
    showNotification('वाचलिस्ट सफलतापूर्वक रिफ्रेश गरियो');
}

// वाचलिस्ट खाली गर्ने फंक्सन
function clearWatchlist() {
    // पुष्टिकरण सोध्ने
    if (confirm('के तपाईं निश्चित हुनुहुन्छ कि तपाईं सम्पूर्ण वाचलिस्ट खाली गर्न चाहनुहुन्छ?')) {
        // वाचलिस्ट खाली गर्ने
        setLocalData('watchlist', []);
        
        // वाचलिस्ट लोड गर्ने
        renderWatchlist();
        
        // नोटिफिकेसन देखाउने
        showNotification('वाचलिस्ट सफलतापूर्वक खाली गरियो');
    }
}

// अलर्ट जाँच गर्ने फंक्सन
function checkAlert(symbol, name, currentPrice, alertPrice, alertCondition) {
    // अलर्ट सेट गरिएको छ कि छैन जाँच गर्ने
    if (!alertPrice || !alertCondition) {
        return;
    }
    
    // अलर्ट अवस्था जाँच गर्ने
    let alertTriggered = false;
    
    if (alertCondition === 'above' && currentPrice > alertPrice) {
        alertTriggered = true;
    } else if (alertCondition === 'below' && currentPrice < alertPrice) {
        alertTriggered = true;
    }
    
    // अलर्ट ट्रिगर भएको छ भने नोटिफिकेसन देखाउने
    if (alertTriggered) {
        const conditionText = alertCondition === 'above' ? 'माथि' : 'तल';
        showNotification(`अलर्ट: ${symbol} (${name}) को मूल्य रु ${alertPrice} ${condition} पुग्यो!`);
    }
}

// अलर्ट मोडल खोल्ने फंक्सन
function openAlertModal(symbol) {
    // लोकल स्टोरेजबाट वाचलिस्ट प्राप्त गर्ने
    const watchlist = getLocalData('watchlist') || [];
    
    // स्टक खोज्ने
    const stock = watchlist.find(stock => stock.symbol === symbol);
    
    if (stock) {
        // अलर्ट मोडल भर्ने
        alertSymbolInput.value = symbol;
        
        // स्टक जानकारी देखाउने
        alertStockInfo.innerHTML = `
            <div class="stock-info-header">
                <h4>${stock.name} (${stock.symbol})</h4>
                <div class="stock-price">रु ${stock.price.toFixed(2)}</div>
            </div>
        `;
        
        // अलर्ट मानहरू सेट गर्ने
        if (stock.alertPrice && stock.alertCondition) {
            alertConditionSelect.value = stock.alertCondition;
            alertPriceInput.value = stock.alertPrice;
            removeAlertBtn.style.display = 'block';
        } else {
            alertConditionSelect.value = '';
            alertPriceInput.value = '';
            removeAlertBtn.style.display = 'none';
        }
        
        // मोडल देखाउने
        alertModal.style.display = 'block';
    }
}

// अलर्ट सेट गर्ने फंक्सन
function setAlert() {
    const symbol = alertSymbolInput.value;
    const condition = alertConditionSelect.value;
    const price = parseFloat(alertPriceInput.value);
    
    if (!symbol || !condition || isNaN(price) || price <= 0) {
        showNotification('कृपया सबै फिल्डहरू भर्नुहोस्');
        return;
    }
    
    // लोकल स्टोरेजबाट वाचलिस्ट प्राप्त गर्ने
    let watchlist = getLocalData('watchlist') || [];
    
    // स्टक खोज्ने
    const stockIndex = watchlist.findIndex(stock => stock.symbol === symbol);
    
    if (stockIndex !== -1) {
        // अलर्ट अपडेट गर्ने
        watchlist[stockIndex].alertPrice = price;
        watchlist[stockIndex].alertCondition = condition;
        
        // अपडेट गरिएको वाचलिस्ट सेभ गर्ने
        setLocalData('watchlist', watchlist);
        
        // वाचलिस्ट लोड गर्ने
        renderWatchlist();
        
        // मोडल बन्द गर्ने
        alertModal.style.display = 'none';
        
        // नोटिफिकेसन देखाउने
        showNotification(`${symbol} को लागि मूल्य अलर्ट सेट गरियो`);
    }
}

// अलर्ट हटाउने फंक्सन
function removeAlert() {
    const symbol = alertSymbolInput.value;
    
    // लोकल स्टोरेजबाट वाचलिस्ट प्राप्त गर्ने
    let watchlist = getLocalData('watchlist') || [];
    
    // स्टक खोज्ने
    const stockIndex = watchlist.findIndex(stock => stock.symbol === symbol);
    
    if (stockIndex !== -1) {
        // अलर्ट हटाउने
        watchlist[stockIndex].alertPrice = null;
        watchlist[stockIndex].alertCondition = null;
        
        // अपडेट गरिएको वाचलिस्ट सेभ गर्ने
        setLocalData('watchlist', watchlist);
        
        // वाचलिस्ट लोड गर्ने
        renderWatchlist();
        
        // मोडल बन्द गर्ने
        alertModal.style.display = 'none';
        
        // नोटिफिकेसन देखाउने
        showNotification(`${symbol} को लागि मूल्य अलर्ट हटाइयो`);
    }
}

// इनिसियलाइजेसन
function init() {
    // लगइन स्थिति जाँच गर्ने
    checkLoginStatus();
    
    // इभेन्ट लिसनरहरू सेटअप गर्ने
    setupEventListeners();
    
    // सबै स्टक्स लोड गर्ने
    loadAllStocks();
    
    // वाचलिस्ट लोड गर्ने
    loadWatchlist();
    
    // नियमित अपडेट सेटअप गर्ने
    setInterval(refreshWatchlist, REFRESH_INTERVAL);
}

// लगइन स्थिति जाँच गर्ने
function checkLoginStatus() {
    // डेमोको लागि, वास्तविक एप्लिकेशनमा यो सर्भरबाट आउनेछ
    const userToken = localStorage.getItem('userToken');
    isLoggedIn = !!userToken;
    
    // UI अपडेट गर्ने
    updateUIBasedOnLoginStatus();
}

// लगइन स्थिति अनुसार UI अपडेट गर्ने
function updateUIBasedOnLoginStatus() {
    if (isLoggedIn) {
        watchlistTableContainer.style.display = 'block';
        
        // वाचलिस्ट खाली छ कि छैन जाँच गर्ने
        if (watchlist.length === 0) {
            emptyWatchlist.style.display = 'block';
        } else {
            emptyWatchlist.style.display = 'none';
        }
    } else {
        watchlistTableContainer.style.display = 'none';
        emptyWatchlist.style.display = 'none';
    }
}

// इभेन्ट लिसनरहरू सेटअप गर्ने
function setupEventListeners() {
    // खोज इनपुट
    watchlistSearch.addEventListener('input', function() {
        renderWatchlistTable();
    });
    
    // सर्ट सेलेक्ट
    watchlistSort.addEventListener('change', function() {
        renderWatchlistTable();
    });
    
    // रिफ्रेस बटन
    refreshWatchlistBtn.addEventListener('click', function() {
        refreshWatchlist();
    });
    
    // शेयर थप्ने बटन
    addToWatchlistBtn.addEventListener('click', function() {
        openAddStockModal();
    });
    
    // नोट मोडल बन्द गर्ने बटन
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // नोट रद्द गर्ने बटन
    cancelNoteBtn.addEventListener('click', function() {
        closeAllModals();
    });
    
    // नोट फर्म सबमिट
    noteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveNote();
    });
    
    // शेयर थप्ने रद्द गर्ने बटन
    cancelAddStockBtn.addEventListener('click', function() {
        closeAllModals();
    });
    
    // शेयर थप्ने फर्म सबमिट
    addStockForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addStockToWatchlist();
    });
    
    // मोडल बाहिर क्लिक गर्दा बन्द गर्ने
    window.addEventListener('click', function(e) {
        if (e.target === noteModal) {
            closeAllModals();
        }
        if (e.target === addStockModal) {
            closeAllModals();
        }
    });
}

// सबै स्टक्स लोड गर्ने
function loadAllStocks() {
    fetch(`${API_BASE_URL}/stocks_list`)
        .then(response => response.json())
        .then(data => {
            allStocks = data.data;
            
            // स्टक सिम्बोल सेलेक्ट अपडेट गर्ने
            updateStockSymbolSelect();
        })
        .catch(error => {
            console.error('Error loading stocks:', error);
        });
}

// स्टक सिम्बोल सेलेक्ट अपडेट गर्ने
function updateStockSymbolSelect() {
    let options = '<option value="">शेयर छान्नुहोस्...</option>';
    
    allStocks.forEach(stock => {
        options += `<option value="${stock.symbol}">${stock.symbol} - ${stock.company_name}</option>`;
    });
    
    stockSymbolInput.innerHTML = options;
}

// वाचलिस्ट लोड गर्ने
function loadWatchlist() {
    // डेमोको लागि, वास्तविक एप्लिकेशनमा यो सर्भरबाट आउनेछ
    const savedWatchlist = localStorage.getItem('watchlist');
    
    if (savedWatchlist) {
        watchlist = JSON.parse(savedWatchlist);
    }
    
    // वाचलिस्ट शेयरहरूको वास्तविक समयको मूल्य प्राप्त गर्ने
    if (watchlist.length > 0) {
        fetchWatchlistPrices();
    } else {
        updateUIBasedOnLoginStatus();
    }
}

// वाचलिस्ट शेयरहरूको वास्तविक समयको मूल्य प्राप्त गर्ने
function fetchWatchlistPrices() {
    fetch(`${API_BASE_URL}/nepse_data`)
        .then(response => response.json())
        .then(data => {
            const stocksData = data.data;
            
            // वाचलिस्ट अपडेट गर्ने
            watchlist = watchlist.map(watchItem => {
                const stockData = stocksData.find(stock => stock.symbol === watchItem.symbol);
                
                if (stockData) {
                    return {
                        ...watchItem,
                        ltp: stockData.ltp,
                        change: stockData.change,
                        percent_change: stockData.percent_change,
                        high: stockData.high,
                        low: stockData.low,
                        open: stockData.open,
                        qty: stockData.qty
                    };
                }
                
                return watchItem;
            });
            
            // वाचलिस्ट टेबल रेन्डर गर्ने
            renderWatchlistTable();
            
            // UI अपडेट गर्ने
            updateUIBasedOnLoginStatus();
        })
        .catch(error => {
            console.error('Error fetching watchlist prices:', error);
            
            // UI अपडेट गर्ने
            updateUIBasedOnLoginStatus();
        });
}

// वाचलिस्ट टेबल रेन्डर गर्ने
function renderWatchlistTable() {
    if (!isLoggedIn || !watchlistTableBody) return;
    
    // खोज र सर्ट अनुसार वाचलिस्ट फिल्टर गर्ने
    const filteredWatchlist = filterWatchlist();
    
    // टेबल HTML बनाउने
    let tableHTML = '';
    
    if (filteredWatchlist.length === 0) {
        if (watchlistSearch.value) {
            tableHTML = '<tr><td colspan="10" class="text-center">खोज अनुसार कुनै परिणाम फेला परेन</td></tr>';
        } else {
            tableHTML = '<tr><td colspan="10" class="text-center">तपाईंको वाचलिस्ट खाली छ</td></tr>';
        }
    } else {
        filteredWatchlist.forEach(item => {
            const changeClass = parseFloat(item.percent_change) > 0 ? 'positive' : (parseFloat(item.percent_change) < 0 ? 'negative' : '');
            const hasNoteClass = item.note ? 'has-note' : '';
            
            tableHTML += `
                <tr>
                    <td class="symbol"><a href="company.html?symbol=${item.symbol}">${item.symbol}</a></td>
                    <td class="company">${item.company_name || 'अज्ञात कम्पनी'}</td>
                    <td class="price">रु. ${item.ltp || 'N/A'}</td>
                    <td class="change ${changeClass}">${item.change || '0'}</td>
                    <td class="percent-change ${changeClass}">
                        ${parseFloat(item.percent_change) > 0 ? '+' : ''}${item.percent_change || '0'}%
                    </td>
                    <td class="high">रु. ${item.high || 'N/A'}</td>
                    <td class="low">रु. ${item.low || 'N/A'}</td>
                    <td class="volume">${formatNumber(item.qty) || '0'}</td>
                    <td class="note">
                        <button class="note-btn ${hasNoteClass}" data-symbol="${item.symbol}" data-note="${item.note}">
                            <i class="fas fa-sticky-note"></i>
                        </button>
                    </td>
                    <td class="actions">
                        <button class="remove-btn" data-symbol="${item.symbol}" title="वाचलिस्टबाट हटाउनुहोस्">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    // टेबल अपडेट गर्ने
    watchlistTableBody.innerHTML = tableHTML;
    
    // नोट र हटाउने बटनहरूमा इभेन्ट लिसनरहरू थप्ने
    setupTableButtonListeners();
}

// वाचलिस्ट फिल्टर गर्ने
function filterWatchlist() {
    let filtered = [...watchlist];
    
    // खोज अनुसार फिल्टर गर्ने
    const searchTerm = watchlistSearch.value.trim().toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.symbol.toLowerCase().includes(searchTerm) || 
            (item.company_name && item.company_name.toLowerCase().includes(searchTerm))
        );
    }
    
    // सर्ट अनुसार सर्ट गर्ने
    const sortBy = watchlistSort.value;
    
    if (sortBy === 'symbol') {
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortBy === 'change') {
        filtered.sort((a, b) => {
            const changeA = parseFloat(a.percent_change) || 0;
            const changeB = parseFloat(b.percent_change) || 0;
            return changeB - changeA; // उच्चतम परिवर्तन पहिले
        });
    } else if (sortBy === 'price') {
        filtered.sort((a, b) => {
            const priceA = parseFloat(a.ltp?.replace(/,/g, '')) || 0;
            const priceB = parseFloat(b.ltp?.replace(/,/g, '')) || 0;
            return priceB - priceA; // उच्चतम मूल्य पहिले
        });
    }
    
    return filtered;
}

// टेबल बटनहरूमा इभेन्ट लिसनरहरू थप्ने
function setupTableButtonListeners() {
    // नोट बटनहरू
    document.querySelectorAll('.note-btn').forEach(button => {
        button.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            const note = this.getAttribute('data-note');
            openNoteModal(symbol, note);
        });
    });
    
    // हटाउने बटनहरू
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            removeFromWatchlist(symbol);
        });
    });
}

// नोट मोडल खोल्ने
function openNoteModal(symbol, note) {
    const noteModal = document.getElementById('note-modal');
    const symbolElement = document.getElementById('note-symbol');
    const noteTextarea = document.getElementById('stock-note');
    
    symbolElement.textContent = symbol;
    noteTextarea.value = note;
    
    noteModal.style.display = 'block';
    
    // मोडल बन्द गर्ने
    const closeNoteModal = document.querySelector('#note-modal .close-modal');
    closeNoteModal.addEventListener('click', function() {
        noteModal.style.display = 'none';
    });
    
    // नोट सेभ गर्ने
    const saveNoteForm = document.getElementById('note-form');
    saveNoteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const updatedNote = noteTextarea.value;
        
        // वास्तविक एपीआई कल यहाँ गर्नुपर्छ
        console.log(`Saving note for ${symbol}: ${updatedNote}`);
        noteModal.style.display = 'none';
    });
}

// वाचलिस्टबाट शेयर हटाउने
function removeFromWatchlist(symbol) {
    if (confirm(`के तपाईं ${symbol} लाई वाचलिस्टबाट हटाउन चाहनुहुन्छ?`)) {
        // वास्तविक एपीआई कल यहाँ गर्नुपर्छ
        console.log(`Removing ${symbol} from watchlist`);
        watchlist = watchlist.filter(item => item.symbol !== symbol);
        
        // लोकल स्टोरेजमा सेभ गर्ने
        setLocalData('watchlist', watchlist);
        
        // टेबल अपडेट गर्ने
        renderWatchlistTable();
        
        // UI अपडेट गर्ने
        updateUIBasedOnLoginStatus();
    }
}

// लोकल स्टोरेजमा वाचलिस्ट सेभ गर्ने
function saveWatchlistToLocalStorage() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// संख्या फर्म्याट गर्ने
function formatNumber(num) {
    if (!num) return '0';
    
    // कमा हटाउने
    num = num.toString().replace(/,/g, '');
    
    // संख्यामा परिवर्तन गर्ने
    return parseInt(num).toLocaleString('en-IN');
} 