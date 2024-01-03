function createAndAssign(tagName, urlList, artName, errorCallback) {
	const btn = createButton(tagName);
	if (!urlList || !GM.download || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	if (urlList.length > 1) {
		btn.innerText = "Download all";
	}
	// The button stays blurry until all the AJAX requests to get file extensions are resolved
	btn.style.opacity = "0.3";
	assignClick(btn, urlList, artName).then(() => {
		btn.style.opacity = "";
	});
	return btn;
}
