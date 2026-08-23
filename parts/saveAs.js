function saveAs(event, btn, pairList, artName, onCompletionCallback) {
	event.preventDefault();
	let completed = 0;
	const total = pairList.length;
	// No rage-clicks
	setBusy();
	// Only one picture to be saved as
	if (total === 1) {
		const url = pairList[0].url;
		const ext = pairList[0].ext;
		const name = artName + "." + ext;
		GM.download({
			url: url,
			name: name,
			saveAs: true,
			onerror: error => handleError(error, url, name, ext),
			ontimeout: () => handleTimeout(),
		}).then(completeAll);
	} else {
		// Batch downloading of multiple pictures
		const requestList = [];
		btn.innerText = "Download (0/" + total + ")";
		for (let i = 0; i < total; ++i) {
			const url = pairList[i].url;
			const ext = pairList[i].ext;
			const name = artName + " - " + padWithZeroes(i + 1, total) + "." + ext;
			const request = GM.download({
				url: url,
				name: name,
				saveAs: false,
				onload: response => completeOne(),
				onerror: error => handleError(error, url, name, ext),
				ontimeout: () => handleTimeout(),
			});
			requestList.push(request);
		}
		Promise.all(requestList).then(completeAll);
	}

	function completeOne() {
		completed++;
		btn.innerText = "Download (" + completed + "/" + total + ")";
	}

	function completeAll() {
		if (onCompletionCallback) {
			onCompletionCallback();
		}
		unsetBusy();
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

	function handleError(error, url, name, ext) {
		switch (error.error) {
			case "not_enabled":
				alert("GM.download is not enabled.");
				break;
			case "not_permitted":
				alert("GM.download permission has not been granted.");
				break;
			case "not_supported":
				alert("GM.download is not supported by the browser/version.");
				break;
			case "not_succeeded":
				console.error(error);
				alert("GM.download has vulgarly failed. Please retry.");
				break;
			case "not_whitelisted":
				// https://github.com/Tampermonkey/tampermonkey/issues/643
				alert(
					"The requested file extension (" +
						ext +
						") is not whitelisted.\n\n" +
						"You have to add it manually (see 'Downloads' in Tampermonkey settings)."
				);
				break;
			case "Download canceled by the user":
				// User just clicked "Cancel" on the prompt
				break;
			case "xhr_failed":
				// Probably Cloudflare CDN
				console.error(error);
				fallback(url, name);
				break;
			default:
				console.error(error);
				alert("GM.download has unexpectedly failed with the following error: " + error.error);
				break;
		}
		unsetBusy();
	}

	function handleTimeout() {
		alert("The download target has timed out :(");
		unsetBusy();
	}

	function fallback(url, name) {
		const a = document.createElement("a");
		a.href = `${url}?name=${name}`;
		a.target = "_blank";
		a.rel = "noopener";
		a.click();
	}
}
