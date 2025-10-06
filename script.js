// Navegación entre secciones
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(sec => {
        sec.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// Enlaces de la barra de navegación
window.onload = function() {
    // Mostrar índice al cargar
    showSection('index');

    // web-security-link: if href is a hash, behave as SPA; if it's a file path, allow normal navigation
    const webSecLink = document.getElementById('web-security-link');
    if (webSecLink) {
        webSecLink.onclick = function(e) {
            const href = e.currentTarget.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                showSection('web-security-index');
                try { e.currentTarget.blur(); } catch (err) { }
            } else {
                // allow normal navigation to the provided href (file path)
            }
        };
    }

    const xssNavLink = document.getElementById('xss-link');
    if (xssNavLink) {
        xssNavLink.onclick = function(e) {
            const href = e.currentTarget.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                showSection('xss');
            } else {
                // normal navigation to theory page (file)
            }
            try { e.currentTarget.blur(); } catch (err) { }
        };
    }

    const sqliNavLink = document.getElementById('sql-injection-link');
    if (sqliNavLink) {
        sqliNavLink.onclick = function(e) {
            const href = e.currentTarget.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                showSection('sql-injection');
            } else {
                // normal navigation to theory page (file)
            }
            try { e.currentTarget.blur(); } catch (err) { }
        };
    }
    document.querySelector('a[href="#devsecops"]').onclick = function(e) {
        e.preventDefault();
        showSection('devsecops');
        try { e.currentTarget.blur(); } catch (err) { }
    };
    document.querySelector('a[href="#design-security"]').onclick = function(e) {
        e.preventDefault();
        showSection('design-security');
        try { e.currentTarget.blur(); } catch (err) { }
    };

    // Ensure dropdowns hide when mouse leaves (some browsers keep :focus)
    document.querySelectorAll('.dropdown').forEach(drop => {
        drop.addEventListener('mouseleave', () => {
            const link = drop.querySelector('a');
            if (link) {
                try { link.blur(); } catch (err) { }
            }
        });
    });

    // Also attach handlers to links inside the main content (e.g. the index page list)
    // so clicks on those links trigger our single-page navigation.
    document.querySelectorAll('main a[href="#xss"]').forEach(a => {
        a.onclick = function(e) {
            e.preventDefault();
            showSection('xss');
            try { a.blur(); } catch (err) { }
        };
    });
    document.querySelectorAll('main a[href="#sql-injection"]').forEach(a => {
        a.onclick = function(e) {
            e.preventDefault();
            showSection('sql-injection');
            try { a.blur(); } catch (err) { }
        };
    });

    // If user clicks on the index section card itself, navigate to the full theory page
    // but ignore clicks on inner links/buttons.
    const xssSection = document.getElementById('xss');
    if (xssSection) {
        xssSection.addEventListener('click', function(e) {
            if (e.target.closest('a')) return; // don't override link clicks
            // Navigate to moved theory page
            location.href = 'WebSecurity/xss/TheoryXSS.html';
        });
    }
    const sqliSection = document.getElementById('sql-injection');
    if (sqliSection) {
        sqliSection.addEventListener('click', function(e) {
            if (e.target.closest('a')) return;
            location.href = 'WebSecurity/sqlInjection/TheorySqli.html';
        });
    }

    // Handle clicks on the nav logo to go back to the index without reloading
    const navLogo = document.getElementById('nav-logo');
    if (navLogo) {
        navLogo.addEventListener('click', function(e) {
            // If we're already on index.html, prevent full-page navigation
            if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname === '') {
                e.preventDefault();
                showSection('index');
                try { navLogo.blur(); } catch (err) { }
            }
            // otherwise allow normal navigation to index.html
        });
    }
};

// Expose an initializer so dynamically injected headers can be wired
window.initGlobalNav = function(){
    try{
        // Re-run the small set of nav link handlers (safe to call multiple times)
        const webSecLink = document.getElementById('web-security-link');
        if (webSecLink) {
            webSecLink.onclick = function(e) {
                const href = e.currentTarget.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    showSection('web-security-index');
                }
                try { e.currentTarget.blur(); } catch (err) { }
            };
        }

        const xssNavLink = document.getElementById('xss-link');
        if (xssNavLink) {
            xssNavLink.onclick = function(e) {
                const href = e.currentTarget.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    showSection('xss');
                }
                try { e.currentTarget.blur(); } catch (err) { }
            };
        }

        const sqliNavLink = document.getElementById('sql-injection-link');
        if (sqliNavLink) {
            sqliNavLink.onclick = function(e) {
                const href = e.currentTarget.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    showSection('sql-injection');
                }
                try { e.currentTarget.blur(); } catch (err) { }
            };
        }

        // dropdown mouseleave to remove focus
        document.querySelectorAll('.dropdown').forEach(drop => {
            drop.addEventListener('mouseleave', () => {
                const link = drop.querySelector('a');
                if (link) try { link.blur(); } catch (err) { }
            });
        });

        // nav logo behavior
        const navLogo = document.getElementById('nav-logo');
        if (navLogo) {
            navLogo.addEventListener('click', function(e) {
                if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname === '') {
                    e.preventDefault();
                    showSection('index');
                    try { navLogo.blur(); } catch (err) { }
                }
            });
        }
    }catch(e){ console.warn('initGlobalNav error', e); }
};
