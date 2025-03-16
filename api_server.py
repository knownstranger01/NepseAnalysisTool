from flask import Flask, jsonify, request
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS
import json
import os
import time
from datetime import datetime, timedelta
import pandas as pd
import threading

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# कन्फिगरेसन
DATA_CACHE_FILE = 'nepse_data_cache.json'
STOCKS_LIST_FILE = 'nepse_stocks_list.json'
CACHE_EXPIRY = 15 * 60  # 15 मिनेट (सेकेन्डमा)
MARKET_HOURS = {
    'open_time': '11:00',  # बिहान ११ बजे
    'close_time': '15:00'  # दिउँसो ३ बजे
}

# ग्लोबल भेरिएबलहरू
nepse_data_cache = {
    'data': [],
    'last_updated': 0
}
stocks_list_cache = {
    'data': [],
    'last_updated': 0
}
market_overview_cache = {
    'data': {},
    'last_updated': 0
}

# क्यास फाइलहरू लोड गर्ने
def load_cache_files():
    global nepse_data_cache, stocks_list_cache
    
    # NEPSE डाटा क्यास लोड गर्ने
    if os.path.exists(DATA_CACHE_FILE):
        try:
            with open(DATA_CACHE_FILE, 'r') as f:
                nepse_data_cache = json.load(f)
        except:
            nepse_data_cache = {'data': [], 'last_updated': 0}
    
    # स्टक्स लिस्ट क्यास लोड गर्ने
    if os.path.exists(STOCKS_LIST_FILE):
        try:
            with open(STOCKS_LIST_FILE, 'r') as f:
                stocks_list_cache = json.load(f)
        except:
            stocks_list_cache = {'data': [], 'last_updated': 0}

# क्यास फाइलहरू सेभ गर्ने
def save_cache_files():
    # NEPSE डाटा क्यास सेभ गर्ने
    with open(DATA_CACHE_FILE, 'w') as f:
        json.dump(nepse_data_cache, f)
    
    # स्टक्स लिस्ट क्यास सेभ गर्ने
    with open(STOCKS_LIST_FILE, 'w') as f:
        json.dump(stocks_list_cache, f)

# बजार खुला छ कि छैन जाँच गर्ने
def is_market_open():
    now = datetime.now()
    
    # शनिबार वा आइतबार हो भने बजार बन्द हुन्छ
    if now.weekday() >= 5:  # 5 = शनिबार, 6 = आइतबार
        return False
    
    # समय जाँच
    current_time = now.strftime('%H:%M')
    return MARKET_HOURS['open_time'] <= current_time <= MARKET_HOURS['close_time']

# सबै NEPSE सूचीकृत शेयरहरू प्राप्त गर्ने
def fetch_all_stocks():
    global stocks_list_cache
    
    current_time = time.time()
    
    # क्यास अवधि समाप्त नभएको छ भने क्यास डाटा फर्काउने
    if stocks_list_cache['data'] and current_time - stocks_list_cache['last_updated'] < 24 * 60 * 60:  # 24 घण्टा
        return stocks_list_cache['data']
    
    try:
        url = 'https://www.nepalstock.com/company'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # कम्पनी टेबल फेला पार्ने
        table = soup.find('table', class_='table table-bordered table-striped table-hover')
        
        if not table:
            return stocks_list_cache['data'] if stocks_list_cache['data'] else []
        
        stocks = []
        rows = table.find_all('tr')[1:]  # हेडर रो छोड्ने
        
        for row in rows:
            columns = row.find_all('td')
            if len(columns) >= 3:
                symbol = columns[1].text.strip()
                company_name = columns[2].text.strip()
                sector = columns[3].text.strip() if len(columns) > 3 else "N/A"
                
                stocks.append({
                    'symbol': symbol,
                    'company_name': company_name,
                    'sector': sector
                })
        
        # यदि कुनै शेयर फेला परेन भने पुरानो क्यास फर्काउने
        if not stocks:
            return stocks_list_cache['data'] if stocks_list_cache['data'] else []
        
        # क्यास अपडेट गर्ने
        stocks_list_cache = {
            'data': stocks,
            'last_updated': current_time
        }
        
        # क्यास फाइल सेभ गर्ने
        save_cache_files()
        
        return stocks
    
    except Exception as e:
        print(f"Error fetching stocks list: {str(e)}")
        return stocks_list_cache['data'] if stocks_list_cache['data'] else []

