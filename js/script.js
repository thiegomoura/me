function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
}

function toggleTheme() {
    console.log('lo')
    if (localStorage.getItem('theme') === 'theme-dark')
        setTheme('theme-ligth')
    else
        setTheme('theme-dark')
}

(function() {
    if (localStorage.getItem('theme') === 'theme-dark')
        setTheme('theme-dark')
    else
        setTheme('theme-ligth')
})();