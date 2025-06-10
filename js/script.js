const icon = document.querySelector("#theme i");

function setTheme(themeName) {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
}

function toggleTheme() {
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-light");
        icon.removeAttribute("bi-cloud-moon-fill");
        icon.setAttribute("class", "bi-cloud-sun-fill");
    } else {
        setTheme("theme-dark");
        icon.removeAttribute("bi-cloud-sun-fill");
        icon.setAttribute("class", "bi-cloud-moon-fill");
    }
}

(function () {
    if (
        localStorage.getItem("theme") === "theme-dark" ||
        !localStorage.getItem("theme")
    ) {
        setTheme("theme-dark");
        icon.setAttribute("class", "bi-cloud-moon-fill");
    } else {
        setTheme("theme-light");
        icon.setAttribute("class", "bi-cloud-sun-fill");
    }

    fetch("../data/timeline.json")
        .then((response) => response.json())
        .then((timeline) => {
            const timelineContainer = document.getElementById("timeline");
            timeline.forEach(({ year, events }) => {
                const card = document.createElement("div");
                card.className = "card bg-light p-1 text-center";

                const step = document.createElement("div");
                step.className = "step";

                const stepNumber = document.createElement("div");
                stepNumber.className = "step-number";

                const yearSpan = document.createElement("span");
                yearSpan.className = "data-step text-muted";
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
