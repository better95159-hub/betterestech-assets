<?php
/**
 * Astra Child Theme Functions
 * 
 * @package Astra Child
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// ============================================
// ENQUEUE PARENT AND CHILD THEME STYLES
// ============================================

add_action('wp_enqueue_scripts', 'astra_child_enqueue_styles');

function astra_child_enqueue_styles() {
    // Enqueue parent theme stylesheet
    wp_enqueue_style('astra-parent-theme', get_template_directory_uri() . '/style.css', array(), wp_get_theme()->parent()->get('Version'));
    
    // Enqueue child theme stylesheet
    wp_enqueue_style('astra-child-theme', get_stylesheet_directory_uri() . '/style.css', array('astra-parent-theme'), wp_get_theme()->get('Version'));
}

// ============================================
// YOUR CUSTOM FUNCTIONS START HERE
// ============================================
// ============================================================================
// SAFE REST API HANDLING - Improved Version
// ============================================================================

// Only run this during ACTUAL REST API requests
if (defined('REST_REQUEST') && REST_REQUEST && strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
    
    // Clean output buffer before REST response
    add_action('rest_pre_serve_request', function() {
        if (ob_get_level()) {
            ob_end_clean();
        }
    }, 0);
    
    // Prevent WooCommerce session initialization
    add_filter('woocommerce_session_handler', function() {
        return 'WC_Session_Handler';
    });
    
    // Remove WooCommerce hooks
    remove_action('init', 'wc_load_cart', 10);
    remove_action('wp_loaded', array('WC_Form_Handler', 'process_login'), 20);
    remove_action('wp_loaded', array('WC_Form_Handler', 'process_registration'), 20);
}

// ============================================================================
// HELPER: Safe WooCommerce session check (CORRECTED)
// ============================================================================
function is_safe_to_use_wc_session() {
    // 1. Not safe during REST API requests
    if (defined('REST_REQUEST') && REST_REQUEST) {
        return false;
    }
    
    // 2. Not safe in admin (EXCEPT during AJAX - which is needed!)
    if (is_admin() && !wp_doing_ajax()) {
        return false;
    }
    
    // 3. Check if WooCommerce and session exist
    if (!function_exists('WC')) {
        return false;
    }
    
    if (!WC()->session || !is_object(WC()->session)) {
        return false;
    }
    
    // 4. All checks passed - safe to use!
    return true;
}
// Ensure jQuery loads properly - FRONTEND ONLY
add_action('wp_enqueue_scripts', 'ensure_jquery_loaded', 1);
function ensure_jquery_loaded() {
    // ✅ Only run on frontend
    if (is_admin()) {
        return;
    }
    
    if (!defined('REST_REQUEST')) {
        wp_enqueue_script('jquery');
    }
}
// Custom Favicons
function my_custom_favicons() {
    echo '<link rel="apple-touch-icon" sizes="180x180" href="https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/site-icons/apple-touch-icon.png?_t=1759396538">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="96x96" href="https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/site-icons/favicon-96x96.png?_t=1759396538">' . "\n";
    echo '<link rel="icon" type="image/svg+xml" href="https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/uploads/favicon.svg">' . "\n";
    echo '<link rel="shortcut icon" href="https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/site-icons/favicon.ico?_t=1759396538">' . "\n";
    echo '<link rel="manifest" href="https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/site-icons/web-app-manifest-192x192.png?_t=1759396538t">' . "\n";
}
add_action('wp_head', 'my_custom_favicons');

// UPDATED CUSTOM ORDER STATUSES (6 statuses)
function custom_register_order_statuses() {
    register_post_status('wc-order-received', array(
        'label' => 'Order Received',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Order Received <span class="count">(%s)</span>', 'Order Received <span class="count">(%s)</span>'),
    ));
    register_post_status('wc-ready-dispatch', array(
        'label' => 'Ready for Dispatch',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Ready for Dispatch <span class="count">(%s)</span>', 'Ready for Dispatch <span class="count">(%s)</span>'),
    ));
    register_post_status('wc-dispatched', array(
        'label' => 'Order Dispatched',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Order Dispatched <span class="count">(%s)</span>', 'Order Dispatched <span class="count">(%s)</span>'),
    ));
    register_post_status('wc-shipped', array(
        'label' => 'Shipped',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Shipped <span class="count">(%s)</span>', 'Shipped <span class="count">(%s)</span>'),
    ));
    register_post_status('wc-out-delivery', array(
        'label' => 'Out for Delivery',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Out for Delivery <span class="count">(%s)</span>', 'Out for Delivery <span class="count">(%s)</span>'),
    ));
    register_post_status('wc-delivered', array(
        'label' => 'Delivered',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Delivered <span class="count">(%s)</span>', 'Delivered <span class="count">(%s)</span>'),
    ));
}
add_action('init', 'custom_register_order_statuses');

// Add to WooCommerce dropdown
function custom_add_order_statuses($order_statuses) {
    $new_statuses = array();
    foreach ($order_statuses as $key => $label) {
        $new_statuses[$key] = $label;
        if ('wc-processing' === $key) {
            $new_statuses['wc-order-received'] = 'Order Received';
            $new_statuses['wc-ready-dispatch'] = 'Ready for Dispatch';
            $new_statuses['wc-dispatched'] = 'Order Dispatched';
            $new_statuses['wc-shipped'] = 'Shipped';
            $new_statuses['wc-out-delivery'] = 'Out for Delivery';
            $new_statuses['wc-delivered'] = 'Delivered';
        }
    }
    return $new_statuses;
}
add_filter('wc_order_statuses', 'custom_add_order_statuses');

// MODERN ORDER TRACKING SYSTEM - ORDER ID ONLY
add_shortcode('modern_order_tracking', 'modern_order_tracking_display');
function modern_order_tracking_display($atts) {
    ob_start();
    
    // Handle form submission
    $order_details = null;
    $error_message = '';
    
    if (isset($_POST['track_order']) && !empty($_POST['order_id'])) {
        $order_id = sanitize_text_field($_POST['order_id']);
        
        // Remove # if present
        $order_id = str_replace('#', '', $order_id);
        
        // Find order by ID
$order = wc_get_order($order_id);
if ($order && is_a($order, 'WC_Order')) {
            $order_details = $order;
        } else {
            $error_message = 'Order not found. Please check your Order ID.';
        }
    }
    ?>
    
    <div class="modern-tracking-container">
        <?php if (!$order_details): ?>
            <!-- SEARCH FORM -->
            <div class="tracking-search-section">
                <div class="search-header">
                    <h2>🔍 Track Your Order</h2>
                    <p>Enter your Order ID to get real-time tracking updates</p>
                </div>
                
                <?php if ($error_message): ?>
                    <div class="error-alert">
                        <i class="fas fa-exclamation-triangle"></i>
                        <?php echo $error_message; ?>
                    </div>
                <?php endif; ?>
                
                <form method="post" class="modern-tracking-form">
                    <div class="input-group">
                        <input type="text" id="order_id" name="order_id" required 
                               placeholder="Enter Order ID (e.g., #12345)" 
                               value="<?php echo isset($_POST['order_id']) ? esc_attr($_POST['order_id']) : ''; ?>">
                        <button type="submit" name="track_order" class="track-btn">
                            <i class="fas fa-search"></i> Track Order
                        </button>
                    </div>
                </form>
            </div>
        <?php else: ?>
            <!-- TRACKING RESULTS -->
            <?php display_modern_order_tracking($order_details); ?>
        <?php endif; ?>
    </div>
    
    <?php
    return ob_get_clean();
}

// Display modern order tracking details
function display_modern_order_tracking($order) {
    $order_status = $order->get_status();
    $order_date = $order->get_date_created();
    $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();
    $customer_phone = $order->get_billing_phone();
    $order_items = $order->get_items();
    
    // Define 6-stage tracking system
    $tracking_stages = array(
        'order-received' => array(
            'label' => 'Order Received',
            'icon' => 'fas fa-clipboard-check',
            'color' => '#28a745'
        ),
        'ready-dispatch' => array(
            'label' => 'Ready for Dispatch',
            'icon' => 'fas fa-box-open',
            'color' => '#ffc107'
        ),
        'dispatched' => array(
            'label' => 'Order Dispatched',
            'icon' => 'fas fa-shipping-fast',
            'color' => '#17a2b8'
        ),
        'shipped' => array(
            'label' => 'Shipped',
            'icon' => 'fas fa-truck',
            'color' => '#6f42c1'
        ),
        'out-delivery' => array(
            'label' => 'Out for Delivery',
            'icon' => 'fas fa-route',
            'color' => '#fd7e14'
        ),
        'delivered' => array(
            'label' => 'Delivered',
            'icon' => 'fas fa-home',
            'color' => '#20c997'
        )
    );
    
    $current_stage_index = array_search($order_status, array_keys($tracking_stages));
    if ($current_stage_index === false) $current_stage_index = 0;
    
    $current_status_label = isset($tracking_stages[$order_status]) ? 
        $tracking_stages[$order_status]['label'] : 
        ucwords(str_replace('-', ' ', $order_status));
    ?>
    
    <!-- ORDER ID HEADER -->
   <div class="order-header">
    <h1> Order #<?php echo $order->get_order_number(); ?></h1>
    <div class="order-meta">
        <span class="order-date">
            <i class="fas fa-calendar-alt"></i> 
            <span class="date-text">Placed on <?php echo $order_date->date('F j, Y'); ?></span>
        </span>
        <span class="order-total">
            <i class="fas fa-money-bill-wave"></i> 
            <span class="total-text">Total: <?php 

            // Use currency converter snippet for order total
// Use cookie instead of session (safer for cached pages)
$user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';

if ($user_currency === 'USD' || $user_currency === $order->get_currency()) {
    echo wc_price($order->get_total());
} else {
// AFTER (with caching)
$cache_key = 'order_total_' . $order->get_id() . '_' . $user_currency;
$converted_total = get_transient($cache_key);

if ($converted_total === false) {
    $rate = get_safe_exchange_rate($user_currency);
    $converted_total = round($order->get_total() * $rate, 0);
    set_transient($cache_key, $converted_total, 12 * HOUR_IN_SECONDS);
}

echo get_safe_symbol($user_currency) . number_format($converted_total, 0);
}

            ?></span>
        </span>
    </div>
</div>
    
    <!-- CUSTOMER DETAILS -->
    <div class="customer-details-card">
        <h3><i class="fas fa-user"></i> Customer Details</h3>
        <div class="customer-info">
            <div class="info-item">
                <span class="label">Name:</span>
                <span class="value"><?php echo $customer_name; ?></span>
            </div>
            <div class="info-item">
                <span class="label">Mobile:</span>
                <span class="value"><?php echo $customer_phone; ?></span>
            </div>
        </div>
    </div>
    
    <!-- CURRENT STATUS -->
<div class="current-status-card">
    <h3>Current Order Status</h3>
    <div class="status-display">
        <div class="status-icon blinking-purple">
            <i class="<?php echo $tracking_stages[array_keys($tracking_stages)[$current_stage_index]]['icon']; ?>"></i>
        </div>
        <div class="status-text">
            <h4><?php echo $current_status_label; ?></h4>
            <p>Your order is currently being processed</p>
        </div>
    </div>
</div>
    
    <!-- PROGRESS BAR -->
    <div class="progress-section">
        <h3>Order Progress</h3>
        <div class="modern-progress-bar">
            <?php foreach ($tracking_stages as $key => $stage): ?>
                <?php 
                $stage_index = array_search($key, array_keys($tracking_stages));
                $is_completed = $stage_index <= $current_stage_index;
                $is_current = $stage_index == $current_stage_index;
                ?>
                
                <div class="progress-checkpoint <?php echo $is_completed ? 'completed' : ''; ?> <?php echo $is_current ? 'active' : ''; ?>">
                    <div class="checkpoint-circle" style="<?php echo $is_completed ? 'background-color: ' . $stage['color'] : ''; ?>">
                        <i class="<?php echo $stage['icon']; ?>"></i>
                    </div>
                    <div class="checkpoint-label"><?php echo $stage['label']; ?></div>
                    
                    <?php if ($stage_index < count($tracking_stages) - 1): ?>
                        <div class="progress-line <?php echo $is_completed ? 'completed' : ''; ?>"></div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- PRODUCT DETAILS -->
<div class="products-section">
    <h3><i class="fas fa-shopping-bag"></i> Order Items</h3>
    <div class="products-grid">
<?php 
// ✅ GET RATE ONCE BEFORE LOOP (NOT INSIDE!)
$user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
$exchange_rate = 1; // Default for USD

if ($user_currency !== 'USD') {
    $exchange_rate = get_safe_exchange_rate($user_currency); // ✅ Called ONCE only
}

foreach ($order_items as $item): 
    $product = $item->get_product();
    $product_name = $item->get_name();
    $product_quantity = $item->get_quantity();
    
    // Use currency converter snippet for product prices
    if ($product) {
        if ($user_currency === 'USD') {
            $product_total_converted = $item->get_total();
        } else {
            $product_total_converted = round($item->get_total() * $exchange_rate, 0); // ✅ Use pre-calculated rate
        }
    }


    $product_image = $product ? wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') : '';
    $product_link = $product ? $product->get_permalink() : '#';
    ?>
    <div class="product-card">
        <div class="product-image">
            <?php if ($product_image): ?>
                <img src="<?php echo $product_image; ?>" alt="<?php echo $product_name; ?>">
            <?php else: ?>
                <div class="no-image"><i class="fas fa-image"></i></div>
            <?php endif; ?>
        </div>
        <div class="product-details">
            <h4><a href="<?php echo $product_link; ?>" target="_blank"><?php echo $product_name; ?></a></h4>
            <div class="product-meta">
                <span class="quantity">Qty: <?php echo $product_quantity; ?></span>
                <span class="price"><?php echo wc_price($product_total_converted); ?></span>
            </div>
        </div>
    </div>
<?php endforeach; ?>
    </div>
</div>

    <!-- BACK TO SEARCH -->
    <div class="back-to-search">
        <form method="post">
            <button type="submit" class="back-btn">
                <i class="fas fa-arrow-left"></i> Track Another Order
            </button>
        </form>
    </div>
    
    <?php
}

// MODERN MY ACCOUNT SHORTCODE
add_shortcode('modern_my_account', 'modern_my_account_display');
function modern_my_account_display($atts) {
    ob_start();
    
    // Check if user is logged in
    if (is_user_logged_in()) {
        display_account_dashboard();
    } else {
        display_modern_login_form();
    }
    
    return ob_get_clean();
}

function display_modern_login_form() {
    // Cache values once to avoid repeated function calls
    $ajax_url = admin_url('admin-ajax.php');
    $google_client_id = get_option('google_client_id', '');
    $google_oauth_nonce = wp_create_nonce('google_oauth_state');
    $facebook_auth_nonce = wp_create_nonce('facebook_auth_nonce');
    $forgot_password_nonce = wp_create_nonce('forgot_password_nonce');
    ?>
    <div class="modern-account-container">
        <div class="account-form-wrapper">
            
            <!-- TABS -->
            <div class="account-tabs">
                <button class="tab-btn active" data-tab="login">Login</button>
                <button class="tab-btn" data-tab="register">Register</button>
            </div>
            
            <!-- LOGIN TAB -->
            <div id="login-form" class="tab-content active">
                <div class="form-header">
                    <h2>👋 Welcome Back!</h2>
                    <p>Sign in to your account</p>
                </div>
                
                <form method="post" class="modern-auth-form">
                    <?php wp_nonce_field('custom_login_nonce', 'login_nonce'); ?>
                    
                    <div class="form-group">
                        <label for="login_email">Email Address</label>
                        <input type="email" id="login_email" name="login_email" required placeholder="Enter your email">
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                    
                    <div class="form-group">
                        <label for="login_password">Password</label>
                        <input type="password" id="login_password" name="login_password" required placeholder="Enter your password">
                        <i class="fas fa-lock input-icon"></i>
                        <i class="fas fa-eye password-toggle" onclick="togglePassword('login_password')"></i>
                    </div>
                    
                    <div class="form-options">
                        <span class="new-user">New user? <a href="#" onclick="switchTab('register')">Register</a></span>
                        <a href="#" class="forgot-password" onclick="showForgotPassword()">Forgot Password?</a>
                    </div>
                    
                    <button type="submit" name="custom_login" class="auth-btn primary">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    
                    <div class="divider">
                        <span>or continue with</span>
                    </div>
                    
                    <div class="social-login">
                        <button type="button" class="social-btn google" onclick="loginWithGoogle()">
                            <i class="fab fa-google"></i> Sign in with Google
                        </button>
                        <button type="button" class="social-btn facebook" onclick="loginWithFacebook()">
                            <i class="fab fa-facebook-f"></i> Continue with Facebook
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- REGISTER TAB -->
            <div id="register-form" class="tab-content">
                <div class="form-header">
                    <h2>🚀 Create Account</h2>
                    <p>Join us today</p>
                </div>
                
                <form method="post" class="modern-auth-form">
                    <?php wp_nonce_field('custom_register_nonce', 'register_nonce'); ?>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="register_first_name">First Name</label>
                            <input type="text" id="register_first_name" name="register_first_name" required placeholder="First name">
                            <i class="fas fa-user input-icon"></i>
                        </div>
                        <div class="form-group">
                            <label for="register_last_name">Last Name</label>
                            <input type="text" id="register_last_name" name="register_last_name" required placeholder="Last name">
                            <i class="fas fa-user input-icon"></i>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_email">Email Address</label>
                        <input type="email" id="register_email" name="register_email" required placeholder="Enter your email">
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_password">Password</label>
                        <input type="password" id="register_password" name="register_password" required placeholder="Create a password" minlength="6">
                        <i class="fas fa-lock input-icon"></i>
                        <i class="fas fa-eye password-toggle" onclick="togglePassword('register_password')"></i>
                    </div>
                    
                    <div class="form-options">
                        <span class="new-user">Already have account? <a href="#" onclick="switchTab('login')">Login</a></span>
                    </div>
                    
                    <button type="submit" name="custom_register" class="auth-btn primary">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                    
                    <div class="divider">
                        <span>or continue with</span>
                    </div>
                    
                    <div class="social-login">
                        <button type="button" class="social-btn google" onclick="registerWithGoogle()">
                            <i class="fab fa-google"></i> Continue with Google
                        </button>
                        <button type="button" class="social-btn facebook" onclick="registerWithFacebook()">
                            <i class="fab fa-facebook-f"></i> Continue with Facebook
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- FORGOT PASSWORD MODAL -->
    <div id="forgot-password-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔑 Reset Password</h3>
                <button class="modal-close" onclick="closeForgotPassword()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <form method="post" id="forgotPasswordForm">
                    <?php wp_nonce_field('forgot_password_nonce', 'forgot_nonce'); ?>
                    <div class="form-group">
                        <label for="forgot_email">Email Address</label>
                        <input type="email" id="forgot_email" name="forgot_email" required placeholder="Enter your email">
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                    <button type="submit" name="forgot_password" class="auth-btn primary">
                        <i class="fas fa-paper-plane"></i> Send Reset Link
                    </button>
                    <button type="button" class="auth-btn secondary" onclick="closeForgotPassword()">
                        Cancel
                    </button>
                </form>
                <div id="forgot-message" style="display: none; margin-top: 15px;"></div>
            </div>
        </div>
    </div>

    <script>
    // Tab switching
    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Password toggle
    function togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const toggle = field.parentElement.querySelector('.password-toggle');
        
        if (field.type === 'password') {
            field.type = 'text';
            toggle.classList.remove('fa-eye');
            toggle.classList.add('fa-eye-slash');
        } else {
            field.type = 'password';
            toggle.classList.remove('fa-eye-slash');
            toggle.classList.add('fa-eye');
        }
    }
    
    // Forgot password modal functions
    function showForgotPassword() {
        document.getElementById('forgot-password-modal').style.display = 'flex';
        document.getElementById('forgot_email').focus();
    }
    
    function closeForgotPassword() {
        document.getElementById('forgot-password-modal').style.display = 'none';
        document.getElementById('forgot-message').style.display = 'none';
        document.getElementById('forgotPasswordForm').reset();
    }
    
// Social login functions - Updated
// FIXED Social login functions
function loginWithGoogle() {
    // Direct OAuth2 redirect (no pop-up, no SDK needed!)
    var clientId = '<?php echo esc_js($google_client_id); ?>';
    var redirectUri = encodeURIComponent('<?php echo home_url('/my-account'); ?>');
    var scope = encodeURIComponent('email profile');
    var state = encodeURIComponent('<?php echo esc_js($google_oauth_nonce); ?>');
    
    var oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        'client_id=' + clientId +
        '&redirect_uri=' + redirectUri +
        '&response_type=code' +
        '&scope=' + scope +
        '&state=' + state +
        '&prompt=select_account'; // Forces account selection
    
    // Redirect user to Google
    window.location.href = oauthUrl;
}

function registerWithGoogle() {
    loginWithGoogle();
}


function loginWithFacebook() {
    // Load Facebook SDK on-demand
    if (typeof FB === 'undefined') {
        loadFacebookSDK(function() {
            performFacebookLogin();
        });
    } else {
        performFacebookLogin();
    }
}

function loadFacebookSDK(callback) {
    var script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onload = function() {
        FB.init({
            appId: '<?php echo esc_js(get_option('facebook_app_id', '')); ?>',
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });
        callback();
    };
    document.head.appendChild(script);
}
function performFacebookLogin() {
    FB.login(function(response) {
        if (response.authResponse) {
            FB.api('/me', {fields: 'name,email,first_name,last_name'}, function(user) {
                // Send user data to WordPress
                fetch('<?php echo esc_url($ajax_url); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=facebook_auth&user_data=' + encodeURIComponent(JSON.stringify(user)) + '&access_token=' + response.authResponse.accessToken + '&security=<?php echo esc_js($facebook_auth_nonce); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert('Facebook sign-in failed: ' + (data.data || 'Please try again.'));
                    }
                })
                .catch(error => {
                    alert('Network error. Please try again.');
                });
            });
        } else {
            alert('Facebook login was cancelled.');
        }
    }, {scope: 'email'});
}
function registerWithFacebook() {
    loginWithFacebook();
}

    
    // Close modal when clicking outside
    document.getElementById('forgot-password-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeForgotPassword();
        }
    });
    
    // Handle forgot password form
    document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
         // ✅ Prevent multiple submissions
    var submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    
    const email = document.getElementById('forgot_email').value;
    const messageDiv = document.getElementById('forgot-message');
        
        // Show loading
        messageDiv.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Sending reset link...</div>';
        messageDiv.style.display = 'block';
        
        // Send AJAX request
         fetch('<?php echo esc_url($ajax_url); ?>', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=forgot_password_request&email=${encodeURIComponent(email)}&nonce=<?php echo esc_js($forgot_password_nonce); ?>`
        })
        .then(response => response.json())
        // Update the success message in your AJAX response
.then(data => {
    if (data.success) {
        messageDiv.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i> 
                <div class="reset-message-content">
                    <div class="primary-message">Password reset link sent successfully!</div>
                    <div class="secondary-message">Please check your <strong>email inbox</strong> and <strong>spam folder</strong> for the reset link.</div>
                </div>
            </div>
        `;
        document.getElementById('forgotPasswordForm').style.display = 'none';
    } else {
        messageDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> ' + (data.data || 'Error sending reset link. Please try again.') + '</div>';
    }
})
        .catch(error => {
            messageDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Network error. Please try again.</div>';
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
        });
    });
    </script>
    <?php
}

// ENHANCED ACCOUNT DASHBOARD - With phone number display
function display_account_dashboard() {
    $current_user = wp_get_current_user();
    
    // ✅ OPTIMIZED: Get only recent orders (limit 5)
    $recent_orders = wc_get_orders(array(
        'customer' => $current_user->ID,
        'limit' => 5,
        'orderby' => 'date',
        'order' => 'DESC',
        'status' => array('completed', 'processing', 'on-hold', 'shipped', 'delivered', 'order-received', 'ready-dispatch', 'dispatched', 'out-delivery')
    ));
    
    // ✅ OPTIMIZED: Use WooCommerce customer data for totals (cached)
    $customer = new WC_Customer($current_user->ID);
    $order_count = $customer->get_order_count();
    $total_spent = $customer->get_total_spent();
    
    // Get user's phone number
    $user_phone = get_user_meta($current_user->ID, 'phone', true);
    
// ✅ Get user's currency from cookie (safer for cached pages)
$user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
$exchange_rate = 1;

if ($user_currency !== 'USD') {
    $exchange_rate = get_safe_exchange_rate($user_currency);
}

$total_spent_converted = ($user_currency === 'USD') ? $total_spent : round($total_spent * $exchange_rate, 0);

    ?>
    
    <div class="account-dashboard">
        <!-- ENHANCED DASHBOARD HEADER WITH PHONE -->
        <div class="dashboard-header">
            <div class="user-welcome">
                <div class="user-avatar">
    <?php 
    $user_id = $current_user->ID;
    $custom_pic = get_user_meta($user_id, 'custom_profile_picture', true);
    $google_pic = get_user_meta($user_id, 'google_profile_picture', true);
    
    if (!empty($custom_pic)) {
        $profile_url = wp_get_attachment_image_url($custom_pic, 'medium');
        echo '<img src="' . esc_url($profile_url) . '" alt="Profile Picture" width="80" height="80" style="border-radius: 50%; object-fit: cover;">';
    } elseif (!empty($google_pic)) {
        echo '<img src="' . esc_url($google_pic) . '" alt="Profile Picture" width="80" height="80" style="border-radius: 50%; object-fit: cover;">';
   } else {
    // Use your custom default profile picture instead of Gravatar
$default_profile = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';

    echo '<img src="' . esc_url($default_profile) . '" alt="Profile Picture" width="80" height="80" style="border-radius: 50%; object-fit: cover;">';
}

    ?>
</div>
                <div class="user-info">
                    <h2>Hello, <?php echo $current_user->display_name; ?>! 👋</h2>
                    <p><?php echo $current_user->user_email; ?></p>
                    <?php if (!empty($user_phone)): ?>
                        <p class="user-phone">📱 <?php echo esc_html($user_phone); ?></p>
                    <?php endif; ?>
                    <div class="user-stats">
                        <span class="stat">📦 <?php echo $order_count; ?> Orders</span>
                        <span class="stat">💰 <?php echo wc_price($total_spent_converted, array('currency' => $user_currency)); ?> Total</span>
                    </div>
                </div>
            </div>
<a href="<?php echo wp_logout_url(home_url('/')); ?>" class="logout-btn">
    <i class="fas fa-sign-out-alt"></i> Logout
</a>
        </div>
        
        <!-- REST OF THE CODE REMAINS THE SAME -->
        <div class="dashboard-content">
            <div class="dashboard-cards">
                <div class="dash-card orders" onclick="window.location.href='<?php echo home_url('/all-orders/'); ?>';" style="cursor: pointer;">
                    <div class="card-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="card-info">
                        <h3><?php echo $order_count; ?></h3>
                        <p>Total Orders</p>
                        <small><?php echo count($recent_orders); ?> recent</small>
                    </div>
                </div>
                
                <div class="dash-card spending">
                    <div class="card-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="card-info">
                        <h3><?php echo wc_price($total_spent_converted, array('currency' => $user_currency)); ?></h3>
                        <p>Total Spent</p>
                        <small>In <?php echo $user_currency; ?></small>
                    </div>
                </div>
                
                <div class="dash-card profile" onclick="window.location.href='/account-settings/';" style="cursor: pointer;">
                    <div class="card-icon">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <div class="card-info">
                        <h3>Profile</h3>
                        <p>Account Settings</p>
                        <small>Manage details</small>
                    </div>
                </div>
                
                <div class="dash-card track" onclick="window.location.href='<?php echo home_url('/track-order/'); ?>';" style="cursor: pointer;">
                    <div class="card-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div class="card-info">
                        <h3>Track Orders</h3>
                        <p>Real-time Status</p>
                        <small>Live updates</small>
                    </div>
                </div>
            </div>
            
            <!-- RECENT ORDERS SECTION - SAME AS BEFORE -->
            <?php if (!empty($recent_orders)): ?>
            <div class="recent-orders">
                <h3>Recent Orders</h3>
                <div class="orders-list">
                    <?php 
                    // ✅ Calculate exchange rate ONCE before loop
                    $loop_exchange_rate = ($user_currency !== 'USD') ? $exchange_rate : 1;
                    
                    foreach ($recent_orders as $order): 
                        $order_total = $order->get_total();
                        $order_total_converted = ($user_currency === 'USD') ? $order_total : round($order_total * $loop_exchange_rate, 0);
                    ?>

                        <div class="order-item enhanced">
                            <div class="order-info">
                                <span class="order-number">#<?php echo $order->get_order_number(); ?></span>
                                <span class="order-date"><?php echo $order->get_date_created()->format('M j, Y'); ?></span>
                                <span class="order-status status-<?php echo $order->get_status(); ?>">
                                    <i class="fas fa-circle"></i>
                                    <?php echo ucwords(str_replace('-', ' ', $order->get_status())); ?>
                                </span>
                                <span class="order-total">
                                    <?php echo wc_price($order_total_converted, array('currency' => $user_currency)); ?>
                                </span>
                            </div>
                            <div class="order-actions">
                                <a href="/track-order/?order_id=<?php echo $order->get_order_number(); ?>" class="track-btn-small">
                                    <i class="fas fa-eye"></i> Track
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}

// FIXED LOGIN HANDLER - No more page refresh
add_action('init', 'handle_custom_login');
function handle_custom_login() {
    if (isset($_POST['custom_login']) && wp_verify_nonce($_POST['login_nonce'], 'custom_login_nonce')) {
        $email = sanitize_email($_POST['login_email']);
        $password = $_POST['login_password'];
        
        $user = get_user_by('email', $email);
        if ($user && wp_check_password($password, $user->user_pass, $user->ID)) {
            wp_clear_auth_cookie();
            wp_set_auth_cookie($user->ID, true, is_ssl());
            wp_set_current_user($user->ID);
            
            // ✅ Direct redirect (no inline script needed)
            wp_redirect(home_url('/my-account/'));
            exit;

} else {
    // Redirect back with error parameter
    wp_redirect(add_query_arg('login_error', '1', wp_get_referer()));
    exit;
}
    }
}

// Handle registration
add_action('init', 'handle_custom_register');
function handle_custom_register() {
    if (isset($_POST['custom_register']) && wp_verify_nonce($_POST['register_nonce'], 'custom_register_nonce')) {
        $first_name = sanitize_text_field($_POST['register_first_name']);
        $last_name = sanitize_text_field($_POST['register_last_name']);
        $email = sanitize_email($_POST['register_email']);
        $password = $_POST['register_password'];
        
if (username_exists($email) || email_exists($email)) {
    wp_redirect(add_query_arg('register_error', '1', wp_get_referer()));
    exit;
}
        
        $user_id = wp_create_user($email, $password, $email);
        if (!is_wp_error($user_id)) {
            wp_update_user(array(
                'ID' => $user_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'display_name' => $first_name . ' ' . $last_name
            ));
            
            wp_set_auth_cookie($user_id, true);
            wp_redirect($_SERVER['REQUEST_URI']);
            exit;
        }
    }
}

// Handle forgot password request
add_action('wp_ajax_forgot_password_request', 'handle_forgot_password_request');
add_action('wp_ajax_nopriv_forgot_password_request', 'handle_forgot_password_request');
function handle_forgot_password_request() {
    if (!wp_verify_nonce($_POST['nonce'], 'forgot_password_nonce')) {
        wp_send_json_error('Security check failed.');
    }
    
    $email = sanitize_email($_POST['email']);
    
    if (!is_email($email)) {
        wp_send_json_error('Please enter a valid email address.');
    }
    
    $user = get_user_by('email', $email);
    
    if (!$user) {
        wp_send_json_error('No account found with that email address.');
    }
    
    // Generate password reset key
    $reset_key = get_password_reset_key($user);
    
    if (is_wp_error($reset_key)) {
        wp_send_json_error('Error generating reset key.');
    }
    
    // Create reset link
    $reset_link = network_site_url("wp-login.php?action=rp&key=$reset_key&login=" . rawurlencode($user->user_login), 'login');
    
    // Send email
    $subject = get_bloginfo('name') . ' - Password Reset';
    $message = "Hi " . $user->display_name . ",\n\n";
    $message .= "You requested a password reset. Click the link below to reset your password:\n\n";
    $message .= $reset_link . "\n\n";
    $message .= "If you didn't request this, please ignore this email.\n\n";
    $message .= "Thanks,\n" . get_bloginfo('name');
    
    $sent = wp_mail($email, $subject, $message);
    
    if ($sent) {
        wp_send_json_success('Password reset email sent successfully.');
    } else {
        wp_send_json_error('Error sending email. Please try again.');
    }
}

// Add admin settings for Google Client ID and Client Secret
add_action('admin_menu', 'add_social_auth_settings');
function add_social_auth_settings() {
    add_options_page(
        'Social Authentication',
        'Social Auth',
        'manage_options',
        'social-auth',
        'social_auth_settings_page'
    );
}

// Register settings in General Settings page (so they appear there too)
add_action('admin_init', 'register_google_oauth_settings');
function register_google_oauth_settings() {
    register_setting('general', 'google_client_id');
    register_setting('general', 'google_client_secret');
    
    add_settings_field(
        'google_client_id',
        'Google Client ID',
        'google_client_id_callback',
        'general'
    );
    
    add_settings_field(
        'google_client_secret',
        'Google Client Secret',
        'google_client_secret_callback',
        'general'
    );
}

function google_client_id_callback() {
    $value = get_option('google_client_id', '');
    echo '<input type="text" name="google_client_id" value="' . esc_attr($value) . '" class="regular-text" />';
    echo '<p class="description">Get this from <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a></p>';
}


// Custom Social Auth Settings Page
function social_auth_settings_page() {
    if (isset($_POST['submit'])) {
        // ✅ FIXED: Now saves Client Secret too!
        update_option('google_client_id', sanitize_text_field($_POST['google_client_id']));
        update_option('google_client_secret', sanitize_text_field($_POST['google_client_secret'])); // ← ADDED
        update_option('facebook_app_id', sanitize_text_field($_POST['facebook_app_id']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $google_client_id = get_option('google_client_id', '');
    $google_client_secret = get_option('google_client_secret', ''); // ← ADDED
    $facebook_app_id = get_option('facebook_app_id', '');
    ?>
    <div class="wrap">
        <h1>Social Authentication Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th scope="row">Google Client ID</th>
                    <td>
                        <input type="text" name="google_client_id" value="<?php echo esc_attr($google_client_id); ?>" class="regular-text" />
                        <p class="description">Get this from <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a></p>
                    </td>
                </tr>
                <!-- ✅ ADDED: Client Secret Field -->
                <tr>
                    <th scope="row">Google Client Secret</th>
                    <td>
                        <input type="text" name="google_client_secret" value="<?php echo esc_attr($google_client_secret); ?>" class="regular-text" />
                        <p class="description">Client Secret from Google Cloud Console (required for OAuth2 redirect method)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Facebook App ID</th>
                    <td>
                        <input type="text" name="facebook_app_id" value="<?php echo esc_attr($facebook_app_id); ?>" class="regular-text" />
                        <p class="description">Get this from <a href="https://developers.facebook.com/" target="_blank">Facebook Developers</a></p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// FIX EMAIL SENDING - Quick Email Fix
add_action('phpmailer_init', 'configure_smtp');
function configure_smtp($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host = 'smtp.gmail.com';
    $phpmailer->SMTPAuth = true;
    $phpmailer->Port = 587;
    $phpmailer->SMTPSecure = 'tls';
    $phpmailer->Username = 'betterestech@gmail.com';
    $phpmailer->Password = 'cupt pgrw tgku jgcf';
    $phpmailer->From = 'betterestech@gmail.com';
    $phpmailer->FromName = get_bloginfo('name');
    
    $phpmailer->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );
}


// ENHANCED Handle Google authentication - WITH PROFILE PICTURE SAVING
add_action('wp_ajax_google_auth', 'handle_google_auth');
add_action('wp_ajax_nopriv_google_auth', 'handle_google_auth');
function handle_google_auth() {
    if (!wp_verify_nonce($_POST['security'], 'google_auth_nonce')) {
        wp_send_json_error('Security check failed');
    }
    
    $id_token = sanitize_text_field($_POST['id_token']);
    
    // Verify the Google ID token
    $google_client_id = get_option('google_client_id');
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;
    $response = wp_remote_get($url);
    
    if (!is_wp_error($response)) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['email']) && $data['aud'] === $google_client_id) {
            $email = sanitize_email($data['email']);
            $name = sanitize_text_field($data['name']);
            $first_name = sanitize_text_field($data['given_name']);
            $last_name = sanitize_text_field($data['family_name']);
            $profile_picture = esc_url_raw($data['picture']); // Get Google profile picture
            
            // Check if user exists
            $user = get_user_by('email', $email);
            
            if (!$user) {
                // Create new user
                $user_id = wp_create_user($email, wp_generate_password(), $email);
                if (!is_wp_error($user_id)) {
                    wp_update_user(array(
                        'ID' => $user_id,
                        'first_name' => $first_name,
                        'last_name' => $last_name,
                        'display_name' => $name,
                        'role' => 'customer'
                    ));
                    $user = get_user_by('ID', $user_id);
                }
            } else {
                $user_id = $user->ID;
            }
            
            // Save Google profile picture
            if (!empty($profile_picture) && $user_id) {
                update_user_meta($user_id, 'google_profile_picture', $profile_picture);
            }
            
            if ($user) {
                wp_set_auth_cookie($user->ID, true);
                wp_send_json_success('Login successful');
            }
        }
    }
    
    wp_send_json_error('Invalid Google token');
}
// ===== NEW: OAuth2 Callback Handler (for direct redirect method) =====
add_action('template_redirect', 'handle_google_oauth_callback', 1);
function handle_google_oauth_callback() {
    // ✅ OPTIMIZED: Early exit if not OAuth callback (runs on EVERY page!)
    if (!isset($_GET['code']) || !isset($_GET['state']) || !isset($_GET['scope'])) {
        return; // Skip processing - not an OAuth callback
    }
    
    // Verify state token (CSRF protection)
    if (!wp_verify_nonce($_GET['state'], 'google_oauth_state')) {
        wp_die('Security check failed. Please try logging in again.');
    }
    
    // ✅ Get Google credentials from options (cached in static var)
    static $oauth_config = null;
    
    if ($oauth_config === null) {
        $oauth_config = array(
            'client_id' => get_option('google_client_id', ''),
            'client_secret' => get_option('google_client_secret', '')
        );
    }
    
    $client_id = $oauth_config['client_id'];
    $client_secret = $oauth_config['client_secret'];
    
    if (empty($client_id) || empty($client_secret)) {
        wp_die('Google OAuth not configured. Please contact site administrator.');
    }

    
    // Exchange authorization code for access token
    $redirect_uri = home_url('/my-account');
    
    $response = wp_remote_post('https://oauth2.googleapis.com/token', [
        'timeout' => 10,
        'body' => [
            'code' => sanitize_text_field($_GET['code']),
            'client_id' => $client_id,
            'client_secret' => $client_secret,
            'redirect_uri' => $redirect_uri,
            'grant_type' => 'authorization_code'
        ]
    ]);
    
    if (is_wp_error($response)) {
        wp_die('Failed to connect to Google. Error: ' . $response->get_error_message());
    }
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    // Check if we got an ID token
    if (!isset($data['id_token'])) {
        wp_die('Invalid response from Google. Please try again.');
    }
    
    // Decode the JWT token to get user info
    $token_parts = explode('.', $data['id_token']);
    if (count($token_parts) !== 3) {
        wp_die('Invalid token format.');
    }
    
    $payload = json_decode(base64_decode(strtr($token_parts[1], '-_', '+/')), true);
    
    if (!$payload || !isset($payload['email'])) {
        wp_die('Could not retrieve user information from Google.');
    }
    
    // Extract user data
    $google_email = sanitize_email($payload['email']);
    $google_name = isset($payload['name']) ? sanitize_text_field($payload['name']) : '';
    $google_id = isset($payload['sub']) ? sanitize_text_field($payload['sub']) : '';
    
    // Check if user exists
    $user = get_user_by('email', $google_email);
    
    if (!$user) {
        // Create new user
        $username = sanitize_user(str_replace('@', '_', $google_email));
        $password = wp_generate_password(16, true, true);
        
        $user_id = wp_create_user($username, $password, $google_email);
        
        if (is_wp_error($user_id)) {
            wp_die('Could not create user account: ' . $user_id->get_error_message());
        }
        
        // Update user meta
        wp_update_user([
            'ID' => $user_id,
            'display_name' => $google_name,
            'first_name' => explode(' ', $google_name)[0],
        ]);
        
        update_user_meta($user_id, 'google_id', $google_id);
        
        $user = get_user_by('id', $user_id);
    }
    
    // Log the user in
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);
    do_action('wp_login', $user->user_login, $user);
    
    // Redirect to my account
    wp_redirect(home_url('/my-account'));
    exit;
}
// ===== END OAuth2 Callback Handler =====


// Handle Facebook authentication
add_action('wp_ajax_facebook_auth', 'handle_facebook_auth');
add_action('wp_ajax_nopriv_facebook_auth', 'handle_facebook_auth');
function handle_facebook_auth() {
    if (!wp_verify_nonce($_POST['security'], 'facebook_auth_nonce')) {
        wp_send_json_error('Security check failed');
    }
    
    $user_data = json_decode(stripslashes($_POST['user_data']), true);
    $access_token = sanitize_text_field($_POST['access_token']);
    
    if (!$user_data || !isset($user_data['email'])) {
        wp_send_json_error('Invalid Facebook data');
    }
    
    $email = sanitize_email($user_data['email']);
    $name = sanitize_text_field($user_data['name']);
    $first_name = sanitize_text_field($user_data['first_name']);
    $last_name = sanitize_text_field($user_data['last_name']);
    
    // Check if user exists
    $user = get_user_by('email', $email);
    
    if (!$user) {
        // Create new user
        $user_id = wp_create_user($email, wp_generate_password(), $email);
        if (!is_wp_error($user_id)) {
            wp_update_user(array(
                'ID' => $user_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'display_name' => $name,
                'role' => 'customer'
            ));
            $user = get_user_by('ID', $user_id);
        }
    }
    
    if ($user) {
        wp_set_auth_cookie($user->ID, true);
        wp_send_json_success('Login successful');
    } else {
        wp_send_json_error('Failed to create user');
    }
}

// Custom password reset shortcode - UPDATED WITH LIGHT CONTAINER
add_shortcode('custom_password_reset', 'custom_password_reset_display');
function custom_password_reset_display() {
    $key = sanitize_text_field($_GET['key']);
    $login = sanitize_text_field($_GET['login']);
    
    // Verify reset key
    $user = check_password_reset_key($key, $login);
    if (is_wp_error($user)) {
        return '<div class="reset-error">Invalid or expired reset link. Please request a new one.</div>';
    }
    
    ob_start();
    ?>
    <div class="modern-reset-container">
        <div class="reset-form-wrapper">
            <div class="reset-header">
                <h2>🔑 Reset Your Password</h2>
                <p>Enter your new password below</p>
            </div>
            
            <form method="post" class="modern-reset-form">
                <input type="hidden" name="reset_key" value="<?php echo esc_attr($key); ?>">
                <input type="hidden" name="reset_login" value="<?php echo esc_attr($login); ?>">
                
                <!-- LIGHT CONTAINER FOR PASSWORD FIELDS -->
                <div class="password-section">
                    <div class="form-group">
                        <label for="new_password">New Password</label>
                        <input type="password" id="new_password" name="new_password" required placeholder="Enter new password" minlength="6">
                        <i class="fas fa-lock input-icon"></i>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password">Confirm Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" required placeholder="Confirm new password" minlength="6">
                        <i class="fas fa-lock input-icon"></i>
                    </div>
                </div>
                
                <button type="submit" name="custom_reset_password" class="auth-btn primary">
                    <i class="fas fa-key"></i> Reset Password
                </button>
                
                <div class="back-to-login">
                    <a href="/my-account/">← Back to Login</a>
                </div>
            </form>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

/* ===== CUSTOM REDIRECT FOR PASSWORD-RESET LINK ===== */
add_action( 'template_redirect', 'brt_send_to_custom_reset_page' );
function brt_send_to_custom_reset_page() {
    // ✅ OPTIMIZED: Early exit if not a reset request (runs on EVERY page!)
    if (!isset($_GET['action']) || !in_array($_GET['action'], array('rp', 'resetpass'), true)) {
        return; // Not a password reset, skip
    }
    
    // WordPress sends users to wp-login.php?action=rp|resetpass&key=XYZ&login=user
    if (isset($_GET['key'], $_GET['login'])) {

        $reset_url = add_query_arg(
            array(
                'key'   => rawurlencode( $_GET['key'] ),
                'login' => rawurlencode( $_GET['login'] ),
            ),
            get_permalink( get_page_by_path( 'reset-password' ) )
        );

        wp_safe_redirect( $reset_url );
        exit;
    }
}

