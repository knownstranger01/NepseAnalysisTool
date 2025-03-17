/**
 * News Module
 * Handles news page functionality including filtering, pagination, and API calls
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = 'http://localhost:5000';
    const ITEMS_PER_PAGE = 10;
    
    // State variables
    let allNews = [];
    let filteredNews = [];
    let currentPage = 1;
    let currentCategory = 'all';
    let currentDateRange = 'week';
    let searchTerm = '';
    let isLoading = false;
    
    // DOM Elements
    const newsContainer = document.getElementById('news-container');
    const categoryTabs = document.querySelectorAll('.tab-btn');
    const categoryFilter = document.getElementById('news-category');
    const dateFilter = document.getElementById('news-date');
    const searchInput = document.getElementById('news-search');
    const searchButton = document.getElementById('search-btn');
    const paginationContainer = document.getElementById('news-pagination');
    const newsletterForm = document.getElementById('newsletter-form');
    
    // Initialize
    init();
    
    /**
     * Initialize the news module
     */
    function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Load news data
        loadNewsData();
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Category tabs
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                categoryTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Update current category
                currentCategory = this.dataset.category;
                currentPage = 1;
                
                // Update category filter dropdown to match
                categoryFilter.value = currentCategory;
                
                // Filter and render news
                filterAndRenderNews();
            });
        });
        
        // Category filter dropdown
        categoryFilter.addEventListener('change', function() {
            currentCategory = this.value;
            currentPage = 1;
            
            // Update category tabs to match
            categoryTabs.forEach(tab => {
                if (tab.dataset.category === currentCategory) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // Filter and render news
            filterAndRenderNews();
        });
        
        // Date range filter
        dateFilter.addEventListener('change', function() {
            currentDateRange = this.value;
            currentPage = 1;
            
            // Filter and render news
            filterAndRenderNews();
        });
        
        // Search input
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                searchTerm = this.value.trim().toLowerCase();
                currentPage = 1;
                
                // Filter and render news
                filterAndRenderNews();
            }
        });
        
        // Search button
        searchButton.addEventListener('click', function() {
            searchTerm = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            
            // Filter and render news
            filterAndRenderNews();
        });
        
        // Newsletter form
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const email = document.getElementById('newsletter-email').value;
                
                // Subscribe to newsletter
                subscribeToNewsletter(email);
            });
        }
    }
    
    /**
     * Load news data from API
     */
    async function loadNewsData() {
        try {
            // Set loading state
            isLoading = true;
            showLoadingState();
            
            // Fetch news data from API
            const response = await fetch(`${API_BASE_URL}/news`);
            
            // If API is not available, use mock data
            if (!response.ok) {
                console.warn('API not available, using mock data');
                allNews = generateMockNewsData();
            } else {
                const data = await response.json();
                allNews = data.success ? data.data : generateMockNewsData();
            }
            
            // Filter and render news
            filterAndRenderNews();
        } catch (error) {
            console.error('Error loading news data:', error);
            
            // Use mock data if API fails
            allNews = generateMockNewsData();
            
            // Filter and render news
            filterAndRenderNews();
        } finally {
            // Clear loading state
            isLoading = false;
            hideLoadingState();
        }
    }
    
    /**
     * Filter and render news based on current filters
     */
    function filterAndRenderNews() {
        // Filter news
        filteredNews = allNews.filter(news => {
            // Filter by category
            if (currentCategory !== 'all' && news.category !== currentCategory) {
                return false;
            }
            
            // Filter by date range
            if (!isWithinDateRange(news.date, currentDateRange)) {
                return false;
            }
            
            // Filter by search term
            if (searchTerm && !(
                news.title.toLowerCase().includes(searchTerm) ||
                news.excerpt.toLowerCase().includes(searchTerm) ||
                (news.content && news.content.toLowerCase().includes(searchTerm))
            )) {
                return false;
            }
            
            return true;
        });
        
        // Render news
        renderNews();
        
        // Render pagination
        renderPagination();
    }
    
    /**
     * Render news items
     */
    function renderNews() {
        // Calculate pagination
        const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredNews.length);
        const currentNews = filteredNews.slice(startIndex, endIndex);
        
        // Clear news container
        newsContainer.innerHTML = '';
        
        // If no news found
        if (currentNews.length === 0) {
            newsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No News Found</h3>
                    <p>We couldn't find any news matching your criteria. Try adjusting your filters or search term.</p>
                </div>
            `;
            return;
        }
        
        // Render each news item
        currentNews.forEach(news => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.dataset.category = news.category;
            
            newsItem.innerHTML = `
                <div class="news-image">
                    <img src="${news.image}" alt="${news.title}">
                    <span class="news-category ${news.category}">${getCategoryLabel(news.category)}</span>
                </div>
                <div class="news-content">
                    <h3>${news.title}</h3>
                    <p class="news-meta">
                        <span class="news-date"><i class="far fa-calendar-alt"></i> ${formatDate(news.date)}</span>
                        ${news.author ? `<span class="news-author"><i class="far fa-user"></i> ${news.author}</span>` : ''}
                    </p>
                    <p class="news-excerpt">${news.excerpt}</p>
                    <a href="news-detail.html?id=${news.id}" class="read-more">Read More</a>
                </div>
            `;
            
            newsContainer.appendChild(newsItem);
        });
    }
    
    /**
     * Render pagination
     */
    function renderPagination() {
        // Calculate total pages
        const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
        
        // Clear pagination container
        paginationContainer.innerHTML = '';
        
        // If only one page, hide pagination
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        // Show pagination
        paginationContainer.style.display = 'flex';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = `pagination-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevButton.disabled = currentPage === 1;
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                filterAndRenderNews();
                scrollToTop();
            }
        });
        paginationContainer.appendChild(prevButton);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if end page is at max
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.className = 'pagination-btn page-btn';
            firstPageButton.textContent = '1';
            firstPageButton.addEventListener('click', () => {
                currentPage = 1;
                filterAndRenderNews();
                scrollToTop();
            });
            paginationContainer.appendChild(firstPageButton);
            
            // Ellipsis
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
        }
        
        // Page buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-btn page-btn ${i === currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                filterAndRenderNews();
                scrollToTop();
            });
            paginationContainer.appendChild(pageButton);
        }
        
        // Last page
        if (endPage < totalPages) {
            // Ellipsis
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastPageButton = document.createElement('button');
            lastPageButton.className = 'pagination-btn page-btn';
            lastPageButton.textContent = totalPages;
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                filterAndRenderNews();
                scrollToTop();
            });
            paginationContainer.appendChild(lastPageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = `pagination-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}`;
        nextButton.disabled = currentPage === totalPages;
        nextButton.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                filterAndRenderNews();
                scrollToTop();
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    /**
     * Subscribe to newsletter
     * @param {string} email - Email address
     */
    async function subscribeToNewsletter(email) {
        try {
            // Show loading state
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
            
            // Call API to subscribe
            const response = await fetch(`${API_BASE_URL}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            // Handle response
            if (response.ok) {
                // Show success message
                showNotification('Success! You have been subscribed to our newsletter.', 'success');
                
                // Clear form
                document.getElementById('newsletter-email').value = '';
            } else {
                // Show error message
                showNotification('Failed to subscribe. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            
            // Show error message
            showNotification('Failed to subscribe. Please try again later.', 'error');
        } finally {
            // Restore button
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe';
        }
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <p>${message}</p>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Add close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);
    }
    
    /**
     * Show loading state
     */
    function showLoadingState() {
        newsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading news...</p>
            </div>
        `;
    }
    
    /**
     * Hide loading state
     */
    function hideLoadingState() {
        // Loading state will be replaced when rendering news
    }
    
    /**
     * Check if date is within specified range
     * @param {string} dateString - Date string
     * @param {string} range - Date range (today, week, month, quarter, year)
     * @returns {boolean} - Whether date is within range
     */
    function isWithinDateRange(dateString, range) {
        const date = new Date(dateString);
        const now = new Date();
        
        switch (range) {
            case 'today':
                return date.toDateString() === now.toDateString();
            
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return date >= weekAgo;
            
            case 'month':
                const monthAgo = new Date();
                monthAgo.setMonth(now.getMonth() - 1);
                return date >= monthAgo;
            
            case 'quarter':
                const quarterAgo = new Date();
                quarterAgo.setMonth(now.getMonth() - 3);
                return date >= quarterAgo;
            
            case 'year':
                const yearAgo = new Date();
                yearAgo.setFullYear(now.getFullYear() - 1);
                return date >= yearAgo;
            
            default:
                return true;
        }
    }
    
    /**
     * Format date
     * @param {string} dateString - Date string
     * @returns {string} - Formatted date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Get category label
     * @param {string} category - Category key
     * @returns {string} - Category label
     */
    function getCategoryLabel(category) {
        const categories = {
            'market-updates': 'Market Updates',
            'regulatory': 'Regulatory',
            'company-news': 'Company News',
            'ipo': 'IPO',
            'dividend': 'Dividend',
            'analysis': 'Analysis'
        };
        
        return categories[category] || category;
    }
    
    /**
     * Scroll to top of news section
     */
    function scrollToTop() {
        const newsSection = document.querySelector('.news-categories');
        if (newsSection) {
            newsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    /**
     * Generate mock news data
     * @returns {Array} - Mock news data
     */
    function generateMockNewsData() {
        const categories = ['market-updates', 'regulatory', 'company-news', 'ipo', 'dividend', 'analysis'];
        const mockNews = [];
        
        // Generate 50 mock news items
        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            mockNews.push({
                id: i,
                title: getMockTitle(category, i),
                excerpt: getMockExcerpt(category),
                content: getMockContent(category),
                image: `img/news/${category}-${(i % 3) + 1}.jpg`,
                category: category,
                date: date.toISOString(),
                author: Math.random() > 0.5 ? getMockAuthor() : null
            });
        }
        
        // Sort by date (newest first)
        return mockNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    /**
     * Get mock title
     * @param {string} category - News category
     * @param {number} index - News index
     * @returns {string} - Mock title
     */
    function getMockTitle(category, index) {
        const titles = {
            'market-updates': [
                'NEPSE Gains 20 Points: Banking and Hydropower Lead',
                'NEPSE Closes in Red: Microfinance Sector Under Pressure',
                'NEPSE Reaches 3-Month High as Investor Confidence Returns',
                'Market Rebounds After Four Days of Decline',
                'NEPSE Volatile Amid Political Uncertainty'
            ],
            'regulatory': [
                'SEBON Announces New Regulations for Broker Commissions',
                'CDS Introduces Online KYC Verification System',
                'NEPSE to Extend Trading Hours Starting Next Month',
                'SEBON Issues Guidelines for Online Trading Platforms',
                'New Capital Gain Tax Rules to Take Effect from Next Fiscal Year'
            ],
            'company-news': [
                'NIC Asia Bank Reports 20% Growth in Quarterly Profit',
                'Himalayan Distillery Expands Production Capacity',
                'Nepal Telecom Launches New 5G Testing Program',
                'Nabil Bank Announces Strategic Partnership with International Fintech',
                'Chilime Hydropower Completes Maintenance, Resumes Full Production'
            ],
            'ipo': [
                'Himalayan Power Partners Announces IPO Worth Rs. 1 Billion',
                'SEBON Approves IPO of New Microfinance Company',
                'Upcoming Hydropower IPO Receives Record Applications',
                'New Insurance Company to Launch IPO Next Month',
                'Citizen Investment Trust to Issue Additional Shares'
            ],
            'dividend': [
                'Nepal Bank Announces 15% Dividend for Fiscal Year 2079/80',
                'NMB Bank Proposes 12% Cash Dividend to Shareholders',
                'Himalayan Bank Declares Record Dividend of 20%',
                'Sanima Bank Announces 10% Bonus Shares and 5% Cash Dividend',
                'Nabil Bank Board Approves 18% Dividend Proposal'
            ],
            'analysis': [
                'Technical Analysis: NEPSE Approaching Resistance Level',
                'Fundamental Analysis: Banking Sector Remains Undervalued',
                'Hydropower Sector Analysis: Monsoon Impact on Generation',
                'Microfinance Sector: Challenges and Opportunities Ahead',
                'Insurance Sector Poised for Growth: Analyst Report'
            ]
        };
        
        return titles[category][index % titles[category].length];
    }
    
    /**
     * Get mock excerpt
     * @param {string} category - News category
     * @returns {string} - Mock excerpt
     */
    function getMockExcerpt(category) {
        const excerpts = {
            'market-updates': 'The NEPSE index showed significant movement today, with investors closely watching key sectors. Trading volume remained moderate as market participants...',
            'regulatory': 'The regulatory body has announced important changes that will affect market operations. These new rules aim to improve transparency and efficiency in the stock market...',
            'company-news': 'The company has released its latest financial results, showing notable performance in the last quarter. Management attributes this success to strategic initiatives and market conditions...',
            'ipo': 'The upcoming Initial Public Offering (IPO) has generated significant interest among investors. The company plans to use the raised capital for expansion and debt reduction...',
            'dividend': 'Shareholders will receive an attractive dividend following the company\'s strong financial performance. The board of directors approved the dividend proposal in their recent meeting...',
            'analysis': 'Our analysis indicates important trends developing in the market that investors should be aware of. Several technical and fundamental factors suggest potential movement in key stocks...'
        };
        
        return excerpts[category];
    }
    
    /**
     * Get mock content
     * @param {string} category - News category
     * @returns {string} - Mock content
     */
    function getMockContent(category) {
        return `This is a detailed article about ${getCategoryLabel(category).toLowerCase()}. The full content would include comprehensive information, data, charts, and expert opinions.`;
    }
    
    /**
     * Get mock author
     * @returns {string} - Mock author name
     */
    function getMockAuthor() {
        const authors = [
            'Financial Analyst',
            'Market Expert',
            'Investment Advisor',
            'Technical Analyst',
            'Economic Researcher',
            'NEPSE Tracker Team'
        ];
        
        return authors[Math.floor(Math.random() * authors.length)];
    }
}); 