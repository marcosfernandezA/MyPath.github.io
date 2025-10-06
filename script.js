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

    document.getElementById('web-security-link').onclick = function(e) {
        e.preventDefault();
        showSection('web-security-index');
    };
    document.getElementById('xss-link').onclick = function(e) {
        e.preventDefault();
        showSection('xss');
    };
    document.getElementById('sql-injection-link').onclick = function(e) {
        e.preventDefault();
        showSection('sql-injection');
    };
    document.querySelector('a[href="#devsecops"]').onclick = function(e) {
        e.preventDefault();
        showSection('devsecops');
    };
    document.querySelector('a[href="#design-security"]').onclick = function(e) {
        e.preventDefault();
        showSection('design-security');
    };
};
