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
	let completed = 0;
	btn.addEventListener("click", async () => {
		// No rage-clicks
		setBusy();
		// Only one picture to be saved as
		if(urlList.length === 1) {
			const url = urlList[0];
			const ext = extList[0];
			await GM.download({
				url: url,
				name: artName + "." + ext,
				saveAs: true,
				onload: response => unsetBusy(),
				onerror: error => handleError(error, ext),
				ontimeout: () => handleTimeout()
			});
		} else {
			// Batch downloading of multiple pictures
			const requestList = [];
			btn.innerText = "Download (0/" + urlList.length + ")";
			for(let i = 0; i < urlList.length; ++i) {
				const url = urlList[i];
				const ext = extList[i];
				const request = GM.download({
					url: url,
					name: artName + " - " + (i + 1) + "." + ext,
					saveAs: false,
					onload: response => completeOne(),
					onerror: error => handleError(error, ext),
					ontimeout: () => handleTimeout()
				});
				requestList.push(request);
			}
			Promise.all(requestList).then(unsetBusy);
		}
	});
	
	function completeOne() {
		completed++;
		btn.innerText = "Download (" + completed + "/" + urlList.length + ")";
	}

	function setBusy() {
		btn.disabled = true;
		btn.style.cursor = "wait";
	}

	function unsetBusy() {
		btn.disabled = false;
		btn.style.cursor = "";
		completed = 0;
	}

	function handleError(error, ext) {
		switch(error.error) {
			case "not_enabled":
				alert("GM_download is not enabled.");
				break;
			case "not_permitted":
				alert("GM_download permission has not been granted.");
				break;
			case "not_supported":
				alert("GM_download is not supported by the browser/version.");
				break;
			case "not_succeeded":
				console.error(error);
				alert("GM_download has vulgarly failed. Please retry.");
				break;
			case "not_whitelisted":
				// https://github.com/Tampermonkey/tampermonkey/issues/643
				alert("The requested file extension (" + ext + ") is not whitelisted.\n\n"
					  +"You have to add it manually (see 'Downloads' in Tampermonkey settings).");
				break;
			case "Download canceled by the user":
				// User just clicked "Cancel" on the prompt
				break;
			default:
				console.error(error);
				alert("GM_download has unexpectedly failed with the following error: " + error.error);
				break;
		}
		unsetBusy();
	}
	
	function handleTimeout() {
		alert("The download target has timed out :(");
		unsetBusy();
	}
}
