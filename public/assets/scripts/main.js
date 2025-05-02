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


	function formatVersion(version) {
		const versionParts = version.split("-");
		if (versionParts.length === 1)  {
			return `v${version}`;
		}
		return `v${versionParts[0]} (Godot ${versionParts[1]})`;
	}

	async function loadVersions() {
		const selector = document.getElementById("versionSelector");
		const currentVersion = selector.value;
		selector.innerHTML = "";

		try {
			const response = await fetch("/versions.json");
			const json = await response.json();

			if (json && json.versions) {
				const versions = json.versions.sort().reverse();
				for (let version of versions) {
					selector.innerHTML += `<option value="${version}" ${version === currentVersion ? 'selected="selected"' : ''}>${formatVersion(version)}</option>`
				}
			}
		} catch (_e) {}

		selector.onchange = (event) => {
			const currentUrl = window.location.href;
			const regex = new RegExp(`${currentVersion}\\/?.*`);
			const newUrl = currentUrl.replace(regex, event.target.value);
			window.location.href = newUrl;
		};
	}

	loadVersions();
}());

