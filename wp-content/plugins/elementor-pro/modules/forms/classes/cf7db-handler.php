<?php

namespace ElementorPro\Modules\Forms\Classes;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class CF7DB_Handler {

	public function store_submit_form( $form_id, $settings, $record ) {
		$all_fields = array_merge( $record['fields'], $record['meta'] );

		$data = (object) [
			'title' => $settings['form_name'],
			'posted_data' => Ajax_Handler::get_formatted_data( $all_fields ),
		];

		// Call hook to submit data
		do_action_ref_array( 'cfdb_submit', [ $data ] );
	}

	public function __construct() {
		add_action( 'elementor_pro/forms/valid_record_submitted', [ $this, 'store_submit_form' ], 10, 3 );
	}
}
