<?php get_header( 'header' ); ?>

<section id="content">


    <div class="platter">
		<?php
		// TO SHOW THE PAGE CONTENTS
		while ( have_posts() ) : the_post(); ?> <!--Because the_content() works only inside a WP Loop -->
            <article class="content-page">
				<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>

				<?php
				echo '<div class="content">';
				the_content();
				echo '</div>';
				?> <!-- Page Content -->
            </article>
			<?php
		endwhile; //resetting the page loop
		wp_reset_query(); //resetting the page query
		?>

    </div>


</section>


<?php get_footer(); ?>

