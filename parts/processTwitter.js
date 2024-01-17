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
			// Cannot process
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
		const bar = article.querySelector("[role=group]");
		btn.style.maxHeight = "30px";
		btn.style.margin = "auto 10px";
		btn.style.cursor = "pointer";
		bar.appendChild(btn);
	}
}
