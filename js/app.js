// DOM लोड भएपछि कोड चलाउनुहोस्
document.addEventListener('DOMContentLoaded', function() {
    // होम पेजको नेप्से चार्ट
    const nepseChartElement = document.getElementById('nepse-chart');
    if (nepseChartElement) {
        // नेप्से डाटा लोड गर्नुहोस्
        fetchNepseData();
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
    
    // शीर्ष बढ्ने र घट्ने कम्पनीहरू लोड गर्नुहोस्
    const gainersTable = document.getElementById('gainers-table');
    const losersTable = document.getElementById('losers-table');
    
    if (gainersTable && losersTable) {
        fetchTopGainersLosers();
    }
    
    // नेप्से डाटा प्राप्त गर्नुहोस्
    function fetchNepseData() {
        // लोडिङ स्टेट देखाउनुहोस्
        document.getElementById('nepse-index').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        document.getElementById('trading-volume').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        document.getElementById('traded-shares').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        document.getElementById('transaction-count').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // नेप्से API बाट डाटा प्राप्त गर्नुहोस्
        fetch('https://nepse-data-api.herokuapp.com/data/todaysprice')
            .then(response => {
                if (!response.ok) {
                    throw new Error('नेटवर्क प्रतिक्रिया राम्रो थिएन');
                }
                return response.json();
            })
            .then(data => {
                // नेप्से सूचकांक अपडेट गर्नुहोस्
                updateMarketStats(data);
                
                // नेप्से चार्ट अपडेट गर्नुहोस्
                updateNepseChart(data);
            })
            .catch(error => {
                console.error('डाटा प्राप्त गर्दा त्रुटि:', error);
                // त्रुटि भएमा डेमो डाटा प्रयोग गर्नुहोस्
                useDemoData();
            });
    }
    
    // बजार तथ्याङ्क अपडेट गर्नुहोस्
    function updateMarketStats(data) {
        try {
            // नेप्से सूचकांक
            const nepseIndex = data.summary ? data.summary.index : 2100.45;
            const nepseChange = data.summary ? data.summary.change : 15.23;
            const nepseChangePercent = (nepseChange / (nepseIndex - nepseChange)) * 100;
            
            // कारोबार रकम
            const tradingVolume = data.summary ? data.summary.amount / 10000000 : 2.5; // करोडमा
            const tradingVolumeChange = data.summary ? data.summary.amountChange / 10000000 : -0.3;
            const tradingVolumeChangePercent = (tradingVolumeChange / (tradingVolume - tradingVolumeChange)) * 100;
            
            // कारोबार भएका शेयर
            const tradedShares = data.summary ? data.summary.share / 1000000 : 7.2; // मिलियनमा
            const tradedSharesChange = data.summary ? data.summary.shareChange / 1000000 : 0.5;
            const tradedSharesChangePercent = (tradedSharesChange / (tradedShares - tradedSharesChange)) * 100;
            
            // कारोबार संख्या
            const transactionCount = data.summary ? data.summary.transactions : 45678;
            const transactionCountChange = data.summary ? data.summary.transactionsChange : 3245;
            const transactionCountChangePercent = (transactionCountChange / (transactionCount - transactionCountChange)) * 100;
            
            // UI अपडेट गर्नुहोस्
            const currentLang = document.documentElement.lang || 'ne';
            
            if (currentLang === 'ne') {
                document.getElementById('nepse-index').textContent = nepseIndex.toFixed(2);
                document.getElementById('trading-volume').textContent = `रु. ${tradingVolume.toFixed(2)} अरब`;
                document.getElementById('traded-shares').textContent = `${tradedShares.toFixed(2)} मिलियन`;
                document.getElementById('transaction-count').textContent = transactionCount.toLocaleString();
            } else {
                document.getElementById('nepse-index').textContent = nepseIndex.toFixed(2);
                document.getElementById('trading-volume').textContent = `Rs. ${tradingVolume.toFixed(2)} Billion`;
                document.getElementById('traded-shares').textContent = `${tradedShares.toFixed(2)} Million`;
                document.getElementById('transaction-count').textContent = transactionCount.toLocaleString();
            }
            
            // परिवर्तन प्रतिशत अपडेट गर्नुहोस्
            updateChangePercent('nepse-index', nepseChange, nepseChangePercent);
            updateChangePercent('trading-volume', tradingVolumeChange, tradingVolumeChangePercent);
            updateChangePercent('traded-shares', tradedSharesChange, tradedSharesChangePercent);
            updateChangePercent('transaction-count', transactionCountChange, transactionCountChangePercent);
        } catch (error) {
            console.error('बजार तथ्याङ्क अपडेट गर्दा त्रुटि:', error);
            useDemoData();
        }
    }
    
    // परिवर्तन प्रतिशत अपडेट गर्नुहोस्
    function updateChangePercent(elementId, change, changePercent) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const changeElement = element.nextElementSibling;
        if (!changeElement) return;
        
        const isPositive = change >= 0;
        const sign = isPositive ? '+' : '';
        const iconClass = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const className = isPositive ? 'positive' : 'negative';
        
        const currentLang = document.documentElement.lang || 'ne';
        
        if (currentLang === 'ne') {
            changeElement.innerHTML = `<i class="fas ${iconClass}"></i> ${sign}${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%)`;
        } else {
            changeElement.innerHTML = `<i class="fas ${iconClass}"></i> ${sign}${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%)`;
        }
        
        changeElement.className = `change ${className}`;
    }
    
    // नेप्से चार्ट अपडेट गर्नुहोस्
    function updateNepseChart(data) {
        try {
            // पछिल्लो 12 महिनाको डाटा प्राप्त गर्नुहोस्
            fetch('https://nepse-data-api.herokuapp.com/data/indices?index=NEPSE&period=1y')
                .then(response => response.json())
                .then(chartData => {
                    // चार्ट डाटा तयार गर्नुहोस्
                    const labels = chartData.map(item => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString();
                    });
                    
                    const values = chartData.map(item => item.close);
                    
                    // चार्ट बनाउनुहोस्
                    createNepseChart(labels, values);
                })
                .catch(error => {
                    console.error('चार्ट डाटा प्राप्त गर्दा त्रुटि:', error);
                    // डेमो चार्ट डाटा प्रयोग गर्नुहोस्
                    createDemoNepseChart();
                });
        } catch (error) {
            console.error('नेप्से चार्ट अपडेट गर्दा त्रुटि:', error);
            createDemoNepseChart();
        }
    }
    
    // नेप्से चार्ट बनाउनुहोस्
    function createNepseChart(labels, values) {
        const nepseChartCtx = document.getElementById('nepse-chart').getContext('2d');
        const nepseChart = new Chart(nepseChartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: document.documentElement.lang === 'ne' ? 'नेप्से सूचकांक' : 'NEPSE Index',
                    data: values,
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderColor: '#1a73e8',
                    borderWidth: 2,
                    pointBackgroundColor: '#1a73e8',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // डेमो नेप्से चार्ट बनाउनुहोस्
    function createDemoNepseChart() {
        const nepseChartCtx = document.getElementById('nepse-chart').getContext('2d');
        const nepseChart = new Chart(nepseChartCtx, {
            type: 'line',
            data: {
                labels: ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'],
                datasets: [{
                    label: document.documentElement.lang === 'ne' ? 'नेप्से सूचकांक' : 'NEPSE Index',
                    data: [2050, 2100, 2150, 2200, 2180, 2220, 2250, 2300, 2280, 2320, 2350, 2100],
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderColor: '#1a73e8',
                    borderWidth: 2,
                    pointBackgroundColor: '#1a73e8',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // डेमो डाटा प्रयोग गर्नुहोस्
    function useDemoData() {
        const currentLang = document.documentElement.lang || 'ne';
        
        if (currentLang === 'ne') {
            document.getElementById('nepse-index').textContent = '2,100.45';
            document.getElementById('trading-volume').textContent = 'रु. 2.5 अरब';
            document.getElementById('traded-shares').textContent = '7.2 मिलियन';
            document.getElementById('transaction-count').textContent = '45,678';
        } else {
            document.getElementById('nepse-index').textContent = '2,100.45';
            document.getElementById('trading-volume').textContent = 'Rs. 2.5 Billion';
            document.getElementById('traded-shares').textContent = '7.2 Million';
            document.getElementById('transaction-count').textContent = '45,678';
        }
        
        // परिवर्तन प्रतिशत अपडेट गर्नुहोस्
        const nepseIndexChange = document.querySelector('#nepse-index + .change');
        const tradingVolumeChange = document.querySelector('#trading-volume + .change');
        const tradedSharesChange = document.querySelector('#traded-shares + .change');
        const transactionCountChange = document.querySelector('#transaction-count + .change');
        
        if (nepseIndexChange) nepseIndexChange.innerHTML = '<i class="fas fa-arrow-up"></i> +15.23 (0.73%)';
        if (tradingVolumeChange) tradingVolumeChange.innerHTML = '<i class="fas fa-arrow-down"></i> -0.3 (-10.71%)';
        if (tradedSharesChange) tradedSharesChange.innerHTML = '<i class="fas fa-arrow-up"></i> +0.5 (7.46%)';
        if (transactionCountChange) transactionCountChange.innerHTML = '<i class="fas fa-arrow-up"></i> +3,245 (7.65%)';
        
        // डेमो चार्ट बनाउनुहोस्
        createDemoNepseChart();
    }
    
    // शीर्ष बढ्ने र घट्ने कम्पनीहरू प्राप्त गर्नुहोस्
    function fetchTopGainersLosers() {
        fetch('https://nepse-data-api.herokuapp.com/data/todaysprice')
            .then(response => response.json())
            .then(data => {
                if (data.content && Array.isArray(data.content)) {
                    // कम्पनीहरूलाई मूल्य परिवर्तन प्रतिशतको आधारमा क्रमबद्ध गर्नुहोस्
                    const companies = data.content.map(company => {
                        return {
                            symbol: company.symbol,
                            name: company.securityName,
                            price: parseFloat(company.lastTradedPrice),
                            change: parseFloat(company.percentageChange),
                            volume: parseInt(company.totalTradeQuantity)
                        };
                    });
                    
                    // शीर्ष बढ्ने कम्पनीहरू
                    const gainers = companies
                        .filter(company => company.change > 0)
                        .sort((a, b) => b.change - a.change)
                        .slice(0, 5);
                    
                    // शीर्ष घट्ने कम्पनीहरू
                    const losers = companies
                        .filter(company => company.change < 0)
                        .sort((a, b) => a.change - b.change)
                        .slice(0, 5);
                    
                    // UI अपडेट गर्नुहोस्
                    displayTopGainersLosers(gainers, losers);
                } else {
                    // डेमो डाटा प्रयोग गर्नुहोस्
                    loadTopGainersLosers();
                }
            })
            .catch(error => {
                console.error('शीर्ष बढ्ने र घट्ने कम्पनीहरू प्राप्त गर्दा त्रुटि:', error);
                // डेमो डाटा प्रयोग गर्नुहोस्
                loadTopGainersLosers();
            });
    }
    
    // शीर्ष बढ्ने र घट्ने कम्पनीहरू प्रदर्शन गर्नुहोस्
    function displayTopGainersLosers(gainers, losers) {
        // शीर्ष बढ्ने कम्पनीहरू प्रदर्शन गर्नुहोस्
        const gainersTable = document.getElementById('gainers-table');
        if (gainersTable) {
            gainersTable.innerHTML = '';
            
            gainers.forEach(stock => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.symbol}</td>
                    <td>${stock.name}</td>
                    <td>${stock.price.toFixed(2)}</td>
                    <td class="positive">+${stock.change.toFixed(2)}%</td>
                    <td>${stock.volume.toLocaleString()}</td>
                `;
                gainersTable.appendChild(row);
            });
        }
        
        // शीर्ष घट्ने कम्पनीहरू प्रदर्शन गर्नुहोस्
        const losersTable = document.getElementById('losers-table');
        if (losersTable) {
            losersTable.innerHTML = '';
            
            losers.forEach(stock => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.symbol}</td>
                    <td>${stock.name}</td>
                    <td>${stock.price.toFixed(2)}</td>
                    <td class="negative">${stock.change.toFixed(2)}%</td>
                    <td>${stock.volume.toLocaleString()}</td>
                `;
                losersTable.appendChild(row);
            });
        }
    }
    
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
    
    function performSearch() {
        const searchTerm = searchBox.value.trim().toUpperCase();
        if (!searchTerm) return;
        
        // कम्पनी सिम्बल खोज्नुहोस्
        const companies = ['NABIL', 'NRIC', 'UPPER', 'NTC', 'NHPC', 'PLIC', 'NICA', 'CHCL', 'GBIME', 'NIFRA'];
        
        if (companies.includes(searchTerm)) {
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
    }
    
    // सम्पर्क फारम
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // वर्तमान भाषा प्राप्त गर्नुहोस्
            const currentLang = document.documentElement.lang || 'ne';
            
            // भाषा अनुसार सन्देश
            const messages = {
                ne: 'तपाईंको सन्देश पठाइएको छ। धन्यवाद!',
                en: 'Your message has been sent. Thank you!'
            };
            
            alert(messages[currentLang] || messages.ne);
            contactForm.reset();
        });
    }
}); 