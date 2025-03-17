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
import random

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
companies_list_cache = {
    'data': [],
    'last_updated': 0
}
company_details_cache = {}

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
    """
    मेरोलगानी वा नेपालीपैसा वेबसाइटबाट नेप्से बजार अवलोकन डाटा स्क्र्याप गर्ने
    """
    try:
        # पहिले मेरोलगानी वेबसाइट प्रयास गर्ने
        try:
            # मेरोलगानी वेबसाइटबाट डाटा स्क्र्याप गर्ने
            url = 'https://merolagani.com/MarketSummary.aspx'
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()  # त्रुटि जाँच गर्ने
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # नेप्से इन्डेक्स डाटा प्राप्त गर्ने
            nepse_index_div = soup.select_one('#ctl00_ContentPlaceHolder1_LiveNepse')
            nepse_index = float(nepse_index_div.select_one('.price').text.strip().replace(',', '')) if nepse_index_div else None
            
            # नेप्से परिवर्तन प्राप्त गर्ने
            nepse_change_div = nepse_index_div.select_one('.change') if nepse_index_div else None
            nepse_change_text = nepse_change_div.text.strip() if nepse_change_div else "0.00 (0.00%)"
            
            # परिवर्तन मान र प्रतिशत प्राप्त गर्ने
            import re
            change_match = re.search(r'([\+\-]?\d+\.\d+)\s*\(([\+\-]?\d+\.\d+)%\)', nepse_change_text)
            
            if change_match:
                nepse_change = float(change_match.group(1))
                nepse_change_percent = float(change_match.group(2))
            else:
                nepse_change = 0.0
                nepse_change_percent = 0.0
            
            # कारोबार रकम प्राप्त गर्ने
            turnover_div = soup.select_one('#ctl00_ContentPlaceHolder1_LiveTurnover')
            turnover_text = turnover_div.select_one('.price').text.strip() if turnover_div else "0"
            
            # Rs. र अन्य अक्षरहरू हटाउने
            turnover_text = turnover_text.replace('Rs.', '').replace(',', '').strip()
            
            # मान र इकाई प्राप्त गर्ने
            turnover_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', turnover_text)
            
            if turnover_match:
                turnover_value = float(turnover_match.group(1))
                turnover_unit = turnover_match.group(2) if turnover_match.group(2) else ""
                
                # इकाई अनुसार मान परिवर्तन गर्ने
                if turnover_unit.lower() == 'b' or turnover_unit.lower() == 'bn':
                    turnover_value = turnover_value * 1000000000  # बिलियन
                elif turnover_unit.lower() == 'm' or turnover_unit.lower() == 'mn':
                    turnover_value = turnover_value * 1000000  # मिलियन
                elif turnover_unit.lower() == 'k':
                    turnover_value = turnover_value * 1000  # हजार
            else:
                turnover_value = 0.0
            
            # कारोबार भएका शेयर संख्या प्राप्त गर्ने
            shares_traded_div = soup.select_one('#ctl00_ContentPlaceHolder1_LiveSharesTraded')
            shares_traded_text = shares_traded_div.select_one('.price').text.strip() if shares_traded_div else "0"
            
            # अक्षरहरू हटाउने
            shares_traded_text = shares_traded_text.replace(',', '').strip()
            
            # मान र इकाई प्राप्त गर्ने
            shares_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', shares_traded_text)
            
            if shares_match:
                shares_value = float(shares_match.group(1))
                shares_unit = shares_match.group(2) if shares_match.group(2) else ""
                
                # इकाई अनुसार मान परिवर्तन गर्ने
                if shares_unit.lower() == 'm':
                    shares_value = shares_value * 1000000  # मिलियन
                elif shares_unit.lower() == 'k':
                    shares_value = shares_value * 1000  # हजार
            else:
                shares_value = 0.0
            
            # कारोबार संख्या प्राप्त गर्ने
            transactions_div = soup.select_one('#ctl00_ContentPlaceHolder1_LiveTransactions')
            transactions_text = transactions_div.select_one('.price').text.strip() if transactions_div else "0"
            transactions = int(transactions_text.replace(',', ''))
            
            # बजार पूँजीकरण प्राप्त गर्ने
            market_cap_div = soup.select_one('#ctl00_ContentPlaceHolder1_LiveMarketCap')
            market_cap_text = market_cap_div.select_one('.price').text.strip() if market_cap_div else "0"
            
            # Rs. र अन्य अक्षरहरू हटाउने
            market_cap_text = market_cap_text.replace('Rs.', '').replace(',', '').strip()
            
            # मान र इकाई प्राप्त गर्ने
            market_cap_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', market_cap_text)
            
            if market_cap_match:
                market_cap_value = float(market_cap_match.group(1))
                market_cap_unit = market_cap_match.group(2) if market_cap_match.group(2) else ""
                
                # इकाई अनुसार मान परिवर्तन गर्ने
                if market_cap_unit.lower() == 't' or market_cap_unit.lower() == 'tn':
                    market_cap_value = market_cap_value * 1000000000000  # ट्रिलियन
                elif market_cap_unit.lower() == 'b' or market_cap_unit.lower() == 'bn':
                    market_cap_value = market_cap_value * 1000000000  # बिलियन
                elif market_cap_unit.lower() == 'm' or market_cap_unit.lower() == 'mn':
                    market_cap_value = market_cap_value * 1000000  # मिलियन
            else:
                market_cap_value = 0.0
            
            # बजार स्थिति प्राप्त गर्ने
            market_status = "Open" if is_market_open() else "Closed"
            
            # अन्तिम अपडेट समय प्राप्त गर्ने
            last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # डाटा संरचना तयार गर्ने
            market_overview = {
                'nepse_index': nepse_index,
                'nepse_change': nepse_change,
                'nepse_change_percent': nepse_change_percent,
                'turnover': turnover_value,
                'turnover_formatted': format_large_number(turnover_value),
                'shares_traded': shares_value,
                'shares_traded_formatted': format_large_number(shares_value),
                'transactions': transactions,
                'transactions_formatted': format_number(transactions),
                'market_cap': market_cap_value,
                'market_cap_formatted': format_large_number(market_cap_value),
                'market_status': market_status,
                'last_updated': last_updated,
                'data_source': 'merolagani'
            }
            
            return market_overview
            
        except Exception as mero_error:
            print(f"मेरोलगानीबाट डाटा प्राप्त गर्न त्रुटि: {mero_error}")
            
            # मेरोलगानीबाट डाटा प्राप्त गर्न असफल भएमा नेपालीपैसा प्रयास गर्ने
            url = 'https://www.nepalipaisa.com/'
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()  # त्रुटि जाँच गर्ने
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # नेप्से इन्डेक्स डाटा प्राप्त गर्ने
            nepse_index_div = soup.select_one('.market-status')
            nepse_index_text = nepse_index_div.select_one('.nepse-index').text.strip() if nepse_index_div else "0"
            nepse_index = float(nepse_index_text.replace(',', ''))
            
            # नेप्से परिवर्तन प्राप्त गर्ने
            nepse_change_div = nepse_index_div.select_one('.nepse-change') if nepse_index_div else None
            nepse_change_text = nepse_change_div.text.strip() if nepse_change_div else "0.00 (0.00%)"
            
            # परिवर्तन मान र प्रतिशत प्राप्त गर्ने
            import re
            change_match = re.search(r'([\+\-]?\d+\.\d+)\s*\(([\+\-]?\d+\.\d+)%\)', nepse_change_text)
            
            if change_match:
                nepse_change = float(change_match.group(1))
                nepse_change_percent = float(change_match.group(2))
            else:
                nepse_change = 0.0
                nepse_change_percent = 0.0
            
            # अन्य बजार डाटा प्राप्त गर्ने
            market_data_divs = soup.select('.market-data .data-item')
            
            turnover_value = 0.0
            shares_value = 0.0
            transactions = 0
            market_cap_value = 0.0
            
            for div in market_data_divs:
                label = div.select_one('.label').text.strip().lower() if div.select_one('.label') else ""
                value_text = div.select_one('.value').text.strip() if div.select_one('.value') else "0"
                
                if 'turnover' in label:
                    # Rs. र अन्य अक्षरहरू हटाउने
                    turnover_text = value_text.replace('Rs.', '').replace(',', '').strip()
                    
                    # मान र इकाई प्राप्त गर्ने
                    turnover_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', turnover_text)
                    
                    if turnover_match:
                        turnover_value = float(turnover_match.group(1))
                        turnover_unit = turnover_match.group(2) if turnover_match.group(2) else ""
                        
                        # इकाई अनुसार मान परिवर्तन गर्ने
                        if turnover_unit.lower() == 'b' or turnover_unit.lower() == 'bn':
                            turnover_value = turnover_value * 1000000000  # बिलियन
                        elif turnover_unit.lower() == 'm' or turnover_unit.lower() == 'mn':
                            turnover_value = turnover_value * 1000000  # मिलियन
                        elif turnover_unit.lower() == 'k':
                            turnover_value = turnover_value * 1000  # हजार
                
                elif 'shares' in label or 'traded' in label:
                    # अक्षरहरू हटाउने
                    shares_text = value_text.replace(',', '').strip()
                    
                    # मान र इकाई प्राप्त गर्ने
                    shares_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', shares_text)
                    
                    if shares_match:
                        shares_value = float(shares_match.group(1))
                        shares_unit = shares_match.group(2) if shares_match.group(2) else ""
                        
                        # इकाई अनुसार मान परिवर्तन गर्ने
                        if shares_unit.lower() == 'm':
                            shares_value = shares_value * 1000000  # मिलियन
                        elif shares_unit.lower() == 'k':
                            shares_value = shares_value * 1000  # हजार
                
                elif 'transactions' in label:
                    transactions = int(value_text.replace(',', ''))
                
                elif 'market cap' in label or 'capitalization' in label:
                    # Rs. र अन्य अक्षरहरू हटाउने
                    market_cap_text = value_text.replace('Rs.', '').replace(',', '').strip()
                    
                    # मान र इकाई प्राप्त गर्ने
                    market_cap_match = re.search(r'([\d\.]+)\s*([A-Za-z]+)?', market_cap_text)
                    
                    if market_cap_match:
                        market_cap_value = float(market_cap_match.group(1))
                        market_cap_unit = market_cap_match.group(2) if market_cap_match.group(2) else ""
                        
                        # इकाई अनुसार मान परिवर्तन गर्ने
                        if market_cap_unit.lower() == 't' or market_cap_unit.lower() == 'tn':
                            market_cap_value = market_cap_value * 1000000000000  # ट्रिलियन
                        elif market_cap_unit.lower() == 'b' or market_cap_unit.lower() == 'bn':
                            market_cap_value = market_cap_value * 1000000000  # बिलियन
                        elif market_cap_unit.lower() == 'm' or market_cap_unit.lower() == 'mn':
                            market_cap_value = market_cap_value * 1000000  # मिलियन
            
            # बजार स्थिति प्राप्त गर्ने
            market_status = "Open" if is_market_open() else "Closed"
            
            # अन्तिम अपडेट समय प्राप्त गर्ने
            last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # डाटा संरचना तयार गर्ने
            market_overview = {
                'nepse_index': nepse_index,
                'nepse_change': nepse_change,
                'nepse_change_percent': nepse_change_percent,
                'turnover': turnover_value,
                'turnover_formatted': format_large_number(turnover_value),
                'shares_traded': shares_value,
                'shares_traded_formatted': format_large_number(shares_value),
                'transactions': transactions,
                'transactions_formatted': format_number(transactions),
                'market_cap': market_cap_value,
                'market_cap_formatted': format_large_number(market_cap_value),
                'market_status': market_status,
                'last_updated': last_updated,
                'data_source': 'nepalipaisa'
            }
            
            return market_overview
    
    except Exception as e:
        print(f"बजार अवलोकन डाटा प्राप्त गर्न त्रुटि: {e}")
        
        # त्रुटि भएमा डिफल्ट डाटा फर्काउने
        return {
            'nepse_index': 0.0,
            'nepse_change': 0.0,
            'nepse_change_percent': 0.0,
            'turnover': 0.0,
            'turnover_formatted': 'Rs. 0',
            'shares_traded': 0,
            'shares_traded_formatted': '0',
            'transactions': 0,
            'transactions_formatted': '0',
            'market_cap': 0.0,
            'market_cap_formatted': 'Rs. 0',
            'market_status': 'Unknown',
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': 'default'
        }

