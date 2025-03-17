// CORS प्रॉक्सी सर्भर
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS मिडलवेयर
app.use(cors());

// स्ट्याटिक फाइलहरू सर्भ गर्ने
app.use(express.static('./'));

// मेरोलगानी मार्केट समरी प्रॉक्सी एन्डपोइन्ट
app.get('/api/market-summary', async (req, res) => {
    try {
        // मेरोलगानी URL
        const url = 'https://merolagani.com/MarketSummary.aspx';
        
        // अनुरोध पठाउने
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // HTML पार्स गर्ने
        const $ = cheerio.load(response.data);
        
        // मार्केट समरी डाटा निकाल्ने
        const marketSummary = {
            date: $('.market-summary .list-wrapper .list-item:nth-child(1) .list-item-value').text().trim(),
            totalTurnover: $('.market-summary .list-wrapper .list-item:nth-child(2) .list-item-value').text().trim(),
            totalTradedShares: $('.market-summary .list-wrapper .list-item:nth-child(3) .list-item-value').text().trim(),
            totalTransactions: $('.market-summary .list-wrapper .list-item:nth-child(4) .list-item-value').text().trim(),
            totalScripTraded: $('.market-summary .list-wrapper .list-item:nth-child(5) .list-item-value').text().trim(),
            marketCap: $('.market-summary .list-wrapper .list-item:nth-child(6) .list-item-value').text().trim(),
            floatMarketCap: $('.market-summary .list-wrapper .list-item:nth-child(7) .list-item-value').text().trim(),
        };
        
        // प्रतिक्रिया पठाउने
        res.json(marketSummary);
    } catch (error) {
        console.error('मेरोलगानी मार्केट समरी डाटा प्राप्त गर्न त्रुटि:', error);
        res.status(500).json({ error: 'सर्भर त्रुटि' });
    }
});

// मेरोलगानी लेटेस्ट मार्केट प्रॉक्सी एन्डपोइन्ट (नेप्से इन्डेक्स, टप गेनर्स र लुजर्स)
app.get('/api/latest-market', async (req, res) => {
    try {
        // मेरोलगानी URL
        const url = 'https://merolagani.com/LatestMarket.aspx';
        
        // अनुरोध पठाउने
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // HTML पार्स गर्ने
        const $ = cheerio.load(response.data);
        
        // नेप्से इन्डेक्स डाटा निकाल्ने
        const nepseIndex = {
            index: $('.market-status .current-index').text().trim(),
            change: $('.market-status .index-diff').text().trim(),
            percentChange: $('.market-status .percent-change').text().trim(),
        };
        
        // टप गेनर्स डाटा निकाल्ने
        const topGainers = [];
        $('#ctl00_ContentPlaceHolder1_LiveTopGainers tr').each((i, el) => {
            if (i > 0) { // हेडर छोड्ने
                const tds = $(el).find('td');
                topGainers.push({
                    symbol: $(tds[0]).text().trim(),
                    ltp: $(tds[1]).text().trim(),
                    pointChange: $(tds[2]).text().trim(),
                    percentChange: $(tds[3]).text().trim(),
                });
            }
        });
        
        // टप लुजर्स डाटा निकाल्ने
        const topLosers = [];
        $('#ctl00_ContentPlaceHolder1_LiveTopLosers tr').each((i, el) => {
            if (i > 0) { // हेडर छोड्ने
                const tds = $(el).find('td');
                topLosers.push({
                    symbol: $(tds[0]).text().trim(),
                    ltp: $(tds[1]).text().trim(),
                    pointChange: $(tds[2]).text().trim(),
                    percentChange: $(tds[3]).text().trim(),
                });
            }
        });
        
        // प्रतिक्रिया पठाउने
        res.json({
            nepseIndex,
            topGainers,
            topLosers
        });
    } catch (error) {
        console.error('मेरोलगानी लेटेस्ट मार्केट डाटा प्राप्त गर्न त्रुटि:', error);
        res.status(500).json({ error: 'सर्भर त्रुटि' });
    }
});

// मेरोलगानी स्टक क्वोट प्रॉक्सी एन्डपोइन्ट (कम्पनी लिस्ट)
app.get('/api/stock-quote', async (req, res) => {
    try {
        // मेरोलगानी URL
        const url = 'https://merolagani.com/StockQuote.aspx';
        
        // अनुरोध पठाउने
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // HTML पार्स गर्ने
        const $ = cheerio.load(response.data);
        
        // कम्पनी लिस्ट डाटा निकाल्ने
        const companies = [];
        $('#ctl00_ContentPlaceHolder1_LiveStockPrice tr').each((i, el) => {
            if (i > 0) { // हेडर छोड्ने
                const tds = $(el).find('td');
                companies.push({
                    symbol: $(tds[0]).text().trim(),
                    ltp: $(tds[1]).text().trim(),
                    change: $(tds[2]).text().trim(),
                    percentChange: $(tds[3]).text().trim(),
                    open: $(tds[4]).text().trim(),
                    high: $(tds[5]).text().trim(),
                    low: $(tds[6]).text().trim(),
                    quantity: $(tds[7]).text().trim(),
                });
            }
        });
        
        // प्रतिक्रिया पठाउने
        res.json(companies);
    } catch (error) {
        console.error('मेरोलगानी स्टक क्वोट डाटा प्राप्त गर्न त्रुटि:', error);
        res.status(500).json({ error: 'सर्भर त्रुटि' });
    }
});

// सर्भर सुरु गर्ने
app.listen(PORT, () => {
    console.log(`CORS प्रॉक्सी सर्भर पोर्ट ${PORT} मा चलिरहेको छ`);
}); 