# NEPSE डाटा प्राप्त गर्ने
def fetch_nepse_data():
    global nepse_data_cache
    
    current_time = time.time()
    
    # क्यास अवधि समाप्त नभएको छ भने क्यास डाटा फर्काउने
    if nepse_data_cache['data'] and current_time - nepse_data_cache['last_updated'] < CACHE_EXPIRY:
        return nepse_data_cache['data']
    
    try:
        url = 'https://www.nepalstock.com/todays_price'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # टेबल फेला पार्ने
        table = soup.find('table', class_='table table-bordered table-striped table-hover')
        
        if not table:
            return nepse_data_cache['data'] if nepse_data_cache['data'] else []
        
        stock_data = []
        rows = table.find_all('tr')[1:]  # हेडर रो छोड्ने
        
        for row in rows:
            columns = row.find_all('td')
            if len(columns) >= 10:
                try:
                    symbol = columns[1].text.strip()
                    
                    # मूल्य डाटा प्राप्त गर्ने
                    ltp = columns[6].text.strip()
                    change_text = columns[7].text.strip()
                    change = float(change_text) if change_text else 0
                    high = columns[4].text.strip()
                    low = columns[5].text.strip()
                    open_price = columns[3].text.strip()
                    qty = columns[10].text.strip().replace(',', '')
                    
                    # प्रतिशत परिवर्तन गणना गर्ने
                    percent_change = 0
                    if change != 0 and ltp:
                        try:
                            ltp_value = float(ltp.replace(',', ''))
                            percent_change = round((change / (ltp_value - change)) * 100, 2)
                        except:
                            percent_change = 0
                    
                    stock_data.append({
                        'symbol': symbol,
                        'ltp': ltp,
                        'change': change,
                        'percent_change': percent_change,
                        'high': high,
                        'low': low,
                        'open': open_price,
                        'qty': qty
                    })
                except Exception as e:
                    print(f"Error processing row: {str(e)}")
                    continue
        
        # यदि कुनै डाटा फेला परेन भने पुरानो क्यास फर्काउने
        if not stock_data:
            return nepse_data_cache['data'] if nepse_data_cache['data'] else []
        
        # क्यास अपडेट गर्ने
        nepse_data_cache = {
            'data': stock_data,
            'last_updated': current_time
        }
        
        # क्यास फाइल सेभ गर्ने
        save_cache_files()
        
        return stock_data
    
    except Exception as e:
        print(f"Error fetching NEPSE data: {str(e)}")
        return nepse_data_cache['data'] if nepse_data_cache['data'] else []

