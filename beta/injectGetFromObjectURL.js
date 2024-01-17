/** Adds an URL.getFromObjectURL(<blob:// URI>) method.
  * It returns the original stored object (<Blob> or <MediaSource>) the URI points to or null.
  * from: https://stackoverflow.com/a/66998406
  * Resource to consider: https://github.com/guest271314/MediaFragmentRecorder/
  */
function injectGetFromObjectURL() {
	const dict = {};
	// Overrides URL methods to be able to retrieve the original blobs later on
	const old_create = URL.createObjectURL;
	const old_revoke = URL.revokeObjectURL;
	Object.defineProperty(URL, 'createObjectURL', {
		get: () => storeAndCreate
	});
	Object.defineProperty(URL, 'revokeObjectURL', {
		get: () => forgetAndRevoke
	});
	Object.defineProperty(URL, 'getFromObjectURL', {
		get: () => getBlob
	});

	function storeAndCreate(blob) {
		const url = old_create(blob); // let it throw if it has to
		dict[url] = blob;
		return url
	}

	function forgetAndRevoke(url) {
		old_revoke(url);
		try {
			if(new URL(url).protocol === 'blob:') {
				delete dict[url];
			}
		} catch(e){}
	}

	function getBlob(url) {
		return dict[url] || null;
	}
}
