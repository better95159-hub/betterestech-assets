/**
 * BetterESTech Reviews CDN Loader
 * Loads reviews from GitHub CDN (jsDelivr)
 * Instant review display with localStorage
 */
(function($) {
    'use strict';
    var JUST_SUBMITTED = false;  // Tracks if review was just submitted
    
    var CDN_URL = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/reviews.json';
    var CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    var PENDING_REVIEW_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    // ═══════════════════════════════════════════════════════
    // CACHE MANAGEMENT
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
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════
    
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        
    }
       function updateReviewCounts() {
    // Update toggle button count
    var $toggleCount = $('.review-count-badge');
    if ($toggleCount.length > 0) {
        var currentCount = parseInt($toggleCount.text().replace(/[()]/g, '')) || 0;
        $toggleCount.text('(' + (currentCount + 1) + ')');
    }
    
    // Update top rating section count
    var $ratingCount = $('.woocommerce-product-rating .woocommerce-review-link .count');
    if ($ratingCount.length > 0) {
        var topCount = parseInt($ratingCount.text()) || 0;
        $ratingCount.text(topCount + 1);
        
        var $reviewLink = $('.woocommerce-product-rating .woocommerce-review-link');
        var linkText = $reviewLink.html();
        var newCount = topCount + 1;
        var newText = linkText.replace(/customer review(s)?/i, 'customer review' + (newCount !== 1 ? 's' : ''));
        $reviewLink.html(newText);
        
    }
    
    // Update reviews header
    var $reviewsTitle = $('#tab-reviews .woocommerce-Reviews-title, #reviews .woocommerce-Reviews-title');
    if ($reviewsTitle.length > 0) {
        var titleText = $reviewsTitle.html();
        var match = titleText.match(/(\d+)\s+reviews?\s+for/i);
        if (match) {
            var headerCount = parseInt(match[1]) || 0;
            var newHeaderCount = headerCount + 1;
            var newTitleText = titleText.replace(/\d+\s+reviews?\s+for/i, newHeaderCount + ' review' + (newHeaderCount !== 1 ? 's' : '') + ' for');
            $reviewsTitle.html(newTitleText);
        }
    }
}

    
    function getProductId() {
        var match = $('body').attr('class').match(/postid-(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    
function getUserIP() {
    return (typeof betterestech_data !== 'undefined' ? betterestech_data.user_ip : 'unknown');
}

    
    // ═══════════════════════════════════════════════════════
    // CDN LOADER
    // ═══════════════════════════════════════════════════════
    
    function loadReviewsFromCDN(callback) {
        var cached = getCachedReviews();
        if (cached && cached.products) {
            callback(cached);
            return;
        }
        
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
    // APPLY REVIEWS TO PAGE
    // ═══════════════════════════════════════════════════════
    
    function applyReviews(data) {
        if (!data || !data.products) return;
        
        var productId = getProductId();
        if (!productId) return;
        
        var productData = data.products[productId];
        if (!productData) return;
        
        // Replace placeholder with reviews
        var $placeholder = $('#reviews-placeholder');
        if ($placeholder.length > 0) {
            $placeholder.replaceWith(productData.html);
            
            setTimeout(function() {
                initializeRatingStars();
                setupReviewsToggle(
                    parseInt(productData.review_count) || 0, 
                    parseFloat(productData.average_rating) || 0
                );
                handleReviewFormAccess();
                injectPendingReview(); // ✅ Inject pending review after reviews load
            }, 100);
        }
        
        // Update rating section
        var $ratingPlaceholder = $('.woocommerce-product-rating[data-load-rating="true"]');
        if ($ratingPlaceholder.length > 0 && productData.review_count > 0) {
            displayRating(
                $ratingPlaceholder, 
                parseInt(productData.review_count) || 0, 
                parseFloat(productData.average_rating) || 0
            );
        }
    }
    
    function initializeRatingStars() {
        var $ratingSelect = $('#tab-reviews select#rating, #reviews select#rating');
        if ($ratingSelect.length === 0) return;
        
        $ratingSelect.hide().before(
            '<p class="stars"><span>' +
            '<a class="star-1" href="#">1</a><a class="star-2" href="#">2</a>' +
            '<a class="star-3" href="#">3</a><a class="star-4" href="#">4</a>' +
            '<a class="star-5" href="#">5</a></span></p>'
        );
        
        $('#tab-reviews .stars a, #reviews .stars a').on('click', function(e) {
            e.preventDefault();
            var rating = $(this).text();
            $ratingSelect.val(rating).trigger('change');
            $(this).siblings('a').removeClass('active');
            $(this).addClass('active').parent().addClass('selected');
        });
    }
    
    function displayRating($placeholder, count, rating) {
        count = parseInt(count) || 0;
        rating = parseFloat(rating) || 0;
        
        if (rating <= 0 || count <= 0) {
            $placeholder.remove();
            return;
        }
        
        var percentage = (rating / 5) * 100;
        var html = '<div class="woocommerce-product-rating">' +
            '<div class="review-rating"><div class="star-rating">' +
            '<span style="width:' + percentage.toFixed(0) + '%">' +
            'Rated <strong class="rating">' + rating.toFixed(2) + '</strong> out of 5 based on ' +
            '<span class="rating">' + count + '</span> customer rating' + (count > 1 ? 's' : '') +
            '</span></div></div>' +
            '<a href="#reviews" class="woocommerce-review-link" rel="nofollow">' +
            '(<span class="count">' + count + '</span> customer review' + (count > 1 ? 's' : '') + ')' +
            '</a></div>';
        
        $placeholder.replaceWith(html);
    }
    
    function setupReviewsToggle(reviewCount, averageRating) {
        if ($('.reviews-toggle-button').length > 0 || $('#tab-reviews').length === 0) {
            return;
        }
        
        var attempts = 0;
        var checkInterval = setInterval(function() {
            attempts++;
            var $stars = $('.woocommerce-product-rating .star-rating').first();
            
            if ($stars.length > 0 || attempts >= 30) {
                clearInterval(checkInterval);
                buildToggle($stars, reviewCount, averageRating);
            }
        }, 100);
    }
    
    function buildToggle($stars, reviewCount, averageRating) {
        reviewCount = parseInt(reviewCount) || 0;
        averageRating = parseFloat(averageRating) || 0;
        
        var $button = $('<div class="reviews-toggle-button"></div>');
        var $content = $('<div class="reviews-button-content"></div>');
        
        $content.append('<span class="reviews-button-text">Reviews</span>');
        
        if (averageRating > 0) {
            var $starsContainer = $('<span class="reviews-button-stars"></span>');
            
            if ($stars.length > 0) {
                $starsContainer.append($stars.clone());
            } else {
                var percentage = (averageRating / 5) * 100;
                $starsContainer.append(
                    '<div class="star-rating" role="img" aria-label="Rated ' + averageRating.toFixed(2) + ' out of 5">' +
                    '<span style="width:' + percentage.toFixed(0) + '%">' +
                    'Rated <strong class="rating">' + averageRating.toFixed(2) + '</strong> out of 5' +
                    '</span></div>'
                );
            }
            
            $starsContainer.append('<span class="reviews-button-rating">' + parseFloat(averageRating).toFixed(1) + '</span>');
            $content.append($starsContainer);
        }
        
        $content.append('<span class="review-count-badge">(' + reviewCount + ')</span>');
        $button.append($content).append('<span class="reviews-toggle-arrow"></span>');
        
        var $tabReviews = $('#tab-reviews').hide();
        $('#tab-description').after($button);
        $button.after($tabReviews);
        
        $button.on('click', function() {
            $(this).toggleClass('active');
            $tabReviews.slideToggle(400);
        });
    }
    
    function handleReviewFormAccess() {
        var $message = $('#review-login-message');
        var $form = $('#review_form');
        
        if ($message.length === 0 || $form.length === 0) {
            return;
        }
        
        var isLoggedIn = $('body').hasClass('logged-in');
        
        if (isLoggedIn) {
            $form.show();
            $message.hide();
        } else {
            $message.show();
            $form.hide();
        }
    }
    
    // ═══════════════════════════════════════════════════════
    // INSTANT REVIEW SUBMISSION
    // ═══════════════════════════════════════════════════════
    
    function setupFormHandler() {
        var $form = $('#commentform');
        if ($form.length === 0) return;
        
        $form.on('submit', function(e) {
            e.preventDefault();
            
            var formData = {
                author: $('#author').val() || $('.logged-in .comment-form-author').text().trim() || 'Anonymous',
                email: $('#email').val() || '',
                comment: $('#comment').val(),
                rating: $('#rating').val(),
                product_id: getProductId(),
                timestamp: Date.now()
            };
            
            // Validate
            if (!formData.comment || !formData.rating) {
                alert('Please provide both a rating and review text.');
                return;
            }

            JUST_SUBMITTED = true;  // Mark as fresh submission

            // Show overlay
            showOverlay();
            
            // Save to localStorage (24 hours)
            savePendingReview(formData);
            
            // Inject review immediately
            injectReviewInstantly(formData, true);
            
            // Submit form via AJAX (triggers GitHub update)
            submitReviewAjax($form, formData);
        });
    }
    
    function showOverlay() {
        var $overlay = $('.review-submitting-overlay');
        if ($overlay.length === 0) {
            $overlay = $('<div class="review-submitting-overlay"><div class="review-submitting-content"><div class="review-submitting-spinner"></div><p>Submitting your review...</p><small>This will take just a moment</small></div></div>');
            $('body').append($overlay);
        }
        
        $overlay.addClass('active');
    }
    
    function hideOverlay() {
        $('.review-submitting-overlay').removeClass('active');
    }
    
    function savePendingReview(formData) {
    var key = 'betterestech_pending_review_' + formData.product_id + '_' + formData.timestamp;
    var reviewData = {
        ...formData,
        user_ip: getUserIP(),
        expires: Date.now() + PENDING_REVIEW_DURATION
    };
    
    // Save to localStorage (browser-specific backup)
    localStorage.setItem(key, JSON.stringify(reviewData));
    
    // ✅ ALSO save to server (IP-based, shared across browsers)
    $.ajax({
        url: (typeof betterestech_data !== 'undefined' ? betterestech_data.ajax_url : '/wp-admin/admin-ajax.php'),
        type: 'POST',
        data: {
            action: 'betterestech_save_pending_review',
            review_data: JSON.stringify(reviewData)
        },
        success: function(response) {
        },
        error: function() {
        }
    });
    
    cleanupOldReviews();
}

    
    function cleanupOldReviews() {
        var keys = Object.keys(localStorage);
        var now = Date.now();
        
        keys.forEach(function(key) {
            if (key.startsWith('betterestech_pending_review_')) {
                try {
                    var data = JSON.parse(localStorage.getItem(key));
                    if (data.expires && data.expires < now) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {}
            }
        });
    }
    
    function injectReviewInstantly(formData, showSuccess) {
        var $commentsList = $('#tab-reviews .commentlist, #reviews .commentlist');
        if ($commentsList.length === 0) {
            return;
        }
        
        var reviewHtml = buildReviewHTML(formData);
        var $newReview = $(reviewHtml);
        
        // Add highlight class
        $newReview.addClass('pending-review').css({
            'background': '#fffbea',
            'border-left': '4px solid #FDA256',
            'padding-left': '15px',
            'margin-bottom': '20px'
        });
        
        // Prepend to list
        $commentsList.prepend($newReview);
        
        // Scroll to it
        setTimeout(function() {
            $('html, body').animate({
                scrollTop: $newReview.offset().top - 100
            }, 500);
        }, 100);
        
        // Show success message
        if (showSuccess || JUST_SUBMITTED) {
    showSuccessMessage(formData.author, formData.rating);
    JUST_SUBMITTED = false;
}
        updateReviewCounts();
    }
    
    function buildReviewHTML(formData) {
        var starWidth = (formData.rating / 5) * 100;
        var avatarUrl = 'https://secure.gravatar.com/avatar/' + md5(formData.email.toLowerCase()) + '?s=60&d=mm&r=g';
        
        return '<li class="review pending-review" id="pending-review-' + formData.timestamp + '">' +
            '<div class="comment_container">' +
            '<img alt="" src="' + avatarUrl + '" class="avatar avatar-60" height="60" width="60">' +
            '<div class="comment-text">' +
            '<div class="star-rating" role="img" aria-label="Rated ' + formData.rating + ' out of 5">' +
            '<span style="width:' + starWidth + '%">Rated <strong class="rating">' + formData.rating + '</strong> out of 5</span>' +
            '</div>' +
            '<p class="meta">' +
            '<strong class="woocommerce-review__author">' + escapeHtml(formData.author) + '</strong> ' +
            '<em class="pending-badge" style="color: #FDA256; font-size: 12px;">(Just posted)</em> ' +
            '&ndash; <time class="woocommerce-review__published-date" datetime="' + new Date().toISOString() + '">Just now</time>' +
            '</p>' +
            '<div class="description"><p>' + escapeHtml(formData.comment) + '</p></div>' +
            '</div>' +
            '</div>' +
            '</li>';
    }
    
    function md5(string) {
        // Simple hash for demo - replace with proper MD5 if needed
        var hash = 0;
        for (var i = 0; i < string.length; i++) {
            hash = ((hash << 5) - hash) + string.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    
    function submitReviewAjax($form, formData) {
        var formDataObj = new FormData($form[0]);
        
        $.ajax({
            url: $form.attr('action'),
            type: 'POST',
            data: formDataObj,
            processData: false,
            contentType: false,
            timeout: 10000,
            success: function() {
                hideOverlay();
                
                // Clear form
                $form[0].reset();
                $('#rating').val('');
                $('.stars a').removeClass('active');
                $('.stars span').removeClass('selected');
            },
            error: function(xhr, status, error) {
                hideOverlay();
                alert('Review saved locally but server update failed. It will sync automatically.');
            }
        });
    }
    function showSuccessMessage(author, rating) {
    // ✅ Only show once per session
    if (sessionStorage.getItem('review_success_shown')) {
        return;
    }
    sessionStorage.setItem('review_success_shown', 'true');
    
    var starsHtml = '';
    for (var i = 1; i <= 5; i++) {
        starsHtml += '<span style="color:' + (i <= rating ? '#FDA256' : '#ddd') + '; font-size:18px; margin:0 2px;">★</span>';
    }
    
    var $message = $('<div class="woocommerce-message review-success-message" style="position: fixed; top: 20px; right: 20px; z-index: 99999; max-width: 400px; padding: 20px; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-left: 4px solid #4caf50; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">' +
        '<div style="display: flex; align-items: center; gap: 15px;">' +
        '<div style="font-size: 40px; line-height: 1;">✅</div>' +
        '<div style="flex: 1;">' +
        '<strong style="font-size: 16px; color: #2e7d32; display: block; margin-bottom: 5px;">Thank you, ' + escapeHtml(author) + '!</strong>' +
        '<p style="margin: 0; color: #558b2f; font-size: 14px;">Your review is now visible below.</p>' +
        '<div style="margin-top: 8px;">' + starsHtml + '</div>' +
        '</div>' +
        '</div>' +
        '</div>');
    
    $('body').append($message);
    
    setTimeout(function() {
        $message.fadeOut(500, function() { $(this).remove(); });
    }, 5000);
}


    
function injectPendingReview() {
    var productId = getProductId();
    if (!productId) return;
    
    // ✅ First check server (IP-based, works across browsers)
    $.ajax({
        url: (typeof betterestech_data !== 'undefined' ? betterestech_data.ajax_url : '/wp-admin/admin-ajax.php'),
        type: 'POST',
        data: {
            action: 'betterestech_get_pending_reviews',
            product_id: productId
        },
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data && response.data.length > 0) {
                
                response.data.forEach(function(reviewData) {
                    // Check if already displayed
                    if ($('#pending-review-' + reviewData.timestamp).length === 0) {
                        injectReviewInstantly(reviewData, false);
                    }
                });
            } else {
                injectFromLocalStorage(productId);
            }
        },
        error: function() {
            injectFromLocalStorage(productId);
        }
    });
}
function injectFromLocalStorage(productId) {
    var keys = Object.keys(localStorage);
    var now = Date.now();
    var foundAny = false;
    
    keys.forEach(function(key) {
        if (key.startsWith('betterestech_pending_review_' + productId)) {
            try {
                var data = JSON.parse(localStorage.getItem(key));
                
                if (data.expires && data.expires < now) {
                    localStorage.removeItem(key);
                    return;
                }
                
                if ($('#pending-review-' + data.timestamp).length === 0) {
                    injectReviewInstantly(data, false);
                    foundAny = true;
                }
            } catch (e) {
            }
        }
    });
    
    if (!foundAny) {
    }
}


    
    // ═══════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════
    
    $(document).ready(function() {
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        // Load reviews from CDN
        $('#reviews-placeholder').html('<div style="padding: 20px; text-align: center; color: #999;">Loading reviews...</div>');
        $('.woocommerce-product-rating[data-load-rating="true"]').html('<div class="rating-loading-dots"><span>•</span><span>•</span><span>•</span></div>');
        
        loadReviewsFromCDN(function(data) {
            if (data) {
                applyReviews(data);
                
                // Setup form handler after reviews load
                setTimeout(function() {
                    setupFormHandler();
                }, 500);
            } else {
                $('#reviews-placeholder').html('');
                $('.woocommerce-product-rating[data-load-rating="true"]').remove();
            }
        });
    });
    
})(jQuery);
