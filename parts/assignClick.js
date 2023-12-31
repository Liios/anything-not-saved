async function assignClick(btn, urlList, artName, errorCallback) {
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	// Retrieves the targets extensions
	const extList = [];
	for(const i = 0; i < urlList.length; ++i) {
		const url = urlList[i];
		const ext = await detectExtension(url, errorCallback);
		extList[i] = ext;
	}
	btn.addEventListener("click", () => {
		// No rage-clicks
		setBusy();
		// Only one picture to be saved as
		if(urlList.length === 1) {
			const url = urlList[0];
			const ext = extList[0];
			GM_download({
				url: url,
				name: artName + "." + ext,
				saveAs: true,
				onload: unsetBusy,
				ontimeout: () => handleTimeout(),
				onerror: error => handleError(error, ext),
			});
		} else {
			// Batch downloading of multiple pictures
			const requestList = [];
			for(const i = 0; i < urlList.length; ++i) {
				const url = urlList[i];
				const ext = extList[i];
				const request = GM_download({
					url: url,
					name: artName + " - " + (i + 1) + "." + ext,
					saveAs: false,
					ontimeout: () => handleTimeout(),
					onerror: error => handleError(error, ext),
				});
				requestList.push(request);
			}
			Promise.all(requestList).then(unsetBusy);
		}
	});

	function setBusy() {
		btn.disabled = true;
		btn.style.cursor = "wait";
	}

	function unsetBusy() {
		btn.disabled = false;
		btn.style.cursor = "";
	}

	function handleTimeout() {
		alert("The download target has timed out :(");
		unsetBusy();
		errorCallback();
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
		errorCallback();
	}
}
