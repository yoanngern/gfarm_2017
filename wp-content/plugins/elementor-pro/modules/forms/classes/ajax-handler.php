<?php
namespace ElementorPro\Modules\Forms\Classes;

use Elementor\Plugin;
use ElementorPro\Classes\Utils;
use ElementorPro\Modules\Forms\Module;

if ( ! defined( 'ABSPATH' ) )  exit; // Exit if accessed directly

class Ajax_Handler {

	const SUCCESS = 'success';
	const ERROR = 'error';
	const FIELD_REQUIRED = 'field_required';
	const INVALID_FORM = 'invalid_form';
	const SERVER_ERROR = 'server_error';

	public static function get_formatted_data( $fields ) {
		$formatted = [];
		$no_label = __( 'No Label', 'elementor-pro' );

		foreach ( $fields as $key => $field ) {
			if ( empty( $field['title'] ) ) {
				$formatted[ $no_label . ' ' . $key ] = $field['value'];
			} else {
				$formatted[ $field['title'] ] = $field['value'];
			}
		}

		return $formatted;
	}

	public static function is_form_submitted() {
		return \Elementor\Utils::is_ajax() && isset( $_POST['action'] ) && 'elementor_pro_forms_send_form' === $_POST['action'];
	}

	public static function get_default_messages() {
		return [
			self::SUCCESS => __( 'The message was sent successfully!', 'elementor-pro' ),
			self::ERROR => __( 'There\'s something wrong... Please fill in the required fields.', 'elementor-pro' ),
			self::FIELD_REQUIRED => __( 'Required', 'elementor-pro' ),
			self::INVALID_FORM => __( 'There\'s something wrong... The form is invalid.', 'elementor-pro' ),
			self::SERVER_ERROR => __( 'Server error. Form not sent.', 'elementor-pro' ),
		];
	}

	public static function get_default_message( $id, $settings ) {
		if ( ! empty( $settings['custom_messages'] ) ) {
			$field_id = $id . '_message';
			if ( isset( $settings[ $field_id ] ) ) {
				return $settings[ $field_id ];
			}
		}

		$default_messages = self::get_default_messages();

		return isset( $default_messages[ $id ] ) ? $default_messages[ $id ] : __( 'Unknown', 'elementor-pro' );
	}

