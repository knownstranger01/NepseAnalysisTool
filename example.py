#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
NEPSE स्टक मार्केट डाटा स्क्र्यापर उदाहरण

यो स्क्रिप्टले nepse_scraper.py मोड्युल प्रयोग गरेर NEPSE डाटा प्राप्त गर्छ र देखाउँछ।
"""

from nepse_scraper import NepseDataScraper
import pandas as pd
import matplotlib.pyplot as plt
import argparse
import sys

def display_market_status(scraper):
    """बजार स्थिति देखाउने"""
    market_status = scraper.get_market_status()
    print("\n" + "=" * 50)
    print(f"बजार स्थिति: {market_status['status_text']}")
    print("=" * 50)

def display_top_stocks(scraper, limit=5):
    """टप गेनर्स र लुजर्स देखाउने"""
    # टप गेनर्स प्राप्त गर्ने
    top_gainers = scraper.get_top_gainers(limit)
    
    print("\n" + "=" * 50)
    print(f"टप {limit} गेनर्स:")
    print("-" * 50)
    print(f"{'क्र.सं.':<5} {'सिम्बल':<10} {'मूल्य':<10} {'परिवर्तन %':<10}")
    print("-" * 50)
    
    for i, stock in enumerate(top_gainers, 1):
        print(f"{i:<5} {stock['symbol']:<10} रु. {stock['ltp']:<10} {stock['percent_change']}%")
    
    # टप लुजर्स प्राप्त गर्ने
    top_losers = scraper.get_top_losers(limit)
    
    print("\n" + "=" * 50)
    print(f"टप {limit} लुजर्स:")
    print("-" * 50)
    print(f"{'क्र.सं.':<5} {'सिम्बल':<10} {'मूल्य':<10} {'परिवर्तन %':<10}")
    print("-" * 50)
    
    for i, stock in enumerate(top_losers, 1):
        print(f"{i:<5} {stock['symbol']:<10} रु. {stock['ltp']:<10} {stock['percent_change']}%")

def display_stock_details(scraper, symbol):
    """स्टक विवरण देखाउने"""
    # सबै स्टक्स प्राप्त गर्ने
    stocks = scraper.fetch_nepse_data()
    
    # सिम्बल अनुसार फिल्टर गर्ने
    stock = next((s for s in stocks if s['symbol'].lower() == symbol.lower()), None)
    
    if not stock:
        print(f"\nसिम्बल '{symbol}' फेला परेन।")
        return
    
    print("\n" + "=" * 50)
    print(f"{symbol} को विवरण:")
    print("-" * 50)
    
    for key, value in stock.items():
        print(f"{key}: {value}")

def plot_top_gainers_losers(scraper, limit=5):
    """टप गेनर्स र लुजर्स प्लट गर्ने"""
    # टप गेनर्स र लुजर्स प्राप्त गर्ने
    top_gainers = scraper.get_top_gainers(limit)
    top_losers = scraper.get_top_losers(limit)
    
    # प्लटिङको लागि डाटा तयार गर्ने
    gainers_symbols = [stock['symbol'] for stock in top_gainers]
    gainers_changes = [float(stock['percent_change']) for stock in top_gainers]
    
    losers_symbols = [stock['symbol'] for stock in top_losers]
    losers_changes = [float(stock['percent_change']) for stock in top_losers]
    
    # प्लट बनाउने
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    
    # गेनर्स प्लट
    ax1.bar(gainers_symbols, gainers_changes, color='green')
    ax1.set_title('टप गेनर्स')
    ax1.set_xlabel('स्टक सिम्बल')
    ax1.set_ylabel('परिवर्तन %')
    ax1.tick_params(axis='x', rotation=45)
    
    # लुजर्स प्लट
    ax2.bar(losers_symbols, losers_changes, color='red')
    ax2.set_title('टप लुजर्स')
    ax2.set_xlabel('स्टक सिम्बल')
    ax2.set_ylabel('परिवर्तन %')
    ax2.tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig('top_gainers_losers.png')
    print("\nचित्र 'top_gainers_losers.png' मा सेभ गरियो।")

def export_to_csv(scraper, filename='nepse_data.csv'):
    """CSV फाइलमा निर्यात गर्ने"""
    if scraper.save_to_csv(filename):
        print(f"\nडाटा सफलतापूर्वक '{filename}' मा निर्यात गरियो।")

def export_to_excel(scraper, filename='nepse_data.xlsx'):
    """Excel फाइलमा निर्यात गर्ने"""
    try:
        # डाटाफ्रेम प्राप्त गर्ने
        df = scraper.get_stock_data_as_dataframe()
        
        if df.empty:
            print("\nनिर्यात गर्न कुनै डाटा छैन।")
            return
        
        # Excel फाइलमा सेभ गर्ने
        df.to_excel(filename, index=False)
        print(f"\nडाटा सफलतापूर्वक '{filename}' मा निर्यात गरियो।")
    
    except Exception as e:
        print(f"\nExcel फाइलमा निर्यात गर्न समस्या: {str(e)}")

def display_sectors(scraper):
    """सबै क्षेत्रहरू देखाउने"""
    sectors = scraper.get_sectors()
    
    print("\n" + "=" * 50)
    print(f"उपलब्ध क्षेत्रहरू ({len(sectors)}):")
    print("-" * 50)
    
    for i, sector in enumerate(sectors, 1):
        print(f"{i}. {sector}")

def main():
    """मुख्य फंक्सन"""
    parser = argparse.ArgumentParser(description='NEPSE स्टक मार्केट डाटा स्क्र्यापर')
    
    parser.add_argument('--market', action='store_true', help='बजार स्थिति देखाउने')
    parser.add_argument('--top', type=int, default=5, help='टप गेनर्स र लुजर्स देखाउने (डिफल्ट: 5)')
    parser.add_argument('--stock', type=str, help='स्टक विवरण देखाउने')
    parser.add_argument('--plot', action='store_true', help='टप गेनर्स र लुजर्स प्लट गर्ने')
    parser.add_argument('--csv', action='store_true', help='CSV फाइलमा निर्यात गर्ने')
    parser.add_argument('--excel', action='store_true', help='Excel फाइलमा निर्यात गर्ने')
    parser.add_argument('--sectors', action='store_true', help='सबै क्षेत्रहरू देखाउने')
    
    args = parser.parse_args()
    
    # स्क्र्यापर इन्स्टान्स बनाउने
    scraper = NepseDataScraper()
    
    # कुनै आर्गुमेन्ट छैन भने सबै देखाउने
    if len(sys.argv) == 1:
        display_market_status(scraper)
        display_top_stocks(scraper)
        export_to_csv(scraper)
        return
    
    # बजार स्थिति देखाउने
    if args.market:
        display_market_status(scraper)
    
    # टप गेनर्स र लुजर्स देखाउने
    if args.top:
        display_top_stocks(scraper, args.top)
    
    # स्टक विवरण देखाउने
    if args.stock:
        display_stock_details(scraper, args.stock)
    
    # टप गेनर्स र लुजर्स प्लट गर्ने
    if args.plot:
        plot_top_gainers_losers(scraper, args.top)
    
    # CSV फाइलमा निर्यात गर्ने
    if args.csv:
        export_to_csv(scraper)
    
    # Excel फाइलमा निर्यात गर्ने
    if args.excel:
        export_to_excel(scraper)
    
    # सबै क्षेत्रहरू देखाउने
    if args.sectors:
        display_sectors(scraper)

if __name__ == "__main__":
    main() 