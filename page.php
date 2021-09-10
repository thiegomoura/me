<?php
/*
  template name: pagina
*/
$estilo = array('estilo');
include('includes/pages/header.php');
?>
<section id="page">
    <div class="container">
        <!-- Page Content -->
        <div class="">
            <!-- Post Content Column -->
            <div class="text-center">
            </div>
            <div class="col-lg-12">
                <?php
                if (have_posts()) :
                    while (have_posts()) : the_post(); ?>
                        <article>
                            <!-- Title -->
                            <header class="section-header">
                                <h3 class="section-title"><?php the_title(); ?></h3>
                            </header>
                            <!-- Post Content -->
                            <p><?php the_content(); ?></p>
                        </article>
                <?php endwhile;
                endif;
                ?>
            </div>
        </div>
    </div>
    </div>
</section>
<?php
include('includes/pages/footer.php');