def format_large_number(number):
    """
    ठूलो संख्यालाई सजिलै पढ्न मिल्ने ढाँचामा परिवर्तन गर्ने
    """
    if number >= 1000000000000:  # ट्रिलियन
        return f"Rs. {number / 1000000000000:.2f} T"
    elif number >= 1000000000:  # बिलियन
        return f"Rs. {number / 1000000000:.2f} B"
    elif number >= 1000000:  # मिलियन
        return f"Rs. {number / 1000000:.2f} M"
    elif number >= 1000:  # हजार
        return f"Rs. {number / 1000:.2f} K"
    else:
        return f"Rs. {number:.2f}"

def format_number(number):
    """
    संख्यालाई सजिलै पढ्न मिल्ने ढाँचामा परिवर्तन गर्ने
    """
    if number >= 1000000:  # मिलियन
        return f"{number / 1000000:.2f} M"
    elif number >= 1000:  # हजार
        return f"{number / 1000:.2f} K"
    else:
        return f"{number}"

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
        # बजार अवलोकन डाटा प्राप्त गर्ने
        market_data = fetch_market_overview()
        
        # क्यास अपडेट गर्ने
        global market_overview_cache
        market_overview_cache = {
            'data': market_data,
            'last_updated': time.time()
        }
        
        return jsonify(market_data)
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

