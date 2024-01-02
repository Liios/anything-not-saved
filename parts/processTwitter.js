function processTwitter() {
	const tweets = document.querySelectorAll("article");
	for (let tweet of tweets) {
		const href = [...tweet.querySelectorAll("[data-testid=User-Name] a")].at(-1).href;
		const elem = href.split("/");
		const user = elem[3];
		const mark = elem[5];
		const name = user + " - " + mark;
		const video = tweet.querySelector("video");
		if (video) {
			const sabt = createSaveAsElement("button", video.src, name, () => {
				console.warn("Unable to create Save As button.");
			});
			addButton(sabt, tweet);
		}
	}
	
	function addButton(btn, tweet) {
		const share = tweet.querySelector("[aria-label='Share post']");
		const bar = getParent(share, 3);
		bar.appendChild(btn);
	}
}
