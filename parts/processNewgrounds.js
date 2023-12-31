function processNewgrounds() {
	const name = parseName(document.title.substr(0, document.title.length - 14));
	const bar = document.querySelectorAll(".pod-head")[0];
	const artList = document.querySelectorAll(".pod-body a[data-action=view-image]");
	const urlList = [...artList].map(a => a.href);
	const sabt = createSaveAsElement("button", urlList, name, () => {
		console.warn("Unable to create Save As button.");
	});
	const icon = disketSvg();
	icon.style = "vertical-align: middle; margin: -2px 4px 0 0;";
	sabt.insertBefore(icon, sabt.firstChild);
	const span = document.createElement("span");
	span.appendChild(sabt);
	bar.appendChild(span);
}
