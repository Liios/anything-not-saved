async function detectExtension(url) {
	// Tries to fetch the file extension from the supplied URL
	// This is the simplest method but it does not alway work
	const type = /\.(\w{3,4})\?|\.(\w{3,4})$/;
	if(type.test(url)) {
		// For some reason, there is sometimes 'undefined' in matched groups...
		const ext = type.exec(firstUrl).filter(el => el !== undefined)[1];
		// Excludes web pages that indirectly deliver content
		const invalidExtensions = ["html", "htm", "php", "jsp", "asp"];
		if (invalidExtensions.includes(ext)) {
			return null;
		}
		return ext;
	}
	// If it does not work, we send a head query and infer extension from the response
	const response = await GM_xmlhttpRequest({ method: "head", url });
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
		return ext.replace("jpeg", "jpg");
	}
	if(response.status === 403) {
		console.error("Could not determine extension of target: AJAX request denied by server.", response);
	} else {
		console.error("Could not determine extension of target."));
	}
	return null;
}
