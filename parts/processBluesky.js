function processBluesky() {
	const href = location.href.split('/');
	const author = href[4].match(/(.+?).bsky.social/)[1];
	const postId = href[6];
	const expoimage = document.querySelector("div[data-expoimage] img");
	if (expoimage) {
		const url = expoimage.src.replace("feed_thumbnail", "feed_fullsize");
		const postBox = getParent(expoimage, 8);
		let name = "";
		if (postBox && postBox.children.length > 0) {
			name = parseName(postBox.children[0].innerText);
		} else {
			name = postId;
		}
		const saBtn = createAndAssign("button", url, name, () => {
			console.warn("Unable to create Save As button.");
		});
		const actions = postBox.nextElementSibling.nextElementSibling.nextElementSibling.children[0];
		actions.insertBefore(saBtn, actions.children[actions.children.length - 1]);
	}
}
