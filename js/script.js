const icon = document.querySelector("#theme i");
const themeToggle = document.querySelector("#theme");

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