/* keep ?key= & ?login= alive so WP doesn't nuke them */
add_filter( 'query_vars', function ( $vars ) {
    $vars[] = 'key';
    $vars[] = 'login';
    return $vars;
} );

/* disable redirect-canonical ONLY for reset-password URLs */
add_filter( 'redirect_canonical', function ( $redirect, $requested ) {
    if ( isset( $_GET['key'], $_GET['login'] ) ) {
        return false;        // keep the original URL intact
    }
    return $redirect;       // default behaviour
}, 10, 2 );

// CREATE ACCOUNT SETTINGS PAGE & SHORTCODE - FIXED
add_shortcode('account_settings', 'display_account_settings');
function display_account_settings() {
    if (!is_user_logged_in()) {
        return '<p>Please <a href="/my-account/">login</a> to access account settings.</p>';
    }
    
    $current_user = wp_get_current_user();
    
    // Handle form submissions
    if (isset($_POST['update_profile'])) {
        $first_name = sanitize_text_field($_POST['first_name']);
        $last_name = sanitize_text_field($_POST['last_name']);
        $country_code = sanitize_text_field($_POST['country_code']);
        $phone_number = sanitize_text_field($_POST['phone_number']);
        
        // Combine country code and phone number
        $full_phone = '';
        if (!empty($phone_number)) {
            $full_phone = $country_code . ' ' . $phone_number;
        }
        
        wp_update_user(array(
            'ID' => $current_user->ID,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => $first_name . ' ' . $last_name
        ));
        
        update_user_meta($current_user->ID, 'phone', $full_phone);
        echo '<div class="success-notification" style="position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;">✅ Profile updated successfully!</div><script>setTimeout(function(){document.querySelector(".success-notification").remove();},3000);</script>';
    }

    
    if (isset($_POST['change_password'])) {
        $current_password = $_POST['current_password'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];
        
        if (wp_check_password($current_password, $current_user->user_pass, $current_user->ID)) {
            if ($new_password === $confirm_password && strlen($new_password) >= 6) {
                wp_set_password($new_password, $current_user->ID);
                echo '<div class="success-notification" style="position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;">✅ Password changed successfully!</div><script>setTimeout(function(){var n=document.querySelector(".success-notification");if(n)n.remove();},3000);</script>';
            } else {
                echo '<div class="error-notification" style="position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;">❌ Passwords do not match or too short!</div><script>setTimeout(function(){var n=document.querySelector(".error-notification");if(n)n.remove();},3000);</script>';
            }
        } else {
            echo '<div class="error-notification" style="position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;">❌ Current password is incorrect!</div><script>setTimeout(function(){var n=document.querySelector(".error-notification");if(n)n.remove();},3000);</script>';
        }
    }
    
    $phone = get_user_meta($current_user->ID, 'phone', true);
    // Extract country code and number from existing phone
    $existing_country_code = '+91';
    $existing_phone_number = '';
    if (!empty($phone)) {
        $parts = explode(' ', $phone, 2);
        if (count($parts) === 2) {
            $existing_country_code = $parts[0];
            $existing_phone_number = $parts[1];
        }
    }
    
    // ✅ Cache PHP values for JavaScript (avoid repeated function calls)
    $ajax_url = admin_url('admin-ajax.php');
    $profile_nonce = wp_create_nonce('profile_picture_nonce');
    
    ob_start();
    ?>
    <div class="account-settings-container">
        <div class="settings-header">
            <h2>⚙️ Account Settings</h2>
            <p>Manage your account preferences and security</p>
        </div>
		
<div class="profile-picture-section">
    <div class="profile-picture-container">
        <div class="profile-picture-wrapper">
            <?php
            $google_profile_pic = get_user_meta($current_user->ID, 'google_profile_picture', true);
            $custom_profile_pic = get_user_meta($current_user->ID, 'custom_profile_picture', true);
            
            // Determine which profile picture to show
            if (!empty($custom_profile_pic)) {
                $profile_pic_url = wp_get_attachment_image_url($custom_profile_pic, 'thumbnail');
            } elseif (!empty($google_profile_pic)) {
                $profile_pic_url = $google_profile_pic;
} else {
    // Default profile picture - your custom image
$profile_pic_url = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
}

            ?>
            
            <div class="profile-picture-display">
                <img id="profile-picture-preview" src="<?php echo esc_url($profile_pic_url); ?>" alt="Profile Picture">
                <div class="profile-picture-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
            
            <div class="profile-picture-actions">
                <h4><?php echo esc_html($current_user->display_name); ?></h4>
                <button type="button" id="change-profile-picture" class="profile-btn">
                    <i class="fas fa-edit"></i> Change Profile Picture
                </button>
                <?php if (!empty($custom_profile_pic) || !empty($google_profile_pic)): ?>
                <button type="button" id="remove-profile-picture" class="profile-btn remove">
                    <i class="fas fa-trash"></i> Remove Picture
                </button>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Hidden file input -->
<input type="file" id="profile-picture-input" accept="image/*" style="display: none;">

<div class="settings-grid">

            <!-- PROFILE SETTINGS -->
            <div class="settings-card">
                <h3><i class="fas fa-user"></i> Profile Information</h3>
                <form method="post" class="settings-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" value="<?php echo esc_attr($current_user->first_name); ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" value="<?php echo esc_attr($current_user->last_name); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" value="<?php echo esc_attr($current_user->user_email); ?>" disabled>
                        <small>Email cannot be changed. Contact support if needed.</small>
                    </div>
                    
                    <div class="form-group phone-group">
                        <label>Phone Number</label>
                        <div class="phone-input-container">
<select name="country_code" class="country-code-select">
    <option value="+1" <?php selected($existing_country_code, '+1'); ?>>🇺🇸 +1</option>
    <option value="+93" <?php selected($existing_country_code, '+93'); ?>>🇦🇫 +93</option>
    <option value="+355" <?php selected($existing_country_code, '+355'); ?>>🇦🇱 +355</option>
    <option value="+213" <?php selected($existing_country_code, '+213'); ?>>🇩🇿 +213</option>
    <option value="+54" <?php selected($existing_country_code, '+54'); ?>>🇦🇷 +54</option>
    <option value="+61" <?php selected($existing_country_code, '+61'); ?>>🇦🇺 +61</option>
    <option value="+43" <?php selected($existing_country_code, '+43'); ?>>🇦🇹 +43</option>
    <option value="+973" <?php selected($existing_country_code, '+973'); ?>>🇧🇭 +973</option>
    <option value="+880" <?php selected($existing_country_code, '+880'); ?>>🇧🇩 +880</option>
    <option value="+32" <?php selected($existing_country_code, '+32'); ?>>🇧🇪 +32</option>
    <option value="+55" <?php selected($existing_country_code, '+55'); ?>>🇧🇷 +55</option>
    <option value="+44" <?php selected($existing_country_code, '+44'); ?>>🇬🇧 +44</option>
    <option value="+1" <?php selected($existing_country_code, '+1'); ?>>🇨🇦 +1</option>
    <option value="+86" <?php selected($existing_country_code, '+86'); ?>>🇨🇳 +86</option>
    <option value="+57" <?php selected($existing_country_code, '+57'); ?>>🇨🇴 +57</option>
    <option value="+45" <?php selected($existing_country_code, '+45'); ?>>🇩🇰 +45</option>
    <option value="+20" <?php selected($existing_country_code, '+20'); ?>>🇪🇬 +20</option>
    <option value="+33" <?php selected($existing_country_code, '+33'); ?>>🇫🇷 +33</option>
    <option value="+49" <?php selected($existing_country_code, '+49'); ?>>🇩🇪 +49</option>
    <option value="+852" <?php selected($existing_country_code, '+852'); ?>>🇭🇰 +852</option>
    <option value="+91" <?php selected($existing_country_code, '+91'); ?>>🇮🇳 +91</option>
    <option value="+62" <?php selected($existing_country_code, '+62'); ?>>🇮🇩 +62</option>
    <option value="+353" <?php selected($existing_country_code, '+353'); ?>>🇮🇪 +353</option>
    <option value="+972" <?php selected($existing_country_code, '+972'); ?>>🇮🇱 +972</option>
    <option value="+39" <?php selected($existing_country_code, '+39'); ?>>🇮🇹 +39</option>
    <option value="+81" <?php selected($existing_country_code, '+81'); ?>>🇯🇵 +81</option>
    <option value="+82" <?php selected($existing_country_code, '+82'); ?>>🇰🇷 +82</option>
    <option value="+60" <?php selected($existing_country_code, '+60'); ?>>🇲🇾 +60</option>
    <option value="+52" <?php selected($existing_country_code, '+52'); ?>>🇲🇽 +52</option>
    <option value="+31" <?php selected($existing_country_code, '+31'); ?>>🇳🇱 +31</option>
    <option value="+64" <?php selected($existing_country_code, '+64'); ?>>🇳🇿 +64</option>
    <option value="+47" <?php selected($existing_country_code, '+47'); ?>>🇳🇴 +47</option>
    <option value="+92" <?php selected($existing_country_code, '+92'); ?>>🇵🇰 +92</option>
    <option value="+63" <?php selected($existing_country_code, '+63'); ?>>🇵🇭 +63</option>
    <option value="+48" <?php selected($existing_country_code, '+48'); ?>>🇵🇱 +48</option>
    <option value="+7" <?php selected($existing_country_code, '+7'); ?>>🇷🇺 +7</option>
    <option value="+966" <?php selected($existing_country_code, '+966'); ?>>🇸🇦 +966</option>
    <option value="+65" <?php selected($existing_country_code, '+65'); ?>>🇸🇬 +65</option>
    <option value="+27" <?php selected($existing_country_code, '+27'); ?>>🇿🇦 +27</option>
    <option value="+34" <?php selected($existing_country_code, '+34'); ?>>🇪🇸 +34</option>
    <option value="+46" <?php selected($existing_country_code, '+46'); ?>>🇸🇪 +46</option>
    <option value="+41" <?php selected($existing_country_code, '+41'); ?>>🇨🇭 +41</option>
    <option value="+66" <?php selected($existing_country_code, '+66'); ?>>🇹🇭 +66</option>
    <option value="+90" <?php selected($existing_country_code, '+90'); ?>>🇹🇷 +90</option>
    <option value="+971" <?php selected($existing_country_code, '+971'); ?>>🇦🇪 +971</option>
    <option value="+84" <?php selected($existing_country_code, '+84'); ?>>🇻🇳 +84</option>
</select>
                            <input type="tel" name="phone_number" value="<?php echo esc_attr($existing_phone_number); ?>" placeholder="Enter your phone number" maxlength="15">
                        </div>
                        <small>Select country code and enter your phone number.</small>
                    </div>
                    
                    <button type="submit" name="update_profile" class="settings-btn primary">
                        <i class="fas fa-save"></i> Update Profile
                    </button>
                </form>
            </div>
            
            <!-- PASSWORD CHANGE -->
            <div class="settings-card">
                <h3><i class="fas fa-key"></i> Change Password</h3>
                <form method="post" class="settings-form">
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" name="current_password" required>
                    </div>
                    
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" name="new_password" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" name="confirm_password" required minlength="6">
                    </div>
                    
                    <button type="submit" name="change_password" class="settings-btn primary">
                        <i class="fas fa-lock"></i> Change Password
                    </button>
                </form>
            </div>
            
            <!-- QUICK ACTIONS -->
            <div class="settings-card">
                <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                <div class="quick-actions">
                    <a href="/my-account/" class="quick-btn">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                    <a href="/track-order/" class="quick-btn">
    <i class="fas fa-truck"></i> Track Orders
</a>
<a href="<?php echo wp_logout_url(home_url('/')); ?>" class="quick-btn danger">
    <i class="fas fa-sign-out-alt"></i> Logout
</a>
                </div>
            </div>
        </div>
    </div>
    
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Phone number validation based on country
    const phoneInput = document.querySelector('input[name="phone_number"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const countryCode = document.querySelector('select[name="country_code"]').value;
            const phoneNumber = this.value.replace(/\D/g, ''); // Remove non-digits
            
            // Set max length based on country (E.164 standard max 15 total digits)
            let maxLength = 15;
            if (countryCode === '+1') maxLength = 10; // US/Canada
            else if (countryCode === '+44') maxLength = 10; // UK
            else if (countryCode === '+91') maxLength = 10; // India
            else if (countryCode === '+86') maxLength = 11; // China
            else if (countryCode === '+81') maxLength = 11; // Japan
            else if (countryCode === '+49') maxLength = 12; // Germany
            
            // Limit input length
            if (phoneNumber.length > maxLength) {
                this.value = phoneNumber.substring(0, maxLength);
            } else {
                this.value = phoneNumber;
            }
        });
    }
    
    // Profile picture functionality
    const profilePictureDisplay = document.querySelector('.profile-picture-display');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const changeBtn = document.getElementById('change-profile-picture');
    const removeBtn = document.getElementById('remove-profile-picture');
    const preview = document.getElementById('profile-picture-preview');
    
    // Click to change picture
    if (changeBtn) {
        changeBtn.addEventListener('click', function() {
            profilePictureInput.click();
        });
    }
    
    if (profilePictureDisplay) {
        profilePictureDisplay.addEventListener('click', function() {
            profilePictureInput.click();
        });
    }
    
    // Handle file selection
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                // Show preview immediately
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Upload file
                const formData = new FormData();
                formData.append('action', 'upload_profile_picture');
                formData.append('profile_picture', file);
                formData.append('nonce', '<?php echo esc_js($profile_nonce); ?>');
                
                fetch('<?php echo esc_url($ajax_url); ?>', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        preview.src = data.data.image_url;
                        alert('Profile picture updated successfully!');
                        location.reload();
                    } else {
                        alert('Upload failed: ' + data.data);
                    }
                })
                .catch(error => {
                    alert('Upload error: ' + error);
                });
            }
        });
    }
    
    // Handle removal
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove your profile picture?')) {
                fetch('<?php echo esc_url($ajax_url); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=remove_profile_picture&nonce=<?php echo esc_js($profile_nonce); ?>'

                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        preview.src = data.data.image_url;
                        alert('Profile picture removed successfully!');
                    } else {
                        alert('Removal failed: ' + data.data);
                    }
                });
            }
        });
    }
});
</script>
<?php
return ob_get_clean();
}




