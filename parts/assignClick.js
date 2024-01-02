async function assignClick(btn, urlList, artName, errorCallback) {
	if(forceFailure) {
		admitFailure(btn, errorCallback);
		return;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	// Retrieves the targets extensions
	const extList = [];
	for(let i = 0; i < urlList.length; ++i) {
		const url = urlList[i];
		const ext = await detectExtension(btn, url, errorCallback);
		extList[i] = ext;
	}
	btn.addEventListener("click", () => saveAs(btn, urlList, extList, artName));
}
