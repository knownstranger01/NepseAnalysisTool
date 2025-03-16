#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
NEPSE स्टक मार्केट डाटा स्क्र्यापर

यो स्क्रिप्टले नेपाल स्टक एक्सचेन्ज (NEPSE) वेबसाइटबाट लाइभ स्टक डाटा स्क्र्याप गर्छ।
यसले स्टक सिम्बल, मूल्य, परिवर्तन, भोल्युम आदि जानकारी प्राप्त गर्छ।
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
import os
import csv
from datetime import datetime
import random

# कन्फिगरेसन
CACHE_DIR = 'cache'
DATA_CACHE_FILE = os.path.join(CACHE_DIR, 'nepse_data_cache.json')
STOCKS_LIST_FILE = os.path.join(CACHE_DIR, 'nepse_stocks_list.json')
CACHE_EXPIRY = 15 * 60  # 15 मिनेट (सेकेन्डमा)
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
]

# क्यास डिरेक्टरी बनाउने
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

class NepseDataScraper:
    """NEPSE डाटा स्क्र्यापिङ गर्ने क्लास"""
    
    def __init__(self):
        """इनिसियलाइजर"""
        self.nepse_data_cache = {'data': [], 'last_updated': 0}
        self.stocks_list_cache = {'data': [], 'last_updated': 0}
        self.load_cache_files()
    
    def load_cache_files(self):
        """क्यास फाइलहरू लोड गर्ने"""
        # NEPSE डाटा क्यास लोड गर्ने
        if os.path.exists(DATA_CACHE_FILE):
            try:
                with open(DATA_CACHE_FILE, 'r') as f:
                    self.nepse_data_cache = json.load(f)
            except:
                self.nepse_data_cache = {'data': [], 'last_updated': 0}
        
        # स्टक्स लिस्ट क्यास लोड गर्ने
        if os.path.exists(STOCKS_LIST_FILE):
            try:
                with open(STOCKS_LIST_FILE, 'r') as f:
                    self.stocks_list_cache = json.load(f)
            except:
                self.stocks_list_cache = {'data': [], 'last_updated': 0}
    
    def save_cache_files(self):
        """क्यास फाइलहरू सेभ गर्ने"""
        # NEPSE डाटा क्यास सेभ गर्ने
        with open(DATA_CACHE_FILE, 'w') as f:
            json.dump(self.nepse_data_cache, f)
        
        # स्टक्स लिस्ट क्यास सेभ गर्ने
        with open(STOCKS_LIST_FILE, 'w') as f:
            json.dump(self.stocks_list_cache, f)
    
    def get_random_user_agent(self):
        """र्यान्डम युजर एजेन्ट प्राप्त गर्ने"""
        return random.choice(USER_AGENTS)
    
    def is_market_open(self):
        """बजार खुला छ कि छैन जाँच गर्ने"""
        now = datetime.now()
        
        # शनिबार वा आइतबार हो भने बजार बन्द हुन्छ
        if now.weekday() >= 5:  # 5 = शनिबार, 6 = आइतबार
            return False
        
        # समय जाँच (11:00 AM - 3:00 PM)
        current_hour = now.hour
        return 11 <= current_hour < 15
    
    def fetch_all_stocks(self, force_refresh=False):
        """सबै NEPSE सूचीकृत शेयरहरू प्राप्त गर्ने"""
        current_time = time.time()
        
        # क्यास अवधि समाप्त नभएको छ र फोर्स रिफ्रेस छैन भने क्यास डाटा फर्काउने
        if not force_refresh and self.stocks_list_cache['data'] and current_time - self.stocks_list_cache['last_updated'] < 24 * 60 * 60:  # 24 घण्टा
            return self.stocks_list_cache['data']
        
        try:
            print("कम्पनीहरूको सूची प्राप्त गर्दै...")
            url = 'https://www.nepalstock.com/company'
            headers = {
                'User-Agent': self.get_random_user_agent()
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # कम्पनी टेबल फेला पार्ने
            table = soup.find('table', class_='table table-bordered table-striped table-hover')
            
            if not table:
                return self.stocks_list_cache['data'] if self.stocks_list_cache['data'] else []
            
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
                return self.stocks_list_cache['data'] if self.stocks_list_cache['data'] else []
            
            # क्यास अपडेट गर्ने
            self.stocks_list_cache = {
                'data': stocks,
                'last_updated': current_time
            }
            
            # क्यास फाइल सेभ गर्ने
            self.save_cache_files()
            
            print(f"{len(stocks)} कम्पनीहरू प्राप्त भए")
            return stocks
        
        except Exception as e:
            print(f"कम्पनीहरूको सूची प्राप्त गर्न समस्या: {str(e)}")
            return self.stocks_list_cache['data'] if self.stocks_list_cache['data'] else []
    
    def fetch_nepse_data(self, force_refresh=False):
        """NEPSE डाटा प्राप्त गर्ने"""
        current_time = time.time()
        
        # क्यास अवधि समाप्त नभएको छ र फोर्स रिफ्रेस छैन भने क्यास डाटा फर्काउने
        if not force_refresh and self.nepse_data_cache['data'] and current_time - self.nepse_data_cache['last_updated'] < CACHE_EXPIRY:
            return self.nepse_data_cache['data']
        
        try:
            print("NEPSE डाटा प्राप्त गर्दै...")
            url = 'https://www.nepalstock.com/todays_price'
            headers = {
                'User-Agent': self.get_random_user_agent()
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # टेबल फेला पार्ने
            table = soup.find('table', class_='table table-bordered table-striped table-hover')
            
            if not table:
                return self.nepse_data_cache['data'] if self.nepse_data_cache['data'] else []
            
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
                        print(f"रो प्रोसेसिङमा समस्या: {str(e)}")
                        continue
            
            # यदि कुनै डाटा फेला परेन भने पुरानो क्यास फर्काउने
            if not stock_data:
                return self.nepse_data_cache['data'] if self.nepse_data_cache['data'] else []
            
            # क्यास अपडेट गर्ने
            self.nepse_data_cache = {
                'data': stock_data,
                'last_updated': current_time
            }
            
            # क्यास फाइल सेभ गर्ने
            self.save_cache_files()
            
            print(f"{len(stock_data)} स्टक्सको डाटा प्राप्त भयो")
            return stock_data
        
        except Exception as e:
            print(f"NEPSE डाटा प्राप्त गर्न समस्या: {str(e)}")
            return self.nepse_data_cache['data'] if self.nepse_data_cache['data'] else []
    
    def get_market_status(self):
        """बजार स्थिति प्राप्त गर्ने"""
        try:
            url = 'https://www.nepalstock.com/'
            headers = {
                'User-Agent': self.get_random_user_agent()
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # बजार स्थिति फेला पार्ने
            market_status_div = soup.find('div', class_='market-status')
            
            if market_status_div:
                status_text = market_status_div.text.strip()
                is_open = 'Open' in status_text
                
                return {
                    'is_open': is_open,
                    'status_text': status_text
                }
            
            # यदि स्थिति फेला परेन भने is_market_open() फंक्सन प्रयोग गर्ने
            is_open = self.is_market_open()
            return {
                'is_open': is_open,
                'status_text': 'Market Open' if is_open else 'Market Closed'
            }
        
        except Exception as e:
            print(f"बजार स्थिति प्राप्त गर्न समस्या: {str(e)}")
            is_open = self.is_market_open()
            return {
                'is_open': is_open,
                'status_text': 'Market Open' if is_open else 'Market Closed'
            }
    
    def get_top_gainers(self, limit=10):
        """टप गेनर्स प्राप्त गर्ने"""
        stocks = self.fetch_nepse_data()
        
        # प्रतिशत परिवर्तनको आधारमा सर्ट गर्ने
        gainers = [stock for stock in stocks if float(stock['percent_change']) > 0]
        gainers.sort(key=lambda x: float(x['percent_change']), reverse=True)
        
        return gainers[:limit]
    
    def get_top_losers(self, limit=10):
        """टप लुजर्स प्राप्त गर्ने"""
        stocks = self.fetch_nepse_data()
        
        # प्रतिशत परिवर्तनको आधारमा सर्ट गर्ने
        losers = [stock for stock in stocks if float(stock['percent_change']) < 0]
        losers.sort(key=lambda x: float(x['percent_change']))
        
        return losers[:limit]
    
    def get_sectors(self):
        """सबै क्षेत्रहरू प्राप्त गर्ने"""
        stocks = self.fetch_all_stocks()
        
        # अद्वितीय क्षेत्रहरू प्राप्त गर्ने
        sectors = list(set(stock['sector'] for stock in stocks))
        sectors.sort()
        
        return sectors
    
    def save_to_csv(self, filename='nepse_data.csv'):
        """डाटालाई CSV फाइलमा सेभ गर्ने"""
        stocks = self.fetch_nepse_data()
        
        if not stocks:
            print("सेभ गर्न कुनै डाटा छैन")
            return False
        
        try:
            # CSV फाइल लेख्ने
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['symbol', 'ltp', 'change', 'percent_change', 'high', 'low', 'open', 'qty']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for stock in stocks:
                    writer.writerow(stock)
            
            print(f"डाटा सफलतापूर्वक {filename} मा सेभ गरियो")
            return True
        
        except Exception as e:
            print(f"CSV फाइल सेभ गर्न समस्या: {str(e)}")
            return False
    
    def get_stock_data_as_dataframe(self):
        """स्टक डाटालाई पान्डास डाटाफ्रेममा परिवर्तन गर्ने"""
        stocks = self.fetch_nepse_data()
        
        if not stocks:
            return pd.DataFrame()
        
        # डिक्शनरी लिस्टलाई डाटाफ्रेममा परिवर्तन गर्ने
        df = pd.DataFrame(stocks)
        
        # संख्यात्मक कलमहरू परिवर्तन गर्ने
        numeric_columns = ['ltp', 'change', 'percent_change', 'high', 'low', 'open', 'qty']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col].str.replace(',', ''), errors='coerce')
        
        return df

def main():
    """मुख्य फंक्सन"""
    scraper = NepseDataScraper()
    
    # बजार स्थिति प्राप्त गर्ने
    market_status = scraper.get_market_status()
    print(f"बजार स्थिति: {market_status['status_text']}")
    
    # सबै स्टक्स प्राप्त गर्ने
    stocks = scraper.fetch_nepse_data()
    print(f"कुल स्टक्स: {len(stocks)}")
    
    # टप गेनर्स र लुजर्स प्राप्त गर्ने
    top_gainers = scraper.get_top_gainers(5)
    top_losers = scraper.get_top_losers(5)
    
    print("\nटप 5 गेनर्स:")
    for i, stock in enumerate(top_gainers, 1):
        print(f"{i}. {stock['symbol']}: {stock['percent_change']}% (रु. {stock['ltp']})")
    
    print("\nटप 5 लुजर्स:")
    for i, stock in enumerate(top_losers, 1):
        print(f"{i}. {stock['symbol']}: {stock['percent_change']}% (रु. {stock['ltp']})")
    
    # CSV फाइलमा सेभ गर्ने
    scraper.save_to_csv()
    
    # पान्डास डाटाफ्रेम प्राप्त गर्ने
    df = scraper.get_stock_data_as_dataframe()
    print("\nडाटाफ्रेम आकार:", df.shape)

if __name__ == "__main__":
    main() 