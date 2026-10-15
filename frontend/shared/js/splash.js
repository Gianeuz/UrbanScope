/**
 * UrbanScope - Welcome Splash
 * Shows the "Miriam Lobren - Real Estate Agent" intro animation the first
 * time the site is opened in a browser tab (once per session).
 * Tip: run  sessionStorage.removeItem('urbanscope_splash_seen')  in the
 * browser console (or open a new tab) to see it again.
 */
(function () {
    var KEY = 'urbanscope_splash_seen';
    var root = document.documentElement;

    try {
        if (sessionStorage.getItem(KEY)) return;
        sessionStorage.setItem(KEY, '1');
    } catch (e) { /* storage blocked - still show splash */ }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Determine relative asset base path based on location
    // (section pages live at frontend/pages/<section>/, two levels below index.html)
    var isSubfolder = window.location.pathname.includes('/pages/');
    var basePath = isSubfolder ? '../../' : './';

    // Hide the page immediately so there is no flash of content before the overlay mounts
    root.classList.add('splash-pending');

    function letters(text) {
        return text.split('').map(function (c, i) {
            return c === ' '
                ? '<span class="sp"></span>'
                : '<span class="ch" style="--i:' + i + '">' + c + '</span>';
        }).join('');
    }

    function build() {
        var el = document.createElement('div');
        el.id = 'splash';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-label', 'Miriam Lobren, Real Estate Agent');
        el.innerHTML =
            '<span class="splash-orb o1"></span>' +
            '<span class="splash-orb o2"></span>' +
            '<div class="splash-inner">' +
                '<div class="splash-logo-ring"><img src="' + basePath + 'assets/images/logo.png" alt=""></div>' +
                '<div class="splash-name" aria-hidden="true">' + letters('Miriam Lobren') + '</div>' +
                '<div class="splash-line"></div>' +
                '<p class="splash-role">REAL ESTATE AGENT</p>' +
                '<p class="splash-tag">Better Homes, Brighter Futures</p>' +
            '</div>' +
            '<div class="splash-skip">Tap to continue</div>';
        document.body.appendChild(el);

        var img = el.querySelector('img');
        img.addEventListener('error', function () {
            var mono = document.createElement('span');
            mono.className = 'splash-mono';
            mono.textContent = 'ML';
            img.replaceWith(mono);
        });

        var closed = false;
        function close() {
            if (closed) return;
            closed = true;
            el.classList.add('splash-exit');
            root.classList.remove('splash-pending');
            setTimeout(function () { el.remove(); }, 1000);
        }

        el.addEventListener('click', close);
        setTimeout(close, reduceMotion ? 800 : 3000);
    }

    if (document.body) build();
    else document.addEventListener('DOMContentLoaded', build);

    // Failsafe: never leave the page hidden
    setTimeout(function () { root.classList.remove('splash-pending'); }, 6000);
})();
