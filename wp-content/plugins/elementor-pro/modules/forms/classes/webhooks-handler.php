<?php

namespace ElementorPro\Modules\Forms\Classes;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Webhooks_Handler {

	public function on_valid_record_submitted( $form_id, $settings, $record ) {
		if ( empty( $settings['webhooks'] ) ) {
			return;
		}

		$all_fields = array_merge( $record['fields'], $record['meta'] );

		$formatted_data = Ajax_Handler::get_formatted_data( $all_fields );

		$formatted_data['form_id'] = $form_id;
		$formatted_data['form_name'] = $settings['form_name'];

		$args = [
			'body' => $formatted_data,
		];

		$args = apply_filters( 'elementor_pro/forms/webhooks/request_args', $args, $form_id, $settings, $record );

		$response = wp_remote_post( $settings['webhooks'], $args );

		do_action( 'elementor_pro/forms/webhooks/response', $response, $form_id, $settings, $record );

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			// TODO: $response log / send an error
		}
	}

	public function __construct() {
		add_action( 'elementor_pro/forms/valid_record_submitted', [ $this, 'on_valid_record_submitted' ], 10, 3 );
	}
}
