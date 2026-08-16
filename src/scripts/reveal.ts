export function initReveal() {
    if (typeof window === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll<HTMLElement>('.reveal');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { root: null, threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    targets.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 60}ms`);
        observer.observe(el);
    });
}
