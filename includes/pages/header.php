<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <!--Fonts-->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
    <link rel="shortcut icon" type="imagem/x-icon" href="../../favicon.ico" />
    <?php
    $url = get_bloginfo('template_url');
    foreach ($estilo as &$value) {
        echo "
    <link href='{$url}/css/{$value}.css' rel='stylesheet'>";
    }
    unset($value)
    ?>
    <title>Thiego Moura - Personal Blog</title>
</head>

<body>
    <header>
        <nav class="navbar navbar-expand-lg">
            <a class="navbar-brand" href="./index.html">Thiego's blog</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <i class="fas fa-bars"></i>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="<?php bloginfo('url') ?>/aboutme">About me</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="<?php bloginfo('url') ?>/success-case">Success case</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="<?php bloginfo('url') ?>/contact">Contact</a>
                    </li>
                </ul>
            </div>
        </nav>
    </header>