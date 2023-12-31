/** Use a AJAX request in order to get the image extension when it's not in the URL.
  * Usually needs a cross-scripting permission to access the CDN.
  * It also means the button will take more time to appear.
  * https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest
  */
function getExtensionThenAssignClick(btn, url, name, errorCallback) {
	if(forceFailure) {
		admitFailure(btn, errorCallback);
		return;
	}
	GM_xmlhttpRequest({
		method: "head",
		url: url,
		onload: response => {
			const filename = /filename=".*?\.(\w+)"/;
			const mimeType = /content-type: image\/(\w+)/;
			const headers = response.responseHeaders;
			let ext = null;
			if(filename.test(headers)) {
				ext = filename.exec(headers)[1];
			} else if(mimeType.test(headers)) {
				// Legacy handling of DeviantArt before it went full Eclipse
				ext = mimeType.exec(headers)[1];
			}
			if(ext) {
				assignClick(btn, url, name, ext.replace("jpeg", "jpg"));
			} else {
				console.error("Could not determine extension of target.", response);
				if(response.status === 403) {
					btn.addEventListener("click", () => alert("Could not determine extension of target: AJAX request denied by server."));
				} else {
					btn.addEventListener("click", () => alert("Could not determine extension of target, see console for details."));
				}
				admitFailure(btn, errorCallback);
			}
		}
	});
}
