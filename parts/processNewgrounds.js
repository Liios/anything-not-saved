function processNewgrounds() {
	let name;
	if (/(^.*) by (.*?$)/.test(document.title)) {
		// "Picture name by artist on Newgrounds"
		name = parseName(document.title.substr(0, document.title.length - 14));
	} else {
		// Video or audio
		const artists = [...document.querySelectorAll(".authorlinks h4 :first-child")].map(e => e.innerText).join(", ");
		name = `${artists} - ${document.title}`;
	}
	const nav = document.querySelector("#gallery-nav");
	if (nav) {
		// fuck it...
		const dlbt = createButton("button", "Download all");
		dlbt.onclick = () => downloadSlideshow(nav, dlbt);
		addButton(dlbt);
	} else if (location.pathname.startsWith("/portal/view")) {
		downloadVideo(name);
	} else if (location.pathname.startsWith("/audio/listen")) {
		let urlList = [...document.querySelectorAll("audio source")].map(el => el.src);
		urlList = urlList.filter(url => url.startsWith("https://audio.ngfiles.com/"));
		// It saves as AAC even if the source and name both say MP3. Annoying...
		const sabt = createAndAssign("button", urlList, name);
		addButton(sabt);
	} else {
		let urlList = [...document.querySelectorAll(".pod-body a")].map(a => a.href);
		urlList = urlList.filter(url => url.startsWith("https://art.ngfiles.com/images/"));
		const sabt = createAndAssign("button", urlList, name);
		addButton(sabt);
	}

	async function downloadVideo(name) {
		const id = location.href.split('/').pop();
		const infoRequest = await GM.xmlHttpRequest({
			method: "get",
			url: `/portal/video/${id}`,
			accept: "application/json",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
		});
		const sources = JSON.parse(infoRequest.response).sources;
		const menu = document.createElement("div");
		Object.assign(menu.style, {
			display: "none",
			position: "absolute",
			background: "white",
			border: "1px solid #ccc",
			borderRadius: "6px",
			padding: "4px",
			marginLeft: "34px",
			zIndex: "1000"
		});
		for (let key of Object.keys(sources)) {
			const option = document.createElement("button");
			option.textContent = key;
			Object.assign(option.style, {
				display: "block",
				width: "100%",
				border: "none",
				background: "none",
				cursor: "pointer"
			});
			const src = sources[key][0].src;
			// Same here, videos are force-named to AVI where they are clearly MP4. What is this, 2007?
			assignClick(option, src, name, null, hideMenu);
			menu.appendChild(option);
		}
		const sabt = createButton("button");
		sabt.addEventListener("click", toggleMenu);
		addButton(sabt);
		sabt.parentElement.appendChild(menu);
		// Hide the menu when you click outside
		document.addEventListener("click", (event) => {
			if (![menu, sabt].some(el => el.contains(event.target))) {
				hideMenu();
			}
		});

		function hideMenu() {
			menu.style.display = "none";
		}

		function toggleMenu() {
			menu.style.display = menu.style.display === "none" ? "block" : "none";
		}
	}

	async function downloadSlideshow(nav, dlbt) {
		dlbt.disabled = true;
		dlbt.style.cursor = "wait";
		const thumbs = [...nav.querySelectorAll("a.art-gallery-thumb")];
		const total = thumbs.length;
		dlbt.innerText = "Download (0/" + total + ")";
		let url = null;
		for (let i = 0; i < total; ++i) {
			const thumb = thumbs[i];
			thumb.click();
			let nextUrl = null;
			do {
				await sleep(200);
				nextUrl = document.querySelector(".pod-body a[data-action=view-image]").href;
			} while (url === nextUrl);
			url = nextUrl;
			const ext = await detectExtension(dlbt, url);
			await GM.download({
				url: url,
				name: name + " - " + padWithZeroes(i + 1, total) + "." + ext,
				saveAs: false,
			});
			dlbt.innerText = "Download (" + (i + 1) + "/" + total + ")";
		}
		dlbt.disabled = false;
		dlbt.style.cursor = "";
	}

	function addButton(bt) {
		const icon = disketSvg();
		icon.style = "vertical-align: middle; margin: -2px 4px 0 0;";
		bt.insertBefore(icon, bt.firstChild);
		const span = document.createElement("span");
		span.appendChild(bt);
		const bar = document.querySelectorAll(".pod-head")[0];
		bar.appendChild(span);
	}
}
