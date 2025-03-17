/**
 * NEPSE Tracker - Market Overview
 * मार्केट ओभरभ्यू, नेप्से इन्डेक्स, टप गेनर्स र लुजर्स, र कम्पनीहरूको सूची प्रदर्शन गर्ने
 */

// DOM लोड भएपछि कोड चलाउनुहोस्
document.addEventListener('DOMContentLoaded', function() {
    // मार्केट डाटा लोड गर्ने
    loadMarketData();
    
    // रिफ्रेस बटन क्लिक इभेन्ट
    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadMarketData();
            showNotification('मार्केट डाटा रिफ्रेस गरिँदैछ...');
        });
    }
    
    // हरेक 5 मिनेटमा अटो-रिफ्रेस
    setInterval(loadMarketData, 300000); // 5 मिनेट = 300000 मिलिसेकेन्ड
});

// मार्केट डाटा लोड गर्ने फंक्शन
async function loadMarketData() {
    try {
        updateLastUpdatedTime();
        showLoadingState();
        
        // मेरोलगानी मार्केट समरी डाटा प्राप्त गर्ने
        const marketSummaryResponse = await fetch('/api/market-summary');
        const marketSummary = await marketSummaryResponse.json();
        
        // मेरोलगानी लेटेस्ट मार्केट डाटा प्राप्त गर्ने (नेप्से इन्डेक्स, टप गेनर्स र लुजर्स)
        const latestMarketResponse = await fetch('/api/latest-market');
        const latestMarket = await latestMarketResponse.json();
        
        // UI अपडेट गर्ने
        updateMarketStatus(marketSummary.date);
        updateNepseIndex(latestMarket.nepseIndex);
        updateMarketSummary(marketSummary);
        
        // टप गेनर्स र लुजर्स अपडेट गर्ने
        updateTopGainersLosers(latestMarket.topGainers, latestMarket.topLosers);
        
        hideLoadingState();
    } catch (error) {
        console.error('मार्केट डाटा लोड गर्न त्रुटि:', error);
        showErrorMessage();
    }
}

// मार्केट स्टेटस अपडेट गर्ने
function updateMarketStatus(dateString) {
    const marketStatus = document.getElementById('market-status');
    const statusIndicator = marketStatus.querySelector('.status-indicator');
    const statusText = marketStatus.querySelector('.status-text');
    
    // बजार खुला छ कि बन्द छ भनेर जाँच गर्ने
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();
    
    // नेपाल स्टक एक्सचेन्ज आइतबारदेखि बिहीबारसम्म बिहान ११ बजेदेखि दिउँसो ३ बजेसम्म खुला रहन्छ
    const isWeekday = dayOfWeek >= 0 && dayOfWeek <= 4; // आइतबार (0) देखि बिहीबार (4)
    const isMarketHours = hours >= 11 && hours < 15;
    const isMarketOpen = isWeekday && isMarketHours;
    
    if (isMarketOpen) {
        statusIndicator.classList.add('open');
        statusIndicator.classList.remove('closed');
        statusText.classList.add('open');
        statusText.classList.remove('closed');
        statusText.textContent = 'बजार खुला छ';
    } else {
        statusIndicator.classList.add('closed');
        statusIndicator.classList.remove('open');
        statusText.classList.add('closed');
        statusText.classList.remove('open');
        statusText.textContent = 'बजार बन्द छ';
    }
}

// नेप्से इन्डेक्स अपडेट गर्ने
function updateNepseIndex(nepseIndex) {
    const indexElement = document.getElementById('nepse-index');
    const changeElement = document.getElementById('nepse-change');
    
    if (indexElement && changeElement) {
        indexElement.textContent = nepseIndex.index;
        
        const changeValue = nepseIndex.change;
        const percentChange = nepseIndex.percentChange;
        const changeText = `${changeValue} (${percentChange})`;
        const changeIcon = changeElement.querySelector('i');
        const changeSpan = changeElement.querySelector('span');
        
        changeSpan.textContent = changeText;
        
        if (parseFloat(changeValue) > 0) {
            changeElement.classList.add('positive');
            changeElement.classList.remove('negative');
            changeIcon.className = 'fas fa-caret-up';
        } else if (parseFloat(changeValue) < 0) {
            changeElement.classList.add('negative');
            changeElement.classList.remove('positive');
            changeIcon.className = 'fas fa-caret-down';
        } else {
            changeElement.classList.remove('positive', 'negative');
            changeIcon.className = 'fas fa-minus';
        }
    }
}

