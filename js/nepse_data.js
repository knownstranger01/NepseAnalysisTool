// Function to fetch NEPSE data from our API
async function fetchNepseData() {
    try {
        const response = await fetch('https://merolagani.com/');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching NEPSE data:', error);
        return [];
    }
}

// Function to display NEPSE data in a table
function displayNepseData(data) {
    const tableContainer = document.getElementById('nepse-data-container');
    
    if (!tableContainer) {
        console.error('Table container not found!');
        return;
    }
    
    // Clear previous data
    tableContainer.innerHTML = '';
    
    if (data.length === 0) {
        tableContainer.innerHTML = '<p class="text-center">डाटा उपलब्ध छैन। कृपया पछि फेरि प्रयास गर्नुहोस्।</p>';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>सिम्बोल</th>
            <th>अन्तिम मूल्य</th>
            <th>परिवर्तन</th>
            <th>उच्च</th>
            <th>न्यून</th>
            <th>भोल्युम</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    data.forEach(stock => {
        const row = document.createElement('tr');
        
        // Add change color class based on positive or negative change
        const changeValue = parseFloat(stock.change);
        let changeClass = '';
        if (changeValue > 0) {
            changeClass = 'text-success';
        } else if (changeValue < 0) {
            changeClass = 'text-danger';
        }
        
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>${stock.ltp}</td>
            <td class="${changeClass}">${stock.change}</td>
            <td>${stock.high}</td>
            <td>${stock.low}</td>
            <td>${stock.volume}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

// Function to initialize NEPSE data display
async function initNepseData() {
    // Show loading indicator
    const container = document.getElementById('nepse-data-container');
    if (container) {
        container.innerHTML = '<p class="text-center">डाटा लोड हुँदैछ...</p>';
    }
    
    // Fetch and display data
    const data = await fetchNepseData();
    displayNepseData(data);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // कन्फिगरेसन
    const API_BASE_URL = 'http://localhost:5000';
    const REFRESH_INTERVAL = 60 * 1000; // 1 मिनेट (मिलिसेकेन्डमा)
    const MAX_STOCKS_TO_SHOW = 20; // होमपेजमा देखाउने अधिकतम स्टक्स
    
    // DOM एलिमेन्टहरू
    const nepseDataContainer = document.getElementById('nepse-data-container');
    
    // इनिसियलाइजेसन
    init();
    
    // मुख्य इनिसियलाइजेसन फंक्सन
    function init() {
        // NEPSE डाटा लोड गर्ने
        loadNepseData();
        
        // नियमित अपडेट सेटअप गर्ने
        setInterval(loadNepseData, REFRESH_INTERVAL);
    }
    
    // NEPSE डाटा लोड गर्ने
    function loadNepseData() {
        if (!nepseDataContainer) return;
        
        // लोडिङ स्टेट देखाउने
        nepseDataContainer.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> डाटा लोड हुँदैछ...</p>';
        
        // API बाट डाटा प्राप्त गर्ने
        fetch(`${API_BASE_URL}/nepse_data?sort_by=percent_change&sort_order=desc&limit=${MAX_STOCKS_TO_SHOW}`)
            .then(response => response.json())
            .then(data => {
                renderNepseData(data.data);
            })
            .catch(error => {
                console.error('Error loading NEPSE data:', error);
                nepseDataContainer.innerHTML = `<p class="text-center text-danger">डाटा लोड गर्न समस्या भयो: ${error.message}</p>`;
            });
    }
    
    // NEPSE डाटा रेन्डर गर्ने
    function renderNepseData(stocks) {
        if (!stocks || stocks.length === 0) {
            nepseDataContainer.innerHTML = '<p class="text-center">कुनै डाटा उपलब्ध छैन</p>';
            return;
        }
        
        // टेबल HTML बनाउने
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>सिम्बोल</th>
                        <th>अन्तिम मूल्य</th>
                        <th>परिवर्तन</th>
                        <th>परिवर्तन %</th>
                        <th>उच्च</th>
                        <th>न्यून</th>
                        <th>कारोबार मात्रा</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // स्टक्स डाटा थप्ने
        stocks.forEach(stock => {
            const changeClass = parseFloat(stock.percent_change) > 0 ? 'text-success' : (parseFloat(stock.percent_change) < 0 ? 'text-danger' : '');
            
            tableHTML += `
                <tr>
                    <td><a href="company.html?symbol=${stock.symbol}">${stock.symbol}</a></td>
                    <td>रु. ${stock.ltp}</td>
                    <td class="${changeClass}">${stock.change}</td>
                    <td class="${changeClass}">
                        ${parseFloat(stock.percent_change) > 0 ? '+' : ''}${stock.percent_change}%
                    </td>
                    <td>रु. ${stock.high}</td>
                    <td>रु. ${stock.low}</td>
                    <td>${formatNumber(stock.qty)}</td>
                </tr>
            `;
        });
        
        // टेबल बन्द गर्ने
        tableHTML += `
                </tbody>
            </table>
            <div class="view-all-link">
                <a href="companies.html" class="btn">सबै शेयरहरू हेर्नुहोस् <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        
        // HTML अपडेट गर्ने
        nepseDataContainer.innerHTML = tableHTML;
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