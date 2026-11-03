// Página de presentación: el reproductor de YouTube se carga recién al hacer clic,
// así la página no pesa ni contacta a YouTube hasta que alguien quiere ver el video.
// Sin JavaScript, la miniatura sigue siendo un enlace al video.
'use strict';

const URL_REPRODUCTOR = 'https://www.youtube-nocookie.com/embed/';

function cargarReproductor(enlace) {
    const reproductor = document.createElement('iframe');
    reproductor.className = 'video-reproductor';
    reproductor.src = `${URL_REPRODUCTOR}${encodeURIComponent(enlace.dataset.videoId)}?autoplay=1&rel=0`;
    reproductor.title = enlace.dataset.videoTitulo;
    reproductor.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    reproductor.allowFullscreen = true;
    // YouTube rechaza el video si el reproductor no recibe el origen de la página
    reproductor.referrerPolicy = 'strict-origin-when-cross-origin';
    enlace.replaceWith(reproductor);
    reproductor.focus();
}

document.querySelectorAll('.video-miniatura').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
        evento.preventDefault();
        cargarReproductor(enlace);
    });
});
