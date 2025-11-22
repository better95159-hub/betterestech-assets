/**
 * BetterESTech Shop Ratings CDN Loader
 * Loads star ratings from GitHub CDN for shop page
 * Uses same cache as product page reviews loader
 */
(function($) {
    'use strict';
    
    var CDN_URL = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/reviews.json';
    var CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    // ═══════════════════════════════════════════════════════
    // CACHE MANAGEMENT (Same as product page)
    // ═══════════════════════════════════════════════════════
    
    function getCachedReviews() {
        try {
            var cached = sessionStorage.getItem('betterestech_reviews_cdn');
            if (!cached) return null;
            
            var parsed = JSON.parse(cached);
            if (!parsed.timestamp) return null;
            
            var age = Date.now() - parsed.timestamp;
            if (age > CACHE_DURATION) {
                sessionStorage.removeItem('betterestech_reviews_cdn');
                return null;
            }
            
            return parsed;
        } catch (e) {
            return null;
        }
    }
    
    function setCachedReviews(data) {
        try {
            data.cached_at = Date.now();
            sessionStorage.setItem('betterestech_reviews_cdn', JSON.stringify(data));
        } catch (e) {
        }
    }
    
    // ═══════════════════════════════════════════════════════
    // CDN LOADER (Same as product page)
    // ═══════════════════════════════════════════════════════
    
    function loadReviewsFromCDN(callback) {
        // Check cache first
        var cached = getCachedReviews();
        if (cached && cached.products) {
            callback(cached);
            return;
        }
        
        // Fetch from CDN
        $.ajax({
            url: CDN_URL + '?_=' + Date.now(),
            type: 'GET',
            dataType: 'json',
            cache: true,
            timeout: 5000,
            success: function(data) {
                if (data && data.products) {
                    setCachedReviews(data);
                    callback(data);
                } else {
                    callback(null);
                }
            },
            error: function() {
                callback(null);
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════
    // APPLY STAR RATINGS TO SHOP PAGE
    // ═══════════════════════════════════════════════════════
    
    function applyShopRatings(data) {
        if (!data || !data.products) return;
        
        $('li.product').each(function() {
            var $product = $(this);
            var classes = $product.attr('class') || '';
            var match = classes.match(/post-(\d+)|product-(\d+)/);
            
            if (!match) return;
            
            var productId = parseInt(match[1] || match[2]);
            var productData = data.products[productId];
            
            if (!productData) return;
            
            var reviewCount = parseInt(productData.review_count) || 0;
            var averageRating = parseFloat(productData.average_rating) || 0;
            
            // Find placeholder
            var $placeholder = $product.find('.shop-rating-placeholder');
            
            if ($placeholder.length === 0) return;
            
            // Remove placeholder and display stars
            if (reviewCount > 0 && averageRating > 0) {
                var percentage = (averageRating / 5) * 100;
                
                var html = '<div class="review-rating">' +
                    '<div class="star-rating" role="img" aria-label="Rated ' + averageRating.toFixed(1) + ' out of 5">' +
                    '<span style="width:' + percentage.toFixed(0) + '%">' +
                    'Rated <strong class="rating">' + averageRating.toFixed(2) + '</strong> out of 5' +
                    '</span></div></div>';
                
                $placeholder.replaceWith(html);
            } else {
                // No reviews - remove placeholder
                $placeholder.remove();
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════
    
    $(document).ready(function() {
        // Only run on shop/archive pages
        if (!$('body').hasClass('woocommerce-shop') && 
            !$('body').hasClass('tax-product_cat') &&
            !$('body').hasClass('tax-product_tag')) {
            return;
        }
        
        // Check if placeholders exist
        if ($('.shop-rating-placeholder').length === 0) {
            return;
        }
        
        // Load from CDN
        loadReviewsFromCDN(function(data) {
            if (data) {
                applyShopRatings(data);
            } else {
                // Failed to load - remove placeholders
                $('.shop-rating-placeholder').remove();
            }
        });
    });
    
})(jQuery);