// मार्केट समरी अपडेट गर्ने
function updateMarketSummary(marketSummary) {
    // कुल कारोबार
    const totalTurnoverElement = document.getElementById('total-turnover');
    if (totalTurnoverElement) {
        totalTurnoverElement.textContent = marketSummary.totalTurnover;
    }
    
    // कुल शेयर
    const totalSharesElement = document.getElementById('total-shares');
    if (totalSharesElement) {
        totalSharesElement.textContent = marketSummary.totalTradedShares;
    }
    
    // कुल कारोबार संख्या
    const totalTransactionsElement = document.getElementById('total-transactions');
    if (totalTransactionsElement) {
        totalTransactionsElement.textContent = marketSummary.totalTransactions;
    }
}

// अन्तिम अपडेट समय अपडेट गर्ने
function updateLastUpdatedTime() {
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        updateTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// लोडिङ स्टेट देखाउने
function showLoadingState() {
    const nepseIndexElement = document.getElementById('nepse-index');
    const totalTurnoverElement = document.getElementById('total-turnover');
    const totalSharesElement = document.getElementById('total-shares');
    const totalTransactionsElement = document.getElementById('total-transactions');
    
    if (nepseIndexElement) nepseIndexElement.textContent = 'लोड हुँदैछ...';
    if (totalTurnoverElement) totalTurnoverElement.textContent = 'लोड हुँदैछ...';
    if (totalSharesElement) totalSharesElement.textContent = 'लोड हुँदैछ...';
    if (totalTransactionsElement) totalTransactionsElement.textContent = 'लोड हुँदैछ...';
    
    // त्रुटि सन्देश लुकाउने
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// लोडिङ स्टेट लुकाउने
function hideLoadingState() {
    // यहाँ केही गर्नु पर्दैन, डाटा अपडेट भइसकेको हुन्छ
}

// त्रुटि सन्देश देखाउने
function showErrorMessage() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'flex';
    }
    
    const nepseIndexElement = document.getElementById('nepse-index');
    const totalTurnoverElement = document.getElementById('total-turnover');
    const totalSharesElement = document.getElementById('total-shares');
    const totalTransactionsElement = document.getElementById('total-transactions');
    
    if (nepseIndexElement) nepseIndexElement.textContent = 'N/A';
    if (totalTurnoverElement) totalTurnoverElement.textContent = 'N/A';
    if (totalSharesElement) totalSharesElement.textContent = 'N/A';
    if (totalTransactionsElement) totalTransactionsElement.textContent = 'N/A';
}

// नोटिफिकेशन देखाउने
function showNotification(message) {
    // common.js मा परिभाषित showNotification फंक्शन प्रयोग गर्ने
    if (typeof window.showNotification === 'function') {
        window.showNotification(message);
    } else {
        console.log(message);
    }
}

/**
 * मार्केट ओभरभ्यू अपडेट गर्ने
 */
async function updateMarketOverview() {
    try {
        // लोडिङ स्पिनर देखाउने
        document.getElementById('loading-spinner').style.display = 'flex';
        
        // मार्केट ओभरभ्यू डाटा प्राप्त गर्ने
        const marketOverview = await getMarketOverview();
        
        // लोडिङ स्पिनर लुकाउने
        document.getElementById('loading-spinner').style.display = 'none';
        
        // अपडेट गरिएको समय देखाउने
        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        document.getElementById('last-updated').textContent = `Last updated: ${formattedTime}`;
        
        // मार्केट ओभरभ्यू डाटा प्रदर्शन गर्ने
        document.getElementById('turnover-value').textContent = marketOverview.totalTurnover;
        document.getElementById('traded-shares').textContent = marketOverview.totalTradedShares;
        document.getElementById('transactions').textContent = marketOverview.totalTransactions;
        
        // मार्केट ओभरभ्यू डाटा परिवर्तन प्रदर्शन गर्ने (डेमो उद्देश्यको लागि)
        const randomChange = (Math.random() * 10 - 5).toFixed(2);
        document.getElementById('turnover-change').textContent = `${randomChange}%`;
        document.getElementById('turnover-change').className = 'change ' + (randomChange >= 0 ? 'positive' : 'negative');
        
        const randomSharesChange = (Math.random() * 10 - 5).toFixed(2);
        document.getElementById('traded-shares-change').textContent = `${randomSharesChange}%`;
        document.getElementById('traded-shares-change').className = 'change ' + (randomSharesChange >= 0 ? 'positive' : 'negative');
        
        const randomTransactionsChange = (Math.random() * 10 - 5).toFixed(2);
        document.getElementById('transactions-change').textContent = `${randomTransactionsChange}%`;
        document.getElementById('transactions-change').className = 'change ' + (randomTransactionsChange >= 0 ? 'positive' : 'negative');
    } catch (error) {
        console.error('मार्केट ओभरभ्यू अपडेट गर्न त्रुटि:', error);
        
        // लोडिङ स्पिनर लुकाउने
        document.getElementById('loading-spinner').style.display = 'none';
        
        // त्रुटि सन्देश देखाउने
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').textContent = 'Failed to load market data. Please try again later.';
    }
}

