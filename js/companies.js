/**
 * NEPSE Tracker - Companies
 * कम्पनीहरूको सूची प्रदर्शन गर्ने
 */

// DOM लोड भएपछि कोड चलाउनुहोस्
document.addEventListener('DOMContentLoaded', function() {
    // टप गेनर्स र लुजर्स अपडेट गर्ने
    updateTopGainersLosers();
    
    // कम्पनीहरूको सूची अपडेट गर्ने
    updateCompanyList();
    
    // रियल-टाइम डाटा अपडेट इभेन्ट सुन्ने
    document.addEventListener('realtime-data-updated', function() {
        updateTopGainersLosers();
        updateCompanyList();
    });
    
    // ट्याब बटनहरूमा क्लिक इभेन्ट थप्ने
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // सबै ट्याब बटनहरूबाट एक्टिभ क्लास हटाउने
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // क्लिक गरिएको बटनमा एक्टिभ क्लास थप्ने
            this.classList.add('active');
            
            // सबै ट्याब कन्टेन्टहरू लुकाउने
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // सम्बन्धित ट्याब कन्टेन्ट देखाउने
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // खोज र फिल्टर फंक्शनहरू
    const companySearch = document.getElementById('company-search');
    if (companySearch) {
        companySearch.addEventListener('input', function() {
            filterCompanies();
        });
    }
    
    const sectorFilter = document.getElementById('sector-filter');
    if (sectorFilter) {
        sectorFilter.addEventListener('change', function() {
            filterCompanies();
        });
    }
});

/**
 * टप गेनर्स र लुजर्स अपडेट गर्ने
 */
async function updateTopGainersLosers() {
    try {
        // टप गेनर्स र लुजर्स डाटा प्राप्त गर्ने
        const data = await getTopGainersLosers();
        
        // टप गेनर्स डाटा प्रदर्शन गर्ने
        const gainersTable = document.getElementById('gainers-table');
        if (gainersTable) {
            gainersTable.innerHTML = '';
            
            data.topGainers.forEach(stock => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.symbol}</td>
                    <td>${stock.symbol}</td>
                    <td>${stock.ltp}</td>
                    <td class="positive">+${stock.percentChange}</td>
                    <td>-</td>
                `;
                gainersTable.appendChild(row);
            });
        }
        
        // टप लुजर्स डाटा प्रदर्शन गर्ने
        const losersTable = document.getElementById('losers-table');
        if (losersTable) {
            losersTable.innerHTML = '';
            
            data.topLosers.forEach(stock => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.symbol}</td>
                    <td>${stock.symbol}</td>
                    <td>${stock.ltp}</td>
                    <td class="negative">${stock.percentChange}</td>
                    <td>-</td>
                `;
                losersTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error('टप गेनर्स र लुजर्स अपडेट गर्न त्रुटि:', error);
    }
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
            
            // कम्पनीहरूको सूची स्टोर गर्ने
            window.companiesList = companies;
            
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

/**
 * कम्पनीहरू फिल्टर गर्ने
 */
function filterCompanies() {
    // खोज र फिल्टर मान प्राप्त गर्ने
    const searchTerm = document.getElementById('company-search').value.toLowerCase();
    const sectorFilter = document.getElementById('sector-filter').value.toLowerCase();
    
    // कम्पनीहरूको सूची प्राप्त गर्ने
    const companies = window.companiesList || [];
    
    // फिल्टर गरिएको कम्पनीहरू
    let filteredCompanies = companies;
    
    // खोज फिल्टर लागू गर्ने
    if (searchTerm) {
        filteredCompanies = filteredCompanies.filter(company => 
            company.symbol.toLowerCase().includes(searchTerm)
        );
    }
    
    // सेक्टर फिल्टर लागू गर्ने
    if (sectorFilter) {
        filteredCompanies = filteredCompanies.filter(company => 
            (company.sector || '').toLowerCase() === sectorFilter
        );
    }
    
    // फिल्टर गरिएको कम्पनीहरू प्रदर्शन गर्ने
    const companiesTable = document.getElementById('all-companies-table');
    if (companiesTable) {
        companiesTable.innerHTML = '';
        
        filteredCompanies.forEach(company => {
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
} 