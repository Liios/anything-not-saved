function processFuraffinity() {
	const actions = document.querySelector("#page-submission .actions");
	const betaSection = document.querySelector("#submission_page .submission-sidebar");
	if(actions) {
		// Classic template (no longer maintened)
		const name = parseName(document.title.substr(0, document.title.length - 26));
		for(let i = 0 ; i < actions.childNodes.length ; ++i) {
			if(actions.childNodes[i].textContent.match("Download")) {
				const dlbt = actions.childNodes[i].childNodes[0];
				dlbt.title = name;
				dlbt.innerHTML = name;
				selectText(dlbt);
				const sabt = createAndAssign("button", dlbt.href, name, () => {});
				dlbt.parentElement.parentElement.appendChild(sabt);
				break;
			}
		}
	} else if(betaSection) {
		// Modern template
		const name = parseName(document.title.substr(0, document.title.length - 26));
		const side = betaSection.querySelector("section.buttons");
		const sideDownloadLink = side.querySelector("div.download a");
		const sideSaveAsLink = createAndAssign("a", sideDownloadLink.href, name, () => {
			// Adds the formatted name as a new meta info
			const nctn = document.createElement("div");
			const ntag = document.createElement("strong");
			const nval = document.createElement("span");
			ntag.innerText = "Name";
			nval.innerText = name;
			nctn.appendChild(ntag);
			nctn.appendChild(document.createTextNode(" "));
			nctn.appendChild(nval);
			const meta = betaSection.querySelector("section.info.text");
			meta.insertBefore(nctn, meta.firstChild);
			selectText(nval);
		});
		// Adjust styling and insert into sidebar
		sideSaveAsLink.href = "#";
		const sideDownload = sideDownloadLink.parentElement;
		sideDownload.style.padding = "0 8px";
		const sideSaveAs = document.createElement("div");
		sideSaveAs.style.borderRight = "none";
		sideSaveAs.appendChild(sideSaveAsLink);
		sideDownload.insertAdjacentElement("afterend", sideSaveAs);
		// Insert a second button into picture bottom bar
		const bottom = document.querySelector(".favorite-nav");
		const bottomDownloadLink = Array.from(bottom.children).find(a => a.innerHTML === "Download");
		const bottomSaveAsLink = createAndAssign("a", sideDownloadLink.href, name, () => {});
		bottomSaveAsLink.className += (" " + bottomDownloadLink.className);
		bottomSaveAsLink.style.marginLeft = "4px"; // simulates a fucking blank space
		bottomDownloadLink.insertAdjacentElement("afterend", bottomSaveAsLink);
	}
}
