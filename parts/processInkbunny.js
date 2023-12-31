/** InkBunny is simple. */
function processInkbunny() {
	const pictop = document.querySelector("#pictop");
	if(pictop) {
		const name = parseName(document.title.substr(0, document.title.length - 49));
		const sctn = document.querySelector("#size_container");
		const downloadLink = sctn.querySelector("div+a");
		let url;
		if (downloadLink) {
			url = downloadLink.href;
		} else {
			const img = document.querySelector("img#magicbox");
			const picLink = img.parentElement;
			url = picLink.href;
		}
		const sabt = createSaveAsElement("a", url, name, () => {
			// Replace the picture title with the formatted name
			const h1 = pictop.querySelector("h1");
			h1.innerHTML = name;
			selectText(h1);
		});
		const icon = disketSvg();
		icon.style = "height: 14px; vertical-align: text-bottom;";
		sabt.insertBefore(icon, sabt.firstChild);
		sabt.style = "margin-left: 24px; cursor: pointer;";
		sctn.appendChild(sabt);
	}
}
