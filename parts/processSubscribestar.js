function processSubscribestar() {
	document.body.addEventListener("click", () => setTimeout(main, 500), true);
	function main() {
		const imgLinks = document.querySelectorAll("a.gallery-image_original_link");
		if (imgLinks.length === 1) {
			const imgLink = imgLinks[0];
			const existing = document.getElementById("artname-btn");
			if (!existing && GM_download) {
				const sabt = createAndAssign("a", imgLink.href, imgLink.download);
				sabt.className = imgLink.className;
				sabt.style.display = "inline-block";
				sabt.style.padding = "0 0 10px 0";
				sabt.style.cursor = "pointer";
				const sep = document.createElement("span");
				sep.innerHTML = "&nbsp;|&nbsp;";
				imgLink.style.display = "inline-block";
				imgLink.style.padding = "10px 0 0 0";
				imgLink.parentElement.appendChild(sep);
				imgLink.parentElement.appendChild(sabt);
			}
		}
	}
}
