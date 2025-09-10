function processBluesky() {
	const nameUrlRelation = new Map();
	let lastObservedLocation = location.href;
	const observer = new MutationObserver(changes => {
		changes.forEach(change => {
			if (change.addedNodes.length > 0) {
				for (const node of change.addedNodes) {
					if (!node.querySelectorAll) {
						// text node
						return;
					}
					const expoImages = node.querySelectorAll("div[data-expoimage] img");
					for (const image of expoImages) {
						processNode(image);
					}
				}
			}
			if (lastObservedLocation !== location.href) {
				lastObservedLocation = location.href;
				const expoImages = document.querySelectorAll("div[data-expoimage] img");
				for (const image of expoImages) {
					processNode(image);
				}
			}
		});
	});
	observer.observe(document.body, { childList: true, subtree: true });

	function processNode(image) {
		const frame = getParent(image, 2);
		if (frame.getAttribute("data-testid") === "userBannerImage") {
			return; // Banner, nothing to do
		}
		const post = image.closest("div[role=link]") ?? image.closest("div + div + div");
		const anchors = post.querySelectorAll("a");
		let anchorPieces;
		for (const anchor of anchors) {
			// Any referential URL including the author and post ID will do
			anchorPieces = anchor.href?.match(/\/profile\/(.+?)(?:\.\w+)*\/post\/(\w+)(?:\/.*)*/);
			if (anchorPieces) {
				break;
			}
		}
		const locationPieces = location.href.match(/.+\/profile\/(.+?)(?:\.\w+)*\/post\/(\w+)/);
		let urlPieces;
		if (anchorPieces) {
			// We are looking at a random post in a timeline
			urlPieces = anchorPieces;
		} else if (locationPieces) {
			// If the URL matches, we are looking at a specific post (which doesn't have anchors)
			urlPieces = locationPieces;
		} else {
			// We are looking at a specific post BUT the URL hasn't updated yet
			console.warn("No URL detected.");
			return;
		}
		const author = urlPieces[1];
		const postId = urlPieces[2];
		// Generates a name
		const imageUrl = image.src.replace("feed_thumbnail", "feed_fullsize");
		const imageExt = imageUrl.split("@")[1];
		if (!imageExt) {
			console.warn("No extension detected.");
			return;
		}
		const postText = post.querySelector("[data-word-wrap]");
		const processedText = postText ? processText(postText.innerText) : null;
		let name;
		if (processedText) {
			name = `${author} - ${processedText} [${postId}].${imageExt}`;
		} else {
			name = `${author} - ${postId}.${imageExt}`;
		}
		let preBtn = post.querySelector("#artname-btn");
		if (preBtn) {
			// A button has already been made, we "add" the new picture in it
			const urlArray = nameUrlRelation.get(postId);
			if (urlArray === undefined || urlArray.includes(imageUrl)) {
				return;
			}
			urlArray.push(imageUrl);
			preBtn = cloneButton(preBtn);
			assignClick(preBtn, urlArray, name);
		} else {
			// No Save As button is present, we create a new one
			const saBtn = createAndAssign("button", imageUrl, name, () => {
				console.warn("Unable to create Save As button.");
			});
			insertButton(saBtn, post);
			nameUrlRelation.set(postId, [imageUrl]);
		}
	}

	function processText(text) {
		const shortenedMentions = text.replace(/\n@(.+)(?:\.\w+)*/g, ' @$1');
		// Discards lines that contains a content wanring or only blank spaces
		const lines = shortenedMentions.split("\n").filter(x => !x.match(/[^\w]?CW[^\w]?.+/i) && x.trim().length !== 0);
		if (lines.length > 0) {
			const firstSentence = lines[0].split(/\.|\?|\!/)[0];
			const removedHashtag = firstSentence.replace(/\#\S+\s?/g, "");
			return clean(removedHashtag);
		} else {
			return null;
		}
	}

	function insertButton(saBtn, post) {
		saBtn.style.cssText = "border: none; background: none; color: #6A7F93; cursor: pointer; line-height: 1; border-radius: 20px; padding: 7px;";
		saBtn.addEventListener("mouseenter", event => { event.target.style.background = "#1E2936"; }, false);
		saBtn.addEventListener("mouseleave", event => { event.target.style.background = "none"; }, false);
		const icon = disketSvg();
		icon.style.verticalAlign = "middle";
		saBtn.innerHTML = "";
		saBtn.appendChild(icon);
		const refBtn = post.querySelector("[data-testid=likeBtn]");
		if (!refBtn) {
			console.warn("No reference button detected.");
			return;
		}
		const refCtn = refBtn.parentElement;
		if (refCtn) {
			// Main post
			const saCtn = document.createElement("div");
			saCtn.className = refCtn.className;
			saCtn.style = refCtn.style;
			saCtn.style.cssText = refCtn.style.cssText; // I don't understand why this is necessary...
			saCtn.appendChild(saBtn);
			refCtn.parentElement.appendChild(saCtn);
		} else {
			// Quote post
			const context = document.createElement("span");
			context.innerHTML = "Save quote post";
			context.style.verticalAlign = "middle";
			context.style.marginLeft = "6px";
			saBtn.appendChild(context);
			saBtn.style.marginTop = "6px";
			post.appendChild(saBtn);
		}
	}
}