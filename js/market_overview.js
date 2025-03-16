// Function to fetch market overview data from our API
async function fetchMarketOverview() {
    try {
        const response = await fetch('http://localhost:5000/market_overview');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching market overview data:', error);
        return null;
    }
}

// Function to update market overview section with real data
function updateMarketOverview(data) {
    if (!data) return;
    
    // Update NEPSE index
    const nepseIndexElement = document.getElementById('nepse-index');
    const nepseChangeElement = document.getElementById('nepse-change');
    
    if (nepseIndexElement && data.nepse_index) {
        nepseIndexElement.textContent = data.nepse_index;
    }
    
    if (nepseChangeElement && data.nepse_change) {
        // Update the change text
        nepseChangeElement.innerHTML = `<i class="fas fa-arrow-${data.nepse_direction === 'positive' ? 'up' : 'down'}"></i> ${data.nepse_change}`;
        
        // Update the class for color
        nepseChangeElement.className = `change ${data.nepse_direction}`;
    }
    
    // Update trading volume
    const tradingVolumeElement = document.getElementById('trading-volume');
    if (tradingVolumeElement && data.turnover) {
        tradingVolumeElement.textContent = data.turnover;
    }
    
    // Update traded shares
    const tradedSharesElement = document.getElementById('traded-shares');
    if (tradedSharesElement && data.traded_shares) {
        tradedSharesElement.textContent = data.traded_shares;
    }
    
    // Update transaction count
    const transactionCountElement = document.getElementById('transaction-count');
    if (transactionCountElement && data.transactions) {
        transactionCountElement.textContent = data.transactions;
    }
}

// Function to initialize market overview data
async function initMarketOverview() {
    const data = await fetchMarketOverview();
    updateMarketOverview(data);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // कन्फिगरेसन
    const API_BASE_URL = 'https://merolagani.com/';
    const REFRESH_INTERVAL = 60 * 1000; // 1 मिनेट (मिलिसेकेन्डमा)
    
    // DOM एलिमेन्टहरू
    const nepseIndexElement = document.getElementById('nepse-index');
    const nepseChangeElement = document.getElementById('nepse-change');
    const tradingVolumeElement = document.getElementById('trading-volume');
    const tradedSharesElement = document.getElementById('traded-shares');
    const transactionCountElement = document.getElementById('transaction-count');
    const nepseChartElement = document.getElementById('nepse-chart');
    
    // इनिसियलाइजेसन
    init();
    
    // मुख्य इनिसियलाइजेसन फंक्सन
    function init() {
        // मार्केट अवलोकन डाटा लोड गर्ने
        loadMarketOverview();
        
        // नियमित अपडेट सेटअप गर्ने
        setInterval(loadMarketOverview, REFRESH_INTERVAL);
        
        // NEPSE चार्ट इनिसियलाइज गर्ने
        initNepseChart();
    }
    
    // मार्केट अवलोकन डाटा लोड गर्ने
    function loadMarketOverview() {
        fetch(`${API_BASE_URL}/market_overview`)
            .then(response => response.json())
            .then(data => {
                updateMarketOverview(data.data);
            })
            .catch(error => {
                console.error('Error loading market overview:', error);
            });
    }
    
    // मार्केट अवलोकन अपडेट गर्ने
    function updateMarketOverview(data) {
        // NEPSE इन्डेक्स अपडेट गर्ने
        if (nepseIndexElement && data.nepse_index) {
            nepseIndexElement.textContent = data.nepse_index;
        }
        
        // NEPSE परिवर्तन अपडेट गर्ने
        if (nepseChangeElement && data.nepse_change) {
            const isPositive = data.nepse_direction === 'positive';
            nepseChangeElement.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${data.nepse_change}
            `;
            nepseChangeElement.className = `change ${data.nepse_direction}`;
        }
        
        // कारोबार रकम अपडेट गर्ने
        if (tradingVolumeElement && data.turnover) {
            tradingVolumeElement.textContent = data.turnover;
        }
        
        // कारोबार भएका शेयर अपडेट गर्ने
        if (tradedSharesElement && data.traded_shares) {
            tradedSharesElement.textContent = data.traded_shares;
        }
        
        // कारोबार संख्या अपडेट गर्ने
        if (transactionCountElement && data.transactions) {
            transactionCountElement.textContent = data.transactions;
        }
    }
    
    // NEPSE चार्ट इनिसियलाइज गर्ने
    function initNepseChart() {
        if (!nepseChartElement) return;
        
        // डेमो डाटा (पछि API बाट प्राप्त गर्ने)
        const demoData = {
            labels: generateDateLabels(30),
            values: generateRandomValues(30, 1800, 2200)
        };
        
        // चार्ट बनाउने
        const nepseChart = new Chart(nepseChartElement, {
            type: 'line',
            data: {
                labels: demoData.labels,
                datasets: [{
                    label: 'NEPSE इन्डेक्स',
                    data: demoData.values,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    fill: true,
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
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `NEPSE: ${context.raw.toFixed(2)}`;
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
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
        // वास्तविक NEPSE इन्डेक्स डाटा प्राप्त गर्ने
        fetchNepseHistoricalData(nepseChart);
    }
    
    // NEPSE ऐतिहासिक डाटा प्राप्त गर्ने
    function fetchNepseHistoricalData(chart) {
        // यहाँ API बाट NEPSE ऐतिहासिक डाटा प्राप्त गर्ने लजिक थप्नुहोस्
        // उदाहरणको लागि, हामी डेमो डाटा प्रयोग गर्छौं
    }
    
    // मिति लेबलहरू जेनेरेट गर्ने
    function generateDateLabels(days) {
        const labels = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(formatDate(date));
        }
        
        return labels;
    }
    
    // र्यान्डम मानहरू जेनेरेट गर्ने
    function generateRandomValues(count, min, max) {
        const values = [];
        let lastValue = Math.random() * (max - min) + min;
        
        for (let i = 0; i < count; i++) {
            // अघिल्लो मानमा र्यान्डम परिवर्तन थप्ने
            const change = (Math.random() - 0.5) * 50;
            lastValue = Math.max(min, Math.min(max, lastValue + change));
            values.push(lastValue);
        }
        
        return values;
    }
    
    // मिति फर्म्याट गर्ने
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    }
}); 