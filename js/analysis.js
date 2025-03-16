// विश्लेषण पृष्ठको लागि JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // URL बाट कम्पनी सिम्बल प्राप्त गर्नुहोस्
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    
    // यदि URL मा सिम्बल छ भने, त्यो कम्पनीको विश्लेषण देखाउनुहोस्
    if (symbol) {
        loadCompanyAnalysis(symbol);
    } else {
        // पूर्वनिर्धारित कम्पनी लोड गर्नुहोस्
        loadCompanyAnalysis('NABIL');
    }
    
    // ट्याब स्विचिङ
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // सबै ट्याब बटनहरूबाट एक्टिभ क्लास हटाउनुहोस्
            tabBtns.forEach(btn => btn.classList.remove('active'));
            
            // सबै ट्याब सामग्रीहरूबाट एक्टिभ क्लास हटाउनुहोस्
            tabContents.forEach(content => content.classList.remove('active'));
            
            // क्लिक गरिएको बटन र सम्बन्धित सामग्रीमा एक्टिभ क्लास थप्नुहोस्
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // खोज कार्यक्षमता
    const searchBox = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchBox && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // कम्पनी सेलेक्टरमा इभेन्ट लिस्नर थप्ने
    const companySelect = document.getElementById('company-select');
    companySelect.addEventListener('change', function() {
        const selectedSymbol = this.value;
        if (selectedSymbol) {
            // URL अपडेट गर्ने
            const newUrl = `analysis.html?symbol=${selectedSymbol}`;
            window.history.pushState({ symbol: selectedSymbol }, '', newUrl);
            
            // कम्पनी विश्लेषण लोड गर्ने
            loadCompanyAnalysis(selectedSymbol);
        }
    });
    
    // चार्ट प्रकार बटनहरूमा इभेन्ट लिस्नरहरू थप्ने
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // सक्रिय बटन हटाउने
            chartButtons.forEach(btn => btn.classList.remove('active'));
            
            // नयाँ सक्रिय बटन सेट गर्ने
            this.classList.add('active');
            
            // चार्ट अपडेट गर्ने
            const chartType = this.getAttribute('data-chart');
            updateChartType(chartType);
        });
    });
    
    // सूचक चेकबक्सहरूमा इभेन्ट लिस्नरहरू थप्ने
    const indicatorCheckboxes = document.querySelectorAll('.indicator-checkboxes input');
    indicatorCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // सूचक देखाउने वा लुकाउने
            const indicatorId = this.id.replace('show-', '');
            toggleIndicator(indicatorId, this.checked);
        });
    });
    
    // नोटिफिकेसन एलिमेन्ट सिर्जना गर्ने
    createNotificationElement();
});

// कम्पनी विश्लेषण लोड गर्नुहोस्
function loadCompanyAnalysis(symbol) {
    // कम्पनी सेलेक्टरमा सही मान सेट गर्ने
    const companySelect = document.getElementById('company-select');
    companySelect.value = symbol;
    
    // कम्पनी विवरण अपडेट गर्ने
    const companyData = updateCompanyDetails(symbol);
    
    // चार्ट अपडेट गर्ने
    updateCompanyChart(symbol);
    
    // प्राविधिक विश्लेषण अपडेट गर्ने
    updateTechnicalAnalysis(companyData);
}

// चार्ट प्रकार अपडेट गर्ने फंक्सन
function updateChartType(chartType) {
    console.log(`चार्ट प्रकार परिवर्तन: ${chartType}`);
    
    // वास्तविक अवस्थामा, यहाँ चार्ट प्रकार परिवर्तन गर्ने लजिक हुनेछ
    // हाल, हामी केवल कन्सोलमा लग गर्छौं
}

// सूचक टगल गर्ने फंक्सन
function toggleIndicator(indicatorId, show) {
    console.log(`सूचक टगल: ${indicatorId}, देखाउने: ${show}`);
    
    // वास्तविक अवस्थामा, यहाँ सूचक देखाउने वा लुकाउने लजिक हुनेछ
    // हाल, हामी केवल कन्सोलमा लग गर्छौं
}

