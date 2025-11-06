/**
 * Optimized Price Prefetch - Cache-Aware Version
 * Works with BetterESTech Ultra Cache (Price-Stripped)
 */
(function($) {
    'use strict';

    // ===== CACHE-STRIPPED PAGE DETECTION =====
    var PRICES_STRIPPED = window.BETTERESTECH_PRICES_NEED_LOAD || false;

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
            var phpCurrency = pricePrefetch.user_currency;
            var expires = new Date(Date.now() + 30*24*60*60*1000).toUTCString();
            document.cookie = 'user_currency=' + phpCurrency + '; expires=' + expires + '; path=/';
            return phpCurrency;
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
    // Helper: Detect currency symbol
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
    
    return '$';
}

// ===== PRICE APPLICATION =====
function applyPrices(prices) {
    if (!prices) {
        return;
    }
    
    var applied = 0;
    var currency = getCurrentCurrency();
    var cached = getCachedPrices();
    var rate = cached && cached.rate ? cached.rate : 1;
    var targetSymbol = cached && cached.symbol ? cached.symbol : '$';
    
    $('[data-price-placeholder], .wc-price-prefetch, .price, .woocommerce-Price-amount').each(function() {
        var $elem = $(this);
        var productId = null;
        
        productId = $elem.data('product-id') || $elem.data('product_id');
        
        if (!productId && $('body').hasClass('single-product')) {
            var bodyClasses = $('body').attr('class');
            var bodyMatch = bodyClasses.match(/postid-(\d+)/);
            if (bodyMatch) {
                var isMainProduct = $elem.closest('.product, .summary, .entry-summary, .single-product-content').length > 0;
                var isRelated = $elem.closest('.related, .upsells').length > 0;
                
                if (isMainProduct && !isRelated) {
                    productId = parseInt(bodyMatch[1]);
                }
            }
        }
        
        if (!productId) {
            var $product = $elem.closest('[data-product_id]');
            if ($product.length > 0) {
                productId = $product.data('product_id');
            }
        }
        
        if (!productId) {
            $product = $elem.closest('.product, li.product, .product-type-variable, .product-type-simple');
            if ($product.length > 0) {
                productId = $product.find('[data-product_id]').first().data('product_id');
            }
        }
        
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
}


    // ===== PRICE FETCHER =====
function fetchPricesAsync(callback) {
    if (isFetching) {
        return;
    }
    
    isFetching = true;
    var currency = getCurrentCurrency();
    
    // ✅ Fetch from GitHub Pages (FAST!)
    $.ajax({
        url: 'https://better95159-hub.github.io/betterestech-prices/prices.json',
        type: 'GET',
        dataType: 'json',
        cache: true,
        success: function(response) {
            isFetching = false;
            
            // Get data for user's currency
            if (response && response[currency]) {
                var currencyData = response[currency];
                
                // Cache the data
                var cacheData = {
                    prices: currencyData.prices,
                    currency: currencyData.currency,
                    symbol: currencyData.symbol,
                    rate: currencyData.rate,
                    timestamp: Date.now()
                };
                
                localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
                
                if (callback) callback(currencyData.prices);
            } else {
                console.error('Currency not found:', currency);
                if (callback) callback(null);
            }
        },
        error: function(xhr, status, error) {
            isFetching = false;
            console.error('Failed to fetch from GitHub:', status, error);
            if (callback) callback(null);
        },
        timeout: 5000
    });
}


    // ===== MAIN LOGIC =====
    function loadPrices() {
        $('[data-price-placeholder]').css('visibility', 'hidden');
        
        var currency = getCurrentCurrency();
        var cached = getCachedPrices();
        
        if (cached && !isCacheExpired(cached) && cached.currency === currency) {
            applyPrices(cached.prices);
            return;
        }
        
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
        loadPrices();
        
        $(document).on('yith_infs_added_elem', function() {
            setTimeout(function() {
                var cached = getCachedPrices();
                if (cached && cached.prices) {
                    applyPrices(cached.prices);
                }
            }, 100);
        });
    });

    // ===== SIDE CART CONVERSION =====
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
            '.wfacp_order_summary_item_total',
            'td.product-total',
            '.product-total',
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
            '.woocommerce-checkout-review-order',
            '.wfacp_order_summary',
            '.wfacp_mini_cart_items',
            '.wfacp_order_total_wrap',
            '.wfacp-product-switch-panel'
        ].join(', ');
        
        var $containers = $(priceContainers);
        var $allPrices = $containers.find('.woocommerce-Price-amount');
        
        $allPrices.each(function() {
            var $elem = $(this);
            
            if ($elem.data('converted') === currency) {
                return;
            }
            
            var inTitle = $elem.closest('.fkcart-item-title-price, .fkcart-item-title, .wfacp_order_summary_item_name, a[href*="product"]').length > 0;
            var inProductTotal = $elem.closest('.wfacp_order_summary_item_total, .product-total, td.product-total').length > 0;
            
            if (inTitle && !inProductTotal) {
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
        
        $(document.body).on('wc_fragments_refreshed wc_fragments_loaded updated_cart_totals updated_checkout fkcart_fragment_refreshed', function() {
            setTimeout(checkCacheAndConvert, 100);
        });
        
        setTimeout(checkCacheAndConvert, 400);
        setTimeout(checkCacheAndConvert, 1200);
        
        $(document).on('click', '.fkcart-cart-btn, .cart-link, .header-cart-link', function() {
            setTimeout(checkCacheAndConvert, 250);
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
                                setTimeout(checkCacheAndConvert, 150);
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

    // ===== FUNNELKIT CHECKOUT CONVERSION =====
    $(document).ready(function() {
        if ($('body').hasClass('wfacp_main_wrapper') || 
            $('.wfacp-form').length > 0 || 
            $('.wfacp_main_form').length > 0 ||
            $('.wfacp_order_summary').length > 0) {
            
            var convertAllCheckoutPrices = function() {
                $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                    'visibility': 'hidden',
                    'opacity': '0'
                });
                
                var cached = getCachedPrices();
                if (!cached || !cached.prices) {
                    $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                        'visibility': 'visible',
                        'opacity': '1'
                    });
                    return;
                }
                
                var rate = cached.rate || 1;
                var targetSymbol = cached.symbol || '$';
                var currency = getCurrentCurrency();
                
                if (currency === 'USD' || rate === 1) {
                    $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                        'visibility': 'visible',
                        'opacity': '1'
                    });
                    return;
                }
                
                var converted = 0;
                
                var priceSelectors = [
                    '.wfacp_order_summary_item_total .woocommerce-Price-amount',
                    'td.product-total .woocommerce-Price-amount',
                    '.cart-subtotal .woocommerce-Price-amount',
                    '.order-total .woocommerce-Price-amount',
                    '.wfacp_order_summary .woocommerce-Price-amount',
                    'table.shop_table .woocommerce-Price-amount'
                ].join(', ');
                
                $(priceSelectors).each(function() {
                    var $elem = $(this);
                    
                    if ($elem.data('fk-converted') === currency) {
                        return;
                    }
                    
                    if ($elem.closest('.product-name, .wfacp_order_summary_item_name').length > 0) {
                        return;
                    }
                    
                    var priceText = '';
                    var $bdi = $elem.find('bdi').first();
                    
                    if ($bdi.length > 0) {
                        priceText = $bdi.text();
                    } else {
                        priceText = $elem.text();
                    }
                    
                    priceText = priceText.replace(/[^\d.]/g, '');
                    var priceValue = parseFloat(priceText);
                    
                    if (isNaN(priceValue) || priceValue === 0) {
                        return;
                    }
                    
                    var hasUSD = ($elem.text().indexOf('$') !== -1);
                    if (!hasUSD) {
                        return;
                    }
                    
                    var convertedPrice = Math.round(priceValue * rate);
                    var newHTML = '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + convertedPrice;
                    
                    if ($bdi.length > 0) {
                        $bdi.empty().html(newHTML);
                    } else {
                        $elem.empty().html(newHTML);
                    }
                    
                    $elem.data('fk-converted', currency);
                    converted++;
                });
                
                var $placeOrderBtn = $('#place_order, button[name="woocommerce_checkout_place_order"]');
                
                if ($placeOrderBtn.length > 0 && $placeOrderBtn.data('btn-converted') !== currency) {
                    var btnText = $placeOrderBtn.text();
                    var priceMatch = btnText.match(/\$(\d+(?:\.\d+)?)/);
                    
                    if (priceMatch) {
                        var btnPrice = parseFloat(priceMatch[1]);
                        var convertedBtnPrice = Math.round(btnPrice * rate);
                        
                        var newBtnText = btnText.replace(/\$\d+(?:\.\d+)?/, targetSymbol + convertedBtnPrice);
                        $placeOrderBtn.text(newBtnText);
                        
                        var btnValue = $placeOrderBtn.val();
                        if (btnValue && btnValue.indexOf('$') !== -1) {
                            var newBtnValue = btnValue.replace(/\$\d+(?:\.\d+)?/, targetSymbol + convertedBtnPrice);
                            $placeOrderBtn.val(newBtnValue).attr('data-value', newBtnValue);
                        }
                        
                        $placeOrderBtn.data('btn-converted', currency);
                        converted++;
                    }
                }
                
                $('.wfacp_order_summary .woocommerce-Price-amount, #place_order').css({
                    'visibility': 'visible',
                    'opacity': '1',
                    'transition': 'opacity 0.2s ease'
                });
            };
            
            setTimeout(convertAllCheckoutPrices, 200);
            setTimeout(convertAllCheckoutPrices, 800);
            
            $(document.body).on('updated_checkout wfacp_order_review_update payment_method_selected', function() {
                setTimeout(convertAllCheckoutPrices, 400);
            });
            
            $(document).on('change', 'input[name="payment_method"]', function() {
                setTimeout(convertAllCheckoutPrices, 250);
            });
            
            $(document).on('click', '.wfacp_apply_coupon, .wfacp_remove_coupon', function() {
                setTimeout(convertAllCheckoutPrices, 1000);
            });
            
            if (window.MutationObserver) {
                var checkoutObserver = new MutationObserver(function(mutations) {
                    var shouldConvert = false;
                    
                    mutations.forEach(function(mutation) {
                        $(mutation.target).find('.woocommerce-Price-amount, #place_order').each(function() {
                            if (!$(this).data('fk-converted') && !$(this).data('btn-converted')) {
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
        }
    });

})(jQuery);
