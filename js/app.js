// DOM लोड भएपछि कोड चलाउनुहोस्
document.addEventListener('DOMContentLoaded', function() {
    // होम पेजको नेप्से चार्ट
    const nepseChartElement = document.getElementById('nepse-chart');
    if (nepseChartElement) {
        // नेप्से डाटा लोड गर्नुहोस्
        fetchNepseData();
    }
    
    // खोज बक्स फंक्शनालिटी
    const searchBox = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchBox && searchButton) {
        // खोज बटनमा क्लिक गर्दा
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        // इन्टर कुञ्जी थिच्दा
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
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
    
    // गेनर्स र लुजर्स ट्याब स्विचिङ
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContentDivs = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // सबै ट्याब बटनहरूबाट एक्टिभ क्लास हटाउनुहोस्
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // सबै ट्याब सामग्रीहरूबाट एक्टिभ क्लास हटाउनुहोस्
            tabContentDivs.forEach(content => content.classList.remove('active'));
            
            // क्लिक गरिएको बटन र सम्बन्धित सामग्रीमा एक्टिभ क्लास थप्नुहोस्
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // शीर्ष बढ्ने र घट्ने कम्पनीहरू लोड गर्नुहोस्
    const gainersTable = document.getElementById('top-gainers-body');
    const losersTable = document.getElementById('top-losers-body');
    
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
            
            // बजार पूँजीकरण
            const marketCap = data.summary ? data.summary.marketCap / 1000000000000 : 3.2; // ट्रिलियनमा
            const marketCapChange = data.summary ? data.summary.marketCapChange / 1000000000000 : 0.025;
            const marketCapChangePercent = (marketCapChange / (marketCap - marketCapChange)) * 100;
            
            // UI अपडेट गर्नुहोस्
            const currentLang = document.documentElement.lang || 'ne';
            
            // नेप्से इन्डेक्स अपडेट
            document.getElementById('nepse-index').textContent = nepseIndex.toFixed(2);
            
            // नेप्से परिवर्तन अपडेट
            const nepseChangeElement = document.getElementById('nepse-change');
            if (nepseChangeElement) {
                const changeText = `${nepseChange >= 0 ? '+' : ''}${nepseChange.toFixed(2)} (${nepseChangePercent.toFixed(2)}%)`;
                nepseChangeElement.textContent = changeText;
                nepseChangeElement.className = `change ${nepseChange >= 0 ? 'positive' : 'negative'}`;
            }
            
            // कारोबार रकम अपडेट
            const turnoverElement = document.getElementById('turnover-value');
            const turnoverChangeElement = document.getElementById('turnover-change');
            if (turnoverElement) {
                turnoverElement.textContent = currentLang === 'ne' ? 
                    `रु. ${tradingVolume.toFixed(2)} अरब` : 
                    `Rs. ${tradingVolume.toFixed(2)} Bn`;
            }
            if (turnoverChangeElement) {
                const turnoverChangeText = `${tradingVolumeChange >= 0 ? '+' : ''}${tradingVolumeChangePercent.toFixed(2)}%`;
                turnoverChangeElement.textContent = turnoverChangeText;
                turnoverChangeElement.className = `change ${tradingVolumeChange >= 0 ? 'positive' : 'negative'}`;
            }
            
            // कारोबार भएका शेयर अपडेट
            const tradedSharesElement = document.getElementById('traded-shares');
            const tradedSharesChangeElement = document.getElementById('traded-shares-change');
            if (tradedSharesElement) {
                tradedSharesElement.textContent = `${tradedShares.toFixed(2)} M`;
            }
            if (tradedSharesChangeElement) {
                const tradedSharesChangeText = `${tradedSharesChange >= 0 ? '+' : ''}${tradedSharesChangePercent.toFixed(2)}%`;
                tradedSharesChangeElement.textContent = tradedSharesChangeText;
                tradedSharesChangeElement.className = `change ${tradedSharesChange >= 0 ? 'positive' : 'negative'}`;
            }
            
            // कारोबार संख्या अपडेट
            const transactionsElement = document.getElementById('transactions');
            const transactionsChangeElement = document.getElementById('transactions-change');
            if (transactionsElement) {
                transactionsElement.textContent = transactionCount.toLocaleString();
            }
            if (transactionsChangeElement) {
                const transactionsChangeText = `${transactionCountChange >= 0 ? '+' : ''}${transactionCountChangePercent.toFixed(2)}%`;
                transactionsChangeElement.textContent = transactionsChangeText;
                transactionsChangeElement.className = `change ${transactionCountChange >= 0 ? 'positive' : 'negative'}`;
            }
            
            // बजार पूँजीकरण अपडेट
            const marketCapElement = document.getElementById('market-cap');
            const marketCapChangeElement = document.getElementById('market-cap-change');
            if (marketCapElement) {
                marketCapElement.textContent = currentLang === 'ne' ? 
                    `रु. ${marketCap.toFixed(2)} खरब` : 
                    `Rs. ${marketCap.toFixed(2)} T`;
            }
            if (marketCapChangeElement) {
                const marketCapChangeText = `${marketCapChange >= 0 ? '+' : ''}${marketCapChangePercent.toFixed(2)}%`;
                marketCapChangeElement.textContent = marketCapChangeText;
                marketCapChangeElement.className = `change ${marketCapChange >= 0 ? 'positive' : 'negative'}`;
            }
            
            // क्षेत्रगत सूचकांक अपडेट गर्नुहोस्
            updateSectoralIndices(data);
            
        } catch (error) {
            console.error('बजार तथ्याङ्क अपडेट गर्दा त्रुटि:', error);
            useDemoData();
        }
    }
    
    // क्षेत्रगत सूचकांक अपडेट गर्नुहोस्
    function updateSectoralIndices(data) {
        try {
            // डेमो क्षेत्रगत डाटा
            let sectoralData = [
                { name: 'Banking', value: 1850.25, change: 1.2 },
                { name: 'Hydropower', value: 2450.80, change: 2.5 },
                { name: 'Insurance', value: 9120.15, change: -0.8 },
                { name: 'Development Bank', value: 3240.60, change: 0.5 },
                { name: 'Finance', value: 1520.30, change: -0.3 },
                { name: 'Hotels', value: 2780.45, change: 1.8 }
            ];
            
            // यदि API बाट डाटा उपलब्ध छ भने, त्यसलाई प्रयोग गर्नुहोस्
            if (data.sectors && Array.isArray(data.sectors)) {
                sectoralData = data.sectors.map(sector => ({
                    name: sector.name,
                    value: sector.index,
                    change: sector.change
                }));
            }
            
            // क्षेत्रगत कार्डहरू अपडेट गर्नुहोस्
            const sectorCardsContainer = document.getElementById('sector-cards');
            if (!sectorCardsContainer) return;
            
            // HTML बनाउनुहोस्
            const sectorCardsHTML = sectoralData.map(sector => `
                <div class="sector-card">
                    <h4>${sector.name}</h4>
                    <div class="value">${sector.value.toLocaleString()}</div>
                    <div class="change ${sector.change >= 0 ? 'positive' : 'negative'}">
                        ${sector.change >= 0 ? '+' : ''}${sector.change.toFixed(1)}%
                    </div>
                </div>
            `).join('');
            
            // HTML सेट गर्नुहोस्
            sectorCardsContainer.innerHTML = sectorCardsHTML;
            
        } catch (error) {
            console.error('क्षेत्रगत सूचकांक अपडेट गर्दा त्रुटि:', error);
        }
    }
    
    // नेप्से चार्ट अपडेट गर्नुहोस्
    function updateNepseChart(data) {
        try {
            // डेमो डाटा तयार गर्नुहोस्
            const labels = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
            const values = [2080.45, 2085.67, 2092.34, 2088.56, 2094.78, 2098.23, 2100.45];
            
            // चार्ट बनाउनुहोस्
            createNepseChart(labels, values);
        } catch (error) {
            console.error('नेप्से चार्ट अपडेट गर्दा त्रुटि:', error);
            createDemoNepseChart();
        }
    }
    
    // नेप्से चार्ट बनाउनुहोस्
    function createNepseChart(labels, values) {
        const ctx = document.getElementById('nepse-chart');
        if (!ctx) return;
        
        // यदि चार्ट पहिले नै अवस्थित छ भने, यसलाई नष्ट गर्नुहोस्
        if (window.nepseChart) {
            window.nepseChart.destroy();
        }
        
        // नयाँ चार्ट बनाउनुहोस्
        window.nepseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'NEPSE Index',
                    data: values,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#1a73e8',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#5f6368'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#5f6368'
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }
    
    // डेमो नेप्से चार्ट बनाउनुहोस्
    function createDemoNepseChart() {
        const labels = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
        const values = [2080.45, 2085.67, 2092.34, 2088.56, 2094.78, 2098.23, 2100.45];
        createNepseChart(labels, values);
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
        const gainersTable = document.getElementById('top-gainers-body');
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
        const losersTable = document.getElementById('top-losers-body');
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
    function performSearch() {
        const searchBox = document.querySelector('.search-box input');
        const searchTerm = searchBox.value.trim().toUpperCase();
        if (!searchTerm) return;
        
        // कम्पनी सिम्बल खोज्नुहोस्
        const companies = ['NABIL', 'NRIC', 'UPPER', 'NTC', 'NHPC', 'PLIC', 'NICA', 'CHCL', 'GBIME', 'NIFRA'];
        
        if (companies.includes(searchTerm)) {
            // कम्पनी फेला परेमा, विश्लेषण पृष्ठमा जानुहोस्
            // वर्तमान भाषा प्राप्त गर्नुहोस्
            const currentLang = document.documentElement.lang || 'ne';
            const analysisPage = currentLang === 'en' ? 'analysis-en.html' : 'analysis.html';
            window.location.href = `${analysisPage}?symbol=${searchTerm}`;
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

    // Tab Switching Functionality
    document.addEventListener('DOMContentLoaded', function() {
        // Get all tab buttons and tab contents
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        // Add click event listener to each tab button
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the tab to show
                const tabToShow = this.getAttribute('data-tab');

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                this.classList.add('active');
                document.getElementById(tabToShow).classList.add('active');
            });
        });

        // Function to update top gainers and losers
        function updateTopGainersLosers(data) {
            try {
                // Check if data exists and has the required properties
                if (!data || !data.gainers || !data.losers) {
                    console.error('Invalid data format for gainers and losers');
                    return;
                }

                // Get the table bodies
                const gainersBody = document.getElementById('top-gainers-body');
                const losersBody = document.getElementById('top-losers-body');

                // Clear existing data
                if (gainersBody) gainersBody.innerHTML = '';
                if (losersBody) losersBody.innerHTML = '';

                // Add gainers data
                if (gainersBody && data.gainers.length > 0) {
                    data.gainers.forEach(stock => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${stock.symbol}</td>
                            <td>${stock.company}</td>
                            <td>${stock.ltp}</td>
                            <td>+${stock.change}</td>
                            <td class="positive">+${stock.percentChange}%</td>
                        `;
                        gainersBody.appendChild(row);
                    });
                }

                // Add losers data
                if (losersBody && data.losers.length > 0) {
                    data.losers.forEach(stock => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${stock.symbol}</td>
                            <td>${stock.company}</td>
                            <td>${stock.ltp}</td>
                            <td>${stock.change}</td>
                            <td class="negative">${stock.percentChange}%</td>
                        `;
                        losersBody.appendChild(row);
                    });
                }
            } catch (error) {
                console.error('Error updating gainers and losers:', error);
            }
        }

        // Example data for testing
        const sampleData = {
            gainers: [
                { symbol: 'UPPER', company: 'Upper Tamakoshi Hydropower Ltd.', ltp: 'Rs. 450', change: '40.5', percentChange: '9.89' },
                { symbol: 'CHCL', company: 'Chilime Hydropower Company Ltd.', ltp: 'Rs. 520', change: '36.8', percentChange: '7.62' },
                { symbol: 'NABIL', company: 'Nabil Bank Ltd.', ltp: 'Rs. 1,250', change: '75.5', percentChange: '6.43' },
                { symbol: 'NICA', company: 'NIC Asia Bank Ltd.', ltp: 'Rs. 880', change: '48.2', percentChange: '5.79' },
                { symbol: 'SBI', company: 'Nepal SBI Bank Ltd.', ltp: 'Rs. 380', change: '19.5', percentChange: '5.41' }
            ],
            losers: [
                { symbol: 'NLIC', company: 'Nepal Life Insurance Co. Ltd.', ltp: 'Rs. 1,150', change: '-92.5', percentChange: '-7.45' },
                { symbol: 'PLIC', company: 'Prime Life Insurance Co. Ltd.', ltp: 'Rs. 780', change: '-58.2', percentChange: '-6.94' },
                { symbol: 'GBIME', company: 'Global IME Bank Ltd.', ltp: 'Rs. 340', change: '-22.5', percentChange: '-6.21' },
                { symbol: 'PRVU', company: 'Prabhu Bank Ltd.', ltp: 'Rs. 310', change: '-18.8', percentChange: '-5.72' },
                { symbol: 'ADBL', company: 'Agricultural Development Bank Ltd.', ltp: 'Rs. 420', change: '-22.4', percentChange: '-5.06' }
            ]
        };

        // Call the function with sample data (in a real app, this would come from an API)
        // updateTopGainersLosers(sampleData);

        // In a real application, you would fetch this data from an API
        // For example:
        /*
        fetch('https://api.example.com/market/gainers-losers')
            .then(response => response.json())
            .then(data => updateTopGainersLosers(data))
            .catch(error => console.error('Error fetching gainers and losers:', error));
        */
    });
}); 