add_action('wp_ajax_upload_profile_picture', 'handle_profile_picture_upload');
function handle_profile_picture_upload() {
    if (!is_user_logged_in()) {
        wp_send_json_error('Not logged in');
    }
    
    if (!wp_verify_nonce($_POST['nonce'], 'profile_picture_nonce')) {
        wp_send_json_error('Security check failed');
    }
    
    if (empty($_FILES['profile_picture'])) {
        wp_send_json_error('No file uploaded');
    }
    
    $user_id = get_current_user_id();
    
    // ✅ Optimized: Only load required files
    if (!function_exists('wp_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
    }
    if (!function_exists('wp_generate_attachment_metadata')) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
    }

    
    $uploadedfile = $_FILES['profile_picture'];
    
    // Check file type
    $allowed_types = array('jpg', 'jpeg', 'png', 'gif');
    $file_ext = strtolower(pathinfo($uploadedfile['name'], PATHINFO_EXTENSION));
    
    if (!in_array($file_ext, $allowed_types)) {
        wp_send_json_error('Invalid file type. Please upload JPG, PNG, or GIF.');
    }
    
    // Check file size (2MB max)
    if ($uploadedfile['size'] > 2097152) {
        wp_send_json_error('File too large. Maximum size is 2MB.');
    }
    
    // ✅ Upload with compression (saves storage on shared hosting)
    $upload_overrides = array(
        'test_form' => false,
        'mimes' => array(
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif'
        )
    );
    $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

    
    if ($movefile && !isset($movefile['error'])) {
        // Create attachment
        $attachment = array(
            'post_mime_type' => $movefile['type'],
            'post_title' => sanitize_file_name($uploadedfile['name']),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        
        $attachment_id = wp_insert_attachment($attachment, $movefile['file']);
        
        if (!is_wp_error($attachment_id)) {
            // Generate metadata
            $attachment_data = wp_generate_attachment_metadata($attachment_id, $movefile['file']);
            wp_update_attachment_metadata($attachment_id, $attachment_data);
            
            // Save to user meta
            update_user_meta($user_id, 'custom_profile_picture', $attachment_id);
            
            // Get the image URL
            $image_url = wp_get_attachment_image_url($attachment_id, 'thumbnail');
            
            wp_send_json_success(array('image_url' => $image_url));
        } else {
            wp_send_json_error('Failed to create attachment');
        }
    } else {
        wp_send_json_error('Upload failed: ' . $movefile['error']);
    }
}

// HANDLE PROFILE PICTURE REMOVAL
add_action('wp_ajax_remove_profile_picture', 'handle_profile_picture_removal');
function handle_profile_picture_removal() {
    if (!is_user_logged_in()) {
        wp_send_json_error('Not logged in');
    }
    
    if (!wp_verify_nonce($_POST['nonce'], 'profile_picture_nonce')) {
        wp_send_json_error('Security check failed');
    }
    
    $user_id = get_current_user_id();
    
    // Remove custom profile picture
    $custom_pic = get_user_meta($user_id, 'custom_profile_picture', true);
    if ($custom_pic) {
        wp_delete_attachment($custom_pic, true);
        delete_user_meta($user_id, 'custom_profile_picture');
    }
    
    // Remove Google profile picture reference
    delete_user_meta($user_id, 'google_profile_picture');
    
    // Return default image
$default_image = 'data:image/svg+xml;base64,CiAgICAgICAgPHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjZTllY2VmIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjNmM3NTdkIi8+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik02MCA3MmMtMTYuNjcgMC0zMCAxMC4xNS0zMCAyNXYyM2g2MFY5N2MwLTE0Ljg1LTEzLjMzLTI1LTMwLTI1eiIgZmlsbD0iIzZjNzU3ZCIvPgogICAgICAgIDwvc3ZnPgogICAg';
    
    wp_send_json_success(array('image_url' => $default_image));
}
// ============================================================================
// CONSOLIDATED FOOTER SCRIPTS - OPTIMIZED (REPLACES 6 SEPARATE FUNCTIONS)
// ============================================================================
add_action('wp_footer', 'consolidated_account_scripts', 999);
function consolidated_account_scripts() {
    // ✅ CRITICAL: Cache ALL repeated values ONCE at top
    static $cached_values = null;
    
    if ($cached_values === null) {
        $cached_values = array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'cart_url' => wc_get_cart_url(),
            'wc_nonce' => wp_create_nonce('woocommerce-cart'),
            'google_nonce' => wp_create_nonce('google_auth_nonce'),
            'google_oauth_nonce' => wp_create_nonce('google_oauth_state'),
            'fb_nonce' => wp_create_nonce('facebook_auth_nonce'),
            'user_id' => get_current_user_id(),
            'is_logged_in' => is_user_logged_in(),
            'profile_url' => null, // Will be set below if needed
            'google_client_id' => get_option('google_client_id', ''),
            'facebook_app_id' => get_option('facebook_app_id', '')
        );
        
        // Get profile picture ONCE
        if ($cached_values['user_id'] > 0) {
            $custom_pic = get_user_meta($cached_values['user_id'], 'custom_profile_picture', true);
            $google_pic = get_user_meta($cached_values['user_id'], 'google_profile_picture', true);
            
            if (!empty($custom_pic)) {
                $cached_values['profile_url'] = wp_get_attachment_image_url($custom_pic, 'thumbnail');
            } elseif (!empty($google_pic)) {
                $cached_values['profile_url'] = $google_pic;
            }
        }
        
        // Default profile picture
        if (empty($cached_values['profile_url'])) {
            $cached_values['profile_url'] = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
        }
    }

    // 1. Social Login Scripts - ONLY on My Account when logged out
    if (is_page('my-account') && !is_user_logged_in()) {
        load_social_auth_scripts();
    }
    
// 2. Profile Picture Scripts - ALL users (desktop header replacement)
if (!wp_is_mobile()) {
    load_profile_picture_scripts();
}
    
    // 3. Avatar Clickable - ALL pages (lightweight)
    load_avatar_click_script();
    
    // 4. Shop Cart Script - ONLY on shop pages
    if (is_shop() || is_product_category() || is_product_tag()) {
        load_shop_cart_script();
    }
    
    // 5. Desktop Cart Trigger - ONLY on desktop
    if (!wp_is_mobile()) {
        load_desktop_cart_trigger();
    }
    
    // 6. Product Default Variation - ONLY on product pages
    if (is_product()) {
        load_product_default_variation();
    }
    
// 7. Mobile Profile - ONLY on actual mobile screens
load_mobile_profile(); // Will self-check screen size

    
    // 8. Sidecart Trigger - ALL pages (lightweight event listener)
    load_sidecart_trigger();

    // 9. Delay cart fragments on homepage (NEW from Part 6)
if (is_front_page()) {
    load_delayed_cart_fragments();
}

// 10. Custom Variants - ALL pages (includes related products on single product pages)
if (!is_admin()) {
    load_shop_custom_variants();
}

    
    // 11. Currency Converter - ALL pages except admin (NEW from Part 8)
    if (!is_admin()) {
        load_currency_converter();
    }
    
// 12. Simple Product AJAX - ALL pages (includes related products)
if (!is_admin()) {
    load_shop_ajax_handler();
}

}