# बजार अवलोकन डाटा प्राप्त गर्ने
def fetch_market_overview():
    global market_overview_cache
    
    current_time = time.time()
    
    # क्यास अवधि समाप्त नभएको छ भने क्यास डाटा फर्काउने
    if market_overview_cache['data'] and current_time - market_overview_cache['last_updated'] < CACHE_EXPIRY:
        return market_overview_cache['data']
    
    try:
        url = 'https://www.nepalstock.com/'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # बजार अवलोकन डाटा प्राप्त गर्ने
        market_data = {}
        
        # NEPSE इन्डेक्स प्राप्त गर्ने
        nepse_index_div = soup.find('div', class_='current-index')
        if nepse_index_div:
            index_value = nepse_index_div.find('span', class_='current-price')
            index_change = nepse_index_div.find('span', class_='point-change')
            
            if index_value and index_change:
                market_data['nepse_index'] = index_value.text.strip()
                market_data['nepse_change'] = index_change.text.strip()
                # पोजिटिभ वा नेगेटिभ निर्धारण गर्ने
                market_data['nepse_direction'] = 'positive' if '+' in index_change.text else 'negative'
        
        # बजार स्टाटिस्टिक्स प्राप्त गर्ने
        market_stats = soup.find('div', class_='market-status')
        if market_stats:
            stats_items = market_stats.find_all('div', class_='d-flex')
            
            for item in stats_items:
                label = item.find('div', class_='text')
                value = item.find('div', class_='count')
                
                if label and value:
                    label_text = label.text.strip().lower()
                    value_text = value.text.strip()
                    
                    if 'turnover' in label_text:
                        market_data['turnover'] = value_text
                    elif 'traded shares' in label_text:
                        market_data['traded_shares'] = value_text
                    elif 'transactions' in label_text:
                        market_data['transactions'] = value_text
                    elif 'market cap' in label_text:
                        market_data['market_cap'] = value_text
        
        # यदि कुनै डाटा फेला परेन भने पुरानो क्यास फर्काउने
        if not market_data:
            return market_overview_cache['data'] if market_overview_cache['data'] else {}
        
        # क्यास अपडेट गर्ने
        market_overview_cache = {
            'data': market_data,
            'last_updated': current_time
        }
        
        return market_data
    
    except Exception as e:
        print(f"Error fetching market overview: {str(e)}")
        return market_overview_cache['data'] if market_overview_cache['data'] else {}

# बैकग्राउन्डमा डाटा अपडेट गर्ने
def background_data_update():
    while True:
        # बजार खुला छ भने हरेक 5 मिनेटमा अपडेट गर्ने, अन्यथा हरेक 30 मिनेटमा
        update_interval = 5 * 60 if is_market_open() else 30 * 60
        
        try:
            fetch_nepse_data()
            fetch_market_overview()
            
            # दिनको एक पटक मात्र सबै स्टक्स लिस्ट अपडेट गर्ने
            now = datetime.now()
            if now.hour == 10 and now.minute < 5:  # बिहान 10 बजे
                fetch_all_stocks()
        
        except Exception as e:
            print(f"Background update error: {str(e)}")
        
        time.sleep(update_interval)