// कम्पनी विवरण अपडेट गर्ने फंक्सन
function updateCompanyDetails(symbol) {
    const companyInfo = document.querySelector('.company-info');
    
    // कम्पनी विवरण अपडेट गर्ने
    let companyName = '';
    let currentPrice = 0;
    let priceChange = 0;
    let volume = 0;
    let sector = '';
    
    switch(symbol) {
        case 'NABIL':
            companyName = 'नबिल बैंक लिमिटेड';
            currentPrice = 1250.50;
            priceChange = 2.5;
            volume = 125000;
            sector = 'बैंकिङ';
            break;
        case 'NRIC':
            companyName = 'नेपाल पुनर्बीमा कम्पनी लिमिटेड';
            currentPrice = 980.75;
            priceChange = -1.2;
            volume = 85000;
            sector = 'बीमा';
            break;
        case 'UPPER':
            companyName = 'अपर तामाकोशी हाइड्रोपावर लिमिटेड';
            currentPrice = 520.25;
            priceChange = 0.8;
            volume = 150000;
            sector = 'हाइड्रोपावर';
            break;
        case 'NTC':
            companyName = 'नेपाल टेलिकम';
            currentPrice = 1100.00;
            priceChange = -0.5;
            volume = 65000;
            sector = 'टेलिकम';
            break;
        case 'NHPC':
            companyName = 'नेशनल हाइड्रोपावर कम्पनी लिमिटेड';
            currentPrice = 450.75;
            priceChange = 1.5;
            volume = 95000;
            sector = 'हाइड्रोपावर';
            break;
        default:
            companyName = 'नबिल बैंक लिमिटेड';
            currentPrice = 1250.50;
            priceChange = 2.5;
            volume = 125000;
            sector = 'बैंकिङ';
            symbol = 'NABIL';
    }
    
    // मूल्य परिवर्तन क्लास
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeSymbol = priceChange >= 0 ? '+' : '';
    
    // वाचलिस्ट बटन स्थिति
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const isInWatchlist = watchlist.some(stock => stock.symbol === symbol);
    const watchlistBtnText = isInWatchlist ? 
        '<i class="fas fa-star"></i> वाचलिस्टमा छ' : 
        '<i class="far fa-star"></i> वाचलिस्टमा थप्नुहोस्';
    const watchlistBtnClass = isInWatchlist ? 'btn-secondary' : 'btn-primary';
    
    companyInfo.innerHTML = `
        <h3>${companyName} (${symbol})</h3>
        <div class="price-info">
            <div class="current-price">रु ${currentPrice.toFixed(2)}</div>
            <div class="price-change ${changeClass}">${changeSymbol}${priceChange.toFixed(2)}%</div>
        </div>
        <div class="additional-info">
            <div class="info-item"><span class="label">भोल्युम:</span> ${volume.toLocaleString()}</div>
            <div class="info-item"><span class="label">क्षेत्र:</span> ${sector}</div>
            <button id="watchlist-btn" class="btn ${watchlistBtnClass}" data-symbol="${symbol}" data-name="${companyName}" data-price="${currentPrice}">${watchlistBtnText}</button>
        </div>
    `;
    
    // वाचलिस्ट बटनमा इभेन्ट लिस्नर थप्ने
    document.getElementById('watchlist-btn').addEventListener('click', function() {
        toggleWatchlist(this.getAttribute('data-symbol'), this.getAttribute('data-name'), parseFloat(this.getAttribute('data-price')));
    });
    
    return { symbol, companyName, currentPrice, priceChange, volume, sector };
}

