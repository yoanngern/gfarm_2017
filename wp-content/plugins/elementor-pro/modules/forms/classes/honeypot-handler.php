<?php
namespace ElementorPro\Modules\Forms\Classes;

use Elementor\Plugin;
use Elementor\Widget_Base;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * Honeypot field
 */
class Honeypot_Handler {

	public function add_field_type( $field_types ) {
		$field_types['honeypot'] = __( 'Honeypot', 'elementor-pro' );

		return $field_types;
	}

	public function hide_label( $item, $item_index, $widget ) {
		if ( 'honeypot' === $item['field_type'] ) {
			$widget->set_render_attribute( 'field-group' . $item_index, 'class', 'elementor-field-type-text' );
			$item['field_label'] = false;
		}

		return $item;
	}

	/**
	 * @param string      $item
	 * @param integer     $item_index
	 * @param Widget_Base $widget
	 */
	public function render_field( $item, $item_index, $widget ) {
		$widget->set_render_attribute( 'input' . $item_index, 'type', 'text' );
		$widget->add_render_attribute( 'input' . $item_index, 'style', 'display:none !important;' );

		echo '<input size="1" ' . $widget->get_render_attribute_string( 'input' . $item_index ) . '>';
	}

	public function filter_record_fields( $record ) {
		foreach ( $record['fields'] as $key => $field ) {
			if ( 'honeypot' === $field['type'] ) {
				unset( $record['fields'][ $key ] );
				break;
			}
		}

		return $record;
	}

	public function validation( $return_array, $form_id, $settings ) {
		$fields = $settings['form_fields'];

		// Get first honeypot field
		foreach ( $fields as $field_index => $field ) {
			if ( 'honeypot' === $field['field_type'] ) {
				$honeypot = $field;
				break;
			}
		}

		if ( isset( $honeypot ) && ! empty( $_POST['form_fields'][ $field_index ] ) ) {
			$return_array['fields'][ $field_index ] = __( 'Invalid Form.', 'elementor-pro' );
		}

		return $return_array;
	}

	public function update_controls( Widget_Base $widget ) {
		$control_data = Plugin::instance()->controls_manager->get_control_from_stack( $widget->get_name(), 'form_fields' );
		if ( is_wp_error( $control_data ) ) {
			return;
		}
		foreach ( $control_data['fields'] as $index => $field ) {
			if ( 'required' === $field['name'] || 'width' === $field['name'] ) {
				$control_data['fields'][ $index ]['conditions']['terms'][] = [
					'name' => 'field_type',
					'operator' => '!in',
					'value' => [
						'honeypot',
					],
				];
			}
		}

		Plugin::instance()->controls_manager->add_control_to_stack( $widget, 'form_fields', $control_data, true );
	}

	public function __construct() {
		add_filter( 'elementor_pro/forms/field_types', [ $this, 'add_field_type' ] );
		add_action( 'elementor_pro/forms/render/item', [ $this, 'hide_label' ], 10, 3 );
		add_action( 'elementor_pro/forms/render_field/honeypot', [ $this, 'render_field' ], 10, 3 );
		add_filter( 'elementor_pro/forms/validation', [ $this, 'validation' ], 10, 3 );
		add_filter( 'elementor_pro/forms/record', [ $this, 'filter_record_fields' ] );
		add_action( 'elementor/element/form/section_form_fields/before_section_end', [ $this, 'update_controls' ] );
	}
}
