<?php
namespace ElementorPro\Modules\Forms\Classes;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * Integration with Activity Log
 */
class AAL_Handler {

	public function aal_init_roles( $roles ) {
		$roles['manage_options'][] = 'Elementor Pro Forms';

		return $roles;
	}

	public function hook_mail_sent_or_blocked( $form_id, $settings ) {
		$is_blocked = 'elementor_pro/forms/mail_blocked' === current_filter();

		aal_insert_log(
			[
				'action' => $is_blocked ? 'blocked' : 'sent',
				'object_type' => 'Elementor Pro Forms',
				'object_id' => $form_id,
				'object_name' => $settings['form_name'],
			]
		);
	}

	public function __construct() {
		add_filter( 'aal_init_roles', [ $this, 'aal_init_roles' ] );

		if ( Ajax_Handler::is_form_submitted() ) {
			add_action( 'elementor_pro/forms/mail_sent', [ $this, 'hook_mail_sent_or_blocked' ], 10, 2 );
			add_action( 'elementor_pro/forms/mail_blocked', [ $this, 'hook_mail_sent_or_blocked' ], 10, 2 );
		}
	}
}