// वाचलिस्टमा टगल गर्ने फंक्सन
function toggleWatchlist(symbol, companyName, price) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const watchlistBtn = document.getElementById('watchlist-btn');
    
    // शेयर वाचलिस्टमा छ कि छैन जाँच गर्ने
    const stockIndex = watchlist.findIndex(stock => stock.symbol === symbol);
    
    if (stockIndex === -1) {
        // वाचलिस्टमा थप्ने
        const newStock = {
            symbol: symbol,
            name: companyName,
            price: price,
            changePercent: getRandomChange(-5, 5),
            alertPrice: null,
            alertCondition: null
        };
        
        watchlist.push(newStock);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        
        // बटन अपडेट गर्ने
        watchlistBtn.innerHTML = '<i class="fas fa-star"></i> वाचलिस्टमा छ';
        watchlistBtn.classList.remove('btn-primary');
        watchlistBtn.classList.add('btn-secondary');
        
        // नोटिफिकेसन देखाउने
        showNotification(`${symbol} लाई वाचलिस्टमा थपियो`);
    } else {
        // वाचलिस्टबाट हटाउने
        watchlist.splice(stockIndex, 1);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        
        // बटन अपडेट गर्ने
        watchlistBtn.innerHTML = '<i class="far fa-star"></i> वाचलिस्टमा थप्नुहोस्';
        watchlistBtn.classList.remove('btn-secondary');
        watchlistBtn.classList.add('btn-primary');
        
        // नोटिफिकेसन देखाउने
        showNotification(`${symbol} लाई वाचलिस्टबाट हटाइयो`);
    }
}

// यादृच्छिक परिवर्तन प्रतिशत प्राप्त गर्ने फंक्सन (डेमो डेटाको लागि)
function getRandomChange(min, max) {
    return Math.random() * (max - min) + min;
}

