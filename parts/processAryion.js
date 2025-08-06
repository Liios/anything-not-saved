function processAryion() {
	const boxes = document.querySelectorAll(".g-box");
	for (let box of boxes) {
		const bar = box.querySelector(".g-box-header + .g-box-header span + span");
		if (bar) {
			const name = parseName(document.title.substr(6, document.title.length));
			const noscript = document.querySelector(".item-box noscript");
			let url = null;
			if (noscript) {
				// Creates download buttons from the noscript picture URL
				url = /src='(.*?)'/.exec(noscript.innerText)[1].replace("//", "https://");
			} else {
				// Slower, because it goes the XMLHttpRequest way to pull the file extension
				const barLinks = document.querySelectorAll(".func-box .g-box-header.g-corner-all a");
				for (const link of barLinks) {
					if (link.innerText == "Download") {
						url = link.href;
						break;
					}
				}
			}
			const sabt = createAndAssign("a", url, name, () => {
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
