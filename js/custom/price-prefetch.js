/**
 * Optimized Price Prefetch - Cache-Aware Version
 * Works with BetterESTech Ultra Cache (Price-Stripped)
 */
(function($) {
    'use strict';

    // ===== CACHE-STRIPPED PAGE DETECTION =====
    var PRICES_STRIPPED = window.BETTERESTECH_PRICES_NEED_LOAD || false;
    
    if (PRICES_STRIPPED) {
        
    }

    var BASE_CACHE_KEY = 'wc_product_prices';
    var CACHE_DURATION = (typeof pricePrefetch !== 'undefined' ? pricePrefetch.cache_duration : 86400) * 1000;
    var isFetching = false;

    // ===== CURRENCY DETECTION (FIXED) =====
function getCurrentCurrency() {
    // STEP 1: Check cookie first (most reliable)
    var cookieMatch = document.cookie.match(/user_currency=([A-Z]{3})/);
    if (cookieMatch) {
        return cookieMatch[1];
    }
    
    // STEP 2: Check PHP-localized value (server-detected on THIS request)
    if (typeof pricePrefetch !== 'undefined' && pricePrefetch.user_currency) {
        var phpCurrency = pricePrefetch.user_currency;
       
        
        // Set cookie for next time
        var expires = new Date(Date.now() + 30*24*60*60*1000).toUTCString();
        document.cookie = 'user_currency=' + phpCurrency + '; expires=' + expires + '; path=/';
        
        return phpCurrency;
    }
    
    // STEP 3: Fallback - detect from existing prices
    var firstPrice = $('.woocommerce-Price-amount:not([data-price-placeholder]), .price').first().text();
    if (firstPrice) {
        if (firstPrice.indexOf('₹') !== -1) {
            return 'INR';
        }
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
            return;
        }
        
        isFetching = true;
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
                isFetching = false;
                
                if (response.success && response.data && response.data.prices) {

                    var cacheData = {
                        prices: response.data.prices,
                        currency: response.data.user_currency || currency,
                        symbol: response.data.symbol || '$',
                        rate: response.data.rate || 1,
                        timestamp: Date.now()
                    };
                    
                    localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
                    
                    if (callback) callback(response.data.prices);
                } else {
                    if (callback) callback(null);
                }
            },
            error: function() {
                isFetching = false;
                console.error('❌ AJAX error');
                if (callback) callback(null);
            },
            timeout: 5000
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
function applyPrices(prices) {
    if (!prices) {
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
}


 // ===== MAIN LOGIC (FIXED) =====
function loadPrices() {
    
    $('[data-price-placeholder]').css('visibility', 'hidden');
    
    // ✅ NO setTimeout - execute immediately
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
        
        // Always load prices on page load
        loadPrices();
        
        // Also watch for AJAX product additions (infinite scroll, etc.)
        $(document).on('yith_infs_added_elem', function() {
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
                '.wfacp_order_summary_item_total',  // ✅ ADD - Product line item
    'td.product-total',                  // ✅ ADD - Product total cell
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
            '.woocommerce-checkout-review-order'
            '.wfacp_order_summary', 
            '.wfacp_mini_cart_items',        // ← ADD THESE
            '.wfacp_order_total_wrap',       // ← ADD THESE
            '.wfacp-product-switch-panel'    // ← ADD THESE
        ].join(', ');
        
        var $containers = $(priceContainers);
        var $allPrices = $containers.find('.woocommerce-Price-amount');
        
        $allPrices.each(function() {
            var $elem = $(this);
            
            if ($elem.data('converted') === currency) {
                return;
            }
            
// ✅ UPDATED: Skip product names but NOT prices in product-total
var inTitle = $elem.closest('.fkcart-item-title-price, .fkcart-item-title, .wfacp_order_summary_item_name, a[href*="product"]').length > 0;
var inProductTotal = $elem.closest('.wfacp_order_summary_item_total, .product-total, td.product-total').length > 0;

// Skip titles, but allow product totals
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
setTimeout(checkCacheAndConvert, 1500);  // ✅ Changed from 2000 to 1500
// ✅ REMOVED: setTimeout(checkCacheAndConvert, 4000);

        
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
    // ===== FUNNELKIT CHECKOUT CONVERSION =====
$(document).ready(function() {
    // Detect FunnelKit checkout
    if ($('body').hasClass('wfacp_main_wrapper') || 
        $('.wfacp-form').length > 0 || 
        $('.wfacp_main_form').length > 0 ||
        $('body').hasClass('wfacp_funnel_cart')) {    
      var convertFunnelKitPrices = function() {
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
            

// ✅ UPDATED: FunnelKit-specific selectors (product prices first)
var fkSelectors = [
    '.wfacp_order_summary_item_total',  // ✅ Product line item prices (FIRST!)
    '.product-total',                    // ✅ Product total container
    'td.product-total',                  // ✅ Table cell for product total
    '.wfacp_order_summary',
    '.wfacp_mini_cart_items',
    '.wfacp-product-switch-panel',
    '.wfacp_order_total_wrap',
    '.wfacp_row_wrap',
    '.wfacp-cart-total',
    '.wfacp-product-row',
    '.wfacp_product_row',
    '.wfacp_order_total',
    '.wfacp_mini_cart_footer',
    '.wfacp_subtotal',
    '.wfacp_shipping',
    '.wfacp_tax',
    '.wfacp_order_review',
    '.wfacp-order-summary',
    '.order_review',
    '.cart-subtotal',                    // ✅ Subtotal row
    '.order-total',                      // ✅ Total row
    'table.shop_table',
    '#order_review'
].join(', ');

            
            $(fkSelectors).find('.woocommerce-Price-amount, .amount, bdi').each(function() {
                var $elem = $(this);
                
                // Skip if already converted
                if ($elem.data('converted') === currency) {
                    return;
                }
                
// ✅ UPDATED: Skip product names/titles but NOT prices
if ($elem.closest('.wfacp_order_summary_item_name, .product-name, .product-quantity, a[href*="product"]').length > 0) {
    return;
}

// ✅ EXPLICITLY ALLOW: Product line item prices
if ($elem.closest('.wfacp_order_summary_item_total, .product-total, td.product-total').length > 0) {
    // Don't skip - this is a price we WANT to convert
}

                
                // Get current symbol
                var currentSymbol = detectPriceSymbol($elem);
                
                // Only convert USD prices
                if (currentSymbol !== '$') {
                    return;
                }
                
// ✅ ENHANCED: Extract numeric value (handles <bdi> properly)
var priceText = '';

// Check if element has <bdi> child
var $bdi = $elem.find('bdi').first();
if ($bdi.length > 0) {
    priceText = $bdi.text();
} else {
    priceText = $elem.text();
}

// Clean and parse
priceText = priceText.replace(/[^\d.]/g, '');
var priceValue = parseFloat(priceText);

if (isNaN(priceValue) || priceValue === 0) {
    return;
}

// Convert
var convertedPrice = Math.round(priceValue * rate);

// ✅ ENHANCED: Update HTML (preserves <bdi> if it exists)
var newHTML = '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + convertedPrice;

if ($bdi.length > 0) {
    // If <bdi> exists, update its content only
    $bdi.empty().html(newHTML);
} else {
    // Otherwise update the element itself
    $elem.empty().html(newHTML);
}

                $elem.data('converted', currency);
                converted++;
            });
            
            if (converted > 0) {
            }
        };
        
        // Initial conversion (multiple attempts)
setTimeout(convertFunnelKitPrices, 500);
setTimeout(convertFunnelKitPrices, 1500);
        
        // FunnelKit-specific events
        $(document.body).on('wfacp_step_switching wfacp_coupon_form_update wfacp_order_review_update', function() {
            setTimeout(convertFunnelKitPrices, 300);
        });
        
        // Standard WooCommerce events
        $(document.body).on('updated_checkout payment_method_selected', function() {
            setTimeout(convertFunnelKitPrices, 300);
        });
        
        // Watch for payment method changes
        $(document).on('change', 'input[name="payment_method"]', function() {
            setTimeout(convertFunnelKitPrices, 200);
        });
        
        // Watch for coupon apply/remove
        $(document).on('click', '.wfacp_apply_coupon, .wfacp_remove_coupon', function() {
            setTimeout(convertFunnelKitPrices, 1000);
        });
        
        // MutationObserver for dynamic content
        if (window.MutationObserver) {
            var fkObserver = new MutationObserver(function(mutations) {
                var shouldConvert = false;
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
                        $(mutation.target).find('.woocommerce-Price-amount, .amount').each(function() {
                            if (!$(this).data('converted')) {
                                shouldConvert = true;
                            }
                        });
                    }
                });
                
                if (shouldConvert) {
                    setTimeout(convertFunnelKitPrices, 200);
                }
            });
            
            // Observe FunnelKit containers
            $('.wfacp_order_summary, .wfacp_mini_cart_items, #order_review').each(function() {
                fkObserver.observe(this, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            });
        }
    }
});
// ===== ENHANCED FUNNELKIT CHECKOUT CONVERSION (HANDLES ALL ELEMENTS) =====
$(document).ready(function() {
    // Detect FunnelKit checkout
    if ($('body').hasClass('wfacp_main_wrapper') || 
        $('.wfacp-form').length > 0 || 
        $('.wfacp_main_form').length > 0 ||
        $('.wfacp_order_summary').length > 0) {
        
        var convertAllCheckoutPrices = function() {
            var cached = getCachedPrices();
            if (!cached || !cached.prices) {
                console.log('❌ No cached prices available');
                return;
            }
            
            var rate = cached.rate || 1;
            var targetSymbol = cached.symbol || '$';
            var currency = getCurrentCurrency();
            
            if (currency === 'USD' || rate === 1) {
                console.log('⏭️ Currency is USD, skipping conversion');
                return;
            }
            
            var converted = 0;
            
            // ===== 1. CONVERT STANDARD PRICE ELEMENTS =====
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
                
                // Skip if already converted
                if ($elem.data('fk-converted') === currency) {
                    return;
                }
                
                // Skip product names
                if ($elem.closest('.product-name, .wfacp_order_summary_item_name').length > 0) {
                    return;
                }
                
                // Extract price from <bdi> or direct text
                var priceText = '';
                var $bdi = $elem.find('bdi').first();
                
                if ($bdi.length > 0) {
                    priceText = $bdi.text();
                } else {
                    priceText = $elem.text();
                }
                
                // Clean and parse
                priceText = priceText.replace(/[^\d.]/g, '');
                var priceValue = parseFloat(priceText);
                
                if (isNaN(priceValue) || priceValue === 0) {
                    return;
                }
                
                // Check if it's USD (has $ symbol)
                var hasUSD = ($elem.text().indexOf('$') !== -1);
                if (!hasUSD) {
                    return; // Already converted
                }
                
                // Convert
                var convertedPrice = Math.round(priceValue * rate);
                var newHTML = '<span class="woocommerce-Price-currencySymbol">' + targetSymbol + '</span>' + convertedPrice;
                
                // Update
                if ($bdi.length > 0) {
                    $bdi.empty().html(newHTML);
                } else {
                    $elem.empty().html(newHTML);
                }
                
                $elem.data('fk-converted', currency);
                converted++;
            });
            
            // ===== 2. CONVERT PLACE ORDER BUTTON =====
            var $placeOrderBtn = $('#place_order, button[name="woocommerce_checkout_place_order"]');
            
            if ($placeOrderBtn.length > 0 && $placeOrderBtn.data('btn-converted') !== currency) {
                var btnText = $placeOrderBtn.text();
                var btnValue = $placeOrderBtn.val();
                
                // Extract price from button text
                var priceMatch = btnText.match(/\$(\d+(?:\.\d+)?)/);
                
                if (priceMatch) {
                    var btnPrice = parseFloat(priceMatch[1]);
                    var convertedBtnPrice = Math.round(btnPrice * rate);
                    
                    // Update button text
                    var newBtnText = btnText.replace(/\$\d+(?:\.\d+)?/, targetSymbol + convertedBtnPrice);
                    $placeOrderBtn.text(newBtnText);
                    
                    // Update button value (if it has price)
                    if (btnValue && btnValue.indexOf('$') !== -1) {
                        var newBtnValue = btnValue.replace(/\$\d+(?:\.\d+)?/, targetSymbol + convertedBtnPrice);
                        $placeOrderBtn.val(newBtnValue).attr('data-value', newBtnValue);
                    }
                    
                    $placeOrderBtn.data('btn-converted', currency);
                    converted++;
                }
            }
            
            if (converted > 0) {
                console.log('✅ FunnelKit: Converted ' + converted + ' prices to ' + currency);
            } else {
                console.log('⚠️ FunnelKit: Found 0 prices to convert (might already be converted)');
            }
        };
        
        // ===== TIMING: Multiple attempts =====
        setTimeout(convertAllCheckoutPrices, 300);
        setTimeout(convertAllCheckoutPrices, 1000);
        setTimeout(convertAllCheckoutPrices, 2000);
        
        // ===== EVENTS: Checkout updates =====
        $(document.body).on('updated_checkout wfacp_order_review_update payment_method_selected', function() {
            setTimeout(convertAllCheckoutPrices, 500);
        });
        
        // ===== EVENTS: Coupon/payment changes =====
        $(document).on('change', 'input[name="payment_method"]', function() {
            setTimeout(convertAllCheckoutPrices, 300);
        });
        
        $(document).on('click', '.wfacp_apply_coupon, .wfacp_remove_coupon', function() {
            setTimeout(convertAllCheckoutPrices, 1500);
        });
        
        // ===== OBSERVER: Watch for dynamic updates =====
        if (window.MutationObserver) {
            var checkoutObserver = new MutationObserver(function(mutations) {
                var shouldConvert = false;
                
                mutations.forEach(function(mutation) {
                    // Check if prices were updated
                    $(mutation.target).find('.woocommerce-Price-amount, #place_order').each(function() {
                        if (!$(this).data('fk-converted') && !$(this).data('btn-converted')) {
                            shouldConvert = true;
                        }
                    });
                });
                
                if (shouldConvert) {
                    setTimeout(convertAllCheckoutPrices, 300);
                }
            });
            
            // Observe checkout container
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