// नोटिफिकेसन देखाउने फंक्सन
function showNotification(message) {
    // नोटिफिकेसन एलिमेन्ट छ कि छैन जाँच गर्ने
    let notification = document.getElementById('notification');
    
    // नोटिफिकेसन एलिमेन्ट छैन भने सिर्जना गर्ने
    if (!notification) {
        notification = document.createElement('div');
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
    
    // नोटिफिकेसन सन्देश अपडेट गर्ने
    document.getElementById('notification-message').textContent = message;
    notification.classList.add('show');
    
    // 5 सेकेन्डपछि नोटिफिकेसन हटाउने
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// कम्पनी चार्ट अपडेट गर्ने फंक्सन
function updateCompanyChart(symbol) {
    // वास्तविक अवस्थामा, यहाँ API बाट डेटा प्राप्त गर्ने लजिक हुनेछ
    // डेमो उद्देश्यको लागि, हामी यादृच्छिक डेटा प्रयोग गर्छौं
    
    // यादृच्छिक मूल्य र भोल्युम डेटा सिर्जना गर्ने
    const days = 30;
    const labels = [];
    const prices = [];
    const volumes = [];
    
    // आजको मिति प्राप्त गर्ने
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        // मिति सिर्जना गर्ने
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(formatDate(date));
        
        // यादृच्छिक मूल्य र भोल्युम सिर्जना गर्ने
        let basePrice = 0;
        let volumeMultiplier = 0;
        
        switch(symbol) {
            case 'NABIL':
                basePrice = 1250;
                volumeMultiplier = 1000;
                break;
            case 'NRIC':
                basePrice = 980;
                volumeMultiplier = 800;
                break;
            case 'UPPER':
                basePrice = 520;
                volumeMultiplier = 1200;
                break;
            case 'NTC':
                basePrice = 1100;
                volumeMultiplier = 600;
                break;
            case 'NHPC':
                basePrice = 450;
                volumeMultiplier = 900;
                break;
            default:
                basePrice = 1000;
                volumeMultiplier = 1000;
        }
        
        // यादृच्छिक मूल्य (±5% भिन्नता)
        prices.push(basePrice + (Math.random() - 0.5) * basePrice * 0.1);
        
        // यादृच्छिक भोल्युम
        volumes.push(Math.floor(Math.random() * volumeMultiplier * 100));
    }
    
    // चार्ट सिर्जना गर्ने
    createCompanyChart(labels, prices, volumes);
}

// कम्पनी चार्ट सिर्जना गर्ने फंक्सन
function createCompanyChart(labels, prices, volumes) {
    // मूल्य चार्ट
    const priceChartCtx = document.getElementById('price-chart').getContext('2d');
    
    // अघिल्लो चार्ट छ भने नष्ट गर्ने
    if (window.priceChart) {
        window.priceChart.destroy();
    }
    
    // नयाँ चार्ट सिर्जना गर्ने
    window.priceChart = new Chart(priceChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'मूल्य',
                    data: prices,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'MA-20',
                    data: calculateMA(prices, 20),
                    borderColor: '#2196F3',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'MA-50',
                    data: calculateMA(prices, 50),
                    borderColor: '#FF9800',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += 'रु ' + context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // भोल्युम चार्ट
    const volumeChartCtx = document.getElementById('volume-chart').getContext('2d');
    
    // अघिल्लो चार्ट छ भने नष्ट गर्ने
    if (window.volumeChart) {
        window.volumeChart.destroy();
    }
    
    // नयाँ चार्ट सिर्जना गर्ने
    window.volumeChart = new Chart(volumeChartCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'भोल्युम',
                    data: volumes,
                    backgroundColor: 'rgba(156, 39, 176, 0.5)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// चलित औसत गणना गर्ने फंक्सन
function calculateMA(data, period) {
    const result = [];
    
    // पहिलो (period-1) मानहरू null हुन्छन्
    for (let i = 0; i < period - 1; i++) {
        result.push(null);
    }
    
    // period देखि अन्तिम सम्म चलित औसत गणना गर्ने
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j];
        }
        result.push(sum / period);
    }
    
    return result;
}

// प्राविधिक विश्लेषण अपडेट गर्ने फंक्सन
function updateTechnicalAnalysis(data) {
    // वास्तविक अवस्थामा, यहाँ API बाट प्राविधिक सूचकहरू प्राप्त गर्ने लजिक हुनेछ
    // डेमो उद्देश्यको लागि, हामी यादृच्छिक मानहरू प्रयोग गर्छौं
    
    // RSI मान (0-100)
    const rsi = Math.floor(Math.random() * 100);
    document.getElementById('rsi-value').textContent = rsi.toFixed(2);
    
    // RSI सिफारिस
    let rsiRecommendation = '';
    let rsiClass = '';
    
    if (rsi < 30) {
        rsiRecommendation = 'खरीद';
        rsiClass = 'positive';
    } else if (rsi > 70) {
        rsiRecommendation = 'बिक्री';
        rsiClass = 'negative';
    } else {
        rsiRecommendation = 'तटस्थ';
        rsiClass = '';
    }
    
    const rsiRecommendationElement = document.getElementById('rsi-recommendation');
    rsiRecommendationElement.textContent = rsiRecommendation;
    rsiRecommendationElement.className = 'recommendation ' + rsiClass;
    
    // MACD मान
    const macd = (Math.random() - 0.5) * 10;
    document.getElementById('macd-value').textContent = macd.toFixed(2);
    
    // MACD सिफारिस
    let macdRecommendation = '';
    let macdClass = '';
    
    if (macd > 0) {
        macdRecommendation = 'खरीद';
        macdClass = 'positive';
    } else {
        macdRecommendation = 'बिक्री';
        macdClass = 'negative';
    }
    
    const macdRecommendationElement = document.getElementById('macd-recommendation');
    macdRecommendationElement.textContent = macdRecommendation;
    macdRecommendationElement.className = 'recommendation ' + macdClass;
    
    // चलित औसत मानहरू
    const ma50 = data.currentPrice * (1 + (Math.random() - 0.5) * 0.05);
    const ma200 = data.currentPrice * (1 + (Math.random() - 0.5) * 0.1);
    
    document.getElementById('ma-50').textContent = ma50.toFixed(2);
    document.getElementById('ma-200').textContent = ma200.toFixed(2);
    
    // समग्र सिफारिस
    let overallRecommendation = '';
    let overallClass = '';
    let explanation = '';
    
    // सिफारिसहरू गणना गर्ने
    const buySignals = (rsiClass === 'positive' ? 1 : 0) + (macdClass === 'positive' ? 1 : 0) + (data.currentPrice > ma50 ? 1 : 0);
    const sellSignals = (rsiClass === 'negative' ? 1 : 0) + (macdClass === 'negative' ? 1 : 0) + (data.currentPrice < ma50 ? 1 : 0);
    
    if (buySignals > sellSignals) {
        overallRecommendation = 'खरीद';
        overallClass = 'positive';
        explanation = 'अधिकांश प्राविधिक सूचकहरूले खरीद संकेत देखाउँदैछन्।';
    } else if (sellSignals > buySignals) {
        overallRecommendation = 'बिक्री';
        overallClass = 'negative';
        explanation = 'अधिकांश प्राविधिक सूचकहरूले बिक्री संकेत देखाउँदैछन्।';
    } else {
        overallRecommendation = 'तटस्थ';
        overallClass = '';
        explanation = 'प्राविधिक सूचकहरू मिश्रित संकेतहरू देखाउँदैछन्।';
    }
    
    const recommendationElement = document.getElementById('recommendation');
    recommendationElement.textContent = overallRecommendation;
    recommendationElement.className = 'recommendation ' + overallClass;
    
    document.getElementById('recommendation-explanation').textContent = explanation;
}

// खोज कार्यक्षमता
function performSearch() {
    const searchTerm = searchBox.value.trim().toUpperCase();
    if (!searchTerm) return;
    
    // कम्पनी सिम्बल खोज्नुहोस्
    fetch('https://nepse-data-api.herokuapp.com/data/companies')
        .then(response => response.json())
        .then(data => {
            // कम्पनी सिम्बल खोज्नुहोस्
            const company = data.find(company => company.symbol === searchTerm);
            
            if (company) {
                // कम्पनी फेला परेमा, विश्लेषण पृष्ठमा जानुहोस्
                window.location.href = `analysis.html?symbol=${searchTerm}`;
            } else {
                // वर्तमान भाषा प्राप्त गर्नुहोस्
                const currentLang = document.documentElement.lang || 'ne';
                
                // भाषा अनुसार सन्देश
                const messages = {
                    ne: 'कम्पनी फेला परेन। कृपया मान्य कम्पनी सिम्बल प्रविष्ट गर्नुहोस्।',
                    en: 'Company not found. Please enter a valid company symbol.'
                };
                
                alert(messages[currentLang] || messages.ne);
            }
        })
        .catch(error => {
            console.error('कम्पनी डाटा प्राप्त गर्दा त्रुटि:', error);
            
            // त्रुटि भएमा, डेमो कम्पनीहरू प्रयोग गर्नुहोस्
            const demoCompanies = ['NABIL', 'NRIC', 'UPPER', 'NTC', 'NHPC', 'PLIC', 'NICA', 'CHCL', 'GBIME', 'NIFRA'];
            
            if (demoCompanies.includes(searchTerm)) {
                // कम्पनी फेला परेमा, विश्लेषण पृष्ठमा जानुहोस्
                window.location.href = `analysis.html?symbol=${searchTerm}`;
            } else {
                // वर्तमान भाषा प्राप्त गर्नुहोस्
                const currentLang = document.documentElement.lang || 'ne';
                
                // भाषा अनुसार सन्देश
                const messages = {
                    ne: 'कम्पनी फेला परेन। कृपया मान्य कम्पनी सिम्बल प्रविष्ट गर्नुहोस्।',
                    en: 'Company not found. Please enter a valid company symbol.'
                };
                
                alert(messages[currentLang] || messages.ne);
            }
        });
}

// नोटिफिकेसन एलिमेन्ट सिर्जना गर्ने फंक्सन
function createNotificationElement() {
    // नोटिफिकेसन एलिमेन्ट छ कि छैन जाँच गर्ने
    let notification = document.getElementById('notification');
    
    // नोटिफिकेसन एलिमेन्ट छैन भने सिर्जना गर्ने
    if (!notification) {
        notification = document.createElement('div');
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
} 