	public function ajax_send_form() {
		$post_id = $_POST['post_id'];
		$form_id = $_POST['form_id'];

		$meta = Plugin::instance()->db->get_plain_editor( $post_id );

		$form = $this->find_element_recursive( $meta, $form_id );

		if ( ! $form ) {
			$return_array['message'] = self::get_default_message( self::INVALID_FORM, $form['settings'] );
			wp_send_json_error( $return_array );
		}

		if ( empty( $form['templateID'] ) ) {
			$fields = $form['settings']['form_fields'];
		} else {
			$global_meta = Plugin::instance()->db->get_plain_editor( $form['templateID'] );
			$form = $global_meta[0];
			$fields = $form['settings']['form_fields'];
		}

		$settings = $form['settings'];

		if ( empty( $fields ) ) {
			$return_array['message'] = self::get_default_message( self::INVALID_FORM, $settings );
			wp_send_json_error( $return_array );
		}

		$return_array = [
			'fields' => [],
			'link' => '',
		];

		$form_raw_data = wp_unslash( $_POST['form_fields'] );

		foreach ( $fields as $field_index => $field ) {
			if ( ! empty( $field['required'] ) && empty( $form_raw_data[ $field_index ] ) && ( ! isset( $field['type'] ) || 'file' !== $field['type'] ) ) {
				$return_array['fields'][ $field_index ] = self::get_default_message( self::FIELD_REQUIRED, $settings );
			}
		}

		$return_array = apply_filters( 'elementor_pro/forms/validation', $return_array, $form_id, $settings, $form_raw_data );

		if ( ! empty( $return_array['fields'] ) ) {
			$return_array['message'] = self::get_default_message( self::ERROR, $settings );
			wp_send_json_error( $return_array );
			die();
		}

		$record = [
			'fields' => [],
			'meta' => [],
		];

		foreach ( $fields as $field_index => $field ) {
			$field_label = $field['field_label'];
			$field_value = '';

			if ( isset( $form_raw_data[ $field_index ] ) ) {

				$field_value = $form_raw_data[ $field_index ];

				if ( 'textarea' === $field['field_type'] ) {
					$field_value = nl2br( $field_value );
				}

				if ( is_array( $field_value ) ) {
					$field_value = implode( ', ', $field_value );
				}
			}

			$record['fields'][] = [
				'type' => $field['field_type'],
				'title' => $field_label,
				'value' => $field_value,
			];
		}

		$form_metadata = $settings['form_metadata'];

		if ( ! empty( $form_metadata ) ) {
			foreach ( $form_metadata as $metadata_type ) {
				switch ( $metadata_type ) {
					case 'date' :
						$record['meta'][] = [
							'type' => 'date',
							'title' => __( 'Date', 'elementor-pro' ),
							'value' => date_i18n( get_option( 'date_format' ) ),
						];
						break;

					case 'time' :
						$record['meta'][] = [
							'type' => 'time',
							'title' => __( 'Time', 'elementor-pro' ),
							'value' => date_i18n( get_option( 'time_format' ) ),
						];
						break;

					case 'page_url' :
						$record['meta'][] = [
							'type' => 'page_url',
							'title' => __( 'Page URL', 'elementor-pro' ),
							'value' => $_POST['referrer'],
						];
						break;

					case 'user_agent' :
						$record['meta'][] = [
							'type' => 'user_agent',
							'title' => __( 'User Agent', 'elementor-pro' ),
							'value' => $_SERVER['HTTP_USER_AGENT'],
						];
						break;

					case 'remote_ip' :
						$record['meta'][] = [
							'type' => 'remote_ip',
							'title' => __( 'Remote IP', 'elementor-pro' ),
							'value' => Utils::get_client_ip(),
						];
						break;
				}
			}
		}

		$record = apply_filters( 'elementor_pro/forms/record', $record, $form_id, $settings );

		do_action( 'elementor_pro/forms/valid_record_submitted', $form_id, $settings, $record );

		$skip_email = apply_filters( 'elementor_pro/forms/skip_send', false, $form_id, $settings, $record );
		$email_sent = false;

		if ( ! $skip_email ) {
			$email_text = '';

			foreach ( $record['fields'] as $field ) {
				$email_text .= $this->field_to_html( $field );
			}

			$email_text .= PHP_EOL . '---' . PHP_EOL . PHP_EOL;

			foreach ( $record['meta'] as $field ) {
				$email_text .= $this->field_to_html( $field );
			}

			if ( in_array( 'credit', $form_metadata ) ) {
				$email_text .= __( 'Powered by https://elementor.com/', 'elementor-pro' ) . PHP_EOL;
			}

			$email_to = trim( $settings['email_to'] );
			if ( empty( $email_to ) ) {
				$email_to = get_option( 'admin_email' );
			}

			$email_subject = trim( $settings['email_subject'] );
			if ( empty( $email_subject ) ) {
				$email_subject = sprintf( __( 'New message from "%s"', 'elementor-pro' ), get_bloginfo( 'name' ) );
			}

			$email_from_name = $settings['email_from_name'];
			if ( empty( $email_from_name ) ) {
				$email_from_name = get_bloginfo( 'name' );
			}

			$email_from = $settings['email_from'];
			if ( empty( $email_from ) ) {
				$email_from = get_bloginfo( 'admin_email' );
			}

			$email_reply_to_setting = $settings['email_reply_to'];
			$email_reply_to = '';

			if ( ! empty( $email_reply_to_setting ) ) {
				foreach ( $fields as $field_index => $field ) {
					if ( $field['_id'] === $email_reply_to_setting ) {
						$email_reply_to = $form_raw_data[ $field_index ];
						break;
					}
				}
			}

			if ( empty( $email_reply_to ) ) {
				$email_reply_to = 'noreplay@' . Utils::get_site_domain();
			}

			$headers = sprintf( 'From: %s <%s>' . "\r\n", $email_from_name, $email_from );
			$headers .= sprintf( 'Reply-To: %s' . "\r\n", $email_reply_to );

			if ( 'yes' === $settings['send_html'] ) {
				$headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
				$email_text = nl2br( $email_text );
			}

			$headers    = apply_filters( 'elementor_pro/forms/wp_mail_headers', $headers );
			$email_text = apply_filters( 'elementor_pro/forms/wp_mail_message', $email_text );

			$email_sent = wp_mail( $email_to, $email_subject, $email_text, $headers );

			do_action( 'elementor_pro/forms/mail_sent', $form_id, $settings, $record );
		} else {
			// for plugins like aal
			do_action( 'elementor_pro/forms/mail_blocked', $form_id, $settings, $record );
		}

		$redirect_to = $settings['redirect_to'];
		if ( empty( $redirect_to ) || ! filter_var( $redirect_to, FILTER_VALIDATE_URL ) ) {
			$redirect_to = '';
		}

		if ( $email_sent || $skip_email ) {
			$return_array['link'] = $redirect_to;
			$return_array['message'] = self::get_default_message( self::SUCCESS, $settings );
			wp_send_json_success( $return_array );
		} else {
			$return_array['message'] = self::get_default_message( self::SERVER_ERROR, $settings );
			wp_send_json_error( $return_array );
		}

		die();
	}

	private function find_element_recursive( $elements, $form_id ) {
		foreach ( $elements as $element ) {
			if ( $form_id === $element['id'] ) {
				return $element;
			}

			if ( ! empty( $element['elements'] ) ) {
				$element = $this->find_element_recursive( $element['elements'], $form_id );

				if ( $element ) {
					return $element;
				}
			}
		}

		return false;
	}

	private function field_to_html( $field ) {
		$html = '';
		if ( ! empty( $field['title'] ) ) {
			$html = sprintf( '%s: %s' . PHP_EOL, $field['title'], $field['value'] );
		} elseif ( ! empty( $field['value'] ) ) {
			$html = sprintf( '%s' . PHP_EOL, $field['value'] );
		}

		return $html;
	}

	public function __construct() {
		add_action( 'wp_ajax_elementor_pro_forms_send_form', [ $this, 'ajax_send_form' ] );
		add_action( 'wp_ajax_nopriv_elementor_pro_forms_send_form', [ $this, 'ajax_send_form' ] );
	}
}