// Social authentication scripts (Google + Facebook)
function load_social_auth_scripts() {
    global $cached_values;
    
    if (!$cached_values) return; // Safety check
    
    if ($cached_values['google_client_id']) {
        ?>
        <!-- Google OAuth -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script>
function loginWithGoogle() {
    var clientId = '<?php echo esc_js($cached_values['google_client_id']); ?>';
    var redirectUri = encodeURIComponent('<?php echo esc_js(home_url('/my-account')); ?>');
    var scope = encodeURIComponent('email profile');
    var state = encodeURIComponent('<?php echo esc_js($cached_values['google_oauth_nonce']); ?>');
    
    if (!clientId) {
        alert('Google Sign-In is not configured.');
        return;
    }
    
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        'client_id=' + clientId +
        '&redirect_uri=' + redirectUri +
        '&response_type=code' +
        '&scope=' + scope +
        '&state=' + state +
        '&prompt=select_account';
}

function registerWithGoogle() {
    loginWithGoogle();
}
        </script>
        <?php
    }
    
    if ($cached_values['facebook_app_id']) {
        ?>
        <!-- Facebook SDK -->
        <div id="fb-root"></div>
        <script async defer crossorigin="anonymous" 
                src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0&appId=<?php echo esc_js($cached_values['facebook_app_id']); ?>"></script>
        <script>
function loginWithFacebook() {
    if (typeof FB !== 'undefined') {
        FB.login(function(response) {
            if (response.authResponse) {
                FB.api('/me', {fields: 'name,email,first_name,last_name'}, function(user) {
                    fetch('<?php echo esc_url($cached_values['ajax_url']); ?>', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: 'action=facebook_auth&user_data=' + encodeURIComponent(JSON.stringify(user)) + 
                              '&access_token=' + response.authResponse.accessToken + 
                              '&security=<?php echo esc_js($cached_values['fb_nonce']); ?>'
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) window.location.reload();
                        else alert('Facebook sign-in failed');
                    });
                });
            }
        }, {scope: 'email'});
    }
}

function registerWithFacebook() {
    loginWithFacebook();
}
        </script>
        <?php
    }
}



// Profile picture replacement
function load_profile_picture_scripts() {
    // ✅ Get profile URL directly (don't rely on global)
    $user_id = get_current_user_id();
    
    if ($user_id > 0) {
        $custom_pic = get_user_meta($user_id, 'custom_profile_picture', true);
        $google_pic = get_user_meta($user_id, 'google_profile_picture', true);
        
        if (!empty($custom_pic)) {
            $profile_url = wp_get_attachment_image_url($custom_pic, 'thumbnail');
        } elseif (!empty($google_pic)) {
            $profile_url = $google_pic;
        } else {
            $profile_url = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
        }
    } else {
        $profile_url = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
    }
    
    $is_logged_in = is_user_logged_in();
    ?>
    <style>
    /* Hide original SVG */
    .ast-header-account svg {
        display: none !important;
        visibility: hidden !important;
    }
    
    /* Link wrapper - circular clipping */
    .ast-header-account-link {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        overflow: hidden !important;
        padding: 0 !important;
        background: transparent !important;
    }
    
    /* Profile image */
    .custom-profile-img {
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        border: 2px solid #06b24b !important;
        box-shadow: 0 2px 8px rgba(6, 178, 75, 0.2) !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        object-fit: cover !important;
        display: block !important;
        margin: 0 !important;
    }
    
    .custom-profile-img:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(6, 178, 75, 0.4) !important;
    }
    </style>
    
    <script>
    // ✅ FIXED: Run immediately with proper error handling
    (function() {
        var link = document.querySelector('.ast-header-account-link');
        if (link) {
            // Clear existing content
            link.innerHTML = '';
            link.href = '/my-account/';
            
            // Create new image
            var img = new Image();
            img.src = '<?php echo esc_url($profile_url); ?>';
            img.alt = 'Profile';
            img.title = '<?php echo $is_logged_in ? "My Account" : "Sign In"; ?>';
            img.className = 'custom-profile-img';
            
            // ✅ Only append if image loaded successfully
            img.onload = function() {
                link.appendChild(img);
            };
            
            // ✅ Fallback if image fails to load
            img.onerror = function() {
                console.log('Profile image failed to load, using default');
                img.src = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
                link.appendChild(img);
            };
        }
    })();
    </script>
    <?php
}


// Avatar click handler (lightweight, runs on all pages)
function load_avatar_click_script() {
    ?>
    <style>
    .avatar {
        border: 3px solid #06b24b !important;
        box-shadow: 0 3px 10px rgba(6, 178, 75, 0.2) !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
    }
    .avatar:hover {
        transform: scale(1.05) !important;
        border-color: #181f2f !important;
    }
    </style>
    <script>
    jQuery(document).ready(function($) {
        $('.avatar').css('cursor', 'pointer').click(function() {
            window.location.href = '/my-account/';
        });
    });
    </script>
    <?php
}

// ====== NEW HELPER FUNCTIONS (ADD THESE) ======

// 4. Shop cart script
function load_shop_cart_script() {
    ?>
    <script>
    jQuery(function($) {
        $(document).on('click', '.custom-variation-cart-btn', function(e) {
            e.preventDefault();
            var $button = $(this);
            var variation_id = $button.data('variation_id');
            var product_id = $button.data('product_id');
            
            if ($button.hasClass('loading')) return;
            $button.addClass('loading').prop('disabled', true).text('Adding...');
            
            $.ajax({
                type: 'POST',
                url: '<?php global $cached_values; echo esc_url($cached_values['ajax_url']); ?>',

                data: { action: 'get_fresh_wc_nonce' },
                success: function(nonceResponse) {
                    var freshNonce = (nonceResponse && nonceResponse.nonce) ? nonceResponse.nonce : '<?php echo wp_create_nonce('woocommerce-cart'); ?>';
                    
                    $.ajax({
                        type: 'POST',
                url: '<?php global $cached_values; echo esc_url($cached_values['ajax_url']); ?>',
                        data: {
                            action: 'add_to_cart_custom_variation',
                            variation_id: variation_id,
                            product_id: product_id,
                            quantity: 1,
                        nonce: '<?php global $cached_values; echo esc_js($cached_values['wc_nonce']); ?>'
                        },
                        timeout: 10000,
                        success: function(response) {
                            if (response && response.success !== false) {
                                if (response.fragments) {
                                    $.each(response.fragments, function(key, value) {
                                        $(key).replaceWith(value);
                                    });
                                }
                                $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $button]);
                                $button.removeClass('loading').text('✓ Added!').css('background', '#28a745');
                                setTimeout(function() {
                                    $button.prop('disabled', false).text('Add to Cart').css('background', '');
                                }, 2000);
                            } else {
                                $button.removeClass('loading').prop('disabled', false).text('Try Again').css('background', '#dc3545');
                                setTimeout(function() {
                                    $button.text('Add to Cart').css('background', '');
                                }, 3000);
                            }
                        },
                        error: function() {
                            $button.removeClass('loading').prop('disabled', false).text('Error').css('background', '#dc3545');
                            setTimeout(function() {
                                $button.text('Add to Cart').css('background', '');
                            }, 3000);
                        }
                    });
                }
            });
        });
    });
    </script>
    <?php
}

// 5. Desktop cart trigger
function load_desktop_cart_trigger() {
    ?>
    <script>
    jQuery(function($) {
        $(document).on('click', '.ast-header-woo-cart a, .ast-site-header-cart a', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof window.fkcart !== 'undefined' && window.fkcart.openCart) {
                window.fkcart.openCart();
                return false;
            }
            
            var $trigger = $('#fkcart-floating-toggler').first();
            if ($trigger.length > 0) {
                $trigger.trigger('click');
                return false;
            }        
            window.location.href = '<?php global $cached_values; echo esc_url($cached_values['cart_url']); ?>';
         return false;
        });
    });
    </script>
    <?php
}
// Helper function for product default colors
function get_product_default_colors() {
    return [
        884 => 'white',
        902 => 'black',
        1244 => 'white',
        1335 => 'black',
        1337 => 'black',
        1338 => 'orange'
    ];
}

// 6. Product default variation
function load_product_default_variation() {
    global $product;
    if (!$product || !$product->is_type('variable')) return;
    
    $default_colors = get_product_default_colors();
    $product_id = $product->get_id();
    
    if (!isset($default_colors[$product_id])) return;
    
    $default_color = $default_colors[$product_id];
    ?>
    <script>
    jQuery(function($) {
        setTimeout(function() {
            var defaultColor = '<?php echo esc_js(strtolower($default_color)); ?>';
            
            $('select[name*="attribute"]').each(function() {
                var $select = $(this);
                if ($select.attr('name').toLowerCase().includes('color')) {
                    $select.find('option').each(function() {
                        if ($(this).val().toLowerCase().includes(defaultColor)) {
                            $select.val($(this).val()).trigger('change');
                            return false;
                        }
                    });
                }
            });
            
            $('.tawcvs-swatches .swatch-item').each(function() {
                var swatchValue = ($(this).data('value') || '').toLowerCase();
                if (swatchValue.includes(defaultColor)) {
                    $(this).addClass('selected').siblings().removeClass('selected').trigger('click');
                    return false;
                }
            });
            
            $('.variations_form').trigger('check_variations');
        }, 1000);
    });
    </script>
    <?php
}
// 7. Mobile profile
function load_mobile_profile() {
    // ✅ Get profile URL directly (same as desktop function)
    $user_id = get_current_user_id();
    
    if ($user_id > 0) {
        $custom_pic = get_user_meta($user_id, 'custom_profile_picture', true);
        $google_pic = get_user_meta($user_id, 'google_profile_picture', true);
        
        if (!empty($custom_pic)) {
            $profile_url = wp_get_attachment_image_url($custom_pic, 'thumbnail');
        } elseif (!empty($google_pic)) {
            $profile_url = $google_pic;
        } else {
            $profile_url = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
        }
    } else {
        $profile_url = 'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg';
    }
    ?>
    <style>
    @media (max-width: 768px) {
        /* Hide cart on mobile */
        .ast-header-woo-cart {
            display: none !important;
        }
        
/* Mobile profile positioning - STAYS IN HEADER, DOESN'T MOVE */
.custom-mobile-profile {
    position: absolute !important;
    right: 75px !important;
    top: 24px !important; /* Fixed pixel value instead of 50% */
    transform: none !important; /* Remove the translateY that was recalculating */
    z-index: 999 !important;
}

/* Prevent header expansion from affecting profile picture */
@media (max-width: 768px) {
    .site-header {
        position: relative !important;
    }
    
    /* Lock profile picture position even when header changes height */
    .custom-mobile-profile {
        position: absolute !important;
        top: 24px !important; /* Stays at this exact position */
        right: 75px !important;
        transform: none !important;
        z-index: 999 !important;
    }
}

        /* Mobile profile image styling */
        .custom-mobile-profile img {
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            border: 2px solid #06b24b !important;
            box-shadow: 0 2px 8px rgba(6, 178, 75, 0.4) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }
        
        .custom-mobile-profile img:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(6, 178, 75, 0.6) !important;
        }
    }
    </style>
    
    <script>
    // ✅ FIXED: Proper jQuery and error handling
    (function($) {
        function addMobileProfile() {
            // Only run on mobile screens
            if ($(window).width() <= 768) {
                // Remove any existing mobile profile
                $('.custom-mobile-profile').remove();
                
                // Find header
                var $header = $('.main-header-bar, .ast-mobile-header-wrap, .site-header').first();
                
                if ($header.length > 0) {
                    // Make header relative for positioning
                    $header.css('position', 'relative');
                    
                    // Create elements
                    var $profile = $('<div class="custom-mobile-profile"></div>');
                    var $link = $('<a href="/my-account/"></a>');
                    var $img = $('<img>');
                    
                    // Set image attributes
                    $img.attr('src', '<?php echo esc_url($profile_url); ?>');
                    $img.attr('alt', 'Profile');
                    $img.attr('title', 'My Account');
                    
                    // Build structure
                    $link.append($img);
                    $profile.append($link);
                    $header.append($profile);
                }
            }
        }
        
        // Run on page load
        $(document).ready(addMobileProfile);
        
        // Run on window resize (if user rotates device)
        $(window).on('resize', function() {
            clearTimeout(window.resizeTimer);
            window.resizeTimer = setTimeout(addMobileProfile, 250);
        });
        
    })(jQuery);
    </script>
    <?php
}
// 8. Sidecart trigger
function load_sidecart_trigger() {
    ?>
    <script>
    jQuery(function($) {
        $(document.body).on('added_to_cart', function(event, fragments, cart_hash, $button) {
            if ($button && $button.hasClass('custom-variation-cart-btn')) {
                setTimeout(function() {
                    var $floatingIcon = $('#fkcart-floating-toggler');
                    if ($floatingIcon.length > 0) {
                        $floatingIcon[0].click();
                        setTimeout(function() {
                            $(document.body).trigger('wc_fragments_refreshed');
                            $(document.body).trigger('updated_cart_totals');
                        }, 800);
                    } else if (typeof window.fkcart !== 'undefined' && window.fkcart.openCart) {
                        window.fkcart.openCart();
                        setTimeout(function() {
                            $(document.body).trigger('wc_fragments_refreshed');
                        }, 800);
                    }
                }, 500);
            }
        });
    });
    </script>
    <?php
}
// 9. Delayed cart fragments (homepage only)
function load_delayed_cart_fragments() {
    ?>
    <script>
    if (typeof wc_cart_fragments_params !== 'undefined') {
        wc_cart_fragments_params.cart_hash_key = 'wc_cart_hash_disabled';
    }
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (typeof jQuery !== 'undefined') {
                jQuery(document.body).trigger('wc_fragment_refresh');
            }
        }, 3000);
    });
    </script>
    <?php
}

// 10. Shop custom variants
function load_shop_custom_variants() {
    $config = [
        884  => ['variation_id' => 1785, 'color' => 'white'],
        902  => ['variation_id' => 1786, 'color' => 'black'],
        1244 => ['variation_id' => 1790, 'color' => 'white'],
        1335 => ['variation_id' => 1796, 'color' => 'black'],
        1337 => ['variation_id' => 1798, 'color' => 'black'],
        1338 => ['variation_id' => 1792, 'color' => 'orange']
    ];
    ?>
    <script>
    (function() {
        if (typeof jQuery === 'undefined') return;
        
        var $ = jQuery;
        var config = <?php echo json_encode($config); ?>;
        
        function setupVariants() {
            $.each(config, function(pid, data) {
                var $product = $('.post-' + pid + ', .product-' + pid + ', [data-product_id="' + pid + '"]').closest('.product, li.product');
                if ($product.length === 0) return;
                
                var $select = $product.find('select[name="attribute_color"], select#color-' + pid);
                var $button = $product.find('.custom-variation-cart-btn, .product_type_variable, button[data-product_id="' + pid + '"]');
                
                if ($select.length === 0) {
                    $product.append('<select name="attribute_color" id="color-' + pid + '" style="display:none;"><option value="' + data.color + '">' + data.color + '</option></select>');
                    $select = $product.find('#color-' + pid);
                }
                
                if ($button.length > 0 && $select.length > 0) {
                    $select.val(data.color.toLowerCase());
                    $button.prop('disabled', false).removeClass('disabled');
                    
                    $button.off('click.cv').on('click.cv', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        $button.addClass('loading').text('Adding...');
                        
                        $.ajax({
                            url: wc_add_to_cart_params.ajax_url,
                            type: 'POST',
                            data: {
                                action: 'add_to_cart_custom_variation',
                                product_id: pid,
                                variation_id: data.variation_id,
                                color: $select.val().toLowerCase(),
                                quantity: 1
                            },
                            success: function(response) {
                                var fragments = response.data ? response.data.fragments : response.fragments;
                                if (fragments) {
                                    $.each(fragments, function(key, value) {
                                        $(key).replaceWith(value);
                                    });
                                    $(document.body).trigger('added_to_cart');
                                    $button.removeClass('loading').addClass('added').text('✓ Added');
                                    
                                    setTimeout(function() {
                                        $('.fkcart-toggler, .fkcart-floating-toggler')[0]?.click();
                                    }, 500);
                                }
                            }
                        });
                    });
                }
            });
        }
        
        setupVariants();
        setTimeout(setupVariants, 1000);
    })();
    </script>
    <?php
}

// 11. Currency converter (sidecart only)
function load_currency_converter() {
    // ✅ Use cookie instead of session (safer for cached pages)
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    if ($user_currency === 'USD') return;
    
    $rate = get_safe_exchange_rate($user_currency);
    $symbol = get_safe_symbol($user_currency);
    ?>
    <script>
    (function() {
        if (typeof jQuery === 'undefined') return;
        var $ = jQuery;
        var rate = <?php echo floatval($rate); ?>;
        var symbol = '<?php echo esc_js($symbol); ?>';
        var converting = false;
        
        function convert() {
            if (converting) return;
            converting = true;
            var $sidecart = $('.fkcart-modal, .fkcart-sidecart, .fk-sidecart');
            if ($sidecart.length === 0) {
                converting = false;
                return;
            }
            $sidecart.find('.woocommerce-Price-amount, .price, .amount, bdi').each(function() {
                var $el = $(this);
                if ($el.text().indexOf(symbol) !== -1) return;
                var html = $el.html();
                if (!html || html.indexOf('$') === -1) return;
                var newHtml = html.replace(/\$/g, '').replace(/([\d,]+\.?\d*)/g, function(match, num) {
                    var usd = parseFloat(num.replace(/,/g, ''));
                    if (!isNaN(usd) && usd >= 1 && usd <= 100000) {
                        return symbol + Math.round(usd * rate).toLocaleString('en-IN');
                    }
                    return match;
                });
                if (newHtml !== html) $el.html(newHtml);
            });
            setTimeout(function() { converting = false; }, 50);
        }
        $(document.body).on('added_to_cart wc_fragments_refreshed updated_cart_totals', function() {
            setTimeout(convert, 10);
        });
        setTimeout(function() {
            if ($('.fkcart-modal:visible').length > 0) convert();
        }, 500);
    })();
    </script>
    <?php
}
// 12. Shop + Related Products AJAX Handler
function load_shop_ajax_handler() {
    ?>
    <script>
    (function() {
        if (typeof jQuery === 'undefined' || typeof wc_add_to_cart_params === 'undefined') return;
        
        var $ = jQuery;
        
        // Disable WooCommerce default notices
        if (typeof wc_add_to_cart_params !== 'undefined') {
            wc_add_to_cart_params.cart_redirect_after_add = 'no';
        }
        
        // ✅ Handle SIMPLE products (shop + related products)
        $('body').on('click', '.ajax_add_to_cart:not(.product_type_variable):not(.loading)', function(e) {
            var $btn = $(this);
            var pid = $btn.data('product_id');
            
            e.preventDefault();
            e.stopPropagation();
            
            $btn.addClass('loading').prop('disabled', true);
            
            $.ajax({
                url: wc_add_to_cart_params.ajax_url,
                type: 'POST',
                data: {
                    action: 'woocommerce_ajax_add_to_cart',
                    product_id: pid,
                    quantity: 1
                },
                success: function(response) {
                    if (response.fragments) {
                        $.each(response.fragments, function(k, v) {
                            $(k).replaceWith(v);
                        });
                    }
                    
                    $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $btn]);
                    
                    $btn.removeClass('loading').prop('disabled', false);
                    
                    // Open FunnelKit sidecart
                    setTimeout(function() {
                        var $trigger = $('.fkcart-toggler, .fkcart-floating-toggler, #fkcart-floating-toggler').first();
                        if ($trigger.length > 0) {
                            $trigger[0].click();
                        }
                    }, 300);
                },
                error: function() {
                    $btn.removeClass('loading').prop('disabled', false);
                    alert('Failed to add to cart. Please try again.');
                }
            });
            
            return false;
        });
    })();
    </script>
    <?php
}



