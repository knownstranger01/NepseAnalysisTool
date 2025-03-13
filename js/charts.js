/**
 * Charts module for NEPSE Stock Analyzer
 * Handles rendering of stock charts and technical indicators
 */

const Charts = (function() {
    // Chart instances
    let priceChart = null;
    let rsiChart = null;
    let macdChart = null;
    
    // Chart colors
    const colors = {
        candle: {
            up: 'rgba(0, 150, 136, 0.8)',
            down: 'rgba(255, 82, 82, 0.8)',
            wick: 'rgba(90, 90, 90, 0.8)'
        },
        volume: {
            up: 'rgba(0, 150, 136, 0.5)',
            down: 'rgba(255, 82, 82, 0.5)'
        },
        sma: {
            20: 'rgba(255, 152, 0, 1)',
            50: 'rgba(66, 165, 245, 1)',
            200: 'rgba(156, 39, 176, 1)'
        },
        ema: {
            9: 'rgba(255, 193, 7, 1)',
            21: 'rgba(3, 169, 244, 1)'
        },
        bb: {
            upper: 'rgba(233, 30, 99, 0.7)',
            middle: 'rgba(156, 39, 176, 0.7)',
            lower: 'rgba(233, 30, 99, 0.7)'
        },
        rsi: {
            line: 'rgba(33, 150, 243, 1)',
            overbought: 'rgba(255, 82, 82, 0.2)',
            oversold: 'rgba(0, 150, 136, 0.2)',
            overboughtLine: 'rgba(255, 82, 82, 0.5)',
            oversoldLine: 'rgba(0, 150, 136, 0.5)'
        },
        macd: {
            line: 'rgba(33, 150, 243, 1)',
            signal: 'rgba(255, 152, 0, 1)',
            histogram: {
                positive: 'rgba(0, 150, 136, 0.5)',
                negative: 'rgba(255, 82, 82, 0.5)'
            }
        }
    };
    
    /**
     * Initialize charts
     */
    function init() {
        // Clean up existing charts
        if (priceChart) priceChart.remove();
        if (rsiChart) rsiChart.remove();
        if (macdChart) macdChart.remove();
        
        // Price chart will be initialized when data is available
        priceChart = null;
        rsiChart = null;
        macdChart = null;
    }
    
    /**
     * Create a price chart using TradingView Lightweight Charts
     * @param {string} containerId - ID of the container element
     * @param {Array} data - Array of price objects
     * @param {Object} options - Chart options
     */
    function createPriceChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create chart
        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: 400,
            layout: {
                backgroundColor: 'transparent',
                textColor: getComputedStyle(document.documentElement).getPropertyValue('--text'),
                fontFamily: 'Segoe UI, sans-serif'
            },
            grid: {
                vertLines: {
                    color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
                },
                horzLines: {
                    color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
                }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal
            },
            rightPriceScale: {
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border')
            },
            timeScale: {
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border'),
                timeVisible: true
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            chart.applyOptions({
                width: container.clientWidth
            });
        });
        
        // Format data for chart
        const chartData = data.map(item => ({
            time: new Date(item.date).getTime() / 1000,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
        }));
        
        // Create series based on chart type
        let mainSeries;
        if (options.type === 'line') {
            mainSeries = chart.addLineSeries({
                color: colors.sma[50],
                lineWidth: 2,
                priceLineVisible: false
            });
            
            mainSeries.setData(chartData.map(item => ({
                time: item.time,
                value: item.close
            })));
        } else {
            // Default to candlestick
            mainSeries = chart.addCandlestickSeries({
                upColor: colors.candle.up,
                downColor: colors.candle.down,
                borderUpColor: colors.candle.up,
                borderDownColor: colors.candle.down,
                wickUpColor: colors.candle.up,
                wickDownColor: colors.candle.down
            });
            
            mainSeries.setData(chartData);
        }
        
        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: colors.volume.up,
            priceFormat: {
                type: 'volume'
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0
            }
        });
        
        volumeSeries.setData(data.map((item, index) => ({
            time: new Date(item.date).getTime() / 1000,
            value: item.volume,
            color: item.close >= item.open ? colors.volume.up : colors.volume.down
        })));
        
        // Add indicators if requested
        if (options.indicators) {
            if (options.indicators.sma) {
                // Add SMA indicators
                if (options.indicators.sma.includes(20)) {
                    const sma20 = Indicators.calculateSMA(data, 20);
                    if (sma20.length > 0) {
                        const sma20Series = chart.addLineSeries({
                            color: colors.sma[20],
                            lineWidth: 1,
                            priceLineVisible: false
                        });
                        
                        sma20Series.setData(sma20.map(item => ({
                            time: new Date(item.date).getTime() / 1000,
                            value: item.value
                        })));
                    }
                }
                
                if (options.indicators.sma.includes(50)) {
                    const sma50 = Indicators.calculateSMA(data, 50);
                    if (sma50.length > 0) {
                        const sma50Series = chart.addLineSeries({
                            color: colors.sma[50],
                            lineWidth: 1,
                            priceLineVisible: false
                        });
                        
                        sma50Series.setData(sma50.map(item => ({
                            time: new Date(item.date).getTime() / 1000,
                            value: item.value
                        })));
                    }
                }
                
                if (options.indicators.sma.includes(200)) {
                    const sma200 = Indicators.calculateSMA(data, 200);
                    if (sma200.length > 0) {
                        const sma200Series = chart.addLineSeries({
                            color: colors.sma[200],
                            lineWidth: 1,
                            priceLineVisible: false
                        });
                        
                        sma200Series.setData(sma200.map(item => ({
                            time: new Date(item.date).getTime() / 1000,
                            value: item.value
                        })));
                    }
                }
            }
            
            if (options.indicators.ema) {
                // Add EMA indicators
                if (options.indicators.ema.includes(9)) {
                    const ema9 = Indicators.calculateEMA(data, 9);
                    if (ema9.length > 0) {
                        const ema9Series = chart.addLineSeries({
                            color: colors.ema[9],
                            lineWidth: 1,
                            priceLineVisible: false
                        });
                        
                        ema9Series.setData(ema9.map(item => ({
                            time: new Date(item.date).getTime() / 1000,
                            value: item.value
                        })));
                    }
                }
                
                if (options.indicators.ema.includes(21)) {
                    const ema21 = Indicators.calculateEMA(data, 21);
                    if (ema21.length > 0) {
                        const ema21Series = chart.addLineSeries({
                            color: colors.ema[21],
                            lineWidth: 1,
                            priceLineVisible: false
                        });
                        
                        ema21Series.setData(ema21.map(item => ({
                            time: new Date(item.date).getTime() / 1000,
                            value: item.value
                        })));
                    }
                }
            }
            
            if (options.indicators.bb) {
                // Add Bollinger Bands
                const bb = Indicators.calculateBollingerBands(data);
                
                if (bb.upperBand.length > 0) {
                    const upperBandSeries = chart.addLineSeries({
                        color: colors.bb.upper,
                        lineWidth: 1,
                        priceLineVisible: false,
                        lineStyle: LightweightCharts.LineStyle.Dashed
                    });
                    
                    upperBandSeries.setData(bb.upperBand.map(item => ({
                        time: new Date(item.date).getTime() / 1000,
                        value: item.value
                    })));
                }
                
                if (bb.middleBand.length > 0) {
                    const middleBandSeries = chart.addLineSeries({
                        color: colors.bb.middle,
                        lineWidth: 1,
                        priceLineVisible: false
                    });
                    
                    middleBandSeries.setData(bb.middleBand.map(item => ({
                        time: new Date(item.date).getTime() / 1000,
                        value: item.value
                    })));
                }
                
                if (bb.lowerBand.length > 0) {
                    const lowerBandSeries = chart.addLineSeries({
                        color: colors.bb.lower,
                        lineWidth: 1,
                        priceLineVisible: false,
                        lineStyle: LightweightCharts.LineStyle.Dashed
                    });
                    
                    lowerBandSeries.setData(bb.lowerBand.map(item => ({
                        time: new Date(item.date).getTime() / 1000,
                        value: item.value
                    })));
                }
            }
        }
        
        // Fit content
        chart.timeScale().fitContent();
        
        // Store chart instance
        priceChart = chart;
        
        return chart;
    }
    
    /**
     * Create an RSI chart using Chart.js
     * @param {string} containerId - ID of the container element
     * @param {Array} data - Array of price objects
     */
    function createRSIChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Calculate RSI
        const rsi = Indicators.calculateRSI(data);
        if (rsi.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough data to calculate RSI</div>';
            return;
        }
        
        // Format data for chart
        const chartData = rsi.map(item => ({
            x: new Date(item.date),
            y: item.value
        }));
        
        // Create canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'RSI (14)',
                    data: chartData,
                    borderColor: colors.rsi.line,
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
                        },
                        ticks: {
                            stepSize: 25
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            overbought: {
                                type: 'box',
                                yMin: 70,
                                yMax: 100,
                                backgroundColor: colors.rsi.overbought,
                                borderWidth: 0
                            },
                            oversold: {
                                type: 'box',
                                yMin: 0,
                                yMax: 30,
                                backgroundColor: colors.rsi.oversold,
                                borderWidth: 0
                            },
                            overboughtLine: {
                                type: 'line',
                                yMin: 70,
                                yMax: 70,
                                borderColor: colors.rsi.overboughtLine,
                                borderWidth: 1,
                                borderDash: [5, 5]
                            },
                            oversoldLine: {
                                type: 'line',
                                yMin: 30,
                                yMax: 30,
                                borderColor: colors.rsi.oversoldLine,
                                borderWidth: 1,
                                borderDash: [5, 5]
                            }
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `RSI: ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Store chart instance
        rsiChart = chart;
        
        return chart;
    }
    
    /**
     * Create a MACD chart using Chart.js
     * @param {string} containerId - ID of the container element
     * @param {Array} data - Array of price objects
     */
    function createMACDChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Calculate MACD
        const macd = Indicators.calculateMACD(data);
        if (!macd.macdLine || macd.macdLine.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough data to calculate MACD</div>';
            return;
        }
        
        // Format data for chart
        const macdData = macd.macdLine.map(item => ({
            x: new Date(item.date),
            y: item.value
        }));
        
        const signalData = macd.signalLine.map(item => ({
            x: new Date(item.date),
            y: item.value
        }));
        
        const histogramData = macd.histogram.map(item => ({
            x: new Date(item.date),
            y: item.value,
            color: item.value >= 0 ? colors.macd.histogram.positive : colors.macd.histogram.negative
        }));
        
        // Create canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        
        // Create chart
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                datasets: [
                    {
                        label: 'Histogram',
                        data: histogramData,
                        backgroundColor: function(context) {
                            const value = context.dataset.data[context.dataIndex];
                            return value ? value.color : colors.macd.histogram.positive;
                        },
                        barPercentage: 0.8,
                        categoryPercentage: 1.0,
                        order: 3
                    },
                    {
                        label: 'MACD',
                        data: macdData,
                        borderColor: colors.macd.line,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        type: 'line',
                        fill: false,
                        order: 1
                    },
                    {
                        label: 'Signal',
                        data: signalData,
                        borderColor: colors.macd.signal,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        type: 'line',
                        fill: false,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid')
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y.toFixed(2);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Store chart instance
        macdChart = chart;
        
        return chart;
    }
    
    /**
     * Filter data by date range
     * @param {Array} data - Array of price objects
     * @param {string} period - Period to filter by (1M, 3M, 6M, 1Y, MAX)
     * @returns {Array} - Filtered data
     */
    function filterDataByPeriod(data, period) {
        if (!data || data.length === 0) return [];
        if (period === 'MAX') return data;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '1M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1Y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
        
        return data.filter(item => new Date(item.date) >= startDate);
    }
    
    /**
     * Update charts with new data
     * @param {Array} data - Array of price objects
     * @param {Object} options - Chart options
     */
    function updateCharts(data, options = {}) {
        // Filter data by period
        const filteredData = filterDataByPeriod(data, options.period || '1M');
        
        // Update price chart
        createPriceChart('price-chart', filteredData, {
            type: options.chartType || 'candle',
            indicators: {
                sma: options.showSMA ? [20, 50, 200] : [],
                ema: options.showEMA ? [9, 21] : [],
                bb: options.showBB
            }
        });
        
        // Update RSI chart
        createRSIChart('rsi-chart', filteredData);
        
        // Update MACD chart
        createMACDChart('macd-chart', filteredData);
    }
    
    // Public API
    return {
        init,
        createPriceChart,
        createRSIChart,
        createMACDChart,
        filterDataByPeriod,
        updateCharts
    };
})(); 