#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
NEPSE स्टक मार्केट डाटा API

यो Flask API ले नेपाल स्टक एक्सचेन्ज (NEPSE) को लाइभ डाटा प्रदान गर्छ।
यसले nepse_scraper.py मोड्युल प्रयोग गरेर डाटा स्क्र्याप गर्छ।
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading
from nepse_scraper import NepseDataScraper

app = Flask(__name__)
CORS(app)  # सबै रुटहरूको लागि CORS सक्षम गर्ने

# ग्लोबल भेरिएबलहरू
scraper = NepseDataScraper()
last_background_update = 0
BACKGROUND_UPDATE_INTERVAL = 5 * 60  # 5 मिनेट (सेकेन्डमा)

# पृष्ठभूमिमा डाटा अपडेट गर्ने
def background_data_update():
    """पृष्ठभूमिमा डाटा अपडेट गर्ने"""
    global last_background_update
    
    while True:
        current_time = time.time()
        
        # अन्तिम अपडेटदेखि पर्याप्त समय बितेको छ भने अपडेट गर्ने
        if current_time - last_background_update >= BACKGROUND_UPDATE_INTERVAL:
            print("पृष्ठभूमिमा डाटा अपडेट गर्दै...")
            
            # बजार स्थिति जाँच गर्ने
            market_status = scraper.get_market_status()
            
            # बजार खुला छ भने मात्र डाटा अपडेट गर्ने
            if market_status['is_open']:
                scraper.fetch_nepse_data(force_refresh=True)
            
            last_background_update = current_time
        
        # 1 मिनेट पछि फेरि जाँच गर्ने
        time.sleep(60)

# API रुटहरू
@app.route('/api/nepse_data', methods=['GET'])
def get_nepse_data():
    """NEPSE डाटा प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # क्वेरी प्यारामिटरहरू प्राप्त गर्ने
        symbol = request.args.get('symbol')
        sector = request.args.get('sector')
        sort_by = request.args.get('sort_by', 'symbol')
        sort_order = request.args.get('sort_order', 'asc')
        limit = request.args.get('limit')
        offset = request.args.get('offset', 0)
        
        # डाटा प्राप्त गर्ने
        stocks = scraper.fetch_nepse_data()
        
        # सिम्बल अनुसार फिल्टर गर्ने
        if symbol:
            stocks = [stock for stock in stocks if stock['symbol'].lower() == symbol.lower()]
        
        # क्षेत्र अनुसार फिल्टर गर्ने
        if sector:
            # सबै स्टक्स प्राप्त गर्ने (क्षेत्र जानकारी सहित)
            all_stocks_with_sectors = scraper.fetch_all_stocks()
            
            # सिम्बल र क्षेत्रको म्याप बनाउने
            symbol_to_sector = {stock['symbol']: stock['sector'] for stock in all_stocks_with_sectors}
            
            # क्षेत्र अनुसार फिल्टर गर्ने
            stocks = [
                stock for stock in stocks 
                if stock['symbol'] in symbol_to_sector and symbol_to_sector[stock['symbol']].lower() == sector.lower()
            ]
        
        # सर्ट गर्ने
        if sort_by in ['symbol', 'ltp', 'change', 'percent_change', 'qty']:
            if sort_by == 'symbol':
                stocks.sort(key=lambda x: x[sort_by], reverse=(sort_order.lower() == 'desc'))
            else:
                # संख्यात्मक फिल्डहरू
                stocks.sort(
                    key=lambda x: float(x[sort_by].replace(',', '')) if isinstance(x[sort_by], str) else float(x[sort_by]), 
                    reverse=(sort_order.lower() == 'desc')
                )
        
        # पेजिनेसन
        if limit:
            limit = int(limit)
            offset = int(offset)
            stocks = stocks[offset:offset + limit]
        
        # बजार स्थिति प्राप्त गर्ने
        market_status = scraper.get_market_status()
        
        # अन्तिम अपडेट समय प्राप्त गर्ने
        last_updated = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(scraper.nepse_data_cache['last_updated']))
        
        return jsonify({
            'success': True,
            'data': stocks,
            'meta': {
                'count': len(stocks),
                'market_status': 'open' if market_status['is_open'] else 'closed',
                'last_updated': last_updated
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/market_overview', methods=['GET'])
def get_market_overview():
    """बजार अवलोकन डाटा प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # बजार स्थिति प्राप्त गर्ने
        market_status = scraper.get_market_status()
        
        # अन्तिम अपडेट समय प्राप्त गर्ने
        last_updated = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(scraper.nepse_data_cache['last_updated']))
        
        return jsonify({
            'success': True,
            'data': {
                'market_status': market_status['status_text'],
                'is_open': market_status['is_open'],
                'last_updated': last_updated
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stocks_list', methods=['GET'])
def get_stocks_list():
    """सबै स्टक्सको सूची प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # क्वेरी प्यारामिटरहरू प्राप्त गर्ने
        sector = request.args.get('sector')
        
        # सबै स्टक्स प्राप्त गर्ने
        stocks = scraper.fetch_all_stocks()
        
        # क्षेत्र अनुसार फिल्टर गर्ने
        if sector:
            stocks = [stock for stock in stocks if stock['sector'].lower() == sector.lower()]
        
        return jsonify({
            'success': True,
            'data': stocks,
            'meta': {
                'count': len(stocks),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(scraper.stocks_list_cache['last_updated']))
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/top_gainers', methods=['GET'])
def get_top_gainers():
    """टप गेनर्स प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # क्वेरी प्यारामिटरहरू प्राप्त गर्ने
        limit = request.args.get('limit', 10)
        
        # टप गेनर्स प्राप्त गर्ने
        gainers = scraper.get_top_gainers(int(limit))
        
        return jsonify({
            'success': True,
            'data': gainers,
            'meta': {
                'count': len(gainers),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(scraper.nepse_data_cache['last_updated']))
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/top_losers', methods=['GET'])
def get_top_losers():
    """टप लुजर्स प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # क्वेरी प्यारामिटरहरू प्राप्त गर्ने
        limit = request.args.get('limit', 10)
        
        # टप लुजर्स प्राप्त गर्ने
        losers = scraper.get_top_losers(int(limit))
        
        return jsonify({
            'success': True,
            'data': losers,
            'meta': {
                'count': len(losers),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(scraper.nepse_data_cache['last_updated']))
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sectors', methods=['GET'])
def get_sectors():
    """सबै क्षेत्रहरू प्राप्त गर्ने API एन्डपोइन्ट"""
    try:
        # सबै क्षेत्रहरू प्राप्त गर्ने
        sectors = scraper.get_sectors()
        
        return jsonify({
            'success': True,
            'data': sectors,
            'meta': {
                'count': len(sectors)
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    """मुख्य पृष्ठ"""
    return jsonify({
        'success': True,
        'message': 'NEPSE स्टक मार्केट डाटा API मा स्वागत छ!',
        'endpoints': [
            '/api/nepse_data',
            '/api/market_overview',
            '/api/stocks_list',
            '/api/top_gainers',
            '/api/top_losers',
            '/api/sectors'
        ]
    })

if __name__ == '__main__':
    # पृष्ठभूमि अपडेट थ्रेड सुरु गर्ने
    update_thread = threading.Thread(target=background_data_update)
    update_thread.daemon = True
    update_thread.start()
    
    # सर्भर सुरु गर्ने
    app.run(debug=True, host='0.0.0.0', port=5000) 