// ============================================
// EASYWP PERFORMANCE OPTIMIZATION
// ============================================

// 1. REDUCE SERVER REQUESTS
add_action('init', 'easywp_performance_optimization');
function easywp_performance_optimization() {
    // Remove unnecessary WordPress features
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wp_shortlink_wp_head');
    
    // Remove WordPress emoji scripts (saves requests)
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
}

// 2. OPTIMIZE HEARTBEAT (Reduces AJAX calls)
add_filter('heartbeat_settings', 'optimize_heartbeat_for_easywp');
function optimize_heartbeat_for_easywp($settings) {
    $settings['interval'] = 60; // 60 seconds instead of 15
    return $settings;
}

// 3. LIMIT POST REVISIONS 
add_filter('wp_revisions_to_keep', function() { return 2; });

// 4. OPTIMIZE DATABASE QUERIES FOR EASYWP
add_filter('posts_clauses', 'optimize_queries_for_starter_hosting', 10, 2);
function optimize_queries_for_starter_hosting($clauses, $wp_query) {
    if (!is_admin() && $wp_query->is_main_query()) {
        // Limit posts on homepage
        if (is_home()) {
            $clauses['limits'] = 'LIMIT 0, 6';
        }
        // Limit shop products  
        if (function_exists('is_shop') && is_shop()) {
            $clauses['limits'] = 'LIMIT 0, 9';
        }
    }
    return $clauses;
}
// ============================================
// 7. DISABLE UNNECESSARY FEATURES FOR PERFORMANCE
// ============================================

// Remove version query strings
function remove_wp_ver_css_js($src) {
    if (strpos($src, 'ver=')) {
        $src = remove_query_arg('ver', $src);
    }
    return $src;
}

add_action('wp_enqueue_scripts', 'disable_unused_features');
function disable_unused_features() {
    // Remove query strings from static resources
    add_filter('script_loader_src', 'remove_wp_ver_css_js', 9999);
    add_filter('style_loader_src', 'remove_wp_ver_css_js', 9999);
}
// 3. SHOP PAGE BUTTONS — BUTTON ONLY (LET WOOCOMMERCE HANDLE PRICE)
add_filter('woocommerce_loop_add_to_cart_link', 'lightweight_shop_buttons', 10, 2);
function lightweight_shop_buttons($link, $product) {
        // ✅ Cache product checks to avoid repeated operations
    static $processed_products = array();
    $product_id = $product->get_id();
    
    // ✅ Return early if already processed
    if (isset($processed_products[$product_id])) {
        return $processed_products[$product_id];
    }

    if (!$product->is_type('variable')) return $link;
    $product_id = $product->get_id();
    $default_colors = get_product_default_colors();
    if (!isset($default_colors[$product_id])) return $link;
    $default_color = $default_colors[$product_id];
    $available_variations = $product->get_available_variations();
    if (empty($available_variations)) return $link;

    $target_variation = null;
    foreach ($available_variations as $variation) {
        foreach ($variation['attributes'] as $attr_val) {
            if (strtolower($attr_val) === strtolower($default_color)) {
                if ($variation['is_purchasable'] && $variation['is_in_stock']) {
                    $target_variation = $variation;
                    break 2;
                }
            }
        }
    }
    if (!$target_variation) return $link;

    $button = sprintf(
        '<button type="button" data-product_id="%s" data-variation_id="%s" class="button product_type_variable custom-variation-cart-btn">%s</button>',
        esc_attr($product_id),
        esc_attr($target_variation['variation_id']),
        esc_html__('Add to Cart', 'woocommerce')
    );
    
    // ✅ Cache result
    $processed_products[$product_id] = $button;
    return $button;
}


// AJAX handler for fresh nonce
add_action('wp_ajax_get_fresh_wc_nonce', 'provide_fresh_wc_nonce');
add_action('wp_ajax_nopriv_get_fresh_wc_nonce', 'provide_fresh_wc_nonce');
function provide_fresh_wc_nonce() {
    wp_send_json(array('nonce' => wp_create_nonce('woocommerce-cart')));
}

// 6. CUSTOM BUTTON TEXT
add_filter('woocommerce_product_add_to_cart_text', 'custom_button_text_variants', 10, 2);

function custom_button_text_variants($text, $product) {
    if ($product->is_type('variable')) {
        $product_id     = $product->get_id();
        $default_colors = get_product_default_colors();

        if (isset($default_colors[$product_id])) {
            return __('Add to Cart', 'woocommerce');
        }
    }

    return $text;
}

// 7. SAFE HTTPS REDIRECT (OPTIMIZED)
add_action('template_redirect', 'safe_https_redirect');
function safe_https_redirect() {
    // ✅ Early exit for common cases (faster)
    if (is_ssl() || is_admin() || (defined('DOING_AJAX') && DOING_AJAX)) {
        return;
    }
    
    // ✅ Additional early exits
    if (isset($_GET['preview']) || php_sapi_name() === 'cli') {
        return;
    }
    
    // ✅ Only redirect if we have valid HTTP_HOST
    if (empty($_SERVER['HTTP_HOST']) || empty($_SERVER['REQUEST_URI'])) {
        return;
    }
    
    // ✅ Perform redirect
    $redirect_url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    wp_redirect($redirect_url, 301);
    exit;
}
// 8. UPDATE WORDPRESS URLS (RUNS ONLY ONCE)
add_action('wp_loaded', 'simple_update_urls');
function simple_update_urls() {
    // ✅ Check transient FIRST before any other operations
    if (get_transient('https_urls_updated') !== false) {
        return; // Already done, skip completely
    }
    
    // ✅ Only run in admin or if HTTPS is active
    if (!is_ssl() && !is_admin()) {
        return;
    }
    
    $home_url = get_option('home');
    $site_url = get_option('siteurl');
    
    $updated = false;
    
    if (strpos($home_url, 'http://') === 0) {
        update_option('home', str_replace('http://', 'https://', $home_url));
        $updated = true;
    }
    
    if (strpos($site_url, 'http://') === 0) {
        update_option('siteurl', str_replace('http://', 'https://', $site_url));
        $updated = true;
    }
    
    // ✅ Set transient for 90 days (even if no update needed)
    set_transient('https_urls_updated', true, 90 * DAY_IN_SECONDS);
}
// 9. SIMPLE MIXED CONTENT FIX (OPTIMIZED)
add_filter('the_content', 'simple_https_content_fix');
add_filter('widget_text', 'simple_https_content_fix');
function simple_https_content_fix($content) {
    // ✅ Early exit if not HTTPS or content doesn't contain http://
    if (!is_ssl() || strpos($content, 'http://betterestech.unaux.com') === false) {
        return $content;
    }
    
    return str_replace('http://betterestech.unaux.com', 'https://betterestech.unaux.com', $content);
}
// 10. SSL DETECTION
add_action('init', 'simple_ssl_detection');
function simple_ssl_detection() {
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        $_SERVER['HTTPS'] = 'on';
    }
}

// 12. ENSURE FUNNELKIT COMPATIBILITY WITH HTTPS (OPTIMIZED)
add_action('wp_head', 'ensure_funnelkit_https_compatibility');
function ensure_funnelkit_https_compatibility() {
    // ✅ Only run if HTTPS is active
    if (!is_ssl()) return;
    ?>
    <script>
    // Lightweight HTTPS fix for FunnelKit
    (function() {
        if (typeof window.fkcart === 'undefined') return;
        
        // Fix any HTTP resources in FunnelKit config
        if (window.fkcart.config && window.fkcart.config.ajaxUrl) {
            window.fkcart.config.ajaxUrl = window.fkcart.config.ajaxUrl.replace('http:', 'https:');
        }
    })();
    </script>
    <?php
}
// ===============================
// CART PLUGIN INTEGRATION & UI MODIFICATIONS - FINAL CORRECTED VERSION
// ===============================

// 1. HIDE DEFAULT WOOCOMMERCE CART BUTTON (CORRECTED)
add_action('wp_head', 'hide_default_cart_button');
function hide_default_cart_button() {
    ?>
    <style>
    /* DESKTOP: Show WooCommerce cart, hide FunnelKit floating icon */
    @media (min-width: 769px) {
        /* Hide FunnelKit floating cart icon on desktop */
        #fc_sidecart,
        .fkcart-floating-icon,
        .fk-cart-floating-icon,
        [class*="fkcart-floating"],
        [id*="fkcart-floating"] {
            display: none !important;
        }
        /* Ensure WooCommerce default cart is visible */
        .ast-header-woo-cart,
        .ast-woo-header-cart,
        .main-header-bar .ast-site-header-cart {
            display: block !important;
        }
    }
    /* MOBILE: Hide WooCommerce cart, show FunnelKit */
    @media (max-width: 768px) {
        /* Hide default WooCommerce cart button in header on mobile */
        .ast-header-woo-cart,
        .ast-woo-header-cart,
        .astra-cart-drawer,
        .header-main .ast-site-header-cart,
        .main-header-bar .ast-site-header-cart,
        .woocommerce-cart-tab,
        .cart-contents {
            display: none !important;
        }
        /* Position FunnelKit Cart Button for mobile */
        #fc_sidecart {
            bottom: 100px !important;
            right: 15px !important;
            z-index: 9999 !important;
        }
    }
    </style>
    <?php
}

// 2. SET DEFAULT PROFILE IMAGE OPTION IN ADMIN
add_action('admin_menu', 'add_profile_settings_page');
function add_profile_settings_page() {
    add_options_page(
        'Profile Settings',
        'Profile Settings', 
        'manage_options',
        'profile-settings',
        'profile_settings_page'
    );
}

function profile_settings_page() {
    if (isset($_POST['save_avatar'])) {
        update_option('custom_default_avatar_id', sanitize_text_field($_POST['default_avatar_id']));
        echo '<div class="notice notice-success"><p>Default avatar saved!</p></div>';
    }
    
    // ✅ Cache avatar data
    $current_avatar_id = get_option('custom_default_avatar_id', '');
    $current_avatar_url = '';
    
    if ($current_avatar_id) {
        // Use transient to cache URL for 1 hour
        $cache_key = 'default_avatar_url_' . $current_avatar_id;
        $current_avatar_url = get_transient($cache_key);
        
        if ($current_avatar_url === false) {
            $current_avatar_url = wp_get_attachment_url($current_avatar_id);
            set_transient($cache_key, $current_avatar_url, HOUR_IN_SECONDS);
        }
    }
    ?>
    <div class="wrap">
        <h1>Profile Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th scope="row">Default Profile Image</th>
                    <td>
                        <input type="hidden" id="default_avatar_id" name="default_avatar_id" value="<?php echo esc_attr($current_avatar_id); ?>" />
                        <img id="avatar_preview" src="<?php echo esc_url($current_avatar_url); ?>" style="max-width: 100px; display: <?php echo $current_avatar_url ? 'block' : 'none'; ?>;" />
                        <p>
                            <button type="button" class="button" id="upload_avatar">Choose Image</button>
                            <button type="button" class="button" id="remove_avatar">Remove</button>
                        </p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <input type="submit" name="save_avatar" class="button-primary" value="Save Settings" />
            </p>
        </form>
        
        <script>
        jQuery(document).ready(function($) {
            var mediaUploader;
            
            $('#upload_avatar').click(function(e) {
                e.preventDefault();
                if (mediaUploader) {
                    mediaUploader.open();
                    return;
                }
                
                mediaUploader = wp.media.frames.file_frame = wp.media({
                    title: 'Choose Default Profile Image',
                    button: { text: 'Choose Image' },
                    multiple: false
                });
                
                mediaUploader.on('select', function() {
                    var attachment = mediaUploader.state().get('selection').first().toJSON();
                    $('#default_avatar_id').val(attachment.id);
                    $('#avatar_preview').attr('src', attachment.url).show();
                });
                
                mediaUploader.open();
            });
            
            $('#remove_avatar').click(function() {
                $('#default_avatar_id').val('');
                $('#avatar_preview').hide();
            });
        });
        </script>
    </div>
    <?php
}

// 3. ENQUEUE MEDIA UPLOADER IN ADMIN
add_action('admin_enqueue_scripts', function($hook) {
    if ($hook === 'settings_page_profile-settings') {
        wp_enqueue_media();
    }
});
// ============================================================================
// SIMPLE: Device-Specific Shortcodes (No CSS here!)
// ============================================================================
add_action('init', 'register_device_specific_shortcodes');
function register_device_specific_shortcodes() {
    add_shortcode('mobile-heading', 'mobile_heading_shortcode');
    add_shortcode('desktop-heading', 'desktop_heading_shortcode');
    add_shortcode('mobile-caption', 'mobile_caption_shortcode');
    add_shortcode('desktop-caption', 'desktop_caption_shortcode');
}

function mobile_heading_shortcode($atts, $content = null) {
    if (empty($content)) return '';
    return '<div class="mobile-only-heading">' . do_shortcode($content) . '</div>';
}

function desktop_heading_shortcode($atts, $content = null) {
    if (empty($content)) return '';
    return '<div class="desktop-only-heading">' . do_shortcode($content) . '</div>';
}

function mobile_caption_shortcode($atts, $content = null) {
    if (empty($content)) return '';
    return '<div class="mobile-only-caption">' . do_shortcode($content) . '</div>';
}

function desktop_caption_shortcode($atts, $content = null) {
    if (empty($content)) return '';
    return '<div class="desktop-only-caption">' . do_shortcode($content) . '</div>';
}



// REMOVE HEAVY BUTTON STYLING - KEEP ORIGINAL DESIGN
remove_action('wp_head', 'uniform_add_to_cart_buttons_sitewide'); // Remove the styling I just provided

// MINIMAL BUTTON ADJUSTMENT - ONLY TEXT ALIGNMENT
add_action('wp_head', 'minimal_button_text_fix_only');
function minimal_button_text_fix_only() {
    ?>
    <style>
    /* MINIMAL FIX - ONLY TEXT ALIGNMENT AND SMALL ADJUSTMENTS */
    
    /* Fix custom variation button text alignment */
    .custom-variation-cart-btn {
        text-align: left !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
        /* Keep all other styling from original code */
    }
    
    /* Ensure all buttons have consistent text alignment */
    .woocommerce .button,
    .woocommerce-page .button,
    .woocommerce ul.products li.product .button,
    .button.product_type_simple,
    .button.product_type_variable {
        text-align: left !important; /* Only change text alignment */
        padding-left: 12px !important;
        padding-right: 12px !important;
        /* Don't change colors, sizes, or other styling */
    }
    
    /* Fix any button width inconsistencies without changing design */
    .woocommerce ul.products li.product .button {
        min-width: auto !important; /* Let theme control the width */
        width: auto !important; /* Don't force specific width */
    }
    </style>
    <?php
}

// ENSURE CART FRAGMENTS ARE PROPERLY UPDATED FOR CUSTOM VARIANTS
add_filter('woocommerce_add_to_cart_fragments', 'custom_variant_cart_fragments');
function custom_variant_cart_fragments($fragments) {
    // ✅ Safety check - ensure WooCommerce cart is available
    if (!function_exists('WC') || !WC()->cart) {
        return $fragments;
    }
    
    $cart_count = WC()->cart->get_cart_contents_count();
    
    // Standard WooCommerce fragments
    $fragments['.cart-contents-count'] = '<span class="cart-contents-count">' . $cart_count . '</span>';
    $fragments['.cart-count'] = '<span class="cart-count">' . $cart_count . '</span>';
    
    // FunnelKit specific fragments
    $fragments['.fkcart-count'] = '<span class="fkcart-count">' . $cart_count . '</span>';
    $fragments['.fk-cart-count'] = '<span class="fk-cart-count">' . $cart_count . '</span>';
    
    return $fragments;
}
// ============================================
// COMPLETE GITHUB CDN SYSTEM
// Repositories:
// - betterestech-assets (JS/CSS)
// - betterestech-uploads (Images/Videos)
// ============================================

// ============================================
// FIXED CDN FILTERS (NO MORE DUPLICATES!)
// ============================================

// JavaScript CDN Filter
add_filter('script_loader_src', 'use_jsdelivr_cdn_js', 10, 2);
function use_jsdelivr_cdn_js($src, $handle) {
    if (is_admin() || strpos($src, '/wp-admin/') !== false) {
        return $src;
    }
    
    // ✅ SKIP if already from CDN (prevents double-run)
    if (strpos($src, 'cdn.jsdelivr.net') !== false) {
        return $src;
    }
    
    $src_clean = strtok($src, '?');
    $cdn_base = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js';
    
    $js_map = [
        // YOUR NEW FOLDER FILES
        'wp-includes/js/jquery/jquery.min.js' => "$cdn_base/new/jquery.min.js",
        'jquery.min.js' => "$cdn_base/new/jquery.min.js",
        'wp-includes/js/jquery/jquery-migrate.min.js' => "$cdn_base/new/jquery-migrate.min.js",
        'jquery-migrate.min.js' => "$cdn_base/new/jquery-migrate.min.js",
        'jquery.blockUI.min.js' => "$cdn_base/new/jquery.blockUI.min.js",
        'utm-tracker.min.js' => "$cdn_base/new/utm-tracker.min.js",
        'geolocation.min.js' => "$cdn_base/new/geolocation.min.js",
        'js.cookie.min.js' => "$cdn_base/new/js.cookie.min.js",
        'spectra-block-positioning.min.js' => "$cdn_base/new/spectra-block-positioning.min.js",
        'sourcebuster.min.js' => "$cdn_base/new/sourcebuster.min.js",
        'order-attribution.min.js' => "$cdn_base/new/order-attribution.min.js",
        'hurrytimer/assets/js/cookie.min.js' => "$cdn_base/new/cookie.min.js",
        'embla-carousel.min.js' => "$cdn_base/new/embla-carousel.min.js",
        'winp-css-js/2156.js' => "$cdn_base/new/2156.js",
        'winp-css-js/2154.js' => "$cdn_base/new/2154.js",
        'astra/assets/js/minified/frontend.min.js' => "$cdn_base/new/frontend.min.js",
        'astra/assets/js/minified/flexibility.min.js' => "$cdn_base/new/flexibility.min.js",
        'astra/assets/js/minified/mobile-cart.min.js' => "$cdn_base/new/mobile-cart.min.js",
        // Product page files
    'woocommerce/assets/js/zoom/jquery.zoom.min.js' => "$cdn_base/new/jquery.zoom.min.js",
    'woocommerce/assets/js/flexslider/jquery.flexslider.min.js' => "$cdn_base/new/jquery.flexslider.min.js",
    'woocommerce/assets/js/photoswipe/photoswipe-ui-default.min.js' => "$cdn_base/new/photoswipe-ui-default.min.js",
    'wp-includes/js/comment-reply.min.js' => "$cdn_base/new/comment-reply.min.js",
    'product-video-gallery-slider-for-woocommerce/public/js/jquery.zoom.min.js' => "$cdn_base/new1/jquery.zoom.min.js",
    'product-video-gallery-slider-for-woocommerce/public/js/jquery.elevatezoom.min.js' => "$cdn_base/new/jquery.elevatezoom.min.js",
    'product-video-gallery-slider-for-woocommerce/public/js/swiper-bundle.min.js' => "$cdn_base/new/swiper-bundle.min.js",
    'product-video-gallery-slider-for-woocommerce/public/js/nickx.front.js' => "$cdn_base/new/nickx.front.js",
        
        // EXISTING FILES
        'woocommerce.min.js' => "$cdn_base/woocommerce.min.js",
        'cart.min.js' => "$cdn_base/cart.min.js",
        'add-to-cart-variation.min.js' => "$cdn_base/woocommerce/add-to-cart-variation.min.js",
        'cart-fragments.min.js' => "$cdn_base/woocommerce/cart-fragments.min.js",
        'single-product.min.js' => "$cdn_base/woocommerce/single-product.min.js",
        'elementor/assets/js/frontend.min.js' => "$cdn_base/elementor/frontend.min.js",
        'underscore.min.js' => "$cdn_base/wordpress/underscore.min.js",
        'wp-util.min.js' => "$cdn_base/wordpress/wp-util.min.js",
        'photoswipe.min.js' => "$cdn_base/photoswipe/photoswipe.min.js",
        'jquery.fancybox.js' => "$cdn_base/fancybox/jquery.fancybox.js",
        'swatches.js' => "$cdn_base/swatches/swatches.js",
        'price-prefetch.js' => "$cdn_base/custom/price-prefetch.js",
    ];
    
    foreach ($js_map as $filename => $cdn_url) {
        if (strpos($src_clean, $filename) !== false) {
            return $cdn_url;
        }
    }
    
    return $src;
}

