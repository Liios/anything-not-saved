function createSaveAsElement(tagName, urlList, artName, errorCallback) {
	const btn = document.createElement(tagName);
	if(tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = "Save as";
	if (!urlList || !GM_download || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	if (urlList.length > 1) {
		btn.innerText = "Download all";
	}
	// The button stays hidden until all the AJAX requests to get file extensions are resolved
	btn.style.display = "none";
	assignClick(btn, urlList, artName).then(() => btn.style.display = "");
	return btn;
}
