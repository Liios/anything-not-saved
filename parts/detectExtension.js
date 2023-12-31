async function detectExtension(url, errorCallback) {
	// Tries to fetch the file extension from the supplied URL
	// This is the simplest method but it does not alway work
	const type = /\.(\w{3,4})\?|\.(\w{3,4})$/;
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
	if(GM_xmlhttpRequest) {
		const response = await GM_xmlhttpRequest({
			method: "head",
			url: url
		});
		const headers = response.responseHeaders;
		const filename = /filename=".*?\.(\w+)"/;
		const mimeType = /content-type: image\/(\w+)/;
		let ext = null;
		if(filename.test(headers)) {
			ext = filename.exec(headers)[1];
		} else if(mimeType.test(headers)) {
			// Legacy handling of DeviantArt before it went full Eclipse
			ext = mimeType.exec(headers)[1];
		}
		if(ext) {
			// Finished!
			return ext.replace("jpeg", "jpg");
		}
		// If we are here then nothing worked
		if(response.status === 403) {
			console.error("Cannot determine extension of target: AJAX request denied by server.", response);
		} else {
			console.error("Cannot determine extension of target.");
		}
	} else {
		console.error("Cannot determine extension of target: no GM_xmlhttpRequest permission.");
	}
	errorCallback();
	return null;
}