// CSS CDN Filter
add_filter('style_loader_src', 'use_jsdelivr_cdn_css', 10, 2);
function use_jsdelivr_cdn_css($src, $handle) {
    if (is_admin() || strpos($src, '/wp-admin/') !== false) {
        return $src;
    }
    
    // ✅ SKIP if already from CDN (prevents double-run)
    if (strpos($src, 'cdn.jsdelivr.net') !== false) {
        return $src;
    }
    
    $src_clean = strtok($src, '?');
    $cdn_base = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/css';
    
    $css_map = [
        // YOUR NEW FOLDER FILES
        'elementor/css/post-17.css' => $cdn_base . '/new/post-17.css',
        'astra/assets/css/minified/main.min.css' => "$cdn_base/new/main.min.css",
        'astra/assets/css/minified/style.min.css' => "$cdn_base/new/style.min.css",
        'ultimate-addons-for-gutenberg/assets/css/spectra-block-positioning.min.css' => "$cdn_base/new/spectra-block-positioning.min.css",
        'custom-style-blocks.css' => "$cdn_base/new/custom-style-blocks.css",
        // Product page files
    'astra/assets/css/minified/compatibility/woocommerce/sticky-add-to-cart.min.css' => "$cdn_base/new/sticky-add-to-cart.min.css",
    'product-video-gallery-slider-for-woocommerce/public/css/nickx-front.css' => "$cdn_base/new/nickx-front.css",
        // In your CSS map:
'hurrytimer/css/059459a8d58f6e37.css' => "$cdn_base/new/059459a8d58f6e37.css",

        // EXISTING FILES
        'woocommerce.min.css' => "$cdn_base/woocommerce.min.css",
        'woocommerce-layout-grid.min.css' => "$cdn_base/woocommerce/woocommerce-layout-grid.min.css",
        'woocommerce-grid.min.css' => "$cdn_base/woocommerce/woocommerce-grid.min.css",
        'woocommerce-smallscreen-grid.min.css' => "$cdn_base/woocommerce/woocommerce-smallscreen-grid.min.css",
        'elementor/assets/css/frontend.min.css' => "$cdn_base/elementor/frontend.min.css",
        'dashicons.min.css' => "$cdn_base/wordpress/dashicons.min.css",
        'photoswipe.min.css' => "$cdn_base/photoswipe/photoswipe.min.css",
        'default-skin.min.css' => "$cdn_base/photoswipe/default-skin.min.css",
        'fancybox.css' => "$cdn_base/fancybox/fancybox.css",
        'swiper-bundle.min.css' => "$cdn_base/swiper/swiper-bundle.min.css",
        'swatches.css' => "$cdn_base/swatches/swatches.css",
        'font-awesome.min.css' => "$cdn_base/font-awesome.min.css",
        'woocommerce/assets/client/blocks/wc-blocks.css' => "$cdn_base/woocommerce/wc-blocks.css",
        'brands.css' => "$cdn_base/woocommerce/brands.css",
        'cart-for-woocommerce/assets/css/style.min.css' => "$cdn_base/plugins/cart-for-woocommerce/style.min.css",
        'themes/astra/style.css' => "$cdn_base/astra/style.css",
        'themes/astra-child/style.css' => "$cdn_base/astra/child-style.css",
        'block-library/style.min.css' => "$cdn_base/wordpress/block-library-style.min.css",
    ];
    
    foreach ($css_map as $filename => $cdn_url) {
        if (strpos($src_clean, $filename) !== false) {
            return $cdn_url;
        }
    }
    
    return $src;
}

// ============================================
// CATCH HARDCODED winp-css-js FILES + REMOVE DUPLICATES
// ============================================
function replace_hardcoded_scripts($html) {
    // Replace winp-css-js files (hardcoded in HTML)
    $replacements = [
        'betterestech.unaux.com/wp-content/uploads/winp-css-js/2156.js' => 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/2156.js',
        'betterestech.unaux.com/wp-content/uploads/winp-css-js/2154.js' => 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/2154.js',
    ];
    
    foreach ($replacements as $old => $new) {
        // Replace with or without query parameters
        $html = preg_replace(
            '/' . preg_quote($old, '/') . '(\?[^"\'\s>]*)?/i',
            $new,
            $html
        );
    }
    
    // Remove duplicate ProFreeHost versions if CDN version exists
    $duplicates = [
        'main.min.css' => [
            'cdn' => 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/css/new/main.min.css',
            'local' => 'betterestech.unaux.com/wp-content/themes/astra/assets/css/minified/main.min.css'
        ],
        'jquery.min.js' => [
            'cdn' => 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/jquery.min.js',
            'local' => 'betterestech.unaux.com/wp-includes/js/jquery/jquery.min.js'
        ]
    ];
    
    foreach ($duplicates as $file => $urls) {
        // If CDN version exists, remove local version
        if (strpos($html, $urls['cdn']) !== false) {
            if (strpos($file, '.css') !== false) {
                $html = preg_replace(
                    '/<link[^>]*href=["\']https?:\/\/' . preg_quote($urls['local'], '/') . '[^"\']*["\'][^>]*>/i',
                    '',
                    $html
                );
            } else {
                $html = preg_replace(
                    '/<script[^>]*src=["\']https?:\/\/' . preg_quote($urls['local'], '/') . '[^"\']*["\'][^>]*><\/script>/i',
                    '',
                    $html
                );
            }
        }
    }
    
    return $html;
}
// ============================================
// 3. UPLOADS CDN (Images, Videos, Media)
// ENHANCED: Catches ALL image types including backgrounds
// ============================================

// 3A. Rewrite attachment URLs (images, videos, PDFs)
add_filter('wp_get_attachment_url', 'rewrite_uploads_to_cdn');
function rewrite_uploads_to_cdn($url) {
        // ✅ Cache excluded paths as static (only check once)
    static $excluded_patterns = null;
    
    if ($excluded_patterns === null) {
        $excluded_patterns = [
            '/uag-plugin/', '/winp-css-js/', '/hurrytimer/', '/wp-code-logs/',
            '/wc-logs/', '/cart-flows-logs/', '/custom-css-js/', '/astra-docs/', '/ast-block-templates/'
        ];
    }
    $cdn_base = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main';
    
    // ⚠️ EXCLUDE these paths - they're dynamically generated, not media files
    $excluded_paths = [
        '/uag-plugin/',           // Gutenberg blocks
        '/winp-css-js/',          // Plugin JS/CSS
        '/hurrytimer/',           // HurryTimer (NEW - dynamic CSS)
        '/wp-code-logs/',         // Logs
        '/wc-logs/',              // WooCommerce logs
        '/cart-flows-logs/',      // CartFlows logs
        '/custom-css-js/',        // Custom code
        '/astra-docs/',           // Astra documentation
        '/ast-block-templates/',  // Astra templates
    ]; 
    // ✅ Faster check using cached patterns
    foreach ($excluded_patterns as $pattern) {
        if (strpos($url, $pattern) !== false) {
            return $url;
        }
    }

    
    // Only rewrite uploads folder URLs (media files only)
    if (strpos($url, '/wp-content/uploads/') !== false) {
        $path = substr($url, strpos($url, '/wp-content/uploads/') + 20);
        return $cdn_base . '/' . $path;
    }
    
    return $url;
}
// 3B. Rewrite image src (for wp_get_attachment_image)
add_filter('wp_get_attachment_image_src', 'rewrite_image_src_to_cdn', 10, 4);
function rewrite_image_src_to_cdn($image, $attachment_id, $size, $icon) {
    if (!$image || !isset($image[0])) {
        return $image;
    }
    
    $image[0] = rewrite_uploads_to_cdn($image[0]);
    return $image;
}

// 3C. Rewrite URLs in post content (product descriptions, pages)
add_filter('the_content', 'rewrite_content_to_cdn', 20);
function rewrite_content_to_cdn($content) {
    $cdn_base = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main';
    
    $patterns = [
        site_url('/wp-content/uploads/'),
        home_url('/wp-content/uploads/'),
        '"/wp-content/uploads/',
        "'/wp-content/uploads/",
        'src="/wp-content/uploads/',
        "src='/wp-content/uploads/",
    ];
    
    $replacements = [
        $cdn_base . '/',
        $cdn_base . '/',
        '"' . $cdn_base . '/',
        "'" . $cdn_base . '/',
        'src="' . $cdn_base . '/',
        "src='" . $cdn_base . '/',
    ];
    
    return str_replace($patterns, $replacements, $content);
}

// 3D. Rewrite responsive image srcset (all image sizes)
add_filter('wp_calculate_image_srcset', 'rewrite_srcset_to_cdn', 10, 5);
function rewrite_srcset_to_cdn($sources, $size_array, $image_src, $image_meta, $attachment_id) {
    if (!is_array($sources)) {
        return $sources;
    }
    
    foreach ($sources as $width => $source) {
        $sources[$width]['url'] = rewrite_uploads_to_cdn($source['url']);
    }
    
    return $sources;
}

// 3E. Rewrite background images in inline styles
add_filter('wp_get_attachment_image_attributes', 'rewrite_image_attributes_to_cdn', 10, 3);
function rewrite_image_attributes_to_cdn($attr, $attachment, $size) {
    foreach ($attr as $key => $value) {
        if (strpos($key, 'src') !== false || strpos($key, 'data-') === 0) {
            if (is_string($value) && strpos($value, '/wp-content/uploads/') !== false) {
                $attr[$key] = rewrite_uploads_to_cdn($value);
            }
        }
    }
    
    return $attr;
}

// ✅ COMBINED CDN Buffer (Merges hardcoded scripts + background images)
add_action('template_redirect', 'unified_cdn_buffer', 1);
function unified_cdn_buffer() {
    if (is_admin()) return;
    ob_start('unified_cdn_replacements');
}

