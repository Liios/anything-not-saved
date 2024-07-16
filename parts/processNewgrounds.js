function processNewgrounds() {
	const name = parseName(document.title.substr(0, document.title.length - 14));
	const nav = document.querySelector("#gallery-nav");
	let urlList = [];
	if (nav) {
		// fuck it...
		const dlbt = createButton("button", "Download all");
		dlbt.onclick = () => downloadSlideshow(nav, dlbt);
		addButton(dlbt);
	} else {
		const artList = document.querySelectorAll(".pod-body a[data-action=view-image]");
		urlList = [...artList].map(a => a.href);
		const sabt = createAndAssign("button", urlList, name, () => {
			console.warn("Unable to create Save As button.");
		});
		addButton(sabt);
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