# रियल-टाइम स्टक डाटा एन्डपोइन्ट
@app.route('/realtime_stock_data')
def get_realtime_stock_data():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({'error': 'Symbol parameter is required'}), 400
    
    try:
        # यहाँ NEPSE बाट रियल-टाइम डाटा प्राप्त गर्ने लजिक
        # यो उदाहरणमा हामी क्यास गरिएको डाटा प्रयोग गर्छौं
        data = fetch_nepse_data()
        stock_data = next((item for item in data if item.get('symbol') == symbol), None)
        
        if not stock_data:
            return jsonify({'error': 'Stock not found'}), 404
            
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# हिस्टोरिकल डाटा एन्डपोइन्ट
@app.route('/historical_data')
def get_historical_data():
    symbol = request.args.get('symbol')
    interval = request.args.get('interval', '1d')  # 1d, 1w, 1m, 3m, 6m, 1y
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not symbol:
        return jsonify({'error': 'Symbol parameter is required'}), 400
    
    try:
        # यहाँ NEPSE बाट हिस्टोरिकल डाटा प्राप्त गर्ने लजिक
        # यो उदाहरणमा हामी डमी डाटा फर्काउँछौं
        
        # वास्तविक कार्यान्वयनमा, यहाँ NEPSE वा अन्य स्रोतबाट डाटा प्राप्त गर्नुपर्छ
        today = datetime.now()
        
        if not start_date:
            if interval == '1d':
                start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
            elif interval == '1w':
                start_date = (today - timedelta(days=90)).strftime('%Y-%m-%d')
            elif interval == '1m':
                start_date = (today - timedelta(days=180)).strftime('%Y-%m-%d')
            else:
                start_date = (today - timedelta(days=365)).strftime('%Y-%m-%d')
        
        if not end_date:
            end_date = today.strftime('%Y-%m-%d')
            
        # डमी डाटा जनरेट गर्ने
        date_range = pd.date_range(start=start_date, end=end_date)
        data = []
        
        base_price = 1000  # आधार मूल्य
        price = base_price
        
        for date in date_range:
            if date.weekday() < 5:  # सप्ताहान्त बाहेक
                change = (0.5 - random.random()) * 20  # -10 देखि +10 सम्म
                price = max(price + change, 100)  # न्यूनतम मूल्य 100
                
                volume = int(random.random() * 10000) + 1000
                
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'open': round(price - random.random() * 5, 2),
                    'high': round(price + random.random() * 10, 2),
                    'low': round(price - random.random() * 10, 2),
                    'close': round(price, 2),
                    'volume': volume
                })
        
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# टेक्निकल इन्डिकेटर्स एन्डपोइन्ट
@app.route('/technical_indicators')
def get_technical_indicators():
    symbol = request.args.get('symbol')
    indicators = request.args.get('indicators', 'sma,ema,rsi')  # कम्मा सेपरेटेड इन्डिकेटर्स
    
    if not symbol:
        return jsonify({'error': 'Symbol parameter is required'}), 400
    
    try:
        # हिस्टोरिकल डाटा प्राप्त गर्ने
        historical_data = json.loads(get_historical_data().get_data(as_text=True))
        
        # इन्डिकेटर्स क्याल्कुलेट गर्ने
        indicators_list = indicators.split(',')
        result = {}
        
        # मूल्य डाटा निकाल्ने
        prices = [item['close'] for item in historical_data]
        dates = [item['date'] for item in historical_data]
        
        for indicator in indicators_list:
            indicator = indicator.strip().lower()
            
            if indicator == 'sma':
                # सिम्पल मुभिङ एभरेज (20 दिन)
                sma_period = 20
                sma_values = []
                
                for i in range(len(prices)):
                    if i < sma_period - 1:
                        sma_values.append(None)
                    else:
                        sma = sum(prices[i-(sma_period-1):i+1]) / sma_period
                        sma_values.append(round(sma, 2))
                
                result['sma'] = [{'date': dates[i], 'value': sma_values[i]} for i in range(len(dates))]
                
            elif indicator == 'ema':
                # एक्सपोनेन्सियल मुभिङ एभरेज (20 दिन)
                ema_period = 20
                ema_values = []
                
                # पहिलो EMA मान SMA हो
                sma = sum(prices[:ema_period]) / ema_period
                ema = sma
                ema_values.extend([None] * (ema_period - 1))
                ema_values.append(round(ema, 2))
                
                # बाँकी EMA मानहरू क्याल्कुलेट गर्ने
                multiplier = 2 / (ema_period + 1)
                
                for i in range(ema_period, len(prices)):
                    ema = (prices[i] - ema) * multiplier + ema
                    ema_values.append(round(ema, 2))
                
                result['ema'] = [{'date': dates[i], 'value': ema_values[i]} for i in range(len(dates))]
                
            elif indicator == 'rsi':
                # रिलेटिभ स्ट्रेन्थ इन्डेक्स (14 दिन)
                rsi_period = 14
                rsi_values = []
                
                # पहिलो RSI मानहरू क्याल्कुलेट गर्न सकिँदैन
                rsi_values.extend([None] * rsi_period)
                
                for i in range(rsi_period, len(prices)):
                    gains = []
                    losses = []
                    
                    for j in range(i - rsi_period, i):
                        change = prices[j+1] - prices[j]
                        if change >= 0:
                            gains.append(change)
                            losses.append(0)
                        else:
                            gains.append(0)
                            losses.append(abs(change))
                    
                    avg_gain = sum(gains) / rsi_period
                    avg_loss = sum(losses) / rsi_period
                    
                    if avg_loss == 0:
                        rsi = 100
                    else:
                        rs = avg_gain / avg_loss
                        rsi = 100 - (100 / (1 + rs))
                    
                    rsi_values.append(round(rsi, 2))
                
                result['rsi'] = [{'date': dates[i], 'value': rsi_values[i]} for i in range(len(dates))]
                
            elif indicator == 'bb':
                # बोलिन्जर ब्यान्ड्स (20 दिन, 2 स्ट्यान्डर्ड डेभिएसन)
                bb_period = 20
                bb_std = 2
                bb_upper = []
                bb_middle = []
                bb_lower = []
                
                for i in range(len(prices)):
                    if i < bb_period - 1:
                        bb_upper.append(None)
                        bb_middle.append(None)
                        bb_lower.append(None)
                    else:
                        period_prices = prices[i-(bb_period-1):i+1]
                        sma = sum(period_prices) / bb_period
                        std = (sum([(x - sma) ** 2 for x in period_prices]) / bb_period) ** 0.5
                        
                        bb_upper.append(round(sma + bb_std * std, 2))
                        bb_middle.append(round(sma, 2))
                        bb_lower.append(round(sma - bb_std * std, 2))
                
                result['bb'] = {
                    'upper': [{'date': dates[i], 'value': bb_upper[i]} for i in range(len(dates))],
                    'middle': [{'date': dates[i], 'value': bb_middle[i]} for i in range(len(dates))],
                    'lower': [{'date': dates[i], 'value': bb_lower[i]} for i in range(len(dates))]
                }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# अलर्ट सेटिङ्ग एन्डपोइन्ट
