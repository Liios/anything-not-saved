function processAryion() {
	const gboxes = document.querySelectorAll(".g-box");
	for(let gbox of gboxes) {
		const bar = gbox.querySelector(".g-box-header + .g-box-header span + span");
		if(bar) {
			const name = parseName(document.title.substr(6, document.title.length));
			const noscript = document.querySelector(".item-box noscript");
			let url = null;
			if(noscript) {
				// Creates download buttons from the noscript picture URL
				url = /src='(.*?)'/.exec(noscript.innerText)[1].replace("//", "https://");
			} else {
				// Slower, because it goes the XMLHttpRequest way to get the file extension
				const downloadAnchor = document.querySelectorAll(".func-box .g-box-header.g-corner-all a")[1];
				url = downloadAnchor.href;
			}
			const sabt = createSaveAsElement("a", url, name, () => {
				// Adds the formatted name under the regular title
				const title = document.createElement("div");
				title.innerHTML = name;
				bar.appendChild(title);
				selectText(title);
			});
			const func = document.querySelector(".func-box .g-box-header.g-corner-all");
			const sep = document.createElement("span");
			sep.innerHTML = " | ";
			func.appendChild(sep);
			func.appendChild(sabt);
			return;
		}
	}
}
