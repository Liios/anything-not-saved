function processTwitter() {
	const nameUrlRelation = new Map();
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
		const article = anchor.closest("article");
		let preBtn = article.querySelector("#artname-btn");
		if (preBtn) {
			const urlArray = nameUrlRelation.get(name);
			urlArray.push(url);
			// Reassign with new set of URL
			preBtn = cloneButton(preBtn);
			assignClick(preBtn, urlArray, name);
			preBtn.innerText = "Download all";
		} else {
			const saBtn = createSaveAsElement("button", url, name, () => {
				console.warn("Unable to create Save As button.");
			});
			addButton(saBtn, article);
			nameUrlRelation.set(name, [url]);
		}
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
		return src.replace(/&name=\w+/, "&name=4096x4096");
	}

	function addButton(btn, article) {
		const share = article.querySelector("[aria-label='Share post']");
		const bar = share.closest("[role=group]");
		btn.style.maxHeight = "30px";
		btn.style.margin = "auto 10px";
		bar.appendChild(btn);
	}
}