/**
 * नेप्से इन्डेक्स अपडेट गर्ने
 */
async function updateNepseIndex() {
    try {
        // टप गेनर्स र लुजर्स डाटा प्राप्त गर्ने (यसमा नेप्से इन्डेक्स पनि समावेश छ)
        const data = await getTopGainersLosers();
        
        // नेप्से इन्डेक्स डाटा प्रदर्शन गर्ने
        document.getElementById('nepse-index').textContent = data.nepseIndex.index;
        
        // नेप्से इन्डेक्स परिवर्तन प्रदर्शन गर्ने
        const change = data.nepseIndex.change;
        const percentChange = data.nepseIndex.percentChange;
        
        // परिवर्तन प्रदर्शन गर्ने
        document.getElementById('nepse-change').textContent = `${change} (${percentChange})`;
        document.getElementById('nepse-change').className = 'change ' + (parseFloat(change) >= 0 ? 'positive' : 'negative');
        
        // नेप्से चार्ट अपडेट गर्ने
        updateNepseChart(data.nepseIndex);
    } catch (error) {
        console.error('नेप्से इन्डेक्स अपडेट गर्न त्रुटि:', error);
    }
}

/**
 * नेप्से चार्ट अपडेट गर्ने
 * @param {Object} nepseData - नेप्से इन्डेक्स डाटा
 */
function updateNepseChart(nepseData) {
    // चार्ट कन्टेनर प्राप्त गर्ने
    const chartContainer = document.getElementById('nepse-chart');
    
    // यदि चार्ट पहिले नै बनाइएको छ भने अपडेट गर्ने
    if (window.nepseChart) {
        // डेमो डाटा अपडेट गर्ने (वास्तविक डाटा प्रयोग गर्न यहाँ परिवर्तन गर्नुहोस्)
        const lastValue = window.nepseChart.data.datasets[0].data[window.nepseChart.data.datasets[0].data.length - 1];
        const newValue = parseFloat(nepseData.index);
        
        // डाटा अपडेट गर्ने
        window.nepseChart.data.datasets[0].data.push(newValue);
        window.nepseChart.data.labels.push('');
        
        // अधिकतम 20 डाटा पोइन्ट मात्र देखाउने
        if (window.nepseChart.data.datasets[0].data.length > 20) {
            window.nepseChart.data.datasets[0].data.shift();
            window.nepseChart.data.labels.shift();
        }
        
        // चार्ट अपडेट गर्ने
        window.nepseChart.update();
        return;
    }
    
    // डेमो डाटा (वास्तविक डाटा प्रयोग गर्न यहाँ परिवर्तन गर्नुहोस्)
    const initialValue = parseFloat(nepseData.index);
    const data = Array.from({length: 10}, (_, i) => initialValue + (Math.random() * 20 - 10));
    data.push(initialValue);
    
    // चार्ट बनाउने
    window.nepseChart = new Chart(chartContainer, {
        type: 'line',
        data: {
            labels: Array(data.length).fill(''),
            datasets: [{
                label: 'NEPSE Index',
                data: data,
                borderColor: parseFloat(nepseData.change) >= 0 ? '#28a745' : '#dc3545',
                backgroundColor: parseFloat(nepseData.change) >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
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
                    enabled: true
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: true,
                    beginAtZero: false
                }
            }
        }
    });
}

