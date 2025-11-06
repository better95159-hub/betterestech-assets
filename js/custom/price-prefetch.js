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
    // CURRENCY DETECTION
    // ═══════════════════════════════════════════════════════
    
    function getCurrentCurrency() {
        // Priority 1: Cookie
        var cookieMatch = document.cookie.match(/user_currency=([A-Z]{3})/);
        if (cookieMatch) {
            return cookieMatch[1];
        }
        
        // Priority 2: PHP localized variable
        if (typeof pricePrefetch !== 'undefined' && pricePrefetch.user_currency) {
            var phpCurrency = pricePrefetch.user_currency;
            setCurrencyCookie(phpCurrency);
            return phpCurrency;
        }
        
        // Priority 3: Detect from existing price symbols
        var firstPrice = $('.woocommerce-Price-amount:not([data-price-placeholder]), .price').first().text();
        if (firstPrice) {
            if (firstPrice.indexOf('₹') !== -1) return 'INR';
            if (firstPrice.indexOf('€') !== -1) return 'EUR';
            if (firstPrice.indexOf('£') !== -1) return 'GBP';
            if (firstPrice.indexOf('C$') !== -1) return 'CAD';
            if (firstPrice.indexOf('A$') !== -1) return 'AUD';
        }
        
        // Default
        return 'USD';
    }
    
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
            console.warn('⚠️ localStorage full, clearing old cache');
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
                console.error('❌ Invalid CDN data structure');
                fallbackToAjax(callback);
            }
        }).fail(function(xhr1, status1, xhr2, status2) {
            isFetching = false;
            console.warn('⚠️ CDN fetch failed, trying AJAX fallback...');
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
            console.error('❌ Price prefetch configuration missing');
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
                console.error('❌ AJAX fallback also failed');
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
            console.warn('⚠️ Invalid rate for ' + targetCurrency + ', using 1');
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
            console.warn('⚠️ No cached data available');
            return;
        }
        
        var rates = cachedRates.rates;
        var symbols = cachedRates.symbols;
        var basePrices = cachedPrices.prices;
        var targetSymbol = symbols[currency] || '$';
        
        var applied = 0;
        
        $('[data-price-placeholder], .wc-price-prefetch, .price, .woocommerce-Price-amount').each(function() {
            var $elem = $(this);
            
            // Skip if already converted
            if ($elem.data('converted') === currency) {
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
            
            $elem.empty().html(priceHTML);
            $elem.removeClass('loading-price wc-price-loading');
            $elem.removeAttr('data-price-placeholder');
            $elem.css('visibility', 'visible');
            $elem.data('converted', currency);
            applied++;
        });
        
        console.log('✅ Applied ' + applied + ' prices in ' + currency);
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
    
    function convertCartPrices() {
        var currency = getCurrentCurrency();
        var cachedRates = getCachedData('exchange_rates');
        
        if (!cachedRates || currency === 'USD') {
            return;
        }
        
        var rate = cachedRates.rates[currency];
        var symbol = cachedRates.symbols[currency];
        
        if (!rate || rate <= 0) {
            return;
        }
        
        var priceSelectors = [
            '.wfacp_order_summary_item_total .woocommerce-Price-amount',
            'td.product-total .woocommerce-Price-amount',
            '.fkcart-item-price .woocommerce-Price-amount',
            '.fkcart-totals .woocommerce-Price-amount',
            '.cart_totals .woocommerce-Price-amount',
            '.order-total .woocommerce-Price-amount',
            '.woocommerce-mini-cart__total .woocommerce-Price-amount'
        ].join(', ');
        
        $(priceSelectors).each(function() {
            var $elem = $(this);
            
            if ($elem.data('cart-converted') === currency) {
                return;
            }
            
            // Skip product titles
            if ($elem.closest('.product-name, .fkcart-item-title').length > 0) {
                return;
            }
            
            var priceText = $elem.text().replace(/[^\d.]/g, '');
            var priceValue = parseFloat(priceText);
            
            if (isNaN(priceValue) || priceValue === 0) {
                return;
            }
            
            // Only convert USD prices
            if ($elem.text().indexOf('$') === -1) {
                return;
            }
            
            var convertedPrice = Math.round(priceValue * rate);
            var newHTML = '<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + convertedPrice;
            
            $elem.empty().html(newHTML);
            $elem.data('cart-converted', currency);
        });
        
        // Convert "Place Order" button
        var $placeOrderBtn = $('#place_order, button[name="woocommerce_checkout_place_order"]');
        if ($placeOrderBtn.length > 0 && $placeOrderBtn.data('btn-converted') !== currency) {
            var btnText = $placeOrderBtn.text();
            var priceMatch = btnText.match(/\$(\d+(?:\.\d+)?)/);
            
            if (priceMatch) {
                var btnPrice = parseFloat(priceMatch[1]);
                var convertedBtnPrice = Math.round(btnPrice * rate);
                var newBtnText = btnText.replace(/\$\d+(?:\.\d+)?/, symbol + convertedBtnPrice);
                $placeOrderBtn.text(newBtnText);
                $placeOrderBtn.data('btn-converted', currency);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════
    
       function loadPrices() {
        // ✅ Hide ALL prices immediately
        $('[data-price-placeholder], .price, .woocommerce-Price-amount').css({
            'visibility': 'hidden',
            'min-height': '20px'
        });
        
        var currency = getCurrentCurrency();
        console.log('🌍 Detected currency: ' + currency);
        
        var cachedRates = getCachedData('exchange_rates');
        var cachedPrices = getCachedData('base_prices');
        
        if (cachedRates && cachedPrices) {
            console.log('✅ Using cached data');
            applyPrices();
            return;
        }
        
        console.log('🔄 Fetching from CDN');
        
        fetchFromCDN(function(success) {
            if (success) {
                applyPrices();
            } else {
                console.error('❌ Failed to load prices');
                $('[data-price-placeholder]').css('visibility', 'visible').text('...');
            }
        });
    }

    
     $(document).ready(function() {
        // ✅ Check if cached page
        var servedFromCache = window.BETTERESTECH_PRICES_NEED_LOAD || false;
        
        if (servedFromCache) {
            console.log('📦 Page from cache - hiding prices');
        }
        
        loadPrices();
        
        // Cart fragments refresh
        $(document.body).on('wc_fragments_refreshed updated_cart_totals updated_checkout fkcart_fragment_refreshed', function() {

            setTimeout(convertCartPrices, 100);
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
