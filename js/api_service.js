/**
 * NEPSE Tracker API Service
 * रियल-टाइम डाटा, एडभान्स्ड चार्टिङ, अलर्ट, फिल्टरिङ र हिस्टोरिकल डाटा फंक्शनहरू
 */

// API कन्फिगरेसन
const API_CONFIG = {
    BASE_URL: 'https://api.nepsetracker.com/api/v1',
    LOCAL_API_URL: 'http://localhost:3000/api',
    BACKUP_URL: 'https://merolagani.com/api',
    CACHE_EXPIRY: 5 * 1000, // 5 सेकेन्ड (मिलिसेकेन्डमा)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 सेकेन्ड
    USE_LOCAL_API: true, // स्थानीय API प्रयोग गर्ने
    REFRESH_INTERVAL: 1000 // 1 सेकेन्ड (मिलिसेकेन्डमा)
};

// क्यास स्टोरेज
const API_CACHE = {
    marketOverview: { data: null, timestamp: 0 },
    liveData: { data: null, timestamp: 0 },
    sectoralIndices: { data: null, timestamp: 0 },
    topGainersLosers: { data: null, timestamp: 0 },
    historicalData: {},
    companies: { data: null, timestamp: 0 },
    companyDetails: {}
};

/**
 * API कल गर्ने मुख्य फंक्सन
 * @param {string} endpoint - API एन्डपोइन्ट
 * @param {Object} params - क्वेरी प्यारामिटरहरू
 * @param {boolean} useCache - क्यास प्रयोग गर्ने कि नगर्ने
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Object>} - API प्रतिक्रिया
 */
async function apiCall(endpoint, params = {}, useCache = true, forceRefresh = false) {
    try {
        // क्यास कि निर्माण गर्ने
        const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
        
        // क्यास जाँच गर्ने
        if (useCache && !forceRefresh && API_CACHE[endpoint]) {
            const cachedData = API_CACHE[endpoint];
            const now = Date.now();
            
            // क्यास अझै वैध छ भने क्यास डाटा फर्काउने
            if (now - cachedData.timestamp < API_CONFIG.CACHE_EXPIRY) {
                console.log(`क्यास डाटा प्रयोग गर्दै: ${endpoint}`);
                return cachedData.data;
            }
        }
        
        // URL तयार गर्ने
        const baseUrl = API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL;
        const url = new URL(`${baseUrl}/${endpoint}`);
        
        // प्यारामिटरहरू थप्ने
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        // API कल गर्ने
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // प्रतिक्रिया जाँच गर्ने
        if (!response.ok) {
            throw new Error(`API कल असफल: ${response.status} ${response.statusText}`);
        }
        
        // प्रतिक्रिया पार्स गर्ने
        const data = await response.json();
        
        // क्यास अपडेट गर्ने
        if (useCache) {
            API_CACHE[endpoint] = {
                data: data,
                timestamp: Date.now()
            };
        }
        
        return data;
    } catch (error) {
        console.error(`API कल असफल (${endpoint}):`, error);
        
        // ब्याकअप API प्रयोग गर्ने
        if (API_CONFIG.USE_LOCAL_API) {
            console.log(`ब्याकअप API प्रयोग गर्दै: ${endpoint}`);
            API_CONFIG.USE_LOCAL_API = false;
            const result = await apiCall(endpoint, params, useCache, forceRefresh);
            API_CONFIG.USE_LOCAL_API = true;
            return result;
        }
        
        throw error;
    }
}

/**
 * मार्केट ओभरभ्यू प्राप्त गर्ने
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Object>} - मार्केट ओभरभ्यू डाटा
 */
