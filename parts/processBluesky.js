function processBluesky() {
	const processedUrls = [];
	const observer = new MutationObserver(changes => {
		changes.forEach(change => {
			if (change.addedNodes.length > 0) {
				for (const node of change.addedNodes) {
					const expoimage = node.querySelector("div[data-expoimage] img");
					if (expoimage && !processedUrls.includes(location.href)) {
						processedUrls.push(location.href);
						processNode(expoimage);
						break;
					}
				}
			}
		});
	});
	observer.observe(document.body, { childList: true, subtree: true });

	function processNode(expoimage) {
		const href = location.href.split('/');
		const author = href[4].match(/(.+?).bsky.social/)[1];
		const postId = href[6];
		const url = expoimage.src.replace("feed_thumbnail", "feed_fullsize");
		const ext = url.split("@")[1];
		const postBox = getParent(expoimage, 8);
		let name;
		if (postBox && postBox.children.length > 0) {
			name = `${author} - ${clean(postBox.children[0].innerText)} [${postId}].${ext}`;
		} else {
			name = `${author} - ${postId}.${ext}`;
		}
		const saBtn = createAndAssign("button", url, name, () => {
			console.warn("Unable to create Save As button.");
		});
		const actions = postBox.nextElementSibling.nextElementSibling.nextElementSibling.children[0];
		actions.insertBefore(saBtn, actions.children[actions.children.length - 1]);
	}
}
