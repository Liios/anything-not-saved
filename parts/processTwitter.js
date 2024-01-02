function processTwitter() {
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
		switch (node.tagName) {
			case "IMG":
				if (node.alt === "Image") {
					const parentAnchor = node.closest("a");
					if (parentAnchor) {
						processTweet(parentAnchor, node);
					}
				}
				break;
			case "DIV":
				if (node.querySelector("video")) {
					const anchor = findTweetAnchor(node);
					const srcElem = node.querySelector("video");
					processTweet(anchor, srcElem);
				}
				break;
		}
	}

	function processTweet(anchor, srcElem) {
		const name = parseName(anchor.href);
		const url = parseUrl(srcElem.src);
		const sabt = createSaveAsElement("button", url, name, () => {
			console.warn("Unable to create Save As button.");
		});
		addButton(sabt, anchor);
	}

	function findTweetAnchor(node) {
		const article = node.closest("article");
		const anchors = article.querySelectorAll("a");
		for (const anchor of anchors) {
			if (/\/status\/\d+/.test(anchor.href)) {
				return anchor;
			}
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
		return src.replace(/&name=.*/, "");
	}

	function addButton(btn, anchor) {
		const article = anchor.closest("article");
		const share = article.querySelector("[aria-label='Share post']");
		const bar = share.closest("[role=group]");
		btn.style.maxHeight = "30px";
		btn.style.margin = "auto 10px";
		bar.appendChild(btn);
	}
}