@app.route('/set_alert', methods=['POST'])
def set_alert():
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['user_id', 'symbol', 'price', 'condition']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # अलर्ट डाटा सेभ गर्ने
        # वास्तविक कार्यान्वयनमा, यहाँ डाटाबेसमा अलर्ट सेभ गर्नुपर्छ
        
        # डमी रेस्पोन्स
        alert_id = int(time.time())  # युनिक आईडी
        
        return jsonify({
            'success': True,
            'alert_id': alert_id,
            'message': 'Alert set successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# अलर्ट हटाउने एन्डपोइन्ट
@app.route('/remove_alert', methods=['POST'])
def remove_alert():
    data = request.json
    
    if not data or 'alert_id' not in data:
        return jsonify({'error': 'Alert ID is required'}), 400
    
    try:
        # अलर्ट हटाउने
        # वास्तविक कार्यान्वयनमा, यहाँ डाटाबेसबाट अलर्ट हटाउनुपर्छ
        
        return jsonify({
            'success': True,
            'message': 'Alert removed successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# प्रयोगकर्ताको अलर्टहरू प्राप्त गर्ने एन्डपोइन्ट
@app.route('/user_alerts')
def get_user_alerts():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        # प्रयोगकर्ताको अलर्टहरू प्राप्त गर्ने
        # वास्तविक कार्यान्वयनमा, यहाँ डाटाबेसबाट अलर्टहरू प्राप्त गर्नुपर्छ
        
        # डमी डाटा
        alerts = [
            {
                'alert_id': 1234567890,
                'symbol': 'NABIL',
                'price': 1000,
                'condition': 'above',
                'created_at': '2023-01-01T12:00:00',
                'status': 'active'
            },
            {
                'alert_id': 1234567891,
                'symbol': 'NRIC',
                'price': 800,
                'condition': 'below',
                'created_at': '2023-01-02T12:00:00',
                'status': 'active'
            }
        ]
        
        return jsonify(alerts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# एडभान्स्ड फिल्टर एन्डपोइन्ट
@app.route('/advanced_filter')
def advanced_filter():
    # फिल्टर प्यारामिटरहरू
    sector = request.args.get('sector')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    min_volume = request.args.get('min_volume')
    max_volume = request.args.get('max_volume')
    min_change = request.args.get('min_change')
    max_change = request.args.get('max_change')
    sort_by = request.args.get('sort_by', 'symbol')
    sort_order = request.args.get('sort_order', 'asc')
    
    try:
        # NEPSE डाटा प्राप्त गर्ने
        data = fetch_nepse_data()
        
        # फिल्टरिङ
        filtered_data = data.copy()
        
        if sector:
            filtered_data = [item for item in filtered_data if item.get('sector') == sector]
        
        if min_price:
            filtered_data = [item for item in filtered_data if float(item.get('ltp', 0)) >= float(min_price)]
        
        if max_price:
            filtered_data = [item for item in filtered_data if float(item.get('ltp', 0)) <= float(max_price)]
        
        if min_volume:
            filtered_data = [item for item in filtered_data if int(item.get('volume', 0)) >= int(min_volume)]
        
        if max_volume:
            filtered_data = [item for item in filtered_data if int(item.get('volume', 0)) <= int(max_volume)]
        
        if min_change:
            filtered_data = [item for item in filtered_data if float(item.get('change_percent', 0)) >= float(min_change)]
        
        if max_change:
            filtered_data = [item for item in filtered_data if float(item.get('change_percent', 0)) <= float(max_change)]
        
        # सर्टिङ
        reverse_order = sort_order.lower() == 'desc'
        
        if sort_by == 'price':
            filtered_data.sort(key=lambda x: float(x.get('ltp', 0)), reverse=reverse_order)
        elif sort_by == 'volume':
            filtered_data.sort(key=lambda x: int(x.get('volume', 0)), reverse=reverse_order)
        elif sort_by == 'change':
            filtered_data.sort(key=lambda x: float(x.get('change_percent', 0)), reverse=reverse_order)
        else:  # symbol
            filtered_data.sort(key=lambda x: x.get('symbol', ''), reverse=reverse_order)
        
        return jsonify(filtered_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# मेरो लगानीबाट कम्पनीहरूको सूची प्राप्त गर्ने
def fetch_companies_from_merolagani():
    global companies_list_cache
    
    current_time = time.time()
    
    # क्यास अवधि जाँच गर्ने
    if companies_list_cache['data'] and current_time - companies_list_cache['last_updated'] < CACHE_EXPIRY:
        return companies_list_cache['data']
    
    try:
        # मेरो लगानी वेबसाइटबाट कम्पनीहरूको सूची प्राप्त गर्ने
        url = "https://merolagani.com/CompanyList.aspx"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            if companies_list_cache['data']:
                return companies_list_cache['data']
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # कम्पनी टेबल प्राप्त गर्ने
        table = soup.find('table', {'id': 'ctl00_ContentPlaceHolder1_tblCompanyList'})
        
        if not table:
            if companies_list_cache['data']:
                return companies_list_cache['data']
            return []
        
        companies = []
        
        # टेबलबाट कम्पनीहरूको विवरण प्राप्त गर्ने
        rows = table.find_all('tr')[1:]  # हेडर छोड्ने
        
        for row in rows:
            cols = row.find_all('td')
            
            if len(cols) >= 7:
                symbol_element = cols[0].find('a')
                
                if symbol_element:
                    symbol = symbol_element.text.strip()
                    company_name = cols[1].text.strip()
                    sector = cols[2].text.strip()
                    
                    # LTP, % Change, 52 Weeks High/Low प्राप्त गर्ने
                    try:
                        ltp = float(cols[3].text.strip().replace(',', ''))
                    except:
                        ltp = 0.0
                    
                    try:
                        change_percent = float(cols[4].text.strip().replace('%', ''))
                    except:
                        change_percent = 0.0
                    
                    try:
                        high_52_week = float(cols[5].text.strip().replace(',', ''))
                    except:
                        high_52_week = 0.0
                    
                    try:
                        low_52_week = float(cols[6].text.strip().replace(',', ''))
                    except:
                        low_52_week = 0.0
                    
                    companies.append({
                        'symbol': symbol,
                        'company_name': company_name,
                        'sector': sector,
                        'ltp': ltp,
                        'change_percent': change_percent,
                        'high_52_week': high_52_week,
                        'low_52_week': low_52_week
                    })
        
        # क्यास अपडेट गर्ने
        companies_list_cache = {
            'data': companies,
            'last_updated': current_time
        }
        
        return companies
    
    except Exception as e:
        print(f"कम्पनीहरूको सूची प्राप्त गर्न त्रुटि: {str(e)}")
        
        # क्यास डाटा फर्काउने यदि उपलब्ध छ भने
        if companies_list_cache['data']:
            return companies_list_cache['data']
        
        return []

# मेरो लगानीबाट कम्पनी विवरण प्राप्त गर्ने
def fetch_company_details(symbol):
    global company_details_cache
    
    current_time = time.time()
    
    # क्यास अवधि जाँच गर्ने
    if symbol in company_details_cache and current_time - company_details_cache[symbol]['last_updated'] < CACHE_EXPIRY:
        return company_details_cache[symbol]['data']
    
    try:
        # मेरो लगानी वेबसाइटबाट कम्पनी विवरण प्राप्त गर्ने
        url = f"https://merolagani.com/CompanyDetail.aspx?symbol={symbol}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            if symbol in company_details_cache:
                return company_details_cache[symbol]['data']
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # कम्पनी विवरण प्राप्त गर्ने
        company_detail = {}
        
        # कम्पनी नाम
        company_name_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_companyName'})
        if company_name_element:
            company_detail['company_name'] = company_name_element.text.strip()
        else:
            company_detail['company_name'] = symbol
        
        # सेक्टर
        sector_element = soup.find('a', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblSector'})
        if sector_element:
            company_detail['sector'] = sector_element.text.strip()
        else:
            company_detail['sector'] = "N/A"
        
        # शेयर मूल्य विवरण
        price_info = {}
        
        # LTP
        ltp_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblMarketPrice'})
        if ltp_element:
            try:
                price_info['ltp'] = float(ltp_element.text.strip().replace(',', ''))
            except:
                price_info['ltp'] = 0.0
        
        # % Change
        change_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblChange'})
        if change_element:
            try:
                change_text = change_element.text.strip()
                if '(' in change_text and ')' in change_text:
                    change_percent_text = change_text.split('(')[1].split(')')[0].replace('%', '')
                    price_info['change_percent'] = float(change_percent_text)
                else:
                    price_info['change_percent'] = 0.0
            except:
                price_info['change_percent'] = 0.0
        
        # 52 Week High/Low
        high_low_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lbl52WeekHighLow'})
        if high_low_element:
            try:
                high_low_text = high_low_element.text.strip()
                if '/' in high_low_text:
                    high, low = high_low_text.split('/')
                    price_info['high_52_week'] = float(high.strip().replace(',', ''))
                    price_info['low_52_week'] = float(low.strip().replace(',', ''))
                else:
                    price_info['high_52_week'] = 0.0
                    price_info['low_52_week'] = 0.0
            except:
                price_info['high_52_week'] = 0.0
                price_info['low_52_week'] = 0.0
        
        company_detail['price_info'] = price_info
        
        # आधारभूत विवरण
        fundamentals = {}
        
        # Market Cap
        market_cap_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblMarketCapitalization'})
        if market_cap_element:
            fundamentals['market_cap'] = market_cap_element.text.strip()
        
        # Shares Outstanding
        shares_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblOutstandingShares'})
        if shares_element:
            fundamentals['shares_outstanding'] = shares_element.text.strip()
        
        # EPS
        eps_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblEPS'})
        if eps_element:
            try:
                fundamentals['eps'] = float(eps_element.text.strip().replace(',', ''))
            except:
                fundamentals['eps'] = 0.0
        
        # P/E Ratio
        pe_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblPERatio'})
        if pe_element:
            try:
                fundamentals['pe_ratio'] = float(pe_element.text.strip().replace(',', ''))
            except:
                fundamentals['pe_ratio'] = 0.0
        
        # Book Value
        book_value_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblBookValue'})
        if book_value_element:
            try:
                fundamentals['book_value'] = float(book_value_element.text.strip().replace(',', ''))
            except:
                fundamentals['book_value'] = 0.0
        
        # PBV
        pbv_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblPBV'})
        if pbv_element:
            try:
                fundamentals['pbv'] = float(pbv_element.text.strip().replace(',', ''))
            except:
                fundamentals['pbv'] = 0.0
        
        # Dividend
        dividend_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblDividend'})
        if dividend_element:
            fundamentals['dividend'] = dividend_element.text.strip()
        
        # Dividend Yield
        dividend_yield_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblDividendYield'})
        if dividend_yield_element:
            try:
                yield_text = dividend_yield_element.text.strip()
                if '%' in yield_text:
                    fundamentals['dividend_yield'] = float(yield_text.replace('%', ''))
                else:
                    fundamentals['dividend_yield'] = 0.0
            except:
                fundamentals['dividend_yield'] = 0.0
        
        company_detail['fundamentals'] = fundamentals
        
        # कम्पनी विवरण
        description = {}
        
        # About
        about_element = soup.find('div', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_divCompanyProfile'})
        if about_element:
            description['about'] = about_element.text.strip()
        
        # Contact Info
        contact_element = soup.find('div', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_divContactInfo'})
        if contact_element:
            contact_info = {}
            
            # Address
            address_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblAddress'})
            if address_element:
                contact_info['address'] = address_element.text.strip()
            
            # Phone
            phone_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblPhone'})
            if phone_element:
                contact_info['phone'] = phone_element.text.strip()
            
            # Email
            email_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblEmail'})
            if email_element:
                contact_info['email'] = email_element.text.strip()
            
            # Website
            website_element = soup.find('span', {'id': 'ctl00_ContentPlaceHolder1_CompanyDetail1_lblWebsite'})
            if website_element:
                contact_info['website'] = website_element.text.strip()
            
            description['contact_info'] = contact_info
        
        company_detail['description'] = description
        
        # क्यास अपडेट गर्ने
        company_details_cache[symbol] = {
            'data': company_detail,
            'last_updated': current_time
        }
        
        return company_detail
    
    except Exception as e:
        print(f"कम्पनी विवरण प्राप्त गर्न त्रुटि: {str(e)}")
        
        # क्यास डाटा फर्काउने यदि उपलब्ध छ भने
        if symbol in company_details_cache:
            return company_details_cache[symbol]['data']
        
        return None

# मेरो लगानीबाट कम्पनीहरूको सूची प्राप्त गर्ने API
@app.route('/companies')
def get_companies():
    try:
        # क्वेरी प्यारामिटरहरू
        sector = request.args.get('sector', '')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'symbol')
        sort_order = request.args.get('sort_order', 'asc')
        
        # कम्पनीहरूको सूची प्राप्त गर्ने
        companies = fetch_companies_from_merolagani()
        
        # सेक्टर अनुसार फिल्टर गर्ने
        if sector:
            companies = [company for company in companies if company['sector'].lower() == sector.lower()]
        
        # खोज अनुसार फिल्टर गर्ने
        if search:
            search = search.lower()
            companies = [company for company in companies if 
                         search in company['symbol'].lower() or 
                         search in company['company_name'].lower()]
        
        # सर्ट गर्ने
        reverse = sort_order.lower() == 'desc'
        
        if sort_by == 'symbol':
            companies = sorted(companies, key=lambda x: x['symbol'], reverse=reverse)
        elif sort_by == 'company_name':
            companies = sorted(companies, key=lambda x: x['company_name'], reverse=reverse)
        elif sort_by == 'sector':
            companies = sorted(companies, key=lambda x: x['sector'], reverse=reverse)
        elif sort_by == 'ltp':
            companies = sorted(companies, key=lambda x: x['ltp'], reverse=reverse)
        elif sort_by == 'change_percent':
            companies = sorted(companies, key=lambda x: x['change_percent'], reverse=reverse)
        
        return jsonify({
            'success': True,
            'data': companies,
            'count': len(companies)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# कम्पनी विवरण प्राप्त गर्ने API
@app.route('/company/<symbol>')
def get_company_detail(symbol):
    try:
        # कम्पनी विवरण प्राप्त गर्ने
        company_detail = fetch_company_details(symbol.upper())
        
        if not company_detail:
            return jsonify({
                'success': False,
                'error': 'कम्पनी विवरण प्राप्त गर्न असफल'
            })
        
        return jsonify({
            'success': True,
            'data': company_detail
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# सेक्टरहरूको सूची प्राप्त गर्ने API
@app.route('/sectors_list')
def get_sectors_list():
    try:
        # कम्पनीहरूको सूची प्राप्त गर्ने
        companies = fetch_companies_from_merolagani()
        
        # सेक्टरहरूको सूची प्राप्त गर्ने
        sectors = list(set([company['sector'] for company in companies]))
        sectors.sort()
        
        return jsonify({
            'success': True,
            'data': sectors
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# मेन फंक्सन
if __name__ == '__main__':
    # क्यास फाइलहरू लोड गर्ने
    load_cache_files()
    
    # ब्याकग्राउन्ड थ्रेड सुरु गर्ने
    bg_thread = threading.Thread(target=background_data_update)
    bg_thread.daemon = True
    bg_thread.start()
    
    # सर्भर सुरु गर्ने
    app.run(debug=True, host='0.0.0.0', port=5000) 