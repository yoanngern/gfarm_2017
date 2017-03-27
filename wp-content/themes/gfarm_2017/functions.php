<?php

function themeslug_enqueue_style() {
	wp_enqueue_style( 'core', get_template_directory_uri() . '/style.css', false );
}

function themeslug_enqueue_script() {
	//wp_enqueue_script( 'my-js', get_template_directory_uri() . '/js/main.min.js', false );
}

add_action( 'wp_enqueue_scripts', 'themeslug_enqueue_style' );
add_action( 'wp_enqueue_scripts', 'themeslug_enqueue_script' );


function register_my_menu() {
	register_nav_menu( 'principal', __( 'Menu principal', 'gfarm_2017' ) );
}

add_action( 'init', 'register_my_menu' );


//add_action( 'acf/init', 'my_acf_init' );

add_theme_support( 'post-thumbnails' );

add_image_size( 'banner', 1440, 670, true );
add_image_size( 'full_hd', 1920, 1080, true );
add_image_size( 'blog', 328, 244, true );

/**
 * Filter the except length to 20 words.
 *
 * @param int $length Excerpt length.
 *
 * @return int (Maybe) modified excerpt length.
 */
function wpdocs_custom_excerpt_length( $length ) {
	return 18;
}

add_filter( 'excerpt_length', 'wpdocs_custom_excerpt_length', 999 );

function my_theme_archive_title( $title ) {
	if ( is_category() ) {
		$title = single_cat_title( '', false );
	} elseif ( is_tag() ) {
		$title = single_tag_title( '', false );
	} elseif ( is_author() ) {
		$title = '<span class="vcard">' . get_the_author() . '</span>';
	} elseif ( is_post_type_archive() ) {
		$title = post_type_archive_title( '', false );
	} elseif ( is_tax() ) {
		$title = single_term_title( '', false );
	}

	return $title;
}

add_filter( 'get_the_archive_title', 'my_theme_archive_title' );


function get_attachment_url_by_slug( $slug ) {

	$args    = array(
		'post_type'      => 'attachment',
		'name'           => sanitize_title( $slug ),
		'posts_per_page' => 1,
		'post_status'    => 'inherit',
	);
	$_header = get_posts( $args );

	$header = $_header ? array_pop( $_header ) : null;

	return $header ? wp_get_attachment_url( $header->ID ) : '';
}


function is_child( $pageSlug ) {

	$id = get_the_ID();

	do {

		$parent_id = wp_get_post_parent_id( $id );

		$parent_slug = get_page_uri( $parent_id );

		if ( $parent_slug == $pageSlug ) {

			return true;
		} else {
			$id = $parent_id;
		}

	} while ( $parent_id != 0 && true );

	return false;
}


// add hook
add_filter( 'wp_nav_menu_objects', 'my_wp_nav_menu_objects_sub_menu', 10, 2 );
// filter_hook function to react on sub_menu flag
function my_wp_nav_menu_objects_sub_menu( $sorted_menu_items, $args ) {
	if ( isset( $args->sub_menu ) ) {
		$root_id = 0;

		// find the current menu item
		foreach ( $sorted_menu_items as $menu_item ) {
			if ( $menu_item->current ) {
				// set the root id based on whether the current menu item has a parent or not
				$root_id = ( $menu_item->menu_item_parent ) ? $menu_item->menu_item_parent : $menu_item->ID;
				break;
			}
		}

		// find the top level parent
		if ( ! isset( $args->direct_parent ) ) {
			$prev_root_id = $root_id;
			while ( $prev_root_id != 0 ) {
				foreach ( $sorted_menu_items as $menu_item ) {
					if ( $menu_item->ID == $prev_root_id ) {
						$prev_root_id = $menu_item->menu_item_parent;
						// don't set the root_id to 0 if we've reached the top of the menu
						if ( $prev_root_id != 0 ) {
							$root_id = $menu_item->menu_item_parent;
						}
						break;
					}
				}
			}
		}
		$menu_item_parents = array();
		foreach ( $sorted_menu_items as $key => $item ) {
			// init menu_item_parents
			if ( $item->ID == $root_id ) {
				$menu_item_parents[] = $item->ID;
			}
			if ( in_array( $item->menu_item_parent, $menu_item_parents ) ) {
				// part of sub-tree: keep!
				$menu_item_parents[] = $item->ID;
			} else if ( ! ( isset( $args->show_parent ) && in_array( $item->ID, $menu_item_parents ) ) ) {
				// not part of sub-tree: away with it!
				unset( $sorted_menu_items[ $key ] );
			}
		}

		return $sorted_menu_items;
	} else {
		return $sorted_menu_items;
	}
}

function get_field_or_parent( $field, $post_id, $taxonomy = 'category' ) {

	if($post_id === NULL) {
		global $post;
	} else {
		$post = get_post($post_id);
	}

	$field_return = get_field( $field, $post->ID );

	if ( ! $field_return ) :


		$categories = get_the_terms( $post->ID, $taxonomy );

		foreach ( $categories as $category ) :

			$field_return = get_field( $field, $category );

			if ( $field_return ) {
				break;
			}

			while ( ! $field_return && $category->parent != null ) {

				$current_cat      = get_term( $category->parent, $taxonomy );
				$new_field_return = get_field( $field, $current_cat );

				if ( $new_field_return ) {
					$field_return = $new_field_return;
				}

				if ( $field_return ) {
					break;
				}

				$category = $current_cat;

			}

		endforeach;

		return $field_return;

	else:

		return $field_return;

	endif;
}