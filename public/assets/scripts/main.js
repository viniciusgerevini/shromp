(function() {
	function configureNav() {
		const menu = document.getElementById("mainNav");
		const items = menu.querySelectorAll(".nav-item");
		const currentLink = window.location.pathname + window.location.hash;

		for (let item of items) {
			const link = item.querySelector("a");
			const button = item.querySelector("button");
			if (!link) { // not a real case, but just to be safe
				continue;
			}
			const path = link.pathname + link.hash;
			if (path === currentLink) {
				item.classList.add("current");
			}

			if (link.hash !== "") {
				link.onclick = () => {
					const current = menu.querySelector(".nav-item.current");
					if (current) {
						current.classList.remove("current");
					}
					item.classList.add("current");
				}
			}

			if (button) {
				button.onclick = (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (item.classList.contains("expanded")) {
						item.classList.remove("expanded");
						item.classList.add("collapsed");
					} else {
						item.classList.add("expanded");
						item.classList.remove("collapsed");
					}
				};
			}
		}
	}

	configureNav();

	const themeSelector = document.getElementById("siteThemeSelector");
	themeSelector.onchange = (event) => {
		setTheme(event.target.value);
		localStorage.setItem("theme", event.target.value);
	};

	function setTheme(theme, shouldUpdateSelector) {
		let newTheme = theme;
		if (!newTheme || newTheme === "auto") {
			newTheme = window.matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light";
		}

		document.querySelector("html").setAttribute("data-theme", newTheme);

		if (shouldUpdateSelector) {
			themeSelector.value = theme;
		}
	}

	setTheme(localStorage.getItem("theme"), true);
}());