// टप गेनर्स र लुजर्स अपडेट गर्ने
function updateTopGainersLosers(gainers, losers) {
    // टप गेनर्स अपडेट गर्ने
    const gainersTable = document.getElementById('top-gainers-table');
    if (gainersTable) {
        gainersTable.innerHTML = '';
        
        if (gainers && gainers.length > 0) {
            gainers.forEach(stock => {
                const row = document.createElement('tr');
                
                // सिम्बल
                const symbolCell = document.createElement('td');
                const symbolLink = document.createElement('a');
                symbolLink.href = `companies.html?symbol=${stock.symbol}`;
                symbolLink.textContent = stock.symbol;
                symbolCell.appendChild(symbolLink);
                
                // LTP
                const ltpCell = document.createElement('td');
                ltpCell.textContent = stock.ltp;
                
                // परिवर्तन
                const changeCell = document.createElement('td');
                changeCell.textContent = stock.pointChange;
                changeCell.classList.add('positive');
                
                // % परिवर्तन
                const percentChangeCell = document.createElement('td');
                percentChangeCell.textContent = stock.percentChange;
                percentChangeCell.classList.add('positive');
                
                // कार्य
                const actionsCell = document.createElement('td');
                actionsCell.classList.add('actions');
                
                // वाचलिस्टमा थप्ने बटन
                const addToWatchlistBtn = document.createElement('button');
                addToWatchlistBtn.classList.add('add-watchlist-btn');
                addToWatchlistBtn.innerHTML = '<i class="far fa-star"></i>';
                addToWatchlistBtn.title = 'वाचलिस्टमा थप्नुहोस्';
                addToWatchlistBtn.addEventListener('click', function() {
                    addToWatchlist(stock.symbol);
                });
                
                // पोर्टफोलियोमा थप्ने बटन
                const addToPortfolioBtn = document.createElement('button');
                addToPortfolioBtn.classList.add('add-portfolio-btn');
                addToPortfolioBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
                addToPortfolioBtn.title = 'पोर्टफोलियोमा थप्नुहोस्';
                addToPortfolioBtn.addEventListener('click', function() {
                    addToPortfolio(stock.symbol);
                });
                
                actionsCell.appendChild(addToWatchlistBtn);
                actionsCell.appendChild(addToPortfolioBtn);
                
                // रो मा सेलहरू थप्ने
                row.appendChild(symbolCell);
                row.appendChild(ltpCell);
                row.appendChild(changeCell);
                row.appendChild(percentChangeCell);
                row.appendChild(actionsCell);
                
                // टेबलमा रो थप्ने
                gainersTable.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.setAttribute('colspan', '5');
            cell.classList.add('text-center');
            cell.textContent = 'कुनै डाटा उपलब्ध छैन';
            row.appendChild(cell);
            gainersTable.appendChild(row);
        }
    }
    
    // टप लुजर्स अपडेट गर्ने
    const losersTable = document.getElementById('top-losers-table');
    if (losersTable) {
        losersTable.innerHTML = '';
        
        if (losers && losers.length > 0) {
            losers.forEach(stock => {
                const row = document.createElement('tr');
                
                // सिम्बल
                const symbolCell = document.createElement('td');
                const symbolLink = document.createElement('a');
                symbolLink.href = `companies.html?symbol=${stock.symbol}`;
                symbolLink.textContent = stock.symbol;
                symbolCell.appendChild(symbolLink);
                
                // LTP
                const ltpCell = document.createElement('td');
                ltpCell.textContent = stock.ltp;
                
                // परिवर्तन
                const changeCell = document.createElement('td');
                changeCell.textContent = stock.pointChange;
                changeCell.classList.add('negative');
                
                // % परिवर्तन
                const percentChangeCell = document.createElement('td');
                percentChangeCell.textContent = stock.percentChange;
                percentChangeCell.classList.add('negative');
                
                // कार्य
                const actionsCell = document.createElement('td');
                actionsCell.classList.add('actions');
                
                // वाचलिस्टमा थप्ने बटन
                const addToWatchlistBtn = document.createElement('button');
                addToWatchlistBtn.classList.add('add-watchlist-btn');
                addToWatchlistBtn.innerHTML = '<i class="far fa-star"></i>';
                addToWatchlistBtn.title = 'वाचलिस्टमा थप्नुहोस्';
                addToWatchlistBtn.addEventListener('click', function() {
                    addToWatchlist(stock.symbol);
                });
                
                // पोर्टफोलियोमा थप्ने बटन
                const addToPortfolioBtn = document.createElement('button');
                addToPortfolioBtn.classList.add('add-portfolio-btn');
                addToPortfolioBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
                addToPortfolioBtn.title = 'पोर्टफोलियोमा थप्नुहोस्';
                addToPortfolioBtn.addEventListener('click', function() {
                    addToPortfolio(stock.symbol);
                });
                
                actionsCell.appendChild(addToWatchlistBtn);
                actionsCell.appendChild(addToPortfolioBtn);
                
                // रो मा सेलहरू थप्ने
                row.appendChild(symbolCell);
                row.appendChild(ltpCell);
                row.appendChild(changeCell);
                row.appendChild(percentChangeCell);
                row.appendChild(actionsCell);
                
                // टेबलमा रो थप्ने
                losersTable.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.setAttribute('colspan', '5');
            cell.classList.add('text-center');
            cell.textContent = 'कुनै डाटा उपलब्ध छैन';
            row.appendChild(cell);
            losersTable.appendChild(row);
        }
    }
    
    // ट्याब बटन क्लिक इभेन्ट
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // सबै ट्याब बटनबाट एक्टिभ क्लास हटाउने
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // सबै ट्याब कन्टेन्टबाट एक्टिभ क्लास हटाउने
            tabContents.forEach(content => content.classList.remove('active'));
            
            // क्लिक गरिएको बटनमा एक्टिभ क्लास थप्ने
            this.classList.add('active');
            
            // सम्बन्धित ट्याब कन्टेन्टमा एक्टिभ क्लास थप्ने
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// वाचलिस्टमा थप्ने फंक्शन
function addToWatchlist(symbol) {
    // यूजर लगइन छ कि छैन जाँच गर्ने
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showNotification('वाचलिस्टमा थप्न कृपया पहिले लगइन गर्नुहोस्');
        return;
    }
    
    // वाचलिस्ट डाटा प्राप्त गर्ने
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    
    // सिम्बल पहिले नै वाचलिस्टमा छ कि छैन जाँच गर्ने
    if (watchlist.includes(symbol)) {
        showNotification(`${symbol} पहिले नै तपाईंको वाचलिस्टमा छ`);
        return;
    }
    
    // वाचलिस्टमा सिम्बल थप्ने
    watchlist.push(symbol);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    showNotification(`${symbol} तपाईंको वाचलिस्टमा थपियो`);
}

// पोर्टफोलियोमा थप्ने फंक्शन
function addToPortfolio(symbol) {
    // यूजर लगइन छ कि छैन जाँच गर्ने
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showNotification('पोर्टफोलियोमा थप्न कृपया पहिले लगइन गर्नुहोस्');
        return;
    }
    
    // पोर्टफोलियो पेजमा रिडाइरेक्ट गर्ने
    window.location.href = `portfolio.html?add=${symbol}`;
}

/**
 * कम्पनीहरूको सूची अपडेट गर्ने
 */
async function updateCompanyList() {
    try {
        // कम्पनीहरूको सूची प्राप्त गर्ने
        const companies = await getCompanies();
        
        // कम्पनीहरूको सूची प्रदर्शन गर्ने
        const companiesTable = document.getElementById('all-companies-table');
        if (companiesTable) {
            companiesTable.innerHTML = '';
            
            companies.forEach(company => {
                const row = document.createElement('tr');
                
                // परिवर्तन पोजिटिभ वा नेगेटिभ छ भनेर निर्धारण गर्ने
                const changeClass = parseFloat(company.percentChange) >= 0 ? 'positive' : 'negative';
                const changePrefix = parseFloat(company.percentChange) >= 0 ? '+' : '';
                
                row.innerHTML = `
                    <td>${company.symbol}</td>
                    <td>${company.symbol}</td>
                    <td>-</td>
                    <td>${company.ltp}</td>
                    <td class="${changeClass}">${changePrefix}${company.percentChange}</td>
                    <td><a href="analysis.html?symbol=${company.symbol}" class="btn btn-sm">View</a></td>
                `;
                companiesTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error('कम्पनीहरूको सूची अपडेट गर्न त्रुटि:', error);
    }
} 