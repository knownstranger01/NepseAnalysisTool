#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
NEPSE स्टक मार्केट डाटा स्क्र्यापर (Selenium संस्करण)

यो स्क्रिप्टले Selenium को प्रयोग गरेर नेपाल स्टक एक्सचेन्ज (NEPSE) वेबसाइटबाट 
डाइनामिक कन्टेन्ट स्क्र्याप गर्छ।
"""

import time
import json
import os
import csv
import pandas as pd
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# कन्फिगरेसन
CACHE_DIR = 'cache'
DATA_CACHE_FILE = os.path.join(CACHE_DIR, 'nepse_selenium_data_cache.json')
CACHE_EXPIRY = 15 * 60  # 15 मिनेट (सेकेन्डमा)

# क्यास डिरेक्टरी बनाउने
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

class NepseSeleniumScraper:
    """NEPSE डाटा स्क्र्यापिङ गर्ने Selenium क्लास"""
    
    def __init__(self, headless=True):
        """इनिसियलाइजर"""
        self.headless = headless
        self.driver = None
        self.nepse_data_cache = {'data': [], 'last_updated': 0}
        self.load_cache_files()
    
    def load_cache_files(self):
        """क्यास फाइलहरू लोड गर्ने"""
        if os.path.exists(DATA_CACHE_FILE):
            try:
                with open(DATA_CACHE_FILE, 'r') as f:
                    self.nepse_data_cache = json.load(f)
            except:
                self.nepse_data_cache = {'data': [], 'last_updated': 0}
    
    def save_cache_files(self):
        """क्यास फाइलहरू सेभ गर्ने"""
        with open(DATA_CACHE_FILE, 'w') as f:
            json.dump(self.nepse_data_cache, f)
    
    def initialize_driver(self):
        """Selenium वेब ड्राइभर इनिसियलाइज गर्ने"""
        if self.driver is not None:
            return
        
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-notifications")
            chrome_options.add_argument("--disable-popup-blocking")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-infobars")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.set_page_load_timeout(30)
            
            print("Selenium वेब ड्राइभर इनिसियलाइज भयो")
        
        except Exception as e:
            print(f"ड्राइभर इनिसियलाइज गर्न समस्या: {str(e)}")
            raise
    
    def close_driver(self):
        """Selenium वेब ड्राइभर बन्द गर्ने"""
        if self.driver is not None:
            self.driver.quit()
            self.driver = None
            print("Selenium वेब ड्राइभर बन्द भयो")
    
    def is_market_open(self):
        """बजार खुला छ कि छैन जाँच गर्ने"""
        now = datetime.now()
        
        # शनिबार वा आइतबार हो भने बजार बन्द हुन्छ
        if now.weekday() >= 5:  # 5 = शनिबार, 6 = आइतबार
            return False
        
        # समय जाँच (11:00 AM - 3:00 PM)
        current_hour = now.hour
        return 11 <= current_hour < 15
    
    def get_market_status(self):
        """बजार स्थिति प्राप्त गर्ने"""
        try:
            self.initialize_driver()
            
            self.driver.get('https://www.nepalstock.com/')
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, 'body'))
            )
            
            # बजार स्थिति फेला पार्ने प्रयास
            try:
                market_status_element = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, '.market-status'))
                )
                status_text = market_status_element.text.strip()
                is_open = 'Open' in status_text
            except (TimeoutException, NoSuchElementException):
                # यदि स्थिति फेला परेन भने is_market_open() फंक्सन प्रयोग गर्ने
                is_open = self.is_market_open()
                status_text = 'Market Open' if is_open else 'Market Closed'
            
            return {
                'is_open': is_open,
                'status_text': status_text
            }
        
        except Exception as e:
            print(f"बजार स्थिति प्राप्त गर्न समस्या: {str(e)}")
            is_open = self.is_market_open()
            return {
                'is_open': is_open,
                'status_text': 'Market Open' if is_open else 'Market Closed'
            }
    
    def fetch_nepse_data(self, force_refresh=False):
        """NEPSE डाटा प्राप्त गर्ने"""
        current_time = time.time()
        
        # क्यास अवधि समाप्त नभएको छ र फोर्स रिफ्रेस छैन भने क्यास डाटा फर्काउने
        if not force_refresh and self.nepse_data_cache['data'] and current_time - self.nepse_data_cache['last_updated'] < CACHE_EXPIRY:
            return self.nepse_data_cache['data']
        
        try:
            print("NEPSE डाटा प्राप्त गर्दै (Selenium)...")
            self.initialize_driver()
            
            self.driver.get('https://www.nepalstock.com/todays_price')
            
            # पेज लोड हुन पर्खने
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table'))
            )
            
            # पेजिनेसन हेन्डल गर्ने
            stock_data = []
            page_num = 1
            has_next_page = True
            
            while has_next_page:
                print(f"पेज {page_num} प्रोसेस गर्दै...")
                
                # टेबल फेला पार्ने
                table = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table'))
                )
                
                # रोहरू प्राप्त गर्ने
                rows = table.find_elements(By.TAG_NAME, 'tr')[1:]  # हेडर रो छोड्ने
                
                for row in rows:
                    try:
                        columns = row.find_elements(By.TAG_NAME, 'td')
                        if len(columns) >= 10:
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
                
                # अर्को पेज छ कि छैन जाँच गर्ने
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, 'a[aria-label="Next"]')
                    if 'disabled' in next_button.get_attribute('class'):
                        has_next_page = False
                    else:
                        next_button.click()
                        page_num += 1
                        # पेज लोड हुन पर्खने
                        time.sleep(2)
                        WebDriverWait(self.driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table'))
                        )
                except (TimeoutException, NoSuchElementException):
                    has_next_page = False
            
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
        
        finally:
            # ड्राइभर बन्द गर्ने
            self.close_driver()
    
    def get_stock_details(self, symbol):
        """स्टक विवरण प्राप्त गर्ने"""
        try:
            print(f"{symbol} को विवरण प्राप्त गर्दै...")
            self.initialize_driver()
            
            # स्टक विवरण पेज खोल्ने
            self.driver.get(f'https://www.nepalstock.com/company/{symbol}')
            
            # पेज लोड हुन पर्खने
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '.company-info'))
            )
            
            # कम्पनी जानकारी प्राप्त गर्ने
            company_info = {}
            
            try:
                company_name = self.driver.find_element(By.CSS_SELECTOR, '.company-info h2').text.strip()
                company_info['company_name'] = company_name
            except:
                company_info['company_name'] = symbol
            
            # विवरण टेबल प्राप्त गर्ने
            try:
                info_table = self.driver.find_element(By.CSS_SELECTOR, '.company-info table')
                rows = info_table.find_elements(By.TAG_NAME, 'tr')
                
                for row in rows:
                    try:
                        columns = row.find_elements(By.TAG_NAME, 'td')
                        if len(columns) >= 2:
                            key = columns[0].text.strip().lower().replace(' ', '_')
                            value = columns[1].text.strip()
                            company_info[key] = value
                    except:
                        continue
            except:
                pass
            
            # मूल्य चार्ट डाटा प्राप्त गर्ने
            try:
                # चार्ट लोड हुन पर्खने
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, 'price-chart'))
                )
                
                # JavaScript मार्फत चार्ट डाटा प्राप्त गर्ने
                chart_data = self.driver.execute_script(
                    "return document.getElementById('price-chart').chart.data"
                )
                
                if chart_data:
                    company_info['price_history'] = chart_data
            except:
                company_info['price_history'] = []
            
            return company_info
        
        except Exception as e:
            print(f"{symbol} को विवरण प्राप्त गर्न समस्या: {str(e)}")
            return {'symbol': symbol, 'error': str(e)}
        
        finally:
            # ड्राइभर बन्द गर्ने
            self.close_driver()
    
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
    
    def save_to_csv(self, filename='nepse_selenium_data.csv'):
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
    scraper = NepseSeleniumScraper(headless=True)
    
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
    
    # एउटा स्टकको विवरण प्राप्त गर्ने
    if stocks:
        symbol = stocks[0]['symbol']
        stock_details = scraper.get_stock_details(symbol)
        print(f"\n{symbol} को विवरण:")
        for key, value in stock_details.items():
            if key != 'price_history':
                print(f"{key}: {value}")

if __name__ == "__main__":
    main() 