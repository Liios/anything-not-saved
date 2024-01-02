async function detectExtension(btn, url, errorCallback) {
	// Tries to fetch the file extension from the supplied URL
	// This is the simplest method but it does not alway work
	const type = /\.(\w{3,4})\?|\.(\w{3,4})$|format=(\w{3,4})$/;
	if(type.test(url)) {
		// For some reason, there is sometimes 'undefined' in matched groups...
		const ext = type.exec(url).filter(el => el !== undefined)[1];
		// Excludes web pages that indirectly deliver content
		const invalidExtensions = ["html", "htm", "php", "jsp", "asp"];
		if (!invalidExtensions.includes(ext)) {
			// Finished!
			return ext;
		}
	}
	// If it does not work, we send a head query and infer extension from the response
	if(GM.xmlHttpRequest) {
		let ext = null;
		const response = await GM.xmlHttpRequest({
			method: "head",
			url: url,
			onerror: error => {
				if(error.status === 403) {
					// TODO: add referer
					console.error("Cannot determine extension of target: head request denied.", error);
				} else {
					console.error("Cannot determine extension of target.", error);
				}
				admitFailure(btn, errorCallback);
			},
			ontimeout: () => {
				console.error("Cannot determine extension of target: head request timed out.");
				admitFailure(btn, errorCallback);
			}
		});
		const headers = response.responseHeaders;
		const filename = /filename=".*?\.(\w+)"/;
		const mimeType = /content-type: image\/(\w+)/;
		if(filename.test(headers)) {
			ext = filename.exec(headers)[1];
		} else if(mimeType.test(headers)) {
			// Legacy handling of DeviantArt before it went full Eclipse
			ext = mimeType.exec(headers)[1];
		} else {
			console.error("Cannot determine extension of target from head response.", response);
			admitFailure(btn, errorCallback);
		}
		if(ext) {
			// Finished!
			return ext.replace("jpeg", "jpg");
		}
	} else {
		console.error("Cannot determine extension of target: no GM_xmlhttpRequest permission.");
	}
	return null;
}
