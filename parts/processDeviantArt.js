function processDeviantArt() {
	let href = location.href;
	let img = document.querySelector("div[data-hook=art_stage] img");
	if(img) {
		afterImage(img, buildButton);
	}
	// DeviantArt is a SPA so we need to detect the change of image
	const observer = new MutationObserver(changes => {
		changes.forEach(change => {
			if (href !== location.href) {
				// URL has changed
				href = location.href;
				// Give some time to stuff to load
				window.setTimeout(() => processArtStage(), 300);
			}
			if(change.addedNodes.length > 0) {
				// There is rarely more than one added node
				for(const node of change.addedNodes) {
					if(node.tagName === "IMG" && node.className && node.className !== "avatar" && !node.dataset.hook) {
						// The actual picture appeared
						processArtStage();
						break;
					}
					if(node.querySelector && node.querySelector("a[data-hook=download_button]")) {
						// A free download button appeared
						processArtStage();
						break;
					}
				}
			}
		});
	});
	observer.observe(document.body, {childList : true, subtree: true});
	
	function afterImage(img, callback) {
		if(img.complete) {
			callback();
		} else {
			// Won't fire if the image is loaded from cache
			img.addEventListener("load", callback);
		}
	}
	
	function processArtStage() {
		const newImg = document.querySelector("div[data-hook=art_stage] img");
		if(newImg && img !== newImg) {
			// Image has changed (or appeared)
			const preexistingStage = img !== null;
			img = newImg;
			afterImage(img, buildButton);
		} else {
			img = null;
		}
	}
	
	async function buildButton() {
		const nameTxt = document.getElementById("artname-txt");
		if(nameTxt) {
			nameTxt.parentNode.removeChild(nameTxt);
		}
		const preBtn = document.getElementById("artname-btn");
		if(preBtn) {
			// Clones the button to remove all previous event listeners
			const newSaveBtn = cloneButton(preBtn);
			await assignClick(newSaveBtn, getArtSource(), getArtName(), createArtNameTextNode);
		} else {
			const favBtn = document.querySelector("button[data-hook=fave_button]");
			const comBtn = document.querySelector("button[data-hook=comment_button]");
			// Comment button is preferred as model to generate the "Save as" button.
			// Otherwise the "Save as" button might replicates the green color of the fave button.
			const refBtn = comBtn || favBtn;
			const refBtnCtn = getParent(refBtn, 3);
			const savBtnCtn = refBtnCtn.cloneNode(true);
			const savBtn = savBtnCtn.querySelector("button");
			savBtn.id = "artname-btn";
			savBtn.dataset.hook = "save_button";
			savBtn.querySelector("svg path").setAttribute("d", disketPathData);
			savBtn.querySelector("span:last-child").innerText = "Save as";
			refBtnCtn.parentNode.appendChild(savBtnCtn);
			await assignClick(savBtn, getArtSource(), getArtName(), createArtNameTextNode);
		}
	}
	
	function getArtSource() {
		const dlBtn = document.querySelector("a[data-hook=download_button]");
		const artImg = document.querySelector("div[data-hook=art_stage] img");
		if(dlBtn) {
			// The download button is only present for large pictures
			return dlBtn.href;
		} else if(artImg) {
			// Attempts to extracts the original picture url from the preview's
			return artImg.src.replace(/\/v1\/fill\/.*?-pre.jpg/, "");
		} else {
			return null;
		}
	}

	function getArtName() {
		// document.title is not correctly updated after a change of picture in the slideshow
		const devMeta = document.querySelector("div[data-hook=deviation_meta]");
		const artist = devMeta.querySelector("[data-hook=user_link]").dataset.username;
		const title = devMeta.querySelector("[data-hook=deviation_title]").innerText;
		return parseName(title + " by " + artist);
	}

	function createArtNameTextNode() {
		// Adds the formatted name to the right of the meta section
		const previousNode = document.querySelector("div#artname-txt");
		if (previousNode) {
			previousNode.innerHTML = getArtName();
		} else {
			const devMeta = document.querySelector("div[data-hook=deviation_meta]");
			const nameTxt = document.createElement("div");
			nameTxt.id = "artname-txt";
			nameTxt.innerHTML = getArtName();
			nameTxt.style.display = "inline-block";
			nameTxt.style.minWidth = "max-content";
			devMeta.parentNode.insertBefore(nameTxt, devMeta);
			selectText(nameTxt);
		}
	}
}
