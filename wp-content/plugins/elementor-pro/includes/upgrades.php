<?php
namespace ElementorPro;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Upgrades {

	public function __construct() {
		add_action( 'init', [ __CLASS__, 'init' ], 20 );
	}

	public static function init() {
		$version = get_option( 'elementor_pro_version' );

		// Normal init
		if ( ELEMENTOR_PRO_VERSION === $version ) {
			return;
		}

		self::check_upgrades( $version );

		Plugin::elementor()->posts_css_manager->clear_cache();

		update_option( 'elementor_pro_version', ELEMENTOR_PRO_VERSION );
	}

	private static function check_upgrades( $elementor_pro_version ) {
		// It's a new install
		if ( ! $elementor_pro_version ) {
			return;
		}

		$elementor_pro_upgrades = get_option( 'elementor_pro_upgrades', [] );

		$upgrades = [];

		foreach ( $upgrades as $version => $function ) {
			if ( version_compare( $elementor_pro_version, $version, '<' ) && ! isset( $elementor_upgrades[ $version ] ) ) {
				self::$function();
				$elementor_pro_upgrades[ $version ] = true;
				update_option( 'elementor_pro_upgrades', $elementor_pro_upgrades );
			}
		}
	}
}
