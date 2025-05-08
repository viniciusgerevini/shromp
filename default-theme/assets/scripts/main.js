(function() {
	function configureNav() {
		const menu = document.getElementById("mainNav");
		if (!menu) {
			return;
		}

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

	function configureThemeSelector() {
		const themeSelector = document.getElementById("siteThemeSelector");

		function setTheme(theme, shouldUpdateSelector) {
			let newTheme = theme;
			if (!newTheme || newTheme === "auto") {
				newTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			}

			document.querySelector("html").setAttribute("data-theme", newTheme);

			if (shouldUpdateSelector) {
				themeSelector.value = theme || "auto";
			}
		}

		setTheme(localStorage.getItem("theme"), true);

		themeSelector.onchange = (event) => {
			setTheme(event.target.value);
			localStorage.setItem("theme", event.target.value);
		};

	}

	function formatVersion(version) {
		const versionParts = version.split("-");
		if (versionParts.length === 1)  {
			return version;
		}
		return `${versionParts[0]} (Godot ${versionParts[1]})`;
	}

	async function loadVersions() {
		const selector = document.getElementById("versionSelector");
		if (!selector) {
			return;
		}

		const currentVersion = selector.value;
		selector.innerHTML = "";

		try {
			const response = await fetch(`${baseUrl}/versions.json`);
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

	configureNav();
	configureThemeSelector();
	loadVersions();
}());

// this is required to support prism's line numbers
(function() {
	document.querySelectorAll('pre').forEach(function(el) {
		el.classList.add('line-numbers');
	});
}());
