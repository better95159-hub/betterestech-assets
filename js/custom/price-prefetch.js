/**
 * Optimized Price Prefetch - Cache-Aware Version
 * Works with BetterESTech Ultra Cache (Price-Stripped)
 */
(function($) {
    'use strict';

    // ===== CACHE-STRIPPED PAGE DETECTION =====
    var PRICES_STRIPPED = window.BETTERESTECH_PRICES_NEED_LOAD || false;
    
    if (PRICES_STRIPPED) {
        console.log('🎯 Price-stripped cache detected - will load ALL prices');
    }

    var BASE_CACHE_KEY = 'wc_product_prices';
    var CACHE_DURATION = (typeof pricePrefetch !== 'undefined' ? pricePrefetch.cache_duration : 86400) * 1000;
    var isFetching = false;

    // ===== CURRENCY DETECTION =====
    function getCurrentCurrency() {
        var cookieMatch = document.cookie.match(/user_currency=([A-Z]{3})/);
        if (cookieMatch) {
            return cookieMatch[1];
        }
        
        if (typeof pricePrefetch !== 'undefined' && pricePrefetch.user_currency) {
            return pricePrefetch.user_currency;
        }
        
        var firstPrice = $('.woocommerce-Price-amount:not([data-price-placeholder]), .price').first().text();
        if (firstPrice) {
            if (firstPrice.indexOf('₹') !== -1) return 'INR';
            if (firstPrice.indexOf('€') !== -1) return 'EUR';
            if (firstPrice.indexOf('£') !== -1) return 'GBP';
        }
        
        return 'USD';
    }

    function getCacheKey() {
        return BASE_CACHE_KEY + '_' + getCurrentCurrency();
    }

    // ===== CACHE MANAGEMENT =====
    function getCachedPrices() {
        try {
            var cached = localStorage.getItem(getCacheKey());
            if (!cached) return null;
            
            var parsed = JSON.parse(cached);
            if (!parsed.prices || !parsed.timestamp) {
                localStorage.removeItem(getCacheKey());
                return null;
            }
            
            return parsed;
        } catch (e) {
            localStorage.removeItem(getCacheKey());
            return null;
        }
    }

    function isCacheExpired(cached) {
        if (!cached || !cached.timestamp) return true;
        var age = Date.now() - cached.timestamp;
        return age > CACHE_DURATION;
    }

    // ===== PRICE FETCHER =====
    function fetchPricesAsync(callback) {
        if (isFetching) {
            console.log('⏳ Already fetching prices...');
            return;
        }
        
        isFetching = true;
        var currency = getCurrentCurrency();
        console.log('📡 Fetching prices for: ' + currency);
        
        $.ajax({
            url: pricePrefetch.ajax_url,
            type: 'POST',
            data: {
                action: 'prefetch_all_prices',
                security: pricePrefetch.nonce,
                currency: currency
            },
            success: function(response) {
                isFetching = false;
                
                if (response.success && response.data && response.data.prices) {
                    console.log('✅ Fetched ' + Object.keys(response.data.prices).length + ' prices');

                    var cacheData = {
                        prices: response.data.prices,
                        currency: response.data.user_currency || currency,
                        symbol: response.data.symbol || '$',
                        rate: response.data.rate || 1,
                        timestamp: Date.now()
                    };
                    
                    localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
                    console.log('💾 Prices cached');
                    
                    if (callback) callback(response.data.prices);
                } else {
                    console.error('❌ Invalid response');
                    if (callback) callback(null);
                }
            },
            error: function() {
                isFetching = false;
                console.error('❌ AJAX error');
                if (callback) callback(null);
            },
            timeout: 30000
        });
    }

    // Helper: Detect currency symbol in price element
    function detectPriceSymbol($elem) {
        var symbolElem = $elem.find('.woocommerce-Price-currencySymbol');
        if (symbolElem.length > 0) {
            return symbolElem.text().trim();
        }
        
        var fullText = $elem.text();
        
        if (fullText.indexOf('$') !== -1) return '$';
        if (fullText.indexOf('₹') !== -1) return '₹';
        if (fullText.indexOf('€') !== -1) return '€';
        if (fullText.indexOf('£') !== -1) return '£';
        if (fullText.indexOf('C$') !== -1) return 'C$';
        if (fullText.indexOf('A$') !== -1) return 'A$';
        if (fullText.indexOf('¥') !== -1) return '¥';
        if (fullText.indexOf('₩') !== -1) return '₩';
        if (fullText.indexOf('₽') !== -1) return '₽';
        if (fullText.indexOf('₪') !== -1) return '₪';
        if (fullText.indexOf('kr') !== -1) return 'kr';
        if (fullText.indexOf('zł') !== -1) return 'zł';
        if (fullText.indexOf('Fr') !== -1) return 'Fr';
        
        return '$';
    }

    // ===== PRICE APPLICATION =====
    // ===== PRICE APPLICATION =====
function applyPrices(prices) {
    if (!prices) {
        console.warn('⚠️ No prices to apply');
        return;
    }
    
    var applied = 0;
    var currency = getCurrentCurrency();
    var cached = getCachedPrices();
    var rate = cached && cached.rate ? cached.rate : 1;
    var targetSymbol = cached && cached.symbol ? cached.symbol : '$';
    
    // Find ALL price elements
    $('[data-price-placeholder], .wc-price-prefetch, .price, .woocommerce-Price-amount').each(function() {
        var $elem = $(this);
        var productId = null;
        
        // ✅ METHOD 1: Direct data attribute (most reliable)
        productId = $elem.data('product-id') || $elem.data('product_id');
        
        // ✅ METHOD 2: For single product pages, use body class FIRST (most reliable)
        if (!productId && $('body').hasClass('single-product')) {
            var bodyClasses = $('body').attr('class');
            var bodyMatch = bodyClasses.match(/postid-(\d+)/);
            if (bodyMatch) {
                // Check if this price element is in main product area (not related products)
                var isMainProduct = $elem.closest('.product, .summary, .entry-summary, .single-product-content').length > 0;
                var isRelated = $elem.closest('.related, .upsells').length > 0;
                
                if (isMainProduct && !isRelated) {
                    productId = parseInt(bodyMatch[1]);
                }
            }
        }
        
        // ✅ METHOD 3: Closest product container (for shop/related products)
        if (!productId) {
            var $product = $elem.closest('[data-product_id]');
            if ($product.length > 0) {
                productId = $product.data('product_id');
            }
        }
        
        // ✅ METHOD 4: Search in product container
        if (!productId) {
            $product = $elem.closest('.product, li.product, .product-type-variable, .product-type-simple');
            if ($product.length > 0) {
                productId = $product.find('[data-product_id]').first().data('product_id');
            }
        }
        
        // ✅ METHOD 5: Post class (last resort, for shop listings)
        if (!productId) {
            $product = $elem.closest('.product, li.product, body.single-product, body.product');
            var classes = $product.attr('class') || '';
            var match = classes.match(/post-(\d+)|product-(\d+)/);
            if (match) {
                productId = parseInt(match[1] || match[2]);
            }
        }
        
        if (productId && prices[productId]) {
            var priceData = prices[productId];
            var currentSymbol = detectPriceSymbol($elem);
            
            if (currentSymbol !== '$') {
                return;
            }
            
            var regularPrice = parseFloat(priceData.regular || 0);
            var salePrice = parseFloat(priceData.sale || 0);
            
            if (currency !== 'USD' && rate > 0) {
                regularPrice = Math.round(regularPrice * rate);
                salePrice = salePrice ? Math.round(salePrice * rate) : 0;
            }
            
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
            
            $elem.empty();
            $elem.html(priceHTML);
            $elem.removeClass('loading-price');
            $elem.removeAttr('data-price-placeholder');
            $elem.css('visibility', 'visible');
            $elem.data('converted', currency);
            applied++;
        }
    });
    
    console.log('✨ Applied ' + applied + ' prices in ' + currency);
}


    // ===== MAIN LOGIC =====
    function loadPrices() {
        var currency = getCurrentCurrency();
        var cached = getCachedPrices();
        
        // HIDE all price placeholders immediately
        $('[data-price-placeholder]').css('visibility', 'hidden');
        
        // ✅ NEW: Check cache FIRST - if valid, use it immediately (like sidecart)
        if (cached && !isCacheExpired(cached) && cached.currency === currency) {
            console.log('⚡ Using cached prices instantly!');
            applyPrices(cached.prices);
            return; // ← Don't fetch again!
        }
        
        // Only fetch if no cache or expired
        if (PRICES_STRIPPED || !cached || isCacheExpired(cached) || cached.currency !== currency) {
            fetchPricesAsync(function(prices) {
                if (prices) {
                    applyPrices(prices);
                } else {
                    $('[data-price-placeholder]').css('visibility', 'visible');
                }
            });
        }
    }

    // ===== INITIALIZATION =====
    $(document).ready(function() {
        console.log('🚀 Price loader initialized');
        
        // Always load prices on page load
        loadPrices();
        
        // Also watch for AJAX product additions (infinite scroll, etc.)
        $(document).on('yith_infs_added_elem', function() {
            console.log('🔄 New products added - reapplying prices');
            setTimeout(function() {
                var cached = getCachedPrices();
                if (cached && cached.prices) {
                    applyPrices(cached.prices);
                }
            }, 100);
        });
    });

    // ===== SIDE CART & CHECKOUT PRICE CONVERSION =====
    function convertCartPrices() {
        var cached = getCachedPrices();
        
        if (!cached || !cached.prices) {
            return;
        }
        
        var rate = cached.rate || 1;
        var targetSymbol = cached.symbol || '$';
        var currency = getCurrentCurrency();
        
        if (currency === 'USD' || rate === 1) {
            return;
        }
        
        var converted = 0;
        
        var priceContainers = [
            '.fkcart-item-price',
            '.fkcart-totals',
            '.fkcart-subtotal',
            '.fkcart-total',
            '.fkcart-subtotal-wrap',
            '.fkcart-summary-amount',
            '.fkcart-checkout--price',
            '.fkcart-order-summary',
            '.woocommerce-mini-cart',
            '.woocommerce-mini-cart__total',
            '.widget_shopping_cart',
            '.cart_totals',
            '.cart-subtotal',
            '.order-total',
            '.woocommerce-checkout-review-order'
        ].join(', ');
        
        var $containers = $(priceContainers);
        var $allPrices = $containers.find('.woocommerce-Price-amount');
        
        $allPrices.each(function() {
            var $elem = $(this);
            
            if ($elem.data('converted') === currency) {
                return;
            }
            
            var inTitle = $elem.closest('.fkcart-item-title-price, .fkcart-item-title, .product-name, a[href*="product"]').length > 0;
            
            if (inTitle) {
                return;
            }
            
            var currentSymbol = detectPriceSymbol($elem);
            
            if (currentSymbol !== '$') {
                return;
            }
            
            var priceText = $elem.text().replace(/[^\d.]/g, '');
            var priceValue = parseFloat(priceText);
            
            if (isNaN(priceValue) || priceValue === 0) {
                return;
            }
            
            var convertedPrice = Math.round(priceValue * rate);
            var newHTML = '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + convertedPrice;
            
            $elem.empty();
            $elem.html(newHTML);
            $elem.data('converted', currency);
            converted++;
        });
    }

    // ===== CART CONVERSION INITIALIZATION =====
    $(document).ready(function() {
        var checkCacheAndConvert = function() {
            var cached = getCachedPrices();
            if (cached && cached.prices) {
                convertCartPrices();
            }
        };
        
        $(document.body).on('wc_fragments_refreshed wc_fragments_loaded', function() {
            setTimeout(checkCacheAndConvert, 100);
        });
        
        $(document.body).on('updated_cart_totals updated_checkout', function() {
            setTimeout(checkCacheAndConvert, 100);
        });
        
        $(document.body).on('fkcart_fragment_refreshed', function() {
            setTimeout(checkCacheAndConvert, 100);
        });
        
        setTimeout(checkCacheAndConvert, 500);
        setTimeout(checkCacheAndConvert, 2000);
        setTimeout(checkCacheAndConvert, 4000);
        
        $(document).on('click', '.fkcart-cart-btn, .cart-link, .header-cart-link', function() {
            setTimeout(checkCacheAndConvert, 300);
        });
        
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        $(mutation.addedNodes).each(function() {
                            if ($(this).hasClass('fkcart-app') || 
                                $(this).find('.fkcart-app').length > 0 ||
                                $(this).hasClass('woocommerce-mini-cart') ||
                                $(this).find('.woocommerce-mini-cart').length > 0) {
                                setTimeout(checkCacheAndConvert, 200);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });

})(jQuery);
