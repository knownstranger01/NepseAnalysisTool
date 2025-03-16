# NEPSE स्टक मार्केट डाटा स्क्र्यापर र API

यो प्रोजेक्टले नेपाल स्टक एक्सचेन्ज (NEPSE) वेबसाइटबाट लाइभ स्टक मार्केट डाटा स्क्र्याप गर्छ र एक REST API मार्फत प्रदान गर्छ।

## विशेषताहरू

- नेपाल स्टक एक्सचेन्ज वेबसाइटबाट लाइभ स्टक डाटा स्क्र्यापिङ
- स्टक सिम्बल, मूल्य, परिवर्तन, भोल्युम आदि जानकारी प्राप्त गर्ने
- डाटा क्यासिङ (15 मिनेट)
- REST API मार्फत डाटा प्रदान गर्ने
- टप गेनर्स र लुजर्स प्राप्त गर्ने
- क्षेत्र अनुसार फिल्टरिङ
- CSV फाइलमा डाटा निर्यात गर्ने
- पान्डास डाटाफ्रेम सपोर्ट

## आवश्यकताहरू

- Python 3.8+
- Flask
- Requests
- BeautifulSoup4
- Pandas
- Flask-CORS

## सेटअप

1. रिपोजिटरी क्लोन गर्नुहोस्:

```bash
git clone https://github.com/yourusername/nepse-scraper.git
cd nepse-scraper
```

2. आवश्यक प्याकेजहरू इन्स्टल गर्नुहोस्:

```bash
pip install -r requirements.txt
```

## प्रयोग

### स्क्र्यापर प्रयोग गर्ने

स्क्र्यापर सिधै प्रयोग गर्न:

```python
from nepse_scraper import NepseDataScraper

# स्क्र्यापर इन्स्टान्स बनाउने
scraper = NepseDataScraper()

# बजार स्थिति प्राप्त गर्ने
market_status = scraper.get_market_status()
print(f"बजार स्थिति: {market_status['status_text']}")

# सबै स्टक्स प्राप्त गर्ने
stocks = scraper.fetch_nepse_data()
print(f"कुल स्टक्स: {len(stocks)}")

# टप गेनर्स प्राप्त गर्ने
top_gainers = scraper.get_top_gainers(5)
print("\nटप 5 गेनर्स:")
for i, stock in enumerate(top_gainers, 1):
    print(f"{i}. {stock['symbol']}: {stock['percent_change']}% (रु. {stock['ltp']})")

# CSV फाइलमा सेभ गर्ने
scraper.save_to_csv('nepse_data.csv')
```

### API सर्भर चलाउने

API सर्भर चलाउन:

```bash
python nepse_api.py
```

सर्भर डिफल्ट रूपमा http://localhost:5000 मा चल्नेछ।

## API एन्डपोइन्टहरू

- **GET /api/nepse_data**: सबै स्टक्सको डाटा प्राप्त गर्ने
  - क्वेरी प्यारामिटरहरू:
    - `symbol`: स्टक सिम्बल अनुसार फिल्टर गर्ने
    - `sector`: क्षेत्र अनुसार फिल्टर गर्ने
    - `sort_by`: सर्ट फिल्ड (symbol, ltp, change, percent_change, qty)
    - `sort_order`: सर्ट अर्डर (asc, desc)
    - `limit`: परिणामहरूको संख्या सीमित गर्ने
    - `offset`: पेजिनेसनको लागि अफसेट

- **GET /api/market_overview**: बजार अवलोकन डाटा प्राप्त गर्ने

- **GET /api/stocks_list**: सबै स्टक्सको सूची प्राप्त गर्ने
  - क्वेरी प्यारामिटरहरू:
    - `sector`: क्षेत्र अनुसार फिल्टर गर्ने

- **GET /api/top_gainers**: टप गेनर्स प्राप्त गर्ने
  - क्वेरी प्यारामिटरहरू:
    - `limit`: परिणामहरूको संख्या सीमित गर्ने (डिफल्ट: 10)

- **GET /api/top_losers**: टप लुजर्स प्राप्त गर्ने
  - क्वेरी प्यारामिटरहरू:
    - `limit`: परिणामहरूको संख्या सीमित गर्ने (डिफल्ट: 10)

- **GET /api/sectors**: सबै क्षेत्रहरू प्राप्त गर्ने

## उदाहरण API अनुरोधहरू

### सबै स्टक्स प्राप्त गर्ने

```
GET http://localhost:5000/api/nepse_data
```

### एक विशेष स्टक प्राप्त गर्ने

```
GET http://localhost:5000/api/nepse_data?symbol=NABIL
```

### क्षेत्र अनुसार स्टक्स प्राप्त गर्ने

```
GET http://localhost:5000/api/nepse_data?sector=Banking
```

### टप 5 गेनर्स प्राप्त गर्ने

```
GET http://localhost:5000/api/top_gainers?limit=5
```

## नोट

- यो स्क्र्यापरले नेपाल स्टक एक्सचेन्ज वेबसाइटको robots.txt फाइल र प्रयोग शर्तहरूको सम्मान गर्छ।
- अत्यधिक अनुरोधहरू नपठाउनुहोस्, क्यासिङ प्रयोग गर्नुहोस्।
- यो स्क्र्यापर शैक्षिक उद्देश्यको लागि मात्र हो।

## लाइसेन्स

MIT 