<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

$woocommerce_exist = function_exists( 'WC' );

return [
	'title' => __( 'WooCommerce', 'elementor-pro' ),
	'required' => $woocommerce_exist,
	'default_activation' => $woocommerce_exist,
];
