/**
 * OPTIMIZED Price Prefetch - CDN-Based Version
 * Works with BetterESTech Ultra Cache (Price-Stripped)
 * Uses GitHub CDN for exchange rates + base prices (NO AJAX to admin-ajax.php)
 * 
 * Flow:
 * 1. Fetch exchange-rates.json from CDN (ALL 160+ currencies, 12-hour cache)
 * 2. Fetch product-prices-usd.json from CDN (base USD prices)
 * 3. Client-side conversion: price × rate
 * 4. Apply to page instantly
 * 
 * Performance: 1.5-2 seconds (vs 7-10 seconds with AJAX)
 */
(function($) {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════
    
    var CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/price-cache';
    var CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
    var PRICES_STRIPPED = window.BETTERESTECH_PRICES_NEED_LOAD || false;
    
    var isFetching = false;
    var fetchQueue = [];

   // ═══════════════════════════════════════════════════════
// ✅ UPDATED: getCurrentCurrency (simplified)
// ═══════════════════════════════════════════════════════

function getCurrentCurrency() {
    var cookieMatch = document.cookie.match(/user_currency=([A-Z]{3})/);
    var currency = 'USD';
    
    if (cookieMatch) {
        currency = cookieMatch[1];
    } else if (typeof pricePrefetch !== 'undefined' && pricePrefetch.user_currency) {
        currency = pricePrefetch.user_currency;
    }
    
    return currency;
}
// ✅ NEW: Clear conversion markers when currency changes
function clearConversionMarkers() {
    $('[data-converted]').each(function() {
        $(this).removeAttr('data-converted');
    });
}

// ✅ Call this when currency changes (e.g., via dropdown)
$(document).on('currency_changed', function() {
    clearConversionMarkers();
    setTimeout(applyPrices, 100);
});


    
    function setCurrencyCookie(currency) {
        var expires = new Date(Date.now() + 30*24*60*60*1000).toUTCString();
        document.cookie = 'user_currency=' + currency + '; expires=' + expires + '; path=/';
    }

    // ═══════════════════════════════════════════════════════
    // CACHE MANAGEMENT (localStorage)
    // ═══════════════════════════════════════════════════════
    
    function getCacheKey(type) {
        return 'betterestech_' + type;
    }
    
    function getCachedData(type) {
        try {
            var cached = localStorage.getItem(getCacheKey(type));
            if (!cached) return null;
            
            var parsed = JSON.parse(cached);
            if (!parsed.timestamp) {
                localStorage.removeItem(getCacheKey(type));
                return null;
            }
            
            var age = Date.now() - parsed.timestamp;
            if (age > CACHE_DURATION) {
                localStorage.removeItem(getCacheKey(type));
                return null;
            }
            
            return parsed;
        } catch (e) {
            localStorage.removeItem(getCacheKey(type));
            return null;
        }
    }
    
    function setCachedData(type, data) {
        try {
            data.timestamp = Date.now();
            localStorage.setItem(getCacheKey(type), JSON.stringify(data));
        } catch (e) {
            localStorage.clear();
        }
    }

    // ═══════════════════════════════════════════════════════
    // CDN FETCHER (Exchange Rates + Base Prices)
    // ═══════════════════════════════════════════════════════
    
    function fetchFromCDN(callback) {
        if (isFetching) {
            fetchQueue.push(callback);
            return;
        }
        
        isFetching = true;
        
        var exchangeRatesUrl = CDN_BASE_URL + '/exchange-rates.json';
        var basePricesUrl = CDN_BASE_URL + '/product-prices-usd.json';
        
        // Check cache first
        var cachedRates = getCachedData('exchange_rates');
        var cachedPrices = getCachedData('base_prices');
        
        if (cachedRates && cachedPrices) {
            isFetching = false;
            processQueue({
                rates: cachedRates.rates,
                symbols: cachedRates.symbols,
                prices: cachedPrices.prices
            });
            if (callback) callback(true);
            return;
        }
        
        // Fetch both files in parallel
        $.when(
            $.ajax({
                url: exchangeRatesUrl,
                type: 'GET',
                dataType: 'json',
                cache: true,
                timeout: 3000
            }),
            $.ajax({
                url: basePricesUrl,
                type: 'GET',
                dataType: 'json',
                cache: true,
                timeout: 3000
            })
        ).done(function(ratesResponse, pricesResponse) {
            isFetching = false;
            
            var ratesData = ratesResponse[0];
            var pricesData = pricesResponse[0];
            
            if (ratesData && ratesData.rates && pricesData && pricesData.prices) {
                // Cache the data
                setCachedData('exchange_rates', {
                    rates: ratesData.rates,
                    symbols: ratesData.symbols
                });
                
                setCachedData('base_prices', {
                    prices: pricesData.prices
                });
                
                processQueue({
                    rates: ratesData.rates,
                    symbols: ratesData.symbols,
                    prices: pricesData.prices
                });
                
                if (callback) callback(true);
            } else {
                fallbackToAjax(callback);
            }
        }).fail(function(xhr1, status1, xhr2, status2) {
            isFetching = false;
            fallbackToAjax(callback);
        });
    }
    
    function processQueue(data) {
        while (fetchQueue.length > 0) {
            var cb = fetchQueue.shift();
            if (cb) cb(true);
        }
    }
    
    // ═══════════════════════════════════════════════════════
    // FALLBACK: Original AJAX Method (if CDN fails)
    // ═══════════════════════════════════════════════════════
    
    function fallbackToAjax(callback) {
        if (typeof pricePrefetch === 'undefined') {
            if (callback) callback(false);
            return;
        }
        
        var currency = getCurrentCurrency();
        
        $.ajax({
            url: pricePrefetch.ajax_url,
            type: 'POST',
            data: {
                action: 'prefetch_all_prices',
                security: pricePrefetch.nonce,
                currency: currency
            },
            success: function(response) {
                if (response.success && response.data && response.data.prices) {
                    // Store in fallback format
                    setCachedData('fallback_prices_' + currency, {
                        prices: response.data.prices,
                        symbol: response.data.symbol,
                        rate: response.data.rate
                    });
                    
                    if (callback) callback(true);
                } else {
                    if (callback) callback(false);
                }
            },
            error: function() {
                if (callback) callback(false);
            },
            timeout: 8000
        });
    }

    // ═══════════════════════════════════════════════════════
    // CLIENT-SIDE PRICE CONVERSION
    // ═══════════════════════════════════════════════════════
    
    function convertPrice(usdPrice, targetCurrency, rates) {
        if (targetCurrency === 'USD') {
            return Math.round(usdPrice);
        }
        
        var rate = rates[targetCurrency];
        if (!rate || rate <= 0) {
            rate = 1;
        }
        
        return Math.round(usdPrice * rate);
    }

    // ═══════════════════════════════════════════════════════
    // PRICE APPLICATION TO PAGE
    // ═══════════════════════════════════════════════════════
    
   function applyPrices() {
    var currency = getCurrentCurrency();
    var cachedRates = getCachedData('exchange_rates');
    var cachedPrices = getCachedData('base_prices');
    
    // Check for fallback data
    if (!cachedRates || !cachedPrices) {
        var fallbackData = getCachedData('fallback_prices_' + currency);
        if (fallbackData) {
            applyFallbackPrices(fallbackData.prices, fallbackData.symbol);
            return;
        }
        return;
    }
    
    var rates = cachedRates.rates;
    var symbols = cachedRates.symbols;
    var basePrices = cachedPrices.prices;
    var targetSymbol = symbols[currency] || '$';
    
    var applied = 0;
    
    $('[data-price-placeholder]:not([data-converted]), .wc-price-prefetch:not([data-converted])').each(function() {
        var $elem = $(this);
        
        // ✅ FIX 1: Check DOM attribute consistently (not data cache)
        var alreadyConverted = $elem.attr('data-converted');
        if (alreadyConverted === currency) {
            return; // Skip - already converted to this currency
        }
        
        // ✅ FIX 2: Check if element already has price elements (from previous conversion)
        if ($elem.find('.woocommerce-Price-amount').length > 0) {
            // Already has price elements - mark as converted and skip
            $elem.attr('data-converted', currency);
            return;
        }
        
        var productId = findProductId($elem);
        
        if (!productId || !basePrices[productId]) {
            return;
        }
        
        var priceData = basePrices[productId];
        var regularPrice = convertPrice(priceData.regular, currency, rates);
        var salePrice = priceData.sale ? convertPrice(priceData.sale, currency, rates) : 0;
        
        var priceHTML = '';
        
        if (salePrice > 0 && salePrice < regularPrice) {
            priceHTML = '<del aria-hidden="true"><span class="woocommerce-Price-amount amount">' +
                '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + regularPrice +
                '</span></del> ' +
                '<ins><span class="woocommerce-Price-amount amount">' +
                '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + salePrice +
                '</span></ins>';
        } else {
            priceHTML = '<span class="woocommerce-Price-amount amount">' +
                '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + regularPrice +
                '</span>';
        }
        
        // ✅ FIX 3: Remove ALL existing price-related children before adding new ones
        $elem.find('.woocommerce-Price-amount, .woocommerce-Price-currencySymbol, del, ins').remove();
        
        // ✅ FIX 4: Clear element completely and set new HTML
        $elem.empty().html(priceHTML);
        $elem.removeClass('loading-price wc-price-loading');
        $elem.removeAttr('data-price-placeholder');
        $elem.css('visibility', 'visible');
        
        // ✅ FIX 5: Use attr() consistently (not data())
        $elem.attr('data-converted', currency);
        applied++;
    });
}

    
    function applyFallbackPrices(prices, symbol) {
        var currency = getCurrentCurrency();
        
        $('[data-price-placeholder], .wc-price-prefetch').each(function() {
            var $elem = $(this);
            var productId = findProductId($elem);
            
            if (productId && prices[productId]) {
                var priceData = prices[productId];
                var regularPrice = parseFloat(priceData.regular || 0);
                var salePrice = parseFloat(priceData.sale || 0);
                
                var priceHTML = '';
                
                if (salePrice > 0 && salePrice < regularPrice) {
                    priceHTML = '<del><span class="woocommerce-Price-amount amount">' +
                        '<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + regularPrice +
                        '</span></del> ' +
                        '<ins><span class="woocommerce-Price-amount amount">' +
                        '<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + salePrice +
                        '</span></ins>';
                } else {
                    priceHTML = '<span class="woocommerce-Price-amount amount">' +
                        '<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + regularPrice +
                        '</span>';
                }
                
                $elem.empty().html(priceHTML);
                $elem.removeAttr('data-price-placeholder');
                $elem.css('visibility', 'visible');
                $elem.data('converted', currency);
            }
        });
    }
    
    // Helper: Find product ID from element context
    function findProductId($elem) {
        var productId = null;
        
        // Method 1: Direct data attribute
        productId = $elem.data('product-id') || $elem.data('product_id');
        if (productId) return productId;
        
        // Method 2: Single product page (from body class)
        if ($('body').hasClass('single-product')) {
            var bodyClasses = $('body').attr('class');
            var bodyMatch = bodyClasses.match(/postid-(\d+)/);
            if (bodyMatch) {
                var isMainProduct = $elem.closest('.product, .summary, .entry-summary').length > 0;
                var isRelated = $elem.closest('.related, .upsells').length > 0;
                
                if (isMainProduct && !isRelated) {
                    return parseInt(bodyMatch[1]);
                }
            }
        }
        
        // Method 3: Closest product container
        var $product = $elem.closest('[data-product_id]');
        if ($product.length > 0) {
            return $product.data('product_id');
        }
        
        // Method 4: Product loop item
        $product = $elem.closest('.product, li.product');
        if ($product.length > 0) {
            var classes = $product.attr('class') || '';
            var match = classes.match(/post-(\d+)|product-(\d+)/);
            if (match) {
                return parseInt(match[1] || match[2]);
            }
        }
        
        return null;
    }

    // ═══════════════════════════════════════════════════════
    // CART & CHECKOUT CONVERSION
    // ═══════════════════════════════════════════════════════
    
   // ===== SIDE CART CONVERSION =====
function convertCartPrices() {
    
    var currency = getCurrentCurrency();      
    return;
}

// ===== FUNNELKIT CHECKOUT CONVERSION (from working backup) =====
$(document).ready(function() {
    // Only run on WFACP checkout pages
    if ($('body').hasClass('wfacp_main_wrapper') || 
        $('.wfacp-form').length > 0 || 
        $('.wfacp_main_form').length > 0 ||
        $('.wfacp_order_summary').length > 0) {
        
        var convertAllCheckoutPrices = function() {
            // ✅ 1. HIDE prices immediately (prevents USD flash)
            $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                'visibility': 'hidden',
                'opacity': '0'
            });
            
            var cachedRates = getCachedData('exchange_rates');
            if (!cachedRates) {
                $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                    'visibility': 'visible',
                    'opacity': '1'
                });
                return;
            }
            
            var currency = getCurrentCurrency();
            var rate = cachedRates.rates[currency];
            var symbol = cachedRates.symbols[currency];
            
            if (currency === 'USD' || !rate) {
                $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                    'visibility': 'visible',
                    'opacity': '1'
                });
                return;
            }
            
            // ✅ 2. EXPANDED SELECTORS (includes mobile summary)
            var priceSelectors = [
                '.wfacp_order_summary_item_total .woocommerce-Price-amount',
                'td.product-total .woocommerce-Price-amount',
                '.cart-subtotal .woocommerce-Price-amount',
                '.order-total .woocommerce-Price-amount',
                '.wfacp_order_summary .woocommerce-Price-amount',
                'table.shop_table .woocommerce-Price-amount',
                '.wfacp_show_price_wrap .woocommerce-Price-amount', // ✅ Mobile summary!
                '.wfacp_mb_cart_accordian .woocommerce-Price-amount' // ✅ Mobile accordion!
            ].join(', ');
            
            var converted = 0;
            