# API एन्डपोइन्ट्स
@app.route('/nepse_data')
def get_nepse_data():
    try:
        # फिल्टरिङ प्यारामिटरहरू
        symbol = request.args.get('symbol')
        sector = request.args.get('sector')
        sort_by = request.args.get('sort_by', 'symbol')
        sort_order = request.args.get('sort_order', 'asc')
        limit = request.args.get('limit')
        
        if limit:
            try:
                limit = int(limit)
            except:
                limit = None
        
        # डाटा प्राप्त गर्ने
        stock_data = fetch_nepse_data()
        
        # फिल्टरिङ
        if symbol:
            stock_data = [stock for stock in stock_data if symbol.upper() in stock['symbol'].upper()]
        
        # सर्टिङ
        reverse = sort_order.lower() == 'desc'
        if sort_by == 'change':
            stock_data = sorted(stock_data, key=lambda x: float(x['change']) if x['change'] else 0, reverse=reverse)
        elif sort_by == 'percent_change':
            stock_data = sorted(stock_data, key=lambda x: float(x['percent_change']) if x['percent_change'] else 0, reverse=reverse)
        elif sort_by == 'ltp':
            stock_data = sorted(stock_data, key=lambda x: float(x['ltp'].replace(',', '')) if x['ltp'] else 0, reverse=reverse)
        elif sort_by == 'qty':
            stock_data = sorted(stock_data, key=lambda x: float(x['qty'].replace(',', '')) if x['qty'] else 0, reverse=reverse)
        else:  # Default: symbol
            stock_data = sorted(stock_data, key=lambda x: x['symbol'], reverse=reverse)
        
        # लिमिट
        if limit:
            stock_data = stock_data[:limit]
        
        # अतिरिक्त जानकारी थप्ने
        result = {
            'data': stock_data,
            'meta': {
                'total': len(stock_data),
                'last_updated': datetime.fromtimestamp(nepse_data_cache['last_updated']).strftime('%Y-%m-%d %H:%M:%S'),
                'market_status': 'open' if is_market_open() else 'closed'
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/market_overview')
def get_market_overview():
    try:
        market_data = fetch_market_overview()
        
        # अतिरिक्त जानकारी थप्ने
        result = {
            'data': market_data,
            'meta': {
                'last_updated': datetime.fromtimestamp(market_overview_cache['last_updated']).strftime('%Y-%m-%d %H:%M:%S') if market_overview_cache['last_updated'] else None,
                'market_status': 'open' if is_market_open() else 'closed'
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stocks_list')
def get_stocks_list():
    try:
        # फिल्टरिङ प्यारामिटरहरू
        sector = request.args.get('sector')
        search = request.args.get('search')
        
        # सबै स्टक्स प्राप्त गर्ने
        stocks = fetch_all_stocks()
        
        # फिल्टरिङ
        if sector:
            stocks = [stock for stock in stocks if sector.lower() in stock['sector'].lower()]
        
        if search:
            stocks = [stock for stock in stocks if search.lower() in stock['symbol'].lower() or search.lower() in stock['company_name'].lower()]
        
        # अतिरिक्त जानकारी थप्ने
        result = {
            'data': stocks,
            'meta': {
                'total': len(stocks),
                'last_updated': datetime.fromtimestamp(stocks_list_cache['last_updated']).strftime('%Y-%m-%d %H:%M:%S') if stocks_list_cache['last_updated'] else None
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/top_gainers')
def get_top_gainers():
    try:
        limit = request.args.get('limit', 10)
        try:
            limit = int(limit)
        except:
            limit = 10
        
        # सबै स्टक डाटा प्राप्त गर्ने
        stock_data = fetch_nepse_data()
        
        # परिवर्तन अनुसार सर्ट गर्ने
        sorted_data = sorted(stock_data, key=lambda x: float(x['percent_change']) if x['percent_change'] else 0, reverse=True)
        
        # टप गेनर्स फिल्टर गर्ने
        gainers = [stock for stock in sorted_data if float(stock['percent_change']) > 0][:limit]
        
        return jsonify(gainers)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/top_losers')
def get_top_losers():
    try:
        limit = request.args.get('limit', 10)
        try:
            limit = int(limit)
        except:
            limit = 10
        
        # सबै स्टक डाटा प्राप्त गर्ने
        stock_data = fetch_nepse_data()
        
        # परिवर्तन अनुसार सर्ट गर्ने
        sorted_data = sorted(stock_data, key=lambda x: float(x['percent_change']) if x['percent_change'] else 0)
        
        # टप लुजर्स फिल्टर गर्ने
        losers = [stock for stock in sorted_data if float(stock['percent_change']) < 0][:limit]
        
        return jsonify(losers)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sectors')
def get_sectors():
    try:
        # सबै स्टक्स प्राप्त गर्ने
        stocks = fetch_all_stocks()
        
        # अद्वितीय क्षेत्रहरू प्राप्त गर्ने
        sectors = list(set(stock['sector'] for stock in stocks if stock['sector'] != "N/A"))
        sectors.sort()
        
        return jsonify(sectors)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# सर्भर सुरु हुँदा क्यास फाइलहरू लोड गर्ने
load_cache_files()

# बैकग्राउन्ड अपडेट थ्रेड सुरु गर्ने
update_thread = threading.Thread(target=background_data_update, daemon=True)
update_thread.start()

if __name__ == '__main__':
    app.run(debug=True, port=5000) 