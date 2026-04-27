const icon = document.querySelector("#theme i");
const themeToggle = document.querySelector("#theme");
const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
).matches;
let revealObserver = null;

function getRevealObserver() {
    if (prefersReducedMotion || revealObserver) {
        return revealObserver;
    }

    if (!("IntersectionObserver" in window)) {
        return null;
    }

    revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            root: null,
            threshold: 0.12,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    return revealObserver;
}

function registerReveal(selector) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) {
        return;
    }

    const observer = getRevealObserver();

    elements.forEach((el, index) => {
        if (el.dataset.revealReady === "true") {
            return;
        }

        el.dataset.revealReady = "true";
        el.classList.add("reveal");
        el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);

        if (prefersReducedMotion || !observer) {
            el.classList.add("reveal-visible");
            return;
        }

        observer.observe(el);
    });
}

function setThemeIcon(themeName) {
    if (!icon) {
        return;
    }

    icon.className =
        themeName === "theme-dark"
            ? "bi bi-cloud-moon-fill"
            : "bi bi-cloud-sun-fill";
}

function setThemeToggleLabel(themeName) {
    if (!themeToggle) {
        return;
    }

    const label =
        themeName === "theme-dark"
            ? "Switch to light theme"
            : "Switch to dark theme";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
}

function setTheme(themeName) {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
    setThemeIcon(themeName);
    setThemeToggleLabel(themeName);
}

function toggleTheme() {
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-light");
    } else {
        setTheme("theme-dark");
    }
}

(function () {
    if (
        localStorage.getItem("theme") === "theme-dark" ||
        !localStorage.getItem("theme")
    ) {
        setTheme("theme-dark");
    } else {
        setTheme("theme-light");
    }

    registerReveal(
        "#profile, #skills .skill-summary, #skills .skill-group, #projects .project-intro, #projects .project-card, #timeline .title",
    );

    fetch("./data/timeline.json")
        .then((response) => response.json())
        .then((timeline) => {
            const timelineContainer = document.getElementById("timeline");
            if (!timelineContainer) {
                return;
            }

            timeline.forEach(({ year, events }) => {
                const card = document.createElement("div");
                card.className = "card timeline-card";

                const step = document.createElement("div");
                step.className = "step";

                const stepNumber = document.createElement("div");
                stepNumber.className = "step-number";

                const yearSpan = document.createElement("span");
                yearSpan.className = "data-step timeline-year";
                yearSpan.innerText = year;

                stepNumber.appendChild(yearSpan);
                step.appendChild(stepNumber);

                events.forEach(({ organization, description }) => {
                    if (organization) {
                        const org = document.createElement("p");
                        org.innerHTML = `<strong>${organization}</strong>`;
                        step.appendChild(org);
                    }
                    const desc = document.createElement("p");
                    desc.className = "step-title";
                    desc.innerText = description;
                    step.appendChild(desc);
                });

                card.appendChild(step);
                timelineContainer.appendChild(card);
            });

            registerReveal("#timeline .timeline-card");
        })
        .catch((error) => {
            console.error("Failed to load timeline data:", error);
        });
})();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth",
        });
    });
});