$(priceSelectors).each(function() {
    var $elem = $(this);
    
    // Skip if already converted
    if ($elem.attr('data-fk-converted') === currency) {
        return;
    }
    
    // Skip product names
    if ($elem.closest('.product-name, .wfacp_order_summary_item_name').length > 0) {
        return;
    }
    
    // Get price from <bdi> or direct text
    var priceText = '';
    var $bdi = $elem.find('bdi').first();
    
    if ($bdi.length > 0) {
        priceText = $bdi.text();
    } else {
        priceText = $elem.text();
    }
    
    // ✅ FIX 1: Get full element text to check symbol
    var elemText = $elem.text().trim();
    
    // ✅ FIX 2: Check if already in target currency
    var currentSymbol = elemText.match(/^([^\d\s,]+)/); // Get symbol at start
    if (currentSymbol && currentSymbol[1] === symbol) {
        // Already showing correct symbol - skip conversion
        $elem.attr('data-fk-converted', currency);
        return;
    }
    
    // ✅ FIX 3: If not USD, skip conversion (backend already converted)
    if (currency !== 'USD' && elemText.indexOf('$') === -1) {
        // Not USD and doesn't have $ symbol - already converted by backend
        $elem.attr('data-fk-converted', currency);
        return;
    }
    
    // ✅ FIX 4: Check for multi-character dollar symbols (S$, C$, A$)
    var hasMultiLetterDollar = /[SCAHKNZTMX]\$/.test(elemText);
    if (hasMultiLetterDollar) {
        // Has multi-char dollar - skip (backend handles it)
        $elem.attr('data-fk-converted', currency);
        return;
    }
    
    // Extract numeric value
    priceText = priceText.replace(/[^\d.]/g, '');
    var priceValue = parseFloat(priceText);
    
    if (isNaN(priceValue) || priceValue === 0) {
        return;
    }
    
    // Only convert if we're sure it's USD
    if (currency === 'USD' || elemText.indexOf('$') === 0 || elemText.match(/^\$[\d,]/)) {
        var convertedPrice = Math.round(priceValue * rate);
        var newHTML = '<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + convertedPrice;
        
        if ($bdi.length > 0) {
            $bdi.html(newHTML);
        } else {
            $elem.html(newHTML);
        }
        
        $elem.attr('data-fk-converted', currency);
        converted++;
    } else {
        // Mark as already converted (backend did it)
        $elem.attr('data-fk-converted', currency);
    }
});

