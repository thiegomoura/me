const icon = document.querySelector('#theme i');

function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
}

function toggleTheme() {
    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-light')
        icon.removeAttribute('bi-cloud-moon-fill');
        icon.setAttribute('class', 'bi-cloud-sun-fill');
    } else {
        setTheme('theme-dark')
        icon.removeAttribute('bi-cloud-sun-fill');
        icon.setAttribute('class', 'bi-cloud-moon-fill');
    }
}

(function () {
    if (localStorage.getItem('theme') === 'theme-dark' || !localStorage.getItem('theme')) {
        setTheme('theme-dark')
        icon.setAttribute('class', 'bi-cloud-moon-fill');
    } else {
        setTheme('theme-light')
        icon.setAttribute('class', 'bi-cloud-sun-fill');
    }
})();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});