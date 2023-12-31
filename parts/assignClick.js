function assignClick(btn, urlList, artName) {
	let keepGoing = true;
	btn.addEventListener("click", () => triggerAction());
	// The button is revealed now that it is finished
	if(urlList && ext) {
		btn.style.display = "";
	}

	function triggerAction() {
		// No rage-clicks
		setBusy();
		// Only one picture to be saved as
		let oneUrl = null;
		if(typeof urlList === "string") {
			oneUrl = urlList;
		} else if (urlList.length < 2) {
			oneUrl = urlList[0];
		}
		if(oneUrl) {
			GM_download({
				url: oneUrl,
				name: artName + "." + ext,
				saveAs: true,
				onload: unsetBusy,
				ontimeout: () => handleTimeout(),
				onerror: error => handleError(error, ext),
			});
		} else {
			// Batch downloading of multiple pictures
			recursiveDownload(0);
		}
	}

	function recursiveDownload(i) {
		const goDeeper = i < urlList.length && keepGoing;
		if (!goDeeper) {
			unsetBusy();
			return;
		}
		const url = urlList[i];
		GM_download({
			url: url,
			name: artName + " - " + (i + 1) + "." + ext,
			saveAs: false,
			onload: () => recursiveDownload(i + 1),
			ontimeout: () => handleTimeout(),
			onerror: error => handleError(error, ext),
		});
	}

	function setBusy() {
		btn.disabled = true;
		btn.style.cursor = "wait";
		keepGoing = true;
	}

	function unsetBusy() {
		btn.disabled = false;
		btn.style.cursor = "";
		keepGoing = false;
	}

	function handleTimeout() {
		alert("The download target has timed out :(");
		unsetBusy();
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
}