// ✅ FIXED: Convert "Place Order" button (with multi-char symbol protection)
var $placeOrderBtn = $('#place_order, button[name="woocommerce_checkout_place_order"]');
if ($placeOrderBtn.length > 0 && $placeOrderBtn.attr('data-btn-converted') !== currency) {
    var btnText = $placeOrderBtn.text();
    
    // ✅ FIX: Detect multi-character dollar symbols (S$, A$, C$, etc.)
    var multiCharSymbols = ['S$', 'C$', 'A$', 'HK$', 'NZ$', 'NT$', 'TT$', 'J$'];
    var hasMultiCharSymbol = false;
    
    for (var i = 0; i < multiCharSymbols.length; i++) {
        if (btnText.indexOf(multiCharSymbols[i]) !== -1) {
            hasMultiCharSymbol = true;
            break;
        }
    }
    
    // ✅ FIX: If button has multi-char symbol, backend already converted - skip
    if (hasMultiCharSymbol) {
        $placeOrderBtn.attr('data-btn-converted', currency);
    } else if (btnText.indexOf(symbol) !== -1 && currency !== 'USD') {
        // ✅ FIX: If button already shows target symbol, skip conversion
        $placeOrderBtn.attr('data-btn-converted', currency);
    } else {
        // ✅ Only convert if button shows plain USD ($)
        var priceMatch = btnText.match(/\$(\d+(?:\.\d+)?)/);
        
        if (priceMatch && currency !== 'USD') {
            var btnPrice = parseFloat(priceMatch[1]);
            var convertedBtnPrice = Math.round(btnPrice * rate);
            var newBtnText = btnText.replace(/\$\d+(?:\.\d+)?/, symbol + convertedBtnPrice);
            
            $placeOrderBtn.text(newBtnText);
            $placeOrderBtn.val(newBtnText).attr('data-value', newBtnText);
            $placeOrderBtn.attr('data-btn-converted', currency);
            converted++;
        } else {
            // USD button - mark as converted
            $placeOrderBtn.attr('data-btn-converted', currency);
        }
    }
}

            
            // ✅ Show prices after conversion
            $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                'visibility': 'visible',
                'opacity': '1',
                'transition': 'opacity 0.2s ease'
            });
            
            if (converted > 0) {
            }
        };
        
        // Run conversions
        setTimeout(convertAllCheckoutPrices, 200);
        setTimeout(convertAllCheckoutPrices, 800);
        
        // ✅ 3. MUTATION OBSERVER (auto-converts when DOM updates)
        if (window.MutationObserver) {
            var checkoutObserver = new MutationObserver(function(mutations) {
                var shouldConvert = false;
                
                mutations.forEach(function(mutation) {
                    $(mutation.target).find('.woocommerce-Price-amount, #place_order').each(function() {
                        if (!$(this).attr('data-fk-converted') && !$(this).attr('data-btn-converted')) {
                            shouldConvert = true;
                        }
                    });
                });
                
                if (shouldConvert) {
                    setTimeout(convertAllCheckoutPrices, 250);
                }
            });
            
            var $checkoutContainer = $('.wfacp_order_summary, #order_review, .woocommerce-checkout');
            $checkoutContainer.each(function() {
                checkoutObserver.observe(this, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            });
        }
        
        // Trigger on WooCommerce events
        $(document.body).on('updated_checkout wfacp_order_review_update payment_method_selected', function() {
            setTimeout(convertAllCheckoutPrices, 400);
        });
    }
});


    // ═══════════════════════════════════════════════════════
    // MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════
