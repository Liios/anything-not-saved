function processDeviantArt() {
	let href = location.href;
	let img = document.querySelector("div[data-hook=art_stage] img");
	if(img) {
		create();
	}
	// DeviantArt is a SPA so we need to detect the change of image
	const observer = new MutationObserver(changes => {
		changes.forEach(change => {
			if (href !== location.href) {
				// URL has changed
				href = location.href;
				// Give some time to stuff to load
				window.setTimeout(() => {
					const newImg = document.querySelector("div[data-hook=art_stage] img");
					if(newImg && img !== newImg) {
						// Image has changed (or appeared)
						const preexistingStage = img !== null;
						img = newImg;
						if(preexistingStage) {
							// Umage has been swapped with another
							afterImage(img, refresh);
						} else {
							// Image is loaded after navigation from a gallery
							afterImage(img, create);
						}
					} else {
						img = null;
					}
				}, 100);
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

	async function create() {
		const actBar = document.querySelector("div[data-hook=action_bar]");
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

	async function refresh() {
		const nameTxt = document.getElementById("artname-txt");
		const saveBtn = document.getElementById("artname-btn");
		if(nameTxt) {
			nameTxt.parentNode.removeChild(nameTxt);
		}
		if(saveBtn) {
			// Clones the button to remove all previous event listeners
			const newSaveBtn = saveBtn.cloneNode(true);
			removeFailure(newSaveBtn);
			saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
			await assignClick(newSaveBtn, getArtSource(), getArtName(), createArtNameTextNode);
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
			return img.src.replace(/\/v1\/fill\/.*?-pre.jpg/, "");
		} else {
			return null;
		}
	}

	function getArtName() {
		return parseName(document.title.substr(0, document.title.length - 14));
	}

	function createArtNameTextNode() {
		// Adds the formatted name to the right of the meta section
		const devMeta = document.querySelector("div[data-hook=deviation_meta]");
		const nameTxt = document.createElement("div");
		nameTxt.id = "artname-txt";
		nameTxt.innerHTML = getArtName();
		nameTxt.style.display = "inline-block";
		nameTxt.style.minWidth = "max-content";
		devMeta.appendChild(nameTxt);
		selectText(nameTxt);
	}
}