async function getMarketOverview(forceRefresh = false) {
    try {
        // क्यास जाँच गर्ने
        if (!forceRefresh && API_CACHE.marketOverview.data) {
            const now = Date.now();
            
            // क्यास अझै वैध छ भने क्यास डाटा फर्काउने
            if (now - API_CACHE.marketOverview.timestamp < API_CONFIG.CACHE_EXPIRY) {
                return API_CACHE.marketOverview.data;
            }
        }
        
        // स्थानीय API प्रयोग गर्ने
        if (API_CONFIG.USE_LOCAL_API) {
            const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/market-summary`);
            if (!response.ok) {
                throw new Error('मार्केट ओभरभ्यू डाटा प्राप्त गर्न त्रुटि');
            }
            
            const data = await response.json();
            
            // क्यास अपडेट गर्ने
            API_CACHE.marketOverview = {
                data,
                timestamp: Date.now()
            };
            
            return data;
        }
        
        // API कल गर्ने
        const response = await apiCall('market_overview', {}, true, forceRefresh);
        
        // डाटा प्रोसेस गर्ने
        const processedData = {
            marketStatus: response.data.market_status,
            isOpen: response.data.is_open,
            lastUpdated: response.data.last_updated,
            indices: response.data.indices || []
        };
        
        // क्यास अपडेट गर्ने
        API_CACHE.marketOverview = {
            data: processedData,
            timestamp: Date.now()
        };
        
        return processedData;
    } catch (error) {
        console.error('मार्केट ओभरभ्यू प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * लाइभ स्टक डाटा प्राप्त गर्ने
 * @param {Object} filters - फिल्टरहरू (symbol, sector)
 * @param {Object} sorting - सर्टिङ (sort_by, sort_order)
 * @param {number} limit - रेकर्ड सीमा
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Array>} - स्टक डाटा
 */
async function getLiveStockData(filters = {}, sorting = {}, limit = null, forceRefresh = false) {
    try {
        // प्यारामिटरहरू तयार गर्ने
        const params = {
            ...filters,
            ...sorting,
            limit: limit
        };
        
        // API कल गर्ने
        const response = await apiCall('nepse_data', params, true, forceRefresh);
        
        // क्यास अपडेट गर्ने
        API_CACHE.liveData = {
            data: response.data,
            timestamp: Date.now(),
            meta: response.meta
        };
        
        return {
            stocks: response.data,
            meta: response.meta
        };
    } catch (error) {
        console.error('लाइभ स्टक डाटा प्राप्त गर्न असफल:', error);
        
        // क्यासमा डाटा छ भने त्यही फर्काउने
        if (API_CACHE.liveData.data) {
            return {
                stocks: API_CACHE.liveData.data,
                meta: API_CACHE.liveData.meta,
                fromCache: true
            };
        }
        
        throw error;
    }
}

/**
 * क्षेत्रगत सूचकांक प्राप्त गर्ने
 * @returns {Promise<Object>} - क्षेत्रगत सूचकांक डाटा
 */
async function getSectoralIndices() {
    const cacheKey = 'sectoralIndices';
    const currentTime = Date.now();
    
    // क्यास जाँच गर्ने
    if (API_CACHE[cacheKey].data && currentTime - API_CACHE[cacheKey].timestamp < API_CONFIG.CACHE_EXPIRY) {
        return API_CACHE[cacheKey].data;
    }
    
    try {
        const data = await apiCall('market/sectoral-indices');
        
        // क्यास अपडेट गर्ने
        API_CACHE[cacheKey] = {
            data: data,
            timestamp: currentTime
        };
        
        return data;
    } catch (error) {
        console.error('क्षेत्रगत सूचकांक प्राप्त गर्न त्रुटि:', error);
        
        // पुरानो क्यास डाटा फर्काउने
        if (API_CACHE[cacheKey].data) {
            return API_CACHE[cacheKey].data;
        }
        
        throw error;
    }
}

/**
 * टप गेनर्स र लुजर्स प्राप्त गर्ने
 * @param {number} limit - प्रत्येक सूचीमा कति वटा आइटम चाहिने हो
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Object>} - टप गेनर्स र लुजर्स डाटा
 */
async function getTopGainersLosers(limit = 5, forceRefresh = false) {
    try {
        // क्यास जाँच गर्ने
        if (!forceRefresh && API_CACHE.topGainersLosers.data) {
            const now = Date.now();
            
            // क्यास अझै वैध छ भने क्यास डाटा फर्काउने
            if (now - API_CACHE.topGainersLosers.timestamp < API_CONFIG.CACHE_EXPIRY) {
                return API_CACHE.topGainersLosers.data;
            }
        }
        
        // स्थानीय API प्रयोग गर्ने
        if (API_CONFIG.USE_LOCAL_API) {
            const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/latest-market`);
            if (!response.ok) {
                throw new Error('टप गेनर्स र लुजर्स डाटा प्राप्त गर्न त्रुटि');
            }
            
            const data = await response.json();
            
            // क्यास अपडेट गर्ने
            API_CACHE.topGainersLosers = {
                data,
                timestamp: Date.now()
            };
            
            return data;
        }
        
        // गेनर्स प्राप्त गर्ने
        const gainersResponse = await apiCall('top_gainers', { limit }, true, forceRefresh);
        
        // लुजर्स प्राप्त गर्ने
        const losersResponse = await apiCall('top_losers', { limit }, true, forceRefresh);
        
        // डाटा प्रोसेस गर्ने
        const processedData = {
            gainers: gainersResponse.data,
            losers: losersResponse.data,
            lastUpdated: gainersResponse.meta.last_updated
        };
        
        // क्यास अपडेट गर्ने
        API_CACHE.topGainersLosers = {
            data: processedData,
            timestamp: Date.now()
        };
        
        return processedData;
    } catch (error) {
        console.error('टप गेनर्स र लुजर्स प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * ऐतिहासिक मूल्य डाटा प्राप्त गर्ने
 * @param {string} symbol - शेयर सिम्बोल
 * @param {string} interval - समय अन्तराल (1d, 1w, 1m, 3m, 6m, 1y, 5y)
 * @param {string} startDate - सुरु मिति (YYYY-MM-DD)
 * @param {string} endDate - अन्त्य मिति (YYYY-MM-DD)
 * @returns {Promise<Object>} - ऐतिहासिक मूल्य डाटा
 */
async function getHistoricalData(symbol, interval = '1d', startDate = null, endDate = null) {
    const cacheKey = `historicalData_${symbol}_${interval}_${startDate}_${endDate}`;
    
    // क्यास जाँच गर्ने (ऐतिहासिक डाटा लामो समयसम्म क्यास गर्न सकिन्छ)
    if (API_CACHE.historicalData[cacheKey]) {
        return API_CACHE.historicalData[cacheKey];
    }
    
    const params = {
        symbol,
        interval,
        start_date: startDate,
        end_date: endDate
    };
    
    try {
        const data = await apiCall('stocks/historical', params);
        
        // क्यास अपडेट गर्ने
        API_CACHE.historicalData[cacheKey] = data;
        
        return data;
    } catch (error) {
        console.error('ऐतिहासिक डाटा प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * प्राविधिक सूचकहरू प्राप्त गर्ने
 * @param {string} symbol - शेयर सिम्बोल
 * @param {Array<string>} indicators - प्राविधिक सूचकहरू (MA, EMA, RSI, MACD, BB)
 * @param {Object} params - सूचकहरूको लागि प्यारामिटरहरू
 * @returns {Promise<Object>} - प्राविधिक सूचकहरू डाटा
 */
async function getTechnicalIndicators(symbol, indicators = [], params = {}) {
    const indicatorsParam = indicators.join(',');
    
    try {
        const data = await apiCall('analysis/technical-indicators', {
            symbol,
            indicators: indicatorsParam,
            ...params
        });
        
        return data;
    } catch (error) {
        console.error('प्राविधिक सूचकहरू प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * मूल्य अलर्ट सेट गर्ने
 * @param {string} symbol - शेयर सिम्बोल
 * @param {number} price - अलर्ट मूल्य
 * @param {string} condition - अलर्ट अवस्था (above, below)
 * @param {string} notificationType - सूचना प्रकार (email, sms, push)
 * @returns {Promise<Object>} - अलर्ट सेटअप प्रतिक्रिया
 */
async function setPriceAlert(symbol, price, condition, notificationType = 'push') {
    try {
        const data = await apiCall('alerts/set', {
            symbol,
            price,
            condition,
            notification_type: notificationType
        }, false);
        
        return data;
    } catch (error) {
        console.error('मूल्य अलर्ट सेट गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * मूल्य अलर्ट हटाउने
 * @param {string} alertId - अलर्ट आईडी
 * @returns {Promise<Object>} - अलर्ट हटाउने प्रतिक्रिया
 */
async function removePriceAlert(alertId) {
    try {
        const data = await apiCall(`alerts/remove/${alertId}`, {}, false);
        return data;
    } catch (error) {
        console.error('मूल्य अलर्ट हटाउन त्रुटि:', error);
        throw error;
    }
}

/**
 * प्रयोगकर्ताको अलर्टहरू प्राप्त गर्ने
 * @returns {Promise<Object>} - प्रयोगकर्ताको अलर्टहरू
 */
async function getUserAlerts() {
    try {
        const data = await apiCall('alerts/user', {}, false);
        return data;
    } catch (error) {
        console.error('प्रयोगकर्ताको अलर्टहरू प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * NEPSE इन्डेक्स ऐतिहासिक डाटा प्राप्त गर्ने
 * @param {string} interval - समय अन्तराल (1d, 1w, 1m, 3m, 6m, 1y, 5y)
 * @returns {Promise<Object>} - NEPSE इन्डेक्स ऐतिहासिक डाटा
 */
async function getNepseHistoricalData(interval = '1d') {
    const cacheKey = `historicalData_NEPSE_${interval}`;
    
    // क्यास जाँच गर्ने
    if (API_CACHE.historicalData[cacheKey]) {
        return API_CACHE.historicalData[cacheKey];
    }
    
    try {
        const data = await apiCall('market/nepse-historical', { interval });
        
        // क्यास अपडेट गर्ने
        API_CACHE.historicalData[cacheKey] = data;
        
        return data;
    } catch (error) {
        console.error('NEPSE इन्डेक्स ऐतिहासिक डाटा प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * कम्पनी विवरण प्राप्त गर्ने
 * @param {string} symbol - शेयर सिम्बोल
 * @returns {Promise<Object>} - कम्पनी विवरण
 */
async function getCompanyDetails(symbol) {
    try {
        const data = await apiCall(`companies/${symbol}`);
        return data;
    } catch (error) {
        console.error('कम्पनी विवरण प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * क्षेत्रहरू प्राप्त गर्ने
 * @returns {Promise<Object>} - क्षेत्रहरू
 */
async function getSectors() {
    try {
        const data = await apiCall('market/sectors');
        return data;
    } catch (error) {
        console.error('क्षेत्रहरू प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * बजार समाचार प्राप्त गर्ने
 * @param {number} limit - समाचारहरूको संख्या
 * @returns {Promise<Object>} - बजार समाचार
 */
async function getMarketNews(limit = 5) {
    try {
        const data = await apiCall('news', { limit });
        return data;
    } catch (error) {
        console.error('बजार समाचार प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * कम्पनीहरूको सूची प्राप्त गर्ने
 * @param {Object} filters - फिल्टरहरू
 * @param {Object} sorting - सर्टिङ प्यारामिटरहरू
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Array>} - कम्पनीहरूको सूची
 */
async function getCompanies(filters = {}, sorting = {}, forceRefresh = false) {
    try {
        // क्यास जाँच गर्ने
        if (!forceRefresh && API_CACHE.companies.data) {
            const now = Date.now();
            
            // क्यास अझै वैध छ भने क्यास डाटा फर्काउने
            if (now - API_CACHE.companies.timestamp < API_CONFIG.CACHE_EXPIRY) {
                return API_CACHE.companies.data;
            }
        }
        
        // स्थानीय API प्रयोग गर्ने
        if (API_CONFIG.USE_LOCAL_API) {
            const response = await fetch(`${API_CONFIG.LOCAL_API_URL}/stock-quote`);
            if (!response.ok) {
                throw new Error('कम्पनीहरूको सूची प्राप्त गर्न त्रुटि');
            }
            
            const data = await response.json();
            
            // क्यास अपडेट गर्ने
            API_CACHE.companies = {
                data,
                timestamp: Date.now()
            };
            
            return data;
        }
        
        // प्यारामिटरहरू तयार गर्ने
        const params = {
            ...filters,
            ...sorting
        };
        
        // API कल गर्ने
        const baseUrl = API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL;
        const url = new URL(`${baseUrl}/companies`);
        
        // प्यारामिटरहरू थप्ने
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        // API कल गर्ने
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // प्रतिक्रिया जाँच गर्ने
        if (!response.ok) {
            throw new Error(`API कल असफल: ${response.status} ${response.statusText}`);
        }
        
        // प्रतिक्रिया पार्स गर्ने
        const data = await response.json();
        
        // क्यास अपडेट गर्ने (सबै कम्पनीहरू)
        if (data.success && !filters.sector && !filters.search) {
            API_CACHE.companies = {
                data: data.data,
                timestamp: Date.now()
            };
        }
        
        return data;
    } catch (error) {
        console.error('कम्पनीहरूको सूची प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * कम्पनी विवरण प्राप्त गर्ने
 * @param {string} symbol - कम्पनी सिम्बोल
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Object>} - कम्पनी विवरण
 */
async function getCompanyDetail(symbol, forceRefresh = false) {
    try {
        // क्यास जाँच गर्ने
        if (!forceRefresh && API_CACHE.companyDetails[symbol] && 
            (Date.now() - API_CACHE.companyDetails[symbol].timestamp < API_CONFIG.CACHE_EXPIRY)) {
            return {
                success: true,
                data: API_CACHE.companyDetails[symbol].data,
                fromCache: true
            };
        }
        
        // API कल गर्ने
        const baseUrl = API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL;
        const url = `${baseUrl}/company/${symbol}`;
        
        // API कल गर्ने
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // प्रतिक्रिया जाँच गर्ने
        if (!response.ok) {
            throw new Error(`API कल असफल: ${response.status} ${response.statusText}`);
        }
        
        // प्रतिक्रिया पार्स गर्ने
        const data = await response.json();
        
        // क्यास अपडेट गर्ने
        if (data.success) {
            API_CACHE.companyDetails[symbol] = {
                data: data.data,
                timestamp: Date.now()
            };
        }
        
        return data;
    } catch (error) {
        console.error(`कम्पनी विवरण प्राप्त गर्न असफल (${symbol}):`, error);
        
        // क्यासमा डाटा छ भने त्यही फर्काउने
        if (API_CACHE.companyDetails[symbol]) {
            return {
                success: true,
                data: API_CACHE.companyDetails[symbol].data,
                fromCache: true
            };
        }
        
        throw error;
    }
}

/**
 * सेक्टरहरूको सूची प्राप्त गर्ने
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Array>} - सेक्टरहरूको सूची
 */
async function getSectorsList(forceRefresh = false) {
    try {
        // API कल गर्ने
        const baseUrl = API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL;
        const url = `${baseUrl}/sectors_list`;
        
        // API कल गर्ने
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // प्रतिक्रिया जाँच गर्ने
        if (!response.ok) {
            throw new Error(`API कल असफल: ${response.status} ${response.statusText}`);
        }
        
        // प्रतिक्रिया पार्स गर्ने
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('सेक्टरहरूको सूची प्राप्त गर्न असफल:', error);
        throw error;
    }
}

/**
 * रियल-टाइम डाटा अपडेट गर्ने
 * @returns {Promise<void>}
 */
async function updateRealTimeData() {
    try {
        // मार्केट ओभरभ्यू अपडेट गर्ने
        await getMarketOverview(true);
        
        // टप गेनर्स र लुजर्स अपडेट गर्ने
        await getTopGainersLosers(5, true);
        
        // कम्पनीहरूको सूची अपडेट गर्ने
        await getCompanies({}, {}, true);
        
        // अपडेट इभेन्ट डिस्प्याच गर्ने
        const event = new CustomEvent('realtime-data-updated');
        document.dispatchEvent(event);
        
        // निरन्तर अपडेट गर्ने
        setTimeout(updateRealTimeData, API_CONFIG.REFRESH_INTERVAL);
    } catch (error) {
        console.error('रियल-टाइम डाटा अपडेट गर्न त्रुटि:', error);
        
        // त्रुटि भएपनि निरन्तर अपडेट गर्ने
        setTimeout(updateRealTimeData, API_CONFIG.REFRESH_INTERVAL);
    }
}

/**
 * API सर्भिस इनिसियलाइज गर्ने
 */
function initializeApiService() {
    // रियल-टाइम डाटा अपडेट सुरु गर्ने
    updateRealTimeData();
    
    console.log('API सर्भिस इनिसियलाइज भयो');
}

// API सर्भिस इनिसियलाइज गर्ने
document.addEventListener('DOMContentLoaded', initializeApiService);

/**
 * रियल-टाइम स्टक डाटा प्राप्त गर्ने
 * @param {string} symbol - स्टक सिम्बल
 * @param {boolean} forceRefresh - क्यास अपडेट गर्ने कि नगर्ने
 * @returns {Promise<Object>} - स्टक डाटा
 */
async function getRealTimeStockData(symbol, forceRefresh = false) {
    try {
        const endpoint = 'realtime_stock_data';
        const params = { symbol };
        
        return await apiCall(endpoint, params, true, forceRefresh);
    } catch (error) {
        console.error('रियल-टाइम स्टक डाटा प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * हिस्टोरिकल स्टक डाटा प्राप्त गर्ने
 * @param {string} symbol - स्टक सिम्बल
 * @param {string} interval - डाटा इन्टरभल (1d, 1w, 1m, 3m, 6m, 1y)
 * @param {string} startDate - सुरु मिति (YYYY-MM-DD)
 * @param {string} endDate - अन्त्य मिति (YYYY-MM-DD)
 * @returns {Promise<Array>} - हिस्टोरिकल डाटा
 */
async function getHistoricalStockData(symbol, interval = '1d', startDate = null, endDate = null) {
    try {
        const endpoint = 'historical_data';
        const params = { 
            symbol,
            interval,
            start_date: startDate,
            end_date: endDate
        };
        
        // क्यास कि निर्माण गर्ने
        const cacheKey = `historicalData:${symbol}:${interval}:${startDate || 'default'}:${endDate || 'default'}`;
        
        // क्यास जाँच गर्ने
        if (API_CACHE.historicalData[cacheKey]) {
            const cachedData = API_CACHE.historicalData[cacheKey];
            const now = Date.now();
            
            // क्यास अझै वैध छ भने क्यास डाटा फर्काउने
            if (now - cachedData.timestamp < API_CONFIG.CACHE_EXPIRY) {
                console.log(`क्यास डाटा प्रयोग गर्दै: ${cacheKey}`);
                return cachedData.data;
            }
        }
        
        // API बाट डाटा प्राप्त गर्ने
        const data = await apiCall(endpoint, params, false);
        
        // क्यासमा डाटा सेभ गर्ने
        API_CACHE.historicalData[cacheKey] = {
            data,
            timestamp: Date.now()
        };
        
        return data;
    } catch (error) {
        console.error('हिस्टोरिकल स्टक डाटा प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * टेक्निकल इन्डिकेटर्स प्राप्त गर्ने
 * @param {string} symbol - स्टक सिम्बल
 * @param {Array<string>} indicators - इन्डिकेटर्स (sma, ema, rsi, bb)
 * @returns {Promise<Object>} - इन्डिकेटर्स डाटा
 */
async function getTechnicalIndicators(symbol, indicators = ['sma', 'ema', 'rsi']) {
    try {
        const endpoint = 'technical_indicators';
        const params = { 
            symbol,
            indicators: indicators.join(',')
        };
        
        return await apiCall(endpoint, params, true);
    } catch (error) {
        console.error('टेक्निकल इन्डिकेटर्स प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * मूल्य अलर्ट सेट गर्ने
 * @param {string} symbol - स्टक सिम्बल
 * @param {number} price - अलर्ट मूल्य
 * @param {string} condition - अलर्ट कन्डिसन (above, below)
 * @param {string} notificationType - नोटिफिकेसन प्रकार (push, email, sms)
 * @returns {Promise<Object>} - अलर्ट सेटिङ्ग प्रतिक्रिया
 */
async function setPriceAlert(symbol, price, condition, notificationType = 'push') {
    try {
        const endpoint = 'set_alert';
        
        // प्रयोगकर्ता आईडी प्राप्त गर्ने
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            throw new Error('प्रयोगकर्ता लगइन छैन');
        }
        
        const data = {
            user_id: userId,
            symbol,
            price,
            condition,
            notification_type: notificationType
        };
        
        // POST रिक्वेस्ट पठाउने
        const response = await fetch(`${API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`अलर्ट सेट गर्न त्रुटि: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('मूल्य अलर्ट सेट गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * मूल्य अलर्ट हटाउने
 * @param {string} alertId - अलर्ट आईडी
 * @returns {Promise<Object>} - अलर्ट हटाउने प्रतिक्रिया
 */
async function removePriceAlert(alertId) {
    try {
        const endpoint = 'remove_alert';
        
        const data = {
            alert_id: alertId
        };
        
        // POST रिक्वेस्ट पठाउने
        const response = await fetch(`${API_CONFIG.USE_LOCAL_API ? API_CONFIG.LOCAL_API_URL : API_CONFIG.BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`अलर्ट हटाउन त्रुटि: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('मूल्य अलर्ट हटाउन त्रुटि:', error);
        throw error;
    }
}

/**
 * प्रयोगकर्ताको अलर्टहरू प्राप्त गर्ने
 * @returns {Promise<Array>} - अलर्टहरू
 */
async function getUserAlerts() {
    try {
        const endpoint = 'user_alerts';
        
        // प्रयोगकर्ता आईडी प्राप्त गर्ने
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            throw new Error('प्रयोगकर्ता लगइन छैन');
        }
        
        const params = {
            user_id: userId
        };
        
        return await apiCall(endpoint, params, true);
    } catch (error) {
        console.error('प्रयोगकर्ताको अलर्टहरू प्राप्त गर्न त्रुटि:', error);
        throw error;
    }
}

/**
 * एडभान्स्ड फिल्टर प्रयोग गर्ने
 * @param {Object} filters - फिल्टर प्यारामिटरहरू
 * @param {string} sortBy - सर्ट फिल्ड
 * @param {string} sortOrder - सर्ट अर्डर (asc, desc)
 * @returns {Promise<Array>} - फिल्टर गरिएको स्टक डाटा
 */
async function advancedFilter(filters = {}, sortBy = 'symbol', sortOrder = 'asc') {
    try {
        const endpoint = 'advanced_filter';
        
        const params = {
            ...filters,
            sort_by: sortBy,
            sort_order: sortOrder
        };
        
        return await apiCall(endpoint, params, true);
    } catch (error) {
        console.error('एडभान्स्ड फिल्टर प्रयोग गर्न त्रुटि:', error);
        throw error;
    }
} 