// ✅ NEW: FAST CLIENT-SIDE IP DETECTION
// ═══════════════════════════════════════════════════════

function detectCurrencyFromIP(callback) {
    // Check if already detected this session
    var sessionCurrency = sessionStorage.getItem('user_currency');
    if (sessionCurrency) {
        setCurrencyCookie(sessionCurrency);
        callback(sessionCurrency);
        return;
    }
    
    // Fast IP detection API (responds in 200-500ms)
    $.ajax({
        url: 'https://ipapi.co/json/',
        type: 'GET',
        dataType: 'json',
        timeout: 2000, // 2 second timeout
        success: function(data) {
            if (data && data.country_code) {
                var currency = mapCountryToCurrency(data.country_code);            
                setCurrencyCookie(currency);
                sessionStorage.setItem('user_currency', currency);
                callback(currency);
            } else {
                callback('USD');
            }
        },
        error: function() {
            callback('USD');
        }
    });
}
function mapCountryToCurrency(countryCode) {
    var countryMap = {
        // ===== MAJOR ECONOMIES =====
        'IN': 'INR',  // India
        'US': 'USD',  // United States
        'GB': 'GBP',  // United Kingdom
        'CA': 'CAD',  // Canada
        'AU': 'AUD',  // Australia
        'JP': 'JPY',  // Japan
        'SG': 'SGD',  // Singapore
        'TH': 'THB',  // Thailand
        
        // ===== EUROPE - EUROZONE (28 countries/territories) =====
        'DE': 'EUR',  // Germany
        'FR': 'EUR',  // France
        'IT': 'EUR',  // Italy
        'ES': 'EUR',  // Spain
        'NL': 'EUR',  // Netherlands
        'BE': 'EUR',  // Belgium
        'AT': 'EUR',  // Austria
        'PT': 'EUR',  // Portugal
        'GR': 'EUR',  // Greece
        'IE': 'EUR',  // Ireland
        'FI': 'EUR',  // Finland
        'LU': 'EUR',  // Luxembourg
        'MT': 'EUR',  // Malta
        'CY': 'EUR',  // Cyprus
        'SI': 'EUR',  // Slovenia
        'SK': 'EUR',  // Slovakia
        'EE': 'EUR',  // Estonia
        'LV': 'EUR',  // Latvia
        'LT': 'EUR',  // Lithuania
        'AD': 'EUR',  // Andorra
        'MC': 'EUR',  // Monaco
        'SM': 'EUR',  // San Marino
        'VA': 'EUR',  // Vatican City
        'ME': 'EUR',  // Montenegro
        'XK': 'EUR',  // Kosovo
        'GF': 'EUR',  // French Guiana
        'MQ': 'EUR',  // Martinique
        'GP': 'EUR',  // Guadeloupe
        
        // ===== EUROPE - NON-EUROZONE =====
        'CH': 'CHF',  // Switzerland
        'LI': 'CHF',  // Liechtenstein
        'NO': 'NOK',  // Norway
        'SE': 'SEK',  // Sweden
        'DK': 'DKK',  // Denmark
        'FO': 'DKK',  // Faroe Islands
        'GL': 'DKK',  // Greenland
        'PL': 'PLN',  // Poland
        'CZ': 'CZK',  // Czech Republic
        'HU': 'HUF',  // Hungary
        'RO': 'RON',  // Romania
        'BG': 'BGN',  // Bulgaria
        'HR': 'HRK',  // Croatia
        'RU': 'RUB',  // Russia
        'UA': 'UAH',  // Ukraine
        'TR': 'TRY',  // Turkey
        'IS': 'ISK',  // Iceland
        'RS': 'RSD',  // Serbia
        'BA': 'BAM',  // Bosnia & Herzegovina
        'MK': 'MKD',  // North Macedonia
        'AL': 'ALL',  // Albania
        'BY': 'BYN',  // Belarus
        'MD': 'MDL',  // Moldova
        'GI': 'GIP',  // Gibraltar
        'IM': 'GBP',  // Isle of Man
        'JE': 'GBP',  // Jersey
        'GG': 'GBP',  // Guernsey
        
        // ===== ASIA PACIFIC =====
        'CN': 'CNY',  // China
        'KR': 'KRW',  // South Korea
        'TW': 'TWD',  // Taiwan
        'HK': 'HKD',  // Hong Kong
        'MO': 'MOP',  // Macau
        'MY': 'MYR',  // Malaysia
        'ID': 'IDR',  // Indonesia
        'PH': 'PHP',  // Philippines
        'VN': 'VND',  // Vietnam
        'NZ': 'NZD',  // New Zealand
        'CK': 'NZD',  // Cook Islands
        'NU': 'NZD',  // Niue
        'PK': 'PKR',  // Pakistan
        'BD': 'BDT',  // Bangladesh
        'LK': 'LKR',  // Sri Lanka
        'NP': 'NPR',  // Nepal
        'MM': 'MMK',  // Myanmar
        'KH': 'KHR',  // Cambodia
        'LA': 'LAK',  // Laos
        'BT': 'BTN',  // Bhutan
        'MV': 'MVR',  // Maldives
        'AF': 'AFN',  // Afghanistan
        'MN': 'MNT',  // Mongolia
        'KP': 'KPW',  // North Korea
        'BN': 'BND',  // Brunei
        'TL': 'USD',  // East Timor
        
        // ===== CENTRAL ASIA =====
        'KZ': 'KZT',  // Kazakhstan
        'UZ': 'UZS',  // Uzbekistan
        'AZ': 'AZN',  // Azerbaijan
        'GE': 'GEL',  // Georgia
        'AM': 'AMD',  // Armenia
        'KG': 'KGS',  // Kyrgyzstan
        'TJ': 'TJS',  // Tajikistan
        'TM': 'TMT',  // Turkmenistan
        
        // ===== MIDDLE EAST =====
        'SA': 'SAR',  // Saudi Arabia
        'AE': 'AED',  // UAE
        'QA': 'QAR',  // Qatar
        'KW': 'KWD',  // Kuwait
        'BH': 'BHD',  // Bahrain
        'OM': 'OMR',  // Oman
        'IL': 'ILS',  // Israel
        'PS': 'ILS',  // Palestine
        'JO': 'JOD',  // Jordan
        'LB': 'LBP',  // Lebanon
        'IR': 'IRR',  // Iran
        'IQ': 'IQD',  // Iraq
        'SY': 'SYP',  // Syria
        'YE': 'YER',  // Yemen
        
        // ===== AFRICA - NORTH =====
        'EG': 'EGP',  // Egypt
        'MA': 'MAD',  // Morocco
        'TN': 'TND',  // Tunisia
        'DZ': 'DZD',  // Algeria
        'LY': 'LYD',  // Libya
        'SD': 'SDG',  // Sudan
        'SS': 'SSP',  // South Sudan
        
        // ===== AFRICA - WEST (CFA Franc BCEAO - XOF) =====
        'SN': 'XOF',  // Senegal
        'CI': 'XOF',  // Ivory Coast
        'BF': 'XOF',  // Burkina Faso
        'ML': 'XOF',  // Mali
        'NE': 'XOF',  // Niger
        'TG': 'XOF',  // Togo
        'BJ': 'XOF',  // Benin
        'GW': 'XOF',  // Guinea-Bissau
        
        // ===== AFRICA - CENTRAL (CFA Franc BEAC - XAF) =====
        'CM': 'XAF',  // Cameroon
        'TD': 'XAF',  // Chad
        'CF': 'XAF',  // Central African Republic
        'GQ': 'XAF',  // Equatorial Guinea
        'GA': 'XAF',  // Gabon
        'CG': 'XAF',  // Republic of Congo
        
        // ===== AFRICA - OTHER =====
        'ZA': 'ZAR',  // South Africa
        'NA': 'NAD',  // Namibia
        'LS': 'LSL',  // Lesotho
        'SZ': 'SZL',  // Eswatini (Swaziland)
        'BW': 'BWP',  // Botswana
        'NG': 'NGN',  // Nigeria
        'KE': 'KES',  // Kenya
        'GH': 'GHS',  // Ghana
        'ET': 'ETB',  // Ethiopia
        'UG': 'UGX',  // Uganda
        'TZ': 'TZS',  // Tanzania
        'AO': 'AOA',  // Angola
        'ZW': 'ZWL',  // Zimbabwe
        'ZM': 'ZMW',  // Zambia
        'MZ': 'MZN',  // Mozambique
        'MG': 'MGA',  // Madagascar
        'GN': 'GNF',  // Guinea
        'RW': 'RWF',  // Rwanda
        'BI': 'BIF',  // Burundi
        'SL': 'SLL',  // Sierra Leone
        'LR': 'LRD',  // Liberia
        'MR': 'MRU',  // Mauritania
        'ER': 'ERN',  // Eritrea
        'GM': 'GMD',  // Gambia
        'CD': 'CDF',  // DR Congo
        'DJ': 'DJF',  // Djibouti
        'SO': 'SOS',  // Somalia
        'MW': 'MWK',  // Malawi
        'SC': 'SCR',  // Seychelles
        'MU': 'MUR',  // Mauritius
        'KM': 'KMF',  // Comoros
        'CV': 'CVE',  // Cape Verde
        'ST': 'STN',  // Sao Tome & Principe
        
        // ===== AMERICAS - NORTH =====
        'MX': 'MXN',  // Mexico
        
        // ===== AMERICAS - CENTRAL =====
        'CR': 'CRC',  // Costa Rica
        'GT': 'GTQ',  // Guatemala
        'PA': 'PAB',  // Panama
        'NI': 'NIO',  // Nicaragua
        'HN': 'HNL',  // Honduras
        'SV': 'USD',  // El Salvador
        'BZ': 'BZD',  // Belize
        
        // ===== AMERICAS - SOUTH =====
        'BR': 'BRL',  // Brazil
        'AR': 'ARS',  // Argentina
        'CL': 'CLP',  // Chile
        'CO': 'COP',  // Colombia
        'PE': 'PEN',  // Peru
        'VE': 'VES',  // Venezuela
        'EC': 'USD',  // Ecuador
        'UY': 'UYU',  // Uruguay
        'PY': 'PYG',  // Paraguay
        'BO': 'BOB',  // Bolivia
        'GY': 'GYD',  // Guyana
        'SR': 'SRD',  // Suriname
        
        // ===== CARIBBEAN =====
        'DO': 'DOP',  // Dominican Republic
        'HT': 'HTG',  // Haiti
        'JM': 'JMD',  // Jamaica
        'CU': 'CUP',  // Cuba
        'BS': 'BSD',  // Bahamas
        'BB': 'BBD',  // Barbados
        'TT': 'TTD',  // Trinidad & Tobago
        'PR': 'USD',  // Puerto Rico
        'VI': 'USD',  // US Virgin Islands
        'VG': 'USD',  // British Virgin Islands
        
        // ===== CARIBBEAN - EASTERN CARIBBEAN DOLLAR (XCD) =====
        'AG': 'XCD',  // Antigua & Barbuda
        'LC': 'XCD',  // Saint Lucia
        'GD': 'XCD',  // Grenada
        'VC': 'XCD',  // St. Vincent & Grenadines
        'DM': 'XCD',  // Dominica
        'KN': 'XCD',  // St. Kitts & Nevis
        
        // ===== CARIBBEAN - OTHER =====
        'AW': 'AWG',  // Aruba
        'CW': 'ANG',  // Curaçao
        'SX': 'ANG',  // Sint Maarten
        'KY': 'KYD',  // Cayman Islands
        'BM': 'BMD',  // Bermuda
        'FK': 'FKP',  // Falkland Islands
        'SH': 'SHP',  // Saint Helena
        
        // ===== OCEANIA - PACIFIC ISLANDS =====
        'FJ': 'FJD',  // Fiji
        'PG': 'PGK',  // Papua New Guinea
        'SB': 'SBD',  // Solomon Islands
        'VU': 'VUV',  // Vanuatu
        'WS': 'WST',  // Samoa
        'TO': 'TOP',  // Tonga
        
        // ===== OCEANIA - CFP FRANC (XPF) =====
        'NC': 'XPF',  // New Caledonia
        'PF': 'XPF',  // French Polynesia
        
        // ===== OCEANIA - USD TERRITORIES =====
        'AS': 'USD',  // American Samoa
        'GU': 'USD',  // Guam
        'MP': 'USD',  // Northern Mariana Islands
        'PW': 'USD',  // Palau
        'MH': 'USD',  // Marshall Islands
        'FM': 'USD',  // Micronesia
        
        // ===== OCEANIA - AUD TERRITORIES =====
        'KI': 'AUD',  // Kiribati
        'TV': 'AUD',  // Tuvalu
        'NR': 'AUD'   // Nauru
    };
    
    return countryMap[countryCode] || 'USD';
}
    
