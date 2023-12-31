function createSaveAsElement(tagName, urlList, artName, errorCallback) {
	const btn = document.createElement(tagName);
	if(tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = "Save as";
	if (!urlList || !GM_download || !GM_xmlhttpRequest || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	if (urlList.length > 1) {
		btn.innerText = "Download all";
	}
	// The button stays hidden until everything is set up
	// This is because the possible XMLHttpRequest might take some time before completing
	btn.style.display = "none";
	
	
	if(type.test(firstUrl)) {
		// For some reason, there is sometimes 'undefined' in matched groups...
		const ext = type.exec(firstUrl).filter(el => el !== undefined)[1];
		// Excludes web pages that indirectly deliver content
		const invalidExtensions = ["html", "htm", "php", "jsp", "asp"];
		if(!invalidExtensions.includes(ext)) {
			assignClick(btn, urlList, artName, ext);
			return btn;
		}
	}

	// If it does not work, we query the resource and get its extension from the filename
	getExtensionThenAssignClick(btn, firstUrl, artName, errorCallback);
	return btn;

	// If we arrive here, nothing has worked
	admitFailure(btn, errorCallback);
	return btn;
}
