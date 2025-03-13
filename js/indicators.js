/**
 * Technical Indicators module for NEPSE Stock Analyzer
 * Calculates various technical indicators for stock analysis
 */

const Indicators = (function() {
    /**
     * Calculate Simple Moving Average (SMA)
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for SMA calculation
     * @param {string} field - Price field to use (default: 'close')
     * @returns {Array} - Array of SMA values
     */
    function calculateSMA(data, period, field = 'close') {
        const result = [];
        
        // Not enough data
        if (data.length < period) {
            return result;
        }
        
        // Calculate SMA
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j][field];
            }
            result.push({
                date: data[i].date,
                value: sum / period
            });
        }
        
        return result;
    }
    
    /**
     * Calculate Exponential Moving Average (EMA)
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for EMA calculation
     * @param {string} field - Price field to use (default: 'close')
     * @returns {Array} - Array of EMA values
     */
    function calculateEMA(data, period, field = 'close') {
        const result = [];
        
        // Not enough data
        if (data.length < period) {
            return result;
        }
        
        // Calculate multiplier
        const multiplier = 2 / (period + 1);
        
        // Calculate first EMA (SMA)
        let ema = data.slice(0, period).reduce((sum, price) => sum + price[field], 0) / period;
        
        // Calculate EMA for each day
        for (let i = period - 1; i < data.length; i++) {
            ema = (data[i][field] - ema) * multiplier + ema;
            result.push({
                date: data[i].date,
                value: ema
            });
        }
        
        return result;
    }
    
    /**
     * Calculate Relative Strength Index (RSI)
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for RSI calculation (default: 14)
     * @returns {Array} - Array of RSI values
     */
    function calculateRSI(data, period = 14) {
        const result = [];
        
        // Not enough data
        if (data.length < period + 1) {
            return result;
        }
        
        // Calculate price changes
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i].close - data[i - 1].close);
        }
        
        // Calculate initial average gain and loss
        let avgGain = 0;
        let avgLoss = 0;
        
        for (let i = 0; i < period; i++) {
            if (changes[i] > 0) {
                avgGain += changes[i];
            } else {
                avgLoss += Math.abs(changes[i]);
            }
        }
        
        avgGain /= period;
        avgLoss /= period;
        
        // Calculate RSI for each day
        for (let i = period; i < changes.length; i++) {
            // Update average gain and loss
            avgGain = ((avgGain * (period - 1)) + (changes[i] > 0 ? changes[i] : 0)) / period;
            avgLoss = ((avgLoss * (period - 1)) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
            
            // Calculate RS and RSI
            const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
            const rsi = 100 - (100 / (1 + rs));
            
            result.push({
                date: data[i + 1].date,
                value: rsi
            });
        }
        
        return result;
    }
    
    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     * @param {Array} data - Array of price objects
     * @param {number} fastPeriod - Fast EMA period (default: 12)
     * @param {number} slowPeriod - Slow EMA period (default: 26)
     * @param {number} signalPeriod - Signal EMA period (default: 9)
     * @returns {Array} - Array of MACD values
     */
    function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        // Calculate fast and slow EMAs
        const fastEMA = calculateEMA(data, fastPeriod);
        const slowEMA = calculateEMA(data, slowPeriod);
        
        // Not enough data
        if (fastEMA.length === 0 || slowEMA.length === 0) {
            return [];
        }
        
        // Calculate MACD line
        const macdLine = [];
        let startIndex = slowEMA.length - fastEMA.length;
        
        for (let i = 0; i < fastEMA.length; i++) {
            if (i + startIndex >= 0) {
                macdLine.push({
                    date: fastEMA[i].date,
                    value: fastEMA[i].value - slowEMA[i + startIndex].value
                });
            }
        }
        
        // Calculate signal line (EMA of MACD line)
        const signalLine = [];
        
        // Not enough data for signal line
        if (macdLine.length < signalPeriod) {
            return [];
        }
        
        // Calculate first signal (SMA of MACD)
        let signal = macdLine.slice(0, signalPeriod).reduce((sum, macd) => sum + macd.value, 0) / signalPeriod;
        const multiplier = 2 / (signalPeriod + 1);
        
        // Calculate signal for each day
        for (let i = signalPeriod - 1; i < macdLine.length; i++) {
            signal = (macdLine[i].value - signal) * multiplier + signal;
            signalLine.push({
                date: macdLine[i].date,
                value: signal
            });
        }
        
        // Calculate histogram
        const histogram = [];
        startIndex = macdLine.length - signalLine.length;
        
        for (let i = 0; i < signalLine.length; i++) {
            histogram.push({
                date: signalLine[i].date,
                value: macdLine[i + startIndex].value - signalLine[i].value
            });
        }
        
        return {
            macdLine,
            signalLine,
            histogram
        };
    }
    
    /**
     * Calculate Bollinger Bands
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for SMA calculation (default: 20)
     * @param {number} multiplier - Standard deviation multiplier (default: 2)
     * @returns {Object} - Object with upper, middle, and lower bands
     */
    function calculateBollingerBands(data, period = 20, multiplier = 2) {
        // Calculate middle band (SMA)
        const middleBand = calculateSMA(data, period);
        
        // Not enough data
        if (middleBand.length === 0) {
            return {
                upperBand: [],
                middleBand: [],
                lowerBand: []
            };
        }
        
        // Calculate upper and lower bands
        const upperBand = [];
        const lowerBand = [];
        
        for (let i = 0; i < middleBand.length; i++) {
            const dataIndex = i + period - 1;
            
            // Calculate standard deviation
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += Math.pow(data[dataIndex - j].close - middleBand[i].value, 2);
            }
            const stdDev = Math.sqrt(sum / period);
            
            // Calculate bands
            upperBand.push({
                date: middleBand[i].date,
                value: middleBand[i].value + (multiplier * stdDev)
            });
            
            lowerBand.push({
                date: middleBand[i].date,
                value: middleBand[i].value - (multiplier * stdDev)
            });
        }
        
        return {
            upperBand,
            middleBand,
            lowerBand
        };
    }
    
    /**
     * Calculate Average True Range (ATR)
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for ATR calculation (default: 14)
     * @returns {Array} - Array of ATR values
     */
    function calculateATR(data, period = 14) {
        const result = [];
        
        // Not enough data
        if (data.length < period + 1) {
            return result;
        }
        
        // Calculate true range for each day
        const trueRanges = [];
        
        for (let i = 1; i < data.length; i++) {
            const high = data[i].high;
            const low = data[i].low;
            const prevClose = data[i - 1].close;
            
            const tr1 = high - low;
            const tr2 = Math.abs(high - prevClose);
            const tr3 = Math.abs(low - prevClose);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        // Calculate first ATR (SMA of true ranges)
        let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
        
        // Calculate ATR for each day
        for (let i = period; i < trueRanges.length; i++) {
            atr = ((atr * (period - 1)) + trueRanges[i]) / period;
            
            result.push({
                date: data[i + 1].date,
                value: atr
            });
        }
        
        return result;
    }
    
    /**
     * Calculate Stochastic Oscillator
     * @param {Array} data - Array of price objects
     * @param {number} period - Period for %K calculation (default: 14)
     * @param {number} smoothK - Smoothing for %K (default: 3)
     * @param {number} smoothD - Smoothing for %D (default: 3)
     * @returns {Object} - Object with %K and %D values
     */
    function calculateStochastic(data, period = 14, smoothK = 3, smoothD = 3) {
        // Not enough data
        if (data.length < period) {
            return {
                k: [],
                d: []
            };
        }
        
        // Calculate raw %K
        const rawK = [];
        
        for (let i = period - 1; i < data.length; i++) {
            // Find highest high and lowest low in the period
            let highestHigh = data[i].high;
            let lowestLow = data[i].low;
            
            for (let j = 1; j < period; j++) {
                highestHigh = Math.max(highestHigh, data[i - j].high);
                lowestLow = Math.min(lowestLow, data[i - j].low);
            }
            
            // Calculate %K
            const k = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
            
            rawK.push({
                date: data[i].date,
                value: k
            });
        }
        
        // Calculate smoothed %K
        const k = calculateSMA(rawK.map((item, index) => ({
            date: item.date,
            close: item.value
        })), smoothK, 'close');
        
        // Calculate %D (SMA of %K)
        const d = calculateSMA(k.map((item, index) => ({
            date: item.date,
            close: item.value
        })), smoothD, 'close');
        
        return {
            k,
            d
        };
    }
    
    /**
     * Generate trading signals based on technical indicators
     * @param {Array} data - Array of price objects
     * @returns {Object} - Object with trading signals and recommendations
     */
    function generateSignals(data) {
        // Not enough data
        if (data.length < 50) {
            return {
                recommendation: 'NEUTRAL',
                score: 50,
                signals: {}
            };
        }
        
        // Calculate indicators
        const sma20 = calculateSMA(data, 20);
        const sma50 = calculateSMA(data, 50);
        const sma200 = calculateSMA(data, 200);
        const rsi = calculateRSI(data);
        const macd = calculateMACD(data);
        const bb = calculateBollingerBands(data);
        
        // Get latest values
        const latestPrice = data[data.length - 1].close;
        const latestSMA20 = sma20.length > 0 ? sma20[sma20.length - 1].value : null;
        const latestSMA50 = sma50.length > 0 ? sma50[sma50.length - 1].value : null;
        const latestSMA200 = sma200.length > 0 ? sma200[sma200.length - 1].value : null;
        const latestRSI = rsi.length > 0 ? rsi[rsi.length - 1].value : null;
        const latestMACD = macd.histogram.length > 0 ? macd.histogram[macd.histogram.length - 1].value : null;
        const latestBB = {
            upper: bb.upperBand.length > 0 ? bb.upperBand[bb.upperBand.length - 1].value : null,
            middle: bb.middleBand.length > 0 ? bb.middleBand[bb.middleBand.length - 1].value : null,
            lower: bb.lowerBand.length > 0 ? bb.lowerBand[bb.lowerBand.length - 1].value : null
        };
        
        // Initialize signals
        const signals = {
            trend: null,
            rsi: null,
            macd: null,
            bollingerBands: null
        };
        
        // Trend signals
        if (latestSMA20 && latestSMA50 && latestSMA200) {
            if (latestPrice > latestSMA20 && latestPrice > latestSMA50 && latestPrice > latestSMA200) {
                signals.trend = 'STRONG_BULLISH';
            } else if (latestPrice > latestSMA20 && latestPrice > latestSMA50) {
                signals.trend = 'BULLISH';
            } else if (latestPrice < latestSMA20 && latestPrice < latestSMA50 && latestPrice < latestSMA200) {
                signals.trend = 'STRONG_BEARISH';
            } else if (latestPrice < latestSMA20 && latestPrice < latestSMA50) {
                signals.trend = 'BEARISH';
            } else {
                signals.trend = 'NEUTRAL';
            }
        }
        
        // RSI signals
        if (latestRSI !== null) {
            if (latestRSI > 70) {
                signals.rsi = 'OVERBOUGHT';
            } else if (latestRSI < 30) {
                signals.rsi = 'OVERSOLD';
            } else if (latestRSI > 50) {
                signals.rsi = 'BULLISH';
            } else {
                signals.rsi = 'BEARISH';
            }
        }
        
        // MACD signals
        if (latestMACD !== null) {
            if (latestMACD > 0 && macd.histogram.length > 1 && macd.histogram[macd.histogram.length - 2].value < 0) {
                signals.macd = 'BULLISH_CROSSOVER';
            } else if (latestMACD < 0 && macd.histogram.length > 1 && macd.histogram[macd.histogram.length - 2].value > 0) {
                signals.macd = 'BEARISH_CROSSOVER';
            } else if (latestMACD > 0) {
                signals.macd = 'BULLISH';
            } else {
                signals.macd = 'BEARISH';
            }
        }
        
        // Bollinger Bands signals
        if (latestBB.upper !== null && latestBB.lower !== null) {
            if (latestPrice > latestBB.upper) {
                signals.bollingerBands = 'OVERBOUGHT';
            } else if (latestPrice < latestBB.lower) {
                signals.bollingerBands = 'OVERSOLD';
            } else if (latestPrice > latestBB.middle) {
                signals.bollingerBands = 'BULLISH';
            } else {
                signals.bollingerBands = 'BEARISH';
            }
        }
        
        // Calculate recommendation score (0-100)
        let score = 50; // Start neutral
        
        // Adjust score based on signals
        if (signals.trend === 'STRONG_BULLISH') score += 15;
        else if (signals.trend === 'BULLISH') score += 10;
        else if (signals.trend === 'BEARISH') score -= 10;
        else if (signals.trend === 'STRONG_BEARISH') score -= 15;
        
        if (signals.rsi === 'OVERBOUGHT') score -= 10;
        else if (signals.rsi === 'OVERSOLD') score += 10;
        else if (signals.rsi === 'BULLISH') score += 5;
        else if (signals.rsi === 'BEARISH') score -= 5;
        
        if (signals.macd === 'BULLISH_CROSSOVER') score += 15;
        else if (signals.macd === 'BEARISH_CROSSOVER') score -= 15;
        else if (signals.macd === 'BULLISH') score += 5;
        else if (signals.macd === 'BEARISH') score -= 5;
        
        if (signals.bollingerBands === 'OVERBOUGHT') score -= 10;
        else if (signals.bollingerBands === 'OVERSOLD') score += 10;
        else if (signals.bollingerBands === 'BULLISH') score += 5;
        else if (signals.bollingerBands === 'BEARISH') score -= 5;
        
        // Ensure score is within 0-100 range
        score = Math.max(0, Math.min(100, score));
        
        // Determine recommendation
        let recommendation;
        if (score >= 80) recommendation = 'STRONG_BUY';
        else if (score >= 60) recommendation = 'BUY';
        else if (score <= 20) recommendation = 'STRONG_SELL';
        else if (score <= 40) recommendation = 'SELL';
        else recommendation = 'NEUTRAL';
        
        return {
            recommendation,
            score,
            signals
        };
    }
    
    /**
     * Calculate all indicators for a stock
     * @param {Array} data - Array of price objects
     * @returns {Object} - Object with all indicators
     */
    function calculateAll(data) {
        return {
            sma: {
                sma20: calculateSMA(data, 20),
                sma50: calculateSMA(data, 50),
                sma200: calculateSMA(data, 200)
            },
            ema: {
                ema9: calculateEMA(data, 9),
                ema21: calculateEMA(data, 21)
            },
            rsi: calculateRSI(data),
            macd: calculateMACD(data),
            bollingerBands: calculateBollingerBands(data),
            atr: calculateATR(data),
            stochastic: calculateStochastic(data),
            signals: generateSignals(data)
        };
    }
    
    /**
     * Get the latest values of all indicators
     * @param {Array} data - Array of price objects
     * @returns {Object} - Object with latest indicator values
     */
    function getLatestValues(data) {
        const indicators = calculateAll(data);
        
        return {
            price: data.length > 0 ? data[data.length - 1] : null,
            sma: {
                sma20: indicators.sma.sma20.length > 0 ? indicators.sma.sma20[indicators.sma.sma20.length - 1].value : null,
                sma50: indicators.sma.sma50.length > 0 ? indicators.sma.sma50[indicators.sma.sma50.length - 1].value : null,
                sma200: indicators.sma.sma200.length > 0 ? indicators.sma.sma200[indicators.sma.sma200.length - 1].value : null
            },
            ema: {
                ema9: indicators.ema.ema9.length > 0 ? indicators.ema.ema9[indicators.ema.ema9.length - 1].value : null,
                ema21: indicators.ema.ema21.length > 0 ? indicators.ema.ema21[indicators.ema.ema21.length - 1].value : null
            },
            rsi: indicators.rsi.length > 0 ? indicators.rsi[indicators.rsi.length - 1].value : null,
            macd: {
                line: indicators.macd.macdLine.length > 0 ? indicators.macd.macdLine[indicators.macd.macdLine.length - 1].value : null,
                signal: indicators.macd.signalLine.length > 0 ? indicators.macd.signalLine[indicators.macd.signalLine.length - 1].value : null,
                histogram: indicators.macd.histogram.length > 0 ? indicators.macd.histogram[indicators.macd.histogram.length - 1].value : null
            },
            bollingerBands: {
                upper: indicators.bollingerBands.upperBand.length > 0 ? indicators.bollingerBands.upperBand[indicators.bollingerBands.upperBand.length - 1].value : null,
                middle: indicators.bollingerBands.middleBand.length > 0 ? indicators.bollingerBands.middleBand[indicators.bollingerBands.middleBand.length - 1].value : null,
                lower: indicators.bollingerBands.lowerBand.length > 0 ? indicators.bollingerBands.lowerBand[indicators.bollingerBands.lowerBand.length - 1].value : null
            },
            atr: indicators.atr.length > 0 ? indicators.atr[indicators.atr.length - 1].value : null,
            stochastic: {
                k: indicators.stochastic.k.length > 0 ? indicators.stochastic.k[indicators.stochastic.k.length - 1].value : null,
                d: indicators.stochastic.d.length > 0 ? indicators.stochastic.d[indicators.stochastic.d.length - 1].value : null
            },
            signals: indicators.signals
        };
    }
    
    /**
     * Get interpretation of an indicator value
     * @param {string} indicator - Indicator name
     * @param {number} value - Indicator value
     * @returns {string} - Interpretation
     */
    function getInterpretation(indicator, value) {
        switch (indicator) {
            case 'rsi':
                if (value > 70) return 'Overbought';
                if (value < 30) return 'Oversold';
                if (value > 50) return 'Bullish';
                return 'Bearish';
                
            case 'macd':
                if (value > 0) return 'Bullish';
                return 'Bearish';
                
            case 'stochastic':
                if (value > 80) return 'Overbought';
                if (value < 20) return 'Oversold';
                if (value > 50) return 'Bullish';
                return 'Bearish';
                
            default:
                return 'Neutral';
        }
    }
    
    // Public API
    return {
        calculateSMA,
        calculateEMA,
        calculateRSI,
        calculateMACD,
        calculateBollingerBands,
        calculateATR,
        calculateStochastic,
        generateSignals,
        calculateAll,
        getLatestValues,
        getInterpretation
    };
})(); 