// ═══════════════════════════════════════════════════════
// ✅ UPDATED: FAST PRICE LOADING
// ═══════════════════════════════════════════════════════

function loadPrices() {
    $('[data-price-placeholder]').css('visibility', 'hidden');
    
    // Check if cookie exists
    var cookieMatch = document.cookie.match(/user_currency=([A-Z]{3})/);
    
    if (!cookieMatch) {
        // ✅ No cookie = first visit → Detect from IP (fast!)
        
        detectCurrencyFromIP(function(detectedCurrency) {
            // Now load and apply prices with detected currency
            loadAndApplyPrices();
        });
    } else {
        // ✅ Cookie exists → Load immediately
        loadAndApplyPrices();
    }
}
function loadAndApplyPrices() {
    var cachedRates = getCachedData('exchange_rates');
    var cachedPrices = getCachedData('base_prices');
    
    if (cachedRates && cachedPrices) {
        applyPrices();
        return;
    }
    
    fetchFromCDN(function(success) {
        if (success) {
            applyPrices();
        } else {
            $('[data-price-placeholder]').css('visibility', 'visible');
        }
    });
}

    
    $(document).ready(function() {
        loadPrices();
        
        // Cart fragments refresh
$(document.body).on('wc_fragments_refreshed updated_cart_totals updated_checkout fkcart_fragment_refreshed', function() {
    // ✅ FIX: Only convert cart/checkout prices, NOT shop page prices
    if ($('.woocommerce-cart, .woocommerce-checkout, .fkcart-modal').length > 0) {
        setTimeout(convertCartPrices, 100);
    }
    // Do NOT call applyPrices() here - it re-converts shop page
});
        setTimeout(convertCartPrices, 500);
        
        // Infinite scroll support
        $(document).on('yith_infs_added_elem', function() {
            setTimeout(applyPrices, 100);
        });
        
        // MutationObserver for dynamic content
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                var shouldConvert = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        $(mutation.addedNodes).each(function() {
                            if ($(this).find('[data-price-placeholder]').length > 0 ||
                                $(this).hasClass('fkcart-app') ||
                                $(this).find('.woocommerce-mini-cart').length > 0) {
                                shouldConvert = true;
                            }
                        });
                    }
                });
                
                if (shouldConvert) {
                    setTimeout(function() {
                        applyPrices();
                        convertCartPrices();
                    }, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });

})(jQuery);
