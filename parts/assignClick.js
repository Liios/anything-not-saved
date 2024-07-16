async function assignClick(btn, urlList, artName, errorCallback) {
	if (forceFailure) {
		admitFailure(btn, errorCallback);
		return;
	}
	if (typeof urlList === "string") {
		urlList = [urlList];
	}
	// Retrieves the targets extensions
	const extList = [];
	const nameWithExt = /(.+)\.(\w{3,4})$/;
	if (nameWithExt.test(artName)) {
		// The name provided already has the file extension
		const twoPartsName = artName.match(nameWithExt);
		artName = twoPartsName[1];
		// We assume every file in the sequence will have the same extension
		urlList.forEach(() => extList.push(twoPartsName[2]));
	} else {
		// The extensions must be derived from the URL
		for (let i = 0; i < urlList.length; ++i) {
			const url = urlList[i];
			const ext = await detectExtension(btn, url, errorCallback);
			extList[i] = ext;
		}
	}
	btn.addEventListener("click", () => saveAs(btn, urlList, extList, artName));
}