function unified_cdn_replacements($html) {
    $cdn_base_js = 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new';
    $cdn_base_uploads = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main';
    
    // Excluded paths for uploads
    $excluded_paths = [
        '/uag-plugin/', '/winp-css-js/', '/hurrytimer/', '/wp-code-logs/',
        '/wc-logs/', '/cart-flows-logs/', '/custom-css-js/', '/astra-docs/', '/ast-block-templates/'
    ];

    // Fix hero image - with ABSOLUTE URLs (protocol required)
    $hero_replacements = [
        'https://betterestech.unaux.com/wp-content/uploads/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png' 
            => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png',
        'http://betterestech.unaux.com/wp-content/uploads/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png' 
            => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png',
        '//betterestech.unaux.com/wp-content/uploads/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png' 
            => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png',
        'betterestech.unaux.com/wp-content/uploads/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png' 
            => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png',
    ];

    $html = str_replace(array_keys($hero_replacements), array_values($hero_replacements), $html);
    // Fix default profile picture - with ABSOLUTE URLs
$profile_pic_replacements = [
    'https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg' 
        => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/download-1-1.jpeg',
    'http://betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg' 
        => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/download-1-1.jpeg',
    '//betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg' 
        => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/download-1-1.jpeg',
    'betterestech.unaux.com/wp-content/uploads/2025/10/download-1-1.jpeg' 
        => 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main/2025/10/download-1-1.jpeg',
];

$html = str_replace(array_keys($profile_pic_replacements), array_values($profile_pic_replacements), $html);


    // ✅ 1. Replace hardcoded winp-css-js files
    $html = str_replace(
        [
            'betterestech.unaux.com/wp-content/uploads/winp-css-js/2156.js',
            'betterestech.unaux.com/wp-content/uploads/winp-css-js/2154.js'
        ],
        [
            $cdn_base_js . '/2156.js',
            $cdn_base_js . '/2154.js'
        ],
        $html
    );
    
    // ✅ 2. Remove duplicate files if CDN exists
    if (strpos($html, 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/css/new/main.min.css') !== false) {
        $html = preg_replace('/<link[^>]*href=["\']https?:\/\/betterestech\.unaux\.com\/wp-content\/themes\/astra\/assets\/css\/minified\/main\.min\.css[^"\']*["\'][^>]*>/i', '', $html);
    }
    
    // ========================================
    // REMOVE DUPLICATE JQUERY - BULLETPROOF VERSION
    // ========================================
    
    // Remove ALL forms of jQuery from wp-includes (multiple patterns)
    $jquery_patterns = [
        // Pattern 1: https with betterestech.unaux.com
        '/<script[^>]*src=["\']https:\/\/betterestech\.unaux\.com\/wp-includes\/js\/jquery\/jquery\.min\.js[^"\']*["\'][^>]*><\/script>\s*/i',
        
        // Pattern 2: http with betterestech.unaux.com
        '/<script[^>]*src=["\']http:\/\/betterestech\.unaux\.com\/wp-includes\/js\/jquery\/jquery\.min\.js[^"\']*["\'][^>]*><\/script>\s*/i',
        
        // Pattern 3: Protocol-relative //betterestech.unaux.com
        '/<script[^>]*src=["\']\/\/betterestech\.unaux\.com\/wp-includes\/js\/jquery\/jquery\.min\.js[^"\']*["\'][^>]*><\/script>\s*/i',
        
        // Pattern 4: Relative path /wp-includes
        '/<script[^>]*src=["\']\/wp-includes\/js\/jquery\/jquery\.min\.js[^"\']*["\'][^>]*><\/script>\s*/i',
        
        // Pattern 5: jquery-migrate removal
        '/<script[^>]*src=["\'][^"\']*jquery-migrate[^"\']*["\'][^>]*><\/script>\s*/i',
    ];
    
    foreach ($jquery_patterns as $pattern) {
        $html = preg_replace($pattern, '', $html);
    }
    
    // Extra safety: If CDN jQuery exists, remove any remaining wp-includes jquery
    if (strpos($html, 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/jquery.min.js') !== false) {
        // Nuclear pattern: any script with wp-includes AND jquery
        $html = preg_replace(
            '/<script[^>]*src=["\'][^"\']*wp-includes[^"\']*jquery[^"\']*["\'][^>]*><\/script>\s*/i',
            '',
            $html
        );
    }
    
    // ✅ 3. Replace background-image URLs (simplified - no callback)
    $html = preg_replace(
        '/background-image:\s*url\([\'"]?(https?:\/\/[^\'"]+betterestech\.unaux\.com\/wp-content\/uploads\/([^\'"]+))[\'"]?\)/i',
        'background-image:url(' . $cdn_base_uploads . '/$2)',
        $html
    );

    return $html;
}
// ========================================
// COMPREHENSIVE DEBUG: See ALL script tags
// ========================================
function debug_all_scripts_in_html($html) {
    // Only debug on homepage with no-cdn parameter
    if (!isset($_GET['no-cdn'])) {
        return $html;
    }
    
    error_log('=== COMPREHENSIVE SCRIPT DEBUG ===');
    
    // 1. Find ALL script tags with src attribute
    preg_match_all('/<script[^>]*src=["\']([^"\']+)["\'][^>]*>/i', $html, $all_scripts);
    
    error_log('Total scripts with src: ' . count($all_scripts[1]));
    
    if (!empty($all_scripts[1])) {
        foreach ($all_scripts[1] as $index => $src_url) {
            // Check if it's jQuery-related
            if (stripos($src_url, 'jquery') !== false) {
                error_log("⚠️  JQUERY Script #{$index}: {$src_url}");
                error_log("    Full tag: " . $all_scripts[0][$index]);
            }
        }
    }
    
    // 2. Specifically look for wp-includes jQuery
    preg_match_all('/<script[^>]*src=["\'][^"\']*wp-includes[^"\']*jquery[^"\']*["\'][^>]*>/i', $html, $wp_includes_jquery);
    
    if (!empty($wp_includes_jquery[0])) {
        error_log('❌ FOUND WP-INCLUDES JQUERY:');
        foreach ($wp_includes_jquery[0] as $tag) {
            error_log("    {$tag}");
        }
    } else {
        error_log('✅ NO wp-includes jQuery found in HTML');
    }
    
    // 3. Check for inline jQuery
    if (preg_match('/<script[^>]*>[\s\S]*?jQuery[\s\S]*?<\/script>/i', $html)) {
        error_log('⚠️  Found inline jQuery usage in script tags');
    }
    
    // 4. Check CDN jQuery
    if (strpos($html, 'cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/jquery.min.js') !== false) {
        error_log('✅ CDN jQuery found in HTML');
    } else {
        error_log('❌ CDN jQuery NOT found in HTML');
    }
    
    error_log('=== END COMPREHENSIVE DEBUG ===');
    
    return $html;
}

// Hook debug AFTER your main replacements
add_action('template_redirect', function() {
    ob_start('debug_all_scripts_in_html');
}, 999);


function rewrite_background_images_to_cdn($html) {
    $cdn_base = 'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-uploads@main';
    
    // Excluded paths
    $excluded_paths = [
        '/uag-plugin/',
        '/winp-css-js/',
        '/hurrytimer/',           // NEW
        '/wp-code-logs/',
        '/wc-logs/',
        '/cart-flows-logs/',
        '/custom-css-js/',
        '/astra-docs/',
        '/ast-block-templates/',
    ];
    
    // Replace background-image URLs
    $html = preg_replace_callback(
        '/background-image:\s*url\([\'"]?(https?:\/\/[^\'"]+\/wp-content\/uploads\/([^\'"]+))[\'"]?\)/i',
        function($matches) use ($cdn_base, $excluded_paths) {
            $old_url = $matches[1];
            $path = $matches[2];
            
            // Check if excluded
            foreach ($excluded_paths as $excluded) {
                if (strpos($old_url, $excluded) !== false) {
                    return 'background-image:url(' . $old_url . ')'; // Keep original
                }
            }
            
            $new_url = $cdn_base . '/' . $path;
            return 'background-image:url(' . $new_url . ')';
        },
        $html
    );
    
    // Simple string replacement for remaining URLs
    $html = preg_replace_callback(
        '/(https?:\/\/[^\s\'"]+\/wp-content\/uploads\/[^\s\'"]+)/i',
        function($matches) use ($cdn_base, $excluded_paths) {
            $url = $matches[1];
            
            foreach ($excluded_paths as $excluded) {
                if (strpos($url, $excluded) !== false) {
                    return $url; // Keep original
                }
            }
            
            $path = substr($url, strpos($url, '/wp-content/uploads/') + 20);
            return $cdn_base . '/' . $path;
        },
        $html
    );
    
    return $html;
}
// ============================================
// 3G. Elementor-specific filter (if using Elementor)
// ============================================
add_filter('elementor/frontend/print_google_fonts', '__return_false'); // Optional: Disable Google Fonts


// FORCE CDN CACHE PURGE - Add version parameter
add_filter('script_loader_src', 'add_cdn_version', 11, 2);
add_filter('style_loader_src', 'add_cdn_version', 11, 2);
function add_cdn_version($src, $handle) {
    if (strpos($src, 'cdn.jsdelivr.net') !== false) {
        // Use static version - only change when updating files
        $separator = (strpos($src, '?') === false) ? '?' : '&';
        return $src . $separator . 'v=1.0.0'; // Change to 1.0.1, 1.0.2 when you update
    }
    return $src;
}
// ============================================
// FINAL PROVEN OPTIMIZATIONS 
// ============================================

// Remove Google Translate (lightweight)
add_filter('wp_footer', function() {
    echo '<style>.goog-te-banner-frame{display:none!important;}.skiptranslate{display:none!important;}</style>';
}, 999);

// ============================================
// FONT AWESOME - OPTIMIZED & FIXED
// ============================================

// Step 1: Load Font Awesome ONLY on specific pages
add_action('wp_enqueue_scripts', 'betterestech_enqueue_font_awesome', 1);
function betterestech_enqueue_font_awesome() {
    // Check if we're on My Account page (including custom shortcode pages)
    $is_my_account = (
        is_page('my-account') || 
        is_page('account-settings') ||
        strpos($_SERVER['REQUEST_URI'], '/my-account') !== false
    );
    
    // Only load on My Account pages
    if ($is_my_account) {
        // Use a unique handle that won't be blocked
        wp_enqueue_style(
            'betterestech-fontawesome', // Unique handle
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
            array(),
            '6.5.1'
        );
    }
}

// Step 2: Remove duplicate Font Awesome from other plugins
add_action('wp_enqueue_scripts', 'betterestech_remove_duplicate_fontawesome', 99999);
function betterestech_remove_duplicate_fontawesome() {
    // List of common Font Awesome handles from plugins
    $fa_handles = [
        'fontawesome',
        'font-awesome',
        'fontawesome-css',
        'font-awesome-css',
        'fontawesome-all',
        'fa',
        'fa-css',
        'all-css',
        'elementor-icons-fa-solid', // Elementor
        'elementor-icons-fa-regular', // Elementor
        'elementor-icons-fa-brands', // Elementor
    ];
    
    // Get current page
    $is_my_account = (
        is_page('my-account') || 
        is_page('account-settings') ||
        strpos($_SERVER['REQUEST_URI'], '/my-account') !== false
    );
    
    // Only remove duplicates on My Account pages
    // (Let other pages load their own Font Awesome if needed)
    if ($is_my_account) {
        foreach ($fa_handles as $handle) {
            // Don't remove OUR Font Awesome
            if ($handle !== 'betterestech-fontawesome') {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
        }
    }
}

// Step 3: Block Font Awesome from other plugins via HTML filter
add_filter('style_loader_tag', 'betterestech_block_duplicate_fontawesome_html', 10, 4);
function betterestech_block_duplicate_fontawesome_html($html, $handle, $href, $media) {
    // Get current page
    $is_my_account = (
        is_page('my-account') || 
        is_page('account-settings') ||
        strpos($_SERVER['REQUEST_URI'], '/my-account') !== false
    );
    
    // Only on My Account pages
    if ($is_my_account) {
        // Block Cloudflare Font Awesome EXCEPT our own
        if (strpos($href, 'cdnjs.cloudflare.com') !== false && 
            strpos($href, 'font-awesome') !== false &&
            $handle !== 'betterestech-fontawesome') { // ✅ Don't block our own!
            return ''; // Block duplicate
        }
        
        // Block other common Font Awesome CDN sources
        if ((strpos($href, 'fontawesome.com') !== false ||
             strpos($href, 'use.fontawesome.com') !== false ||
             strpos($href, 'kit.fontawesome.com') !== false) &&
            $handle !== 'betterestech-fontawesome') {
            return ''; // Block duplicate
        }
    }
    
    return $html;
}

// ============================================
// NEW FIXES FOR FOUC & CLS
// ============================================

// #12: Inline Critical CSS (Fix FOUC)
add_action('wp_head', 'inline_critical_css', 1);
function inline_critical_css() {
    ?>
    <style id="critical-css">
    body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-display:swap}
    .site-header{background:#fff;position:relative;z-index:999}
    .site-main{min-height:50vh}
    img{max-width:100%;height:auto;display:block}
    </style>
    <?php
}

// #13: Fix Desktop CLS (Font-display:swap)
add_filter('wp_resource_hints', 'optimize_google_fonts_loading', 10, 2);
function optimize_google_fonts_loading($urls, $relation_type) {
    if ('preconnect' === $relation_type) {
        foreach ($urls as $key => $url) {
            if (strpos($url['href'], 'fonts.googleapis.com') !== false || 
                strpos($url['href'], 'fonts.gstatic.com') !== false) {
                $urls[$key]['crossorigin'] = 'anonymous';
            }
        }
    }
    return $urls;
}


// ============================================
// SMART BACKGROUND PRICE PREFETCHING
// Pre-loads all product prices on homepage visit
// ============================================

/**
 * Strategy:
 * 1. User lands on any page (homepage, product, etc)
 * 2. Detect currency/location immediately
 * 3. Background fetch ALL product prices (silent, no loading)
 * 4. Store in browser localStorage (persists across pages)
 * 5. When user visits Shop - prices load instantly from localStorage!
 */

// BULLETPROOF AJAX PRICE FETCHER WITH MULTIPLE CURRENCY DETECTION METHODS
function ajax_prefetch_all_prices() {
    // ✅ NEW: Check cache first (instant response!)
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    $cache_key = 'prefetch_prices_' . $user_currency;
    $cached_response = get_transient($cache_key);
    
    if ($cached_response !== false) {
        wp_send_json_success($cached_response);
        return;
    }
    
    // Force USD currency for AJAX
    add_filter('woocommerce_currency', function() { return 'USD'; }, 9999);
    add_filter('woocommerce_currency_symbol', function() { return '$'; }, 9999);
    
    // Variant product configuration
    $variant_config = [
        884  => 1785,
        902  => 1786,
        1244 => 1790,
        1335 => 1796,
        1337 => 1798,
        1338 => 1792
    ];

    // ✅ OPTIMIZED: Limit to 50 products (instead of -1 = ALL)
    $products = wc_get_products([
        'status' => 'publish',
        'limit'  => 50,  // ← CHANGED from -1 to 50
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'ids',
    ]);

    $prices = [];

    foreach ($products as $product_id) {
        // For variant products: Use specific variation
        if (isset($variant_config[$product_id])) {
            $variation_id = $variant_config[$product_id];
            $variation = wc_get_product($variation_id);
            
            if ($variation && $variation->is_type('variation')) {
                $prices[$product_id] = [
                    'html'      => $variation->get_price_html(),
                    'regular'   => $variation->get_regular_price(),
                    'sale'      => $variation->get_sale_price(),
                    'formatted' => wc_price($variation->get_price()),
                    'is_variant' => true
                ];
                continue;
            }
        }
        
        // Normal products
        $product = wc_get_product($product_id);
        if (!$product) continue;

        $prices[$product_id] = [
            'html'      => $product->get_price_html(),
            'regular'   => $product->get_regular_price(),
            'sale'      => $product->get_sale_price(),
            'formatted' => wc_price($product->get_price()),
            'is_variant' => false
        ];
    }

    // Get exchange rate from your system
    $rate = get_safe_exchange_rate($user_currency);
    
    // Get currency symbol
    $symbol = get_safe_symbol($user_currency);
    
    // Prepare response
    $response_data = [
        'prices'        => $prices,
        'base_currency' => 'USD',
        'user_currency' => $user_currency,
        'country'       => 'US',
        'symbol'        => $symbol,
        'rate'          => $rate,
        'timestamp'     => current_time('timestamp'),
    ];
    
    // ✅ NEW: Cache response for 1 hour
    set_transient($cache_key, $response_data, HOUR_IN_SECONDS);
    
    wp_send_json_success($response_data);
}
add_action('wp_ajax_prefetch_all_prices', 'ajax_prefetch_all_prices');
add_action('wp_ajax_nopriv_prefetch_all_prices', 'ajax_prefetch_all_prices');

// 2. Enqueue smart prefetch script
add_action('wp_enqueue_scripts', 'enqueue_price_prefetch_script');
function enqueue_price_prefetch_script() {
    // ✅ FIXED: Load on shop, products, cart, AND checkout
    if (is_admin()) {
        return;
    }
    
    // ✅ Only load on WooCommerce pages
    if (!is_shop() && !is_product() && !is_cart() && !is_checkout() && !is_product_category() && !is_product_tag()) {
        return;
    }
    
    wp_enqueue_script(
        'price-prefetch',
        get_stylesheet_directory_uri() . '/js/price-prefetch.js',
        array('jquery'),
        '1.2', // ✅ Version bump
        true
    );
    
    // CRITICAL: Pass currency to JavaScript
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    
    wp_localize_script('price-prefetch', 'pricePrefetch', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('price_prefetch_nonce'),
        'is_shop' => is_shop() || is_product_category() || is_product_tag(),
        'cache_duration' => 86400,
        'user_currency' => $user_currency,
        'currency_symbol' => get_safe_symbol($user_currency)
    ));
}



// Output price placeholders that W3TC will cache (not actual prices)
add_filter('woocommerce_get_price_html', 'use_prefetched_price_if_available', 10, 2);
function use_prefetched_price_if_available($price, $product) {
    static $processing = false;
    if ($processing) return $price;
    $processing = true;
    
    // ✅ NEW: Include single product pages!
    if (!is_shop() && !is_product_category() && !is_product_tag() && !is_product()) {
        $processing = false;
        return $price;
    }
    
    $product_id = $product->get_id();
    $variant_config = [
        884  => 1785,
        902  => 1786,
        1244 => 1790,
        1335 => 1796,
        1337 => 1798,
        1338 => 1792
    ];
    
    if (isset($variant_config[$product_id])) {
        $variation_id = $variant_config[$product_id];
        $variation = wc_get_product($variation_id);
        if ($variation && $variation->is_type('variation')) {
            $price = $variation->get_price_html();
        }
    }
    
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    $processing = false;
    
        return '<span class="wc-price-prefetch wc-price-loading" data-product-id="' . $product_id . '" data-price-placeholder>...</span>';
}




// Style for custom variant price display
add_action('wp_head', 'custom_variant_price_styling');
function custom_variant_price_styling() {
    ?>
    <style>
    .custom-variant-product {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }
    
    .custom-variant-product .price {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0;
    }
    
    .custom-variant-product .button {
        width: 100%;
        text-align: left !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
    }
    
    /* Ensure price formatting matches normal products */
    .custom-variant-product .price del {
        opacity: 0.5;
        margin-right: 5px;
    }
    
    .custom-variant-product .price ins {
        text-decoration: none;
        background: transparent;
    }
    </style>
    <?php
}

// ============================================================================
// END CUSTOM VARIANT PRODUCTS CONVERTER
// ============================================================================

// ============================================================================
// BACKEND: Simple Product AJAX Handler (ORIGINAL - unchanged)
// ============================================================================
add_action('wp_ajax_woocommerce_ajax_add_to_cart', 'simple_product_ajax_handler');
add_action('wp_ajax_nopriv_woocommerce_ajax_add_to_cart', 'simple_product_ajax_handler');

function simple_product_ajax_handler() {
    $product_id = absint($_POST['product_id']);
    $quantity = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
    
    if ($product_id < 1) {
        wp_send_json_error('Invalid product');
        return;
    }
    
    $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity);
    
    if (!$cart_item_key) {
        wp_send_json_error('Could not add to cart');
        return;
    }
    
    do_action('woocommerce_ajax_added_to_cart', $product_id);
    WC_AJAX::get_refreshed_fragments();
}

// ============================================================================
// BACKEND: Custom Variation AJAX Handler (ORIGINAL - unchanged)
// ============================================================================
add_action('wp_ajax_add_to_cart_custom_variation', 'custom_variation_ajax_handler');
add_action('wp_ajax_nopriv_add_to_cart_custom_variation', 'custom_variation_ajax_handler');

function custom_variation_ajax_handler() {
    $variation_id = absint($_POST['variation_id']);
    $quantity = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
    
    if ($variation_id < 1) {
        wp_send_json_error('Invalid variation');
        return;
    }
    
    $variation = wc_get_product($variation_id);
    
    if (!$variation || !$variation->exists()) {
        wp_send_json_error('Variation does not exist');
        return;
    }
    
    $parent_id = $variation->get_parent_id();
    
    if (!$parent_id) {
        wp_send_json_error('Invalid product structure');
        return;
    }
    
    $variation_data = $variation->get_variation_attributes();
    
    $cart_item_key = WC()->cart->add_to_cart($parent_id, $quantity, $variation_id, $variation_data);
    
    if (!$cart_item_key) {
        wp_send_json_error('Could not add to cart');
        return;
    }
    
    do_action('woocommerce_ajax_added_to_cart', $parent_id);
    
    wp_send_json_success([
        'cart_hash' => WC()->cart->get_cart_hash(),
        'fragments' => WC_AJAX::get_refreshed_fragments(),
        'cart_item_key' => $cart_item_key,
        'parent_id' => $parent_id,
        'variation_id' => $variation_id
    ]);
}


// Add clickable badge image between checkout and tabs on product pages
add_action('woocommerce_after_single_product_summary', 'add_custom_badge_before_tabs', 9);

function add_custom_badge_before_tabs() {
    // Get the Money Back Policy page URL (page ID 942)
    $policy_url = get_permalink(942);
    ?>
    <div class="custom-product-badge" style="text-align: center; margin: 30px 0; padding: 20px 0;">
        <a href="<?php echo esc_url($policy_url); ?>" title="Money Back Policy" style="display: inline-block;">
            <img src="https://betterestech.unaux.com/wp-content/uploads/2025/10/download-1.png" alt="Money Back Policy" style="max-width: 100%; height: auto; display: block; margin: 0 auto; cursor: pointer;">
        </a>
    </div>
    <style>
    /* Badge styling */
    .custom-product-badge {
        width: 100%;
        max-width: 100%;
        display: block;
        clear: both;
    }
    
    .custom-product-badge a {
        display: inline-block;
        transition: opacity 0.3s ease, transform 0.2s ease;
    }
    
    .custom-product-badge a:hover {
        opacity: 0.8;
        transform: scale(1.02);
    }
    
    .custom-product-badge img {
        width: auto;
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
    }
    
    /* Add spacing to tabs below */
    .woocommerce-tabs {
        margin-top: 30px !important;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .custom-product-badge {
            margin: 20px 0;
            padding: 15px 0;
        }
    }
    </style>
    <?php
}
// Admin helper to clear cache safely
add_action('admin_bar_menu', 'add_clear_cache_link', 999);
function add_clear_cache_link($wp_admin_bar) {
    if (!current_user_can('manage_options')) return;
    
    $args = array(
        'id'    => 'clear_all_cache',
        'title' => 'Clear ALL Cache',
        'href'  => add_query_arg(array(
            'clear_all' => '1',
            '_wpnonce' => wp_create_nonce('clear_all_cache')
        ), home_url()),
        'meta'  => array('class' => 'clear-all-cache-link')
    );
    $wp_admin_bar->add_node($args);
}

// ============================================
// CUSTOM ALL ORDERS PAGE
// ============================================

add_shortcode('all_orders_display', 'display_all_orders_page');

function display_all_orders_page() {
    // Check if user is logged in
    if (!is_user_logged_in()) {
        return '<p>Please <a href="' . wp_login_url(get_permalink()) . '">login</a> to view your orders.</p>';
    }
    
    $current_user = wp_get_current_user();
    
    // ✅ CRITICAL: Limit to recent 50 orders (prevents server overload)
    $per_page = 50;
    $paged = isset($_GET['paged']) ? absint($_GET['paged']) : 1;
    
    $all_orders = wc_get_orders(array(
        'customer' => $current_user->ID,
        'limit' => $per_page,
        'page' => $paged,
        'orderby' => 'date',
        'order' => 'DESC',
        'status' => array('completed', 'processing', 'on-hold', 'pending', 'shipped', 'delivered', 'order-received', 'ready-dispatch', 'dispatched', 'out-delivery', 'cancelled', 'refunded', 'failed')
    ));
    
    // Get total count for pagination
    $total_orders = wc_get_orders(array(
        'customer' => $current_user->ID,
        'return' => 'ids',
        'limit' => -1,
    ));
    $total_count = count($total_orders); 
    // ✅ Get user's currency from cookie (safer)
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    $exchange_rate = 1;
    
    if ($user_currency !== 'USD') {
        $exchange_rate = get_safe_exchange_rate($user_currency);
    }

    
    ob_start();
    ?>
    
    <div class="all-orders-page">
        <div class="orders-header">
            <h2>All Orders (<?php echo count($all_orders); ?> Total)</h2>
            <a href="<?php echo home_url('/my-account/'); ?>" class="back-btn">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
        </div>
        
        <?php if (empty($all_orders)): ?>
            <div class="no-orders">
                <p>You haven't placed any orders yet.</p>
                <a href="<?php echo home_url('/shop/'); ?>" class="shop-btn">
                    Start Shopping
                </a>
            </div>
        <?php else: ?>
            <div class="orders-table-container">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($all_orders as $order): ?>
                            <?php 
                            $order_total = $order->get_total();
                            $order_total_converted = ($user_currency === 'USD') ? $order_total : round($order_total * $exchange_rate, 0);
                            $order_date = $order->get_date_created();
                            $status = $order->get_status();
                            ?>
                            <tr class="order-row status-<?php echo $status; ?>">
                                <td class="order-number">
                                    <strong>#<?php echo $order->get_order_number(); ?></strong>
                                </td>
                                <td class="order-date">
                                    <?php echo $order_date->format('M j, Y'); ?>
                                    <br>
                                    <small><?php echo $order_date->format('g:i A'); ?></small>
                                </td>
                                <td class="order-status">
                                    <span class="status-badge status-<?php echo $status; ?>">
                                        <i class="fas fa-circle"></i>
                                        <?php echo ucwords(str_replace('-', ' ', $status)); ?>
                                    </span>
                                </td>
                                <td class="order-total">
                                    <strong><?php echo wc_price($order_total_converted, array('currency' => $user_currency)); ?></strong>
                                    <br>
                                    <small><?php echo count($order->get_items()); ?> items</small>
                                </td>
                                <td class="order-actions">
                                    <a href="/track-order/?order_id=<?php echo $order->get_order_number(); ?>" class="action-btn track-btn">
                                        <i class="fas fa-truck"></i> Track
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
    
    <style>
    .all-orders-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .orders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #eee;
    }
    
    .orders-header h2 {
        margin: 0;
        color: #2c3e50;
    }
    
    .back-btn {
        background: #3498db;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        transition: background 0.3s;
    }
    
    .back-btn:hover {
        background: #2980b9;
    }
    
    .orders-table-container {
        overflow-x: auto;
    }
    
    .orders-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .orders-table thead {
        background: #34495e;
        color: white;
    }
    
    .orders-table th {
        padding: 15px;
        text-align: left;
        font-weight: 600;
    }
    
    .orders-table td {
        padding: 15px;
        border-bottom: 1px solid #eee;
    }
    
    .orders-table tbody tr:hover {
        background: #f8f9fa;
    }
    
    .order-number strong {
        color: #3498db;
        font-size: 16px;
    }
    
    .status-badge {
        display: inline-block;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .status-badge.status-completed {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.status-processing {
        background: #fff3cd;
        color: #856404;
    }
    
    .status-badge.status-on-hold {
        background: #f8d7da;
        color: #721c24;
    }
    
    .status-badge.status-pending {
        background: #d1ecf1;
        color: #0c5460;
    }
    
    .status-badge.status-cancelled,
    .status-badge.status-refunded,
    .status-badge.status-failed {
        background: #f5c6cb;
        color: #721c24;
    }
    
    .status-badge i {
        font-size: 8px;
        margin-right: 5px;
    }
    
    .action-btn {
        display: inline-block;
        padding: 8px 15px;
        background: #27ae60;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-size: 14px;
        transition: background 0.3s;
    }
    
    .action-btn:hover {
        background: #229954;
    }
    
    .no-orders {
        text-align: center;
        padding: 60px 20px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .no-orders p {
        font-size: 18px;
        color: #7f8c8d;
        margin-bottom: 20px;
    }
    
    .shop-btn {
        display: inline-block;
        padding: 12px 30px;
        background: #3498db;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        font-weight: 600;
        transition: background 0.3s;
    }
    
    .shop-btn:hover {
        background: #2980b9;
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
        .orders-header {
            flex-direction: column;
            gap: 15px;
        }
        
        .orders-table {
            font-size: 14px;
        }
        
        .orders-table th,
        .orders-table td {
            padding: 10px;
        }
    }
    </style>
    
    <?php
    return ob_get_clean();
}
// 6. Set Smart Cache Headers
add_action('send_headers', 'set_smart_cache_headers');
function set_smart_cache_headers() {
    if (is_admin() || wp_doing_ajax()) {
        return;
    }
    
    $request_uri = $_SERVER['REQUEST_URI'];
    
    // Preview/Customizer
    if (isset($_GET['preview']) || isset($_GET['customize_changeset_uuid'])) {
        @header('Cache-Control: no-cache, no-store, must-revalidate');
        @header('X-BetterEsTech-Page: Preview/Customizer (Not Cached)');
        return;
    }
    
    // My Account
    if (strpos($request_uri, '/my-account') !== false) {
        if (is_user_logged_in()) {
            @header('Cache-Control: no-cache, no-store, must-revalidate');
            @header('X-BetterEsTech-Page: My Account Dashboard (Not Cached)');
        } else {
            @header('Cache-Control: public, max-age=3600');
            @header('X-BetterEsTech-Page: My Account Login (Cached)');
        }
        return;
    }
    
    // Track Order
    if (strpos($request_uri, '/track-order') !== false) {
        if (isset($_POST['order_id']) || isset($_GET['order_id']) || isset($_GET['key'])) {
            @header('Cache-Control: no-cache, no-store, must-revalidate');
            @header('X-BetterEsTech-Page: Track Order Results (Not Cached)');
        } else {
            @header('Cache-Control: public, max-age=3600');
            @header('X-BetterEsTech-Page: Track Order Form (Cached)');
        }
        return;
    }
    
    // Account Settings
    if (strpos($request_uri, '/account-settings') !== false) {
        @header('Cache-Control: no-cache, no-store, must-revalidate');
        @header('X-BetterEsTech-Page: Account Settings (Not Cached)');
        return;
    }
    
    // Static pages
    if (is_front_page() || is_shop() || is_product() || is_product_category()) {
        @header('Cache-Control: public, max-age=3600');
        @header('X-BetterEsTech-Page: Static (Cached)');
    }
}

// 7. FunnelKit Side Cart AJAX Refresh
add_action('wp_enqueue_scripts', 'sidecart_fragment_refresh');
function sidecart_fragment_refresh() {
    if (function_exists('WC')) {
        wp_add_inline_script('wc-cart-fragments', '
            jQuery(document).ready(function($) {
                $(document.body).trigger("wc_fragment_refresh");
                $(document.body).on("added_to_cart", function() {
                    $(document.body).trigger("wc_fragment_refresh");
                });
            });
        ');
    }
}


// 3. Prevent common reload triggers
add_action('wp_footer', 'prevent_auto_reload', 998);
function prevent_auto_reload() {
    ?>
    <script>
    // Prevent Microsoft Clarity auto-reload
    if (typeof clarity !== 'undefined') {
        window.clarity = function() {};
    }
    
    // Prevent HurryTimer reload
    jQuery(document).ready(function($) {
        // Disable HurryTimer auto-refresh if present
        if (typeof hurrytimer_ajax_refresh !== 'undefined') {
            window.hurrytimer_ajax_refresh = function() {};
        }
    });
    </script>
    <?php
}
// ============================================================================
// COMPLETE PERFORMANCE OPTIMIZATION SYSTEM
// Version: 2.0 (Optimized & Consolidated)
// ============================================================================

// ===== 1. CRITICAL RESOURCE PRELOAD =====
add_action('wp_head', 'optimized_critical_preload', 1);
function optimized_critical_preload() {
    // Skip admin pages
    if (is_admin()) return;
    
    ?>
    <!-- DNS Prefetch & Preconnect for HTTP/1.1 Parallel Loading -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    
    <?php if (is_front_page()): ?>
    <!-- Homepage Critical Resources -->
    <link rel="preload" href="<?php echo home_url(); ?>/wp-content/uploads/2025/10/60640035-49eb-4083-bdc0-c03c4bdd91be.png" as="image" fetchpriority="high">
    <link rel="preload" href="https://fonts.gstatic.com/s/worksans/v24/QGYsz_wNahGAdqQ43Rh_fKDp.woff2" as="font" type="font/woff2" crossorigin>
    <?php endif; ?>
    
    <!-- Critical CSS Preload -->
    <link rel="preload" href="<?php echo get_template_directory_uri(); ?>/assets/css/minified/main.min.css?x63327" as="style">
    
    <!-- Critical JavaScript Preload -->
    <link rel="preload" href="<?php echo includes_url('js/jquery/jquery.min.js'); ?>" as="script">
    
    <!-- Universal Font Optimization -->
    <style>
    /* Force fast font rendering */
    * { font-display: swap !important; }
    
    body {
        font-display: swap;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
    }
    
    @font-face {
        font-family: system-ui;
        font-display: swap;
    }
    </style>
    <?php
}

// ===== 2. UNIFIED JAVASCRIPT DEFER SYSTEM =====
add_filter('script_loader_tag', 'unified_script_optimization', 10, 3);
function unified_script_optimization($tag, $handle, $src) {
    // Skip admin, already optimized, and inline scripts
    if (is_admin() || 
        strpos($tag, 'defer') !== false || 
        strpos($tag, 'async') !== false ||
        empty($src)) {
        return $tag;
    }
    
    // ===== CRITICAL SCRIPTS - NEVER DEFER =====
    $critical_scripts = [
        'jquery',
        'jquery-core',
        'jquery-migrate',
        'wc-cart-fragments',
        'cart-fragments'
    ];
    
    if (in_array($handle, $critical_scripts)) {
        return $tag;
    }
    
    // ===== HIGH PRIORITY - ASYNC (DON'T BLOCK, BUT LOAD EARLY) =====
    $async_scripts = [
        'woocommerce',
        'wc-single-product',
        'price-prefetch'
    ];
    
    if (in_array($handle, $async_scripts)) {
        return str_replace(' src', ' async src', $tag);
    }
    
    // ===== TRACKER SCRIPTS - DEFER =====
    $tracker_keywords = ['sourcebuster', 'utm-tracker', 'order-attribution', 'geolocation', 'clarity'];
    foreach ($tracker_keywords as $keyword) {
        if (strpos($handle, $keyword) !== false || strpos($src, $keyword) !== false) {
            return str_replace(' src', ' defer src', $tag);
        }
    }
    
    // ===== EVERYTHING ELSE - DEFER =====
    return str_replace(' src', ' defer src', $tag);
}

// ===== 3. REMOVE VERSION QUERY STRINGS (REDUCE REDIRECTS) =====
add_filter('script_loader_src', 'remove_script_version_unified', 15);
add_filter('style_loader_src', 'remove_script_version_unified', 15);

function remove_script_version_unified($src) {
    // Keep W3TC's version hash (x63327) but remove WordPress version
    if (strpos($src, 'ver=') !== false) {
        $src = remove_query_arg('ver', $src);
    }
    // Don't remove W3TC version hash (x63327)
    return $src;
}


function google_client_secret_callback() {
    $value = get_option('google_client_secret', '');
    echo '<input type="text" name="google_client_secret" value="' . esc_attr($value) . '" class="regular-text" />';
    echo '<p class="description">Client Secret from Google Cloud Console</p>';
}
// SAFER: Only convert specific fragment keys
add_filter('woocommerce_add_to_cart_fragments', 'safe_convert_cart_fragments', 9999);
function safe_convert_cart_fragments($fragments) {
    $user_currency = isset($_COOKIE['user_currency']) ? $_COOKIE['user_currency'] : 'USD';
    
    if ($user_currency === 'USD') {
        return $fragments;
    }
    
    $rate = get_safe_exchange_rate($user_currency);
    $symbol = get_safe_symbol($user_currency);
    
    // Only process the mini-cart HTML fragment
    if (isset($fragments['div.widget_shopping_cart_content'])) {
        $html = $fragments['div.widget_shopping_cart_content'];
        
        // Convert prices carefully - only inside <span> tags
        $html = preg_replace_callback(
            '/<span[^>]*>\$(\d+(?:,\d{3})*(?:\.\d{2})?)<\/span>/',
            function($matches) use ($rate, $symbol) {
                $usd_price = floatval(str_replace(',', '', $matches[1]));
                $converted = round($usd_price * $rate, 0);
                return str_replace($matches[1], $symbol . $converted, $matches[0]);
            },
            $html
        );
        
        $fragments['div.widget_shopping_cart_content'] = $html;
    }
    
    return $fragments;
}

// Cache geolocation result for 24 hours
add_filter('woocommerce_geolocate_ip', 'cache_geolocation_result');
function cache_geolocation_result($location) {
    $cached = get_transient('wc_geolocation_' . $_SERVER['REMOTE_ADDR']);
    if ($cached) {
        return $cached;
    }
    
    set_transient('wc_geolocation_' . $_SERVER['REMOTE_ADDR'], $location, DAY_IN_SECONDS);
    return $location;
}

// Increase fragment cache duration
add_filter('woocommerce_cart_fragment_cache_expires', function() {
    return HOUR_IN_SECONDS; // Cache for 1 hour instead of 1 minute
});

// 1. Disable HurryTimer on non-product pages
add_action('wp_enqueue_scripts', 'conditionally_load_hurrytimer', 999);
function conditionally_load_hurrytimer() {
    if (!is_product()) {
        wp_dequeue_script('hurrytimer');
        wp_dequeue_style('hurrytimer');
    }
}
// Fix FunnelKit cart data (must load BEFORE cart script)
add_action('wp_head', 'fix_fkcart_data_early', 1);
function fix_fkcart_data_early() {
    // ✅ Cache values
    static $ajax_url = null;
    static $nonce = null;
    
    if ($ajax_url === null) {
        $ajax_url = admin_url('admin-ajax.php');
        $nonce = wp_create_nonce('fkcart_nonce');
    }
    ?>
    <script>
    var fkcart_app_data = fkcart_app_data || {
        ajax_url: '<?php echo esc_js($ajax_url); ?>',
        nonce: '<?php echo esc_js($nonce); ?>'
    };
    </script>
    <?php
}
// ============================================
// INLINE CHECKOUT PRICE CONVERSION - IMPROVED
// Add to functions.php
// ============================================
add_action('wp_footer', 'inline_checkout_conversion', 999);
function inline_checkout_conversion() {
    if (!is_checkout())
            // ✅ Only run once per page
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;
 {
        return;
    }
    ?>
<style>
/* Hide ALL prices until converted */
.wfacp_order_summary .woocommerce-Price-amount,
.wfacp_mini_cart_items .woocommerce-Price-amount,
table.shop_table .woocommerce-Price-amount,
#order_review .woocommerce-Price-amount,
.wfacp_order_total .woocommerce-Price-amount {
    opacity: 0;
    transition: opacity 0.3s ease;
}

/* COMPLETELY hide button until converted (not just opacity) */
button.wfacp-next-btn-wrap,
button[name="wfacp_payment"],
#place_order {
    visibility: hidden !important;
    opacity: 0;
    transition: opacity 0.3s ease, visibility 0s 0.3s;
}

/* Show prices after conversion */
.wfacp_order_summary .woocommerce-Price-amount.price-converted,
.wfacp_mini_cart_items .woocommerce-Price-amount.price-converted,
table.shop_table .woocommerce-Price-amount.price-converted,
#order_review .woocommerce-Price-amount.price-converted,
.wfacp_order_total .woocommerce-Price-amount.price-converted {
    opacity: 1;
}

/* Show button after conversion */
button.wfacp-next-btn-wrap.price-converted,
button[name="wfacp_payment"].price-converted,
#place_order.price-converted {
    visibility: visible !important;
    opacity: 1;
    transition: opacity 0.3s ease;
}

/* Optional: Add loading state for button area */
button.wfacp-next-btn-wrap:not(.price-converted)::after,
button[name="wfacp_payment"]:not(.price-converted)::after,
#place_order:not(.price-converted)::after {
    content: "Loading...";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    visibility: visible;
    opacity: 0.5;
    font-size: 14px;
}

    /* ===== DESKTOP - ONLY TARGET CUSTOMER REVIEWS SECTION ===== */
    
    /* Target the specific column with reviews */
    .elementor-element-efc923d .elementor-widget-wrap {
        display: flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 20px !important;
    }
    
    /* Target ONLY the customer reviews text (element ID: 79b32cc6) */
    .elementor-element-79b32cc6 ul.elementor-icon-list-items {
        display: flex !important;
        align-items: center !important;
        margin: 0 !important;
        margin-top: 22px !important; /* 🎯 CHANGE THIS: 20px, 25px, 30px to move down */
        margin-left: 28px !important;
    }
    
    /* Style the text - BOLD */
    .elementor-element-79b32cc6 .elementor-icon-list-text {
        font-size: 17px !important;
        font-weight: 700 !important; /* Bold */
        line-height: 1.2 !important;
    }
    
    /* Target rating stars (element ID: 531fbcc7) */
    .elementor-element-531fbcc7 .e-rating-wrapper {
        display: flex !important;
        align-items: center !important;
    }


/* Move logo image down */
.elementor-element-67443670 {
    margin-top: 15px !important; /* 🎯 CHANGE THIS: 5px, 10px, 15px, 20px, 25px */
}

    
    /* ===== MOBILE - SIMPLE SPACING ===== */
@media (max-width: 768px) {
    /* Remove desktop flexbox */
    .elementor-element-efc923d .elementor-widget-wrap {
        display: block !important;
    }
    
    /* Customer reviews text on mobile */
    .elementor-element-79b32cc6 ul.elementor-icon-list-items {
        display: flex !important;
        margin-top: 15px !important;
        justify-content: center !important;
        text-align: center !important;
    }
    
    /* Text styling - BOLD */
    .elementor-element-79b32cc6 .elementor-icon-list-text {
        font-size: 15px !important;
        font-weight: 700 !important;
    }
    
    /* ✅ NEW: Increase star rating size on mobile */
    .elementor-element-531fbcc7 .e-rating-wrapper .e-icon svg {
        width: 20px !important; /* 🎯 CHANGE THIS: 22px, 26px, 28px, 30px */
        height: 24px !important;
    }
    
    /* Center the stars on mobile */
    .elementor-element-531fbcc7 .e-rating-wrapper {
        justify-content: center !important;
    }
}

/* Move Norton badge up */
img[src*="norton.png"] {
    margin-top: -18px !important; /* 🎯 CHANGE THIS: -10px, -20px, -25px, -30px */
}

    
    /* ===== EXCLUDE PROGRESS BAR (just to be safe) ===== */
    [data-id="bf4ff89"],
    [data-id="23b8298f"],
    [data-id="6c4099e1"] {
        /* Keep progress bar original styling */
        display: inline-block !important;
    }
</style>

<script>
jQuery(document).ready(function($) {
    console.log('💰 Inline checkout conversion starting...');
    
    function getCurrency() {
        var match = document.cookie.match(/user_currency=([A-Z]{3})/);
        return match ? match[1] : 'USD';
    }
    
    function getCachedData() {
        try {
            var currency = getCurrency();
            var cached = localStorage.getItem('wc_product_prices_' + currency);
            if (!cached) return null;
            return JSON.parse(cached);
        } catch(e) {
            return null;
        }
    }
    
    function convertButton(rate, symbol, currency) {
        var converted = 0;
        
        $('button.wfacp-next-btn-wrap, button[name="wfacp_payment"], #place_order').each(function() {
            var $btn = $(this);
            
            if ($btn.data('converted') === currency) {
                $btn.addClass('price-converted');
                return;
            }
            
            var btnText = $btn.html();
            
            if (btnText.indexOf('$') === -1) {
                $btn.addClass('price-converted');
                return;
            }
            
            var match = btnText.match(/\$\s*([0-9,.]+)/);
            if (match) {
                var priceValue = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(priceValue) && priceValue > 0) {
                    var convertedPrice = Math.round(priceValue * rate);
                    var newText = btnText.replace(/\$\s*([0-9,.]+)/, symbol + convertedPrice);
                    $btn.html(newText);
                    $btn.data('converted', currency);
                    converted++;
                    console.log('✅ Converted button: ' + priceValue + ' → ' + convertedPrice);
                }
            }
            
            $btn.addClass('price-converted');
        });
        
        return converted;
    }
    
    function convertCheckoutPrices() {
        var cached = getCachedData();
        if (!cached || !cached.rate || !cached.symbol) {
            console.log('⏳ No cached conversion data - showing USD prices');
            $('.woocommerce-Price-amount, button.wfacp-next-btn-wrap, button[name="wfacp_payment"], #place_order').addClass('price-converted');
            return;
        }
        
        var currency = getCurrency();
        if (currency === 'USD') {
            console.log('💵 Already in USD - showing prices');
            $('.woocommerce-Price-amount, button.wfacp-next-btn-wrap, button[name="wfacp_payment"], #place_order').addClass('price-converted');
            return;
        }
        
        var rate = cached.rate;
        var symbol = cached.symbol;
        
        console.log('🔄 Converting to ' + currency + ' (rate: ' + rate + ')');
        
        var converted = 0;
        
        // Convert prices in order summary/totals
        $('.wfacp_order_summary, .wfacp_mini_cart_items, table.shop_table, #order_review').find('.woocommerce-Price-amount, bdi, .amount').each(function() {
            var $elem = $(this);
            
            if ($elem.data('converted') === currency) {
                $elem.addClass('price-converted');
                return;
            }
            
            if ($elem.closest('.wfacp_product_name, .product-name, a[href*="product"]').length > 0) {
                return;
            }
            
            var text = $elem.text();
            if (text.indexOf('$') === -1) {
                $elem.addClass('price-converted');
                return;
            }
            
            var priceText = text.replace(/[^\d.]/g, '');
            var priceValue = parseFloat(priceText);
            
            if (isNaN(priceValue) || priceValue === 0) {
                $elem.addClass('price-converted');
                return;
            }
            
            var convertedPrice = Math.round(priceValue * rate);
            $elem.html('<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>' + convertedPrice);
            $elem.data('converted', currency);
            $elem.addClass('price-converted');
            converted++;
        });
        
        // Convert buttons
        converted += convertButton(rate, symbol, currency);
        
        if (converted > 0) {
            console.log('✅ Converted ' + converted + ' checkout prices to ' + currency);
        }
    }
    
    // Run conversion IMMEDIATELY
    convertCheckoutPrices();
    
    // Watch for button appearing with MutationObserver
    if (window.MutationObserver) {
        var cached = getCachedData();
        if (cached && cached.rate && cached.symbol) {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            var $node = $(node);
                            
                            // Check if button was added
                            if ($node.is('button.wfacp-next-btn-wrap, button[name="wfacp_payment"], #place_order')) {
                                console.log('🔘 Button appeared - converting instantly');
                                convertButton(cached.rate, cached.symbol, getCurrency());
                            }
                            
                            // Check if button is inside added node
                            $node.find('button.wfacp-next-btn-wrap, button[name="wfacp_payment"], #place_order').each(function() {
                                console.log('🔘 Button appeared inside node - converting instantly');
                                convertButton(cached.rate, cached.symbol, getCurrency());
                            });
                        }
                    });
                });
            });
            
            // Observe the checkout form
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // Fallback - run again at intervals
    setTimeout(convertCheckoutPrices, 100);
    setTimeout(convertCheckoutPrices, 300);
    
    // Re-convert on checkout updates
    $(document.body).on('updated_checkout', function() {
        console.log('🔄 Checkout updated - reconverting...');
        $('.price-converted').removeClass('price-converted');
        setTimeout(convertCheckoutPrices, 300);
    });
    
    $(document).on('change', 'input[name="payment_method"]', function() {
        $('.price-converted').removeClass('price-converted');
        setTimeout(convertCheckoutPrices, 200);
    });
    
    console.log('🛒 Checkout conversion initialized');
});
</script>
    <?php
}
// ============================================
// FORCE WORK SANS FONT ON CHECKOUT PAGE
// ============================================
add_action('wp_head', 'force_checkout_fonts', 999);
function force_checkout_fonts() {
    if (!is_checkout()) {
        return;
    }
    ?>
    <!-- Load Work Sans font with ALL weights -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
    /* FORCE Work Sans on EVERYTHING on checkout page */
    body.woocommerce-checkout,
    body.woocommerce-checkout *,
    .wfacp_main_form,
    .wfacp_main_form *,
    #wfacp-e-form,
    #wfacp-e-form *,
    .wfacp_main_wrapper,
    .wfacp_main_wrapper *,
    input,
    select,
    textarea,
    button,
    label,
    span,
    p,
    h1, h2, h3, h4, h5, h6,
    .wfacp-form,
    .wfacp_order_summary,
    .wfacp_mini_cart_items,
    .elementor-widget-wrap *,
    [class*="wfacp"],
    [class*="elementor"] {
        font-family: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }
    
    /* Specific elements with proper weights */
    body.woocommerce-checkout {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 400 !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    
    /* Input fields */
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    textarea,
    select {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 400 !important;
    }
    
    /* Labels */
    label {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 500 !important;
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6,
    .wfacp-form legend,
    .wfacp-form h3 {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 600 !important;
    }
    
    /* Buttons */
    button,
    .button,
    .btn,
    input[type="submit"],
    button[type="submit"],
    .wfacp-next-btn-wrap,
    #place_order {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 500 !important;
    }
    
    /* Order summary */
    .wfacp_order_summary,
    .wfacp_mini_cart_items,
    .shop_table {
        font-family: "Work Sans", sans-serif !important;
    }
    
    /* Price text */
    .woocommerce-Price-amount,
    .amount {
        font-family: "Work Sans", sans-serif !important;
        font-weight: 600 !important;
    }
    </style>
    <?php
}
// ============================================
// REMOVE WOOCOMMERCE SORTING DROPDOWN
// ============================================
add_action('init', 'remove_woocommerce_sorting');
function remove_woocommerce_sorting() {
    // Remove sorting dropdown from shop page
    remove_action('woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30);
    
    // Remove from other locations if present
    remove_action('woocommerce_after_shop_loop', 'woocommerce_catalog_ordering', 10);
}

// ========================================
// NUCLEAR OPTION: Force CDN jQuery at ALL costs
// ========================================

// Run at ABSOLUTE PRIORITY (before EVERYTHING)
add_action('init', 'nuclear_replace_jquery', 1);
function nuclear_replace_jquery() {
    if (is_admin()) return;
    
    // Completely remove WordPress jQuery
    wp_deregister_script('jquery');
    wp_deregister_script('jquery-core');
    wp_deregister_script('jquery-migrate');
    
    // Register CDN version
    wp_register_script(
        'jquery',
        'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/jquery.min.js',
        array(),
        '3.7.1',
        false
    );
}

// Also run at wp_enqueue_scripts with maximum priority
add_action('wp_enqueue_scripts', 'nuclear_replace_jquery', 1);

// Block late-loading jQuery from plugins
add_action('wp_enqueue_scripts', 'block_late_jquery_loading', PHP_INT_MAX);
function block_late_jquery_loading() {
    if (is_admin()) return;
    
    // Check what's registered
    global $wp_scripts;
    
    if (isset($wp_scripts->registered['jquery-core'])) {
        $src = $wp_scripts->registered['jquery-core']->src;
        
        // If it's NOT our CDN version, force replace
        if (strpos($src, 'cdn.jsdelivr.net') === false) {
            wp_deregister_script('jquery');
            wp_deregister_script('jquery-core');
            
            wp_register_script(
                'jquery',
                'https://cdn.jsdelivr.net/gh/better95159-hub/betterestech-assets@main/js/new/jquery.min.js',
                array(),
                '3.7.1',
                false
            );
            
            wp_enqueue_script('jquery');
        }
    }
}

// HTML cleanup (backup)
add_action('template_redirect', 'cleanup_jquery_in_html_output', 1);
function cleanup_jquery_in_html_output() {
    ob_start(function($html) {
        // Remove wp-includes jQuery
        $html = preg_replace(
            '/<script[^>]*src=["\'][^"\']*wp-includes\/js\/jquery[^"\']*["\'][^>]*><\/script>/i',
            '',
            $html
        );
        return $html;
    });
}
