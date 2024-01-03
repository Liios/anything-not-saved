function processTwitter() {
	const nameUrlRelation = new Map();
	// Allow for retrieving of MediaSource from blob url
	injectGetFromObjectURL();
	const observer = new MutationObserver(changes => {
		changes.forEach(change => {
			if (change.addedNodes.length > 0) {
				for (const node of change.addedNodes) {
					processNode(node);
				}
			}
		});
	});
	observer.observe(document.body, {childList : true, subtree: true});

	function processNode(node) {
		const testAnchor = anchor => /\/status\/\d+/.test(anchor.href);
		switch (node.tagName) {
			case "IMG":
				if (node.src.startsWith("https://pbs.twimg.com/media/")) {
					const parentAnchor = node.closest("a");
					if (parentAnchor) {
						processTweet(parentAnchor, node);
					}
				}
				break;
			case "DIV":
				if (node.querySelector("video")) {
					const article = node.closest("article");
					const anchors = article.querySelectorAll("a");
					for (const anchor of anchors) {
						if (testAnchor(anchor)) {
							processTweet(anchor, node.querySelector("video"));
							break;
						}
					}
				}
				break;
		}
	}

	function processTweet(anchor, srcElem) {
		const name = parseName(anchor.href);
		const url = parseUrl(srcElem.src);
		const article = anchor.closest("article");
		if (!article) {
			// Not a tweet
			return;
		}
		if (url.startsWith("blob")) {
			// Special blob button
			const btn = createButton();
			btn.addEventListener("click", async () => {
				// Try to rip directly from the media source
				//recDownload(btn, name, srcElem);
				// Fallback solution
				apiDownload(btn, name);
			});
			addButton(btn, article);
			return;
		}
		let preBtn = article.querySelector("#artname-btn");
		if (preBtn) {
			const urlArray = nameUrlRelation.get(name);
			if (urlArray === undefined) {
				// miniature of a quote tweet, skip
				return;
			}
			urlArray.push(url);
			// Reassign with new set of URL
			preBtn = cloneButton(preBtn);
			assignClick(preBtn, urlArray, name);
			preBtn.innerText = "Download all";
		} else {
			const saBtn = createAndAssign("button", url, name, () => {
				console.warn("Unable to create Save As button.");
			});
			addButton(saBtn, article);
			nameUrlRelation.set(name, [url]);
		}
	}

	function parseName(href) {
		// https://twitter.com/{user}/status/{mark}
		const elem = href.split("/");
		const user = elem[3];
		const mark = elem[5];
		return user + " - " + mark;
	}

	function parseUrl(src) {
		// https://pbs.twimg.com/media/{internal-id}?format=png&name=small
		return src.replace(/&name=\w+/, "&name=4096x4096");
	}

	function addButton(btn, article) {
		const share = article.querySelector("[aria-label='Share post']");
		const bar = share.closest("[role=group]");
		btn.style.maxHeight = "30px";
		btn.style.margin = "auto 10px";
		bar.appendChild(btn);
	}

	async function apiDownload(btn, name) {
		const id = name.split(" - ")[1];
		const url = await getMediaUrlFromTweetId(id);
		if (url) {
			saveAs(btn, url, "mp4", name);
		} else {
			admitFailure(btn);
		}
	}

	async function recDownload(btn, name, video) {
		const mediaSource = URL.getFromObjectURL(video.src);
		// https://github.com/gildas-lormeau/SingleFile/issues/565
		// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element
		const stream = video.captureStream?.exec() ?? video.mozCaptureStream();
		const mediaRecorder = new MediaRecorder(stream);
		const videoData = [];
		mediaRecorder.ondataavailable = e => videoData.push(e.data);
		video.pause();
		video.currentTime = 0;
		video.playbackRate = 60.0;
		await video.play();
		mediaRecorder.start();
		video.addEventListener("ended", () => {
			const url = URL.createObjectURL(new Blob(videoData));
			saveAs(btn, url, "mp4", name);
		});
		// https://developer.mozilla.org/en-US/docs/Web/API/SourceBufferList
		const sourceBuffers = mediaSource.sourceBuffers;
		sourceBuffers.addEventListener("addsourcebuffer", () => {
			const buff = sourceBuffers[0];
			buff.addEventListener("updateend", () => {
				// console.log(buff);
			});
		});
	}
}
