/** Creates a generic "Save as" button (or link, if specified).
  * When clicked it will open the "Save as" dialog with the corrected filename.
  * https://www.tampermonkey.net/documentation.php#GM_download
  */
function createSaveAsElement(tagName, urlList, name, errorCallback) {
	const btn = document.createElement(tagName);
	if(tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = "Save as";
	if (!urlList || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	// I'm too lazy to do it the proper way, so we'll only check the first one
	// and assume the others link to the same type of pictures
	const firstUrl = urlList[0];
	if (urlList.length > 1) {
		btn.innerText = "Download all";
	}
	if(GM_download) {
		// The button stays hidden until everything is set up
		// This is because the possible XMLHttpRequest might take some time before completing
		btn.style.display = "none";
		// Tries to fetch the file extension from the supplied URL
		// This is the simplest method but it does not alway work
		const type = /\.(\w{3,4})\?|\.(\w{3,4})$/;
		if(type.test(firstUrl)) {
			// For some reason, there sometimes 'undefined' in matched groups...
			const ext = type.exec(firstUrl).filter(el => el !== undefined)[1];
			// Excludes web pages that indirectly deliver content
			const invalidExtensions = ["html", "htm", "php", "jsp", "asp"];
			if(!invalidExtensions.includes(ext)) {
				assignClick(btn, urlList, name, ext);
				return btn;
			}
		}
	}
	// If it does not work, we query the resource and get its extension from the filename
	if(GM_xmlhttpRequest) {
		getExtensionThenAssignClick(btn, firstUrl, name, errorCallback);
		return btn;
	}
	// If we arrive here, nothing has worked
	admitFailure(btn, errorCallback);
	return btn;
}
