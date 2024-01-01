// ==UserScript==
// @name		Anything Not Saved
// @namespace	https://openuserjs.org/users/Sauvegarde
// @version 	5.4
// @author		Sauvegarde
// @description	Save every picture you like in one click.
// @match		https://aryion.com/g4/view/*
// @match		https://*.deviantart.com/*
// @match		https://www.furaffinity.net/view/*
// @match		https://www.furaffinity.net/full/*
// @match 		https://www.hentai-foundry.com/pictures/*
// @match		https://inkbunny.net/s/*
// @match		https://inkbunny.net/submissionview.php?id=*
// @match		https://www.weasyl.com/*/submissions/*
// @match 		https://www.newgrounds.com/art/view/*/*
// @connect	 	wixmp.com
// @run-at		document-start
// @grant		GM_xmlhttpRequest
// @grant		GM_download
// @iconURL		https://i.ibb.co/59f9S0g/floppy.png
// @updateURL	https://openuserjs.org/meta/Sauvegarde/Anything_Not_Saved.meta.js
// @downloadURL	https://openuserjs.org/install/Sauvegarde/Anything_Not_Saved.user.js
// @supportURL	https://openuserjs.org/scripts/Sauvegarde/Anything_Not_Saved/issues
// @copyright	2024, Sauvegarde (https://openuserjs.org/users/Sauvegarde)
// @license		GPL-3.0-or-later
// ==/UserScript==

/* `Anything Not Saved` will attempt to create a "Save as" button near artworks in compatible websites.
 * The "Save as" button will query the full size image (if applicable) and open the corresponding prompt.
 * The prompt will supply a filename in the form of "artist - artwork" for convenience.
 * Any character forbidden by Windows (such as slashes) will be replaced (often with dashes) or stripped.
 * If the button cannot be created, it will fallback to a pre-highlighted text node with the proper name.
 *
 * Requisite permissions:
 * * GM_xmlhttpRequest is required for websites that serves content indirectly.
 *     A head request must be sent in order to know the file extension or the "Save as" button won't work.
 *     Case in point: DeviantArt, which uses `wixmp.com` as a CDN.
 * * GM_download is required for "Save as" functionality.
 *     TamperMonkey uses an extension whitelist for download candidates (pictures are covered by default).
 *     You may have to extend it youself if you want to download more exotic files ("docx", "pdf", etc).
 *     Go to Dashboard > Parameters > Downloads and add the extensions you want in the list.
 *
 * This script is developed and tested with the plugin TamperMonkey on Firefox.
 */

/* jshint esversion: 8 */

/** For testing purpose. */
const forceFailure = false;

/** SVG path of a universally recognized save icon 💾 :p */
const disketPathData = "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 "
					 + "7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z";

/** SVG icon element. */
function disketSvg() {
	const ns = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(ns, "svg");
	svg.setAttributeNS(null, "width", "24");
	svg.setAttributeNS(null, "height", "24");
	svg.setAttributeNS(null, "viewBox", "0 0 24 24");
	const path = document.createElementNS(ns, "path");
	path.setAttributeNS(null, "d", disketPathData);
	path.setAttributeNS(null, "style", "fill: currentColor;");
	svg.appendChild(path);
	return svg;
}

/** Generates a correct artwork name in the form of "$artist - $title".
  * Any character forbidden by Windows are replaced or removed
  */
function parseName(name) {
	const author = name.replace(/(^.*) by (.*?$)/g, "$2");
	const picture = name.replace(/(^.*) by (.*?$)/g, "$1");
	let title = author + " - " + picture;
	title = title.replace(/[?.*_~=`"]/g, " ");		// forbidden characters
	title = title.replace(/[\/\\><]/g, "-");		// slashes and stripes
	title = title.replace(/:/g, " - ");				// colon
	title = title.replace(/\-+\s+\-+/g, "-");		// redundant dashes
	title = title.replace(/\s+/g, " ");				// redundant spaces
	title = title.replace(/^\s|\s$/g, "");			// start/end spaces
	title = title.replace(/^\-+\s+|\s+\-+$/g, "");	// start/end dashes
	return title;
}

/** Highlights all the text in the element, ready for a ctrl+c. */
function selectText(element) {
	if(document.body.createTextRange) {
		const range = document.body.createTextRange();
		range.moveToElementText(element);
		range.select();
	}
	else if(window.getSelection) {
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(element);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

/** Gets the nth parent of an element. */
function getParent(el, nth) {
	let parent = el;
	for(let i = 0; i < nth; ++i) {
		parent = parent.parentElement;
	}
	return parent;
}

/** Adds a <style> tag with the rule.
  * Necessary when dealing with pseudo-classes or anything too complicated for JS.
  * https://stackoverflow.com/a/11371599/6355515
  */
function addCssRule(cssRule) {
	const style = document.createElement("style");
	if (style.styleSheet) {
		style.styleSheet.cssText = cssRule;
	} else {
		style.appendChild(document.createTextNode(cssRule));
	}
	document.getElementsByTagName("head")[0].appendChild(style);
}

/** Waits for a set amount of time. */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** Adds the required number of zeroes to keep a constant amount of digits. */
function padWithZeroes(num, max) {
	let strNum = num.toString();
	const paddingLength = max.toString().length;
	while(strNum.length < paddingLength) {
		strNum = '0' + strNum;
	}
	return strNum;
}

/** Creates a generic "Save as" button (or link, if specified).
  * When clicked it will open the "Save as" dialog with the corrected filename.
  * https://www.tampermonkey.net/documentation.php#GM_download
  */
function createSaveAsElement(tagName, urlList, artName, errorCallback) {
	const btn = document.createElement(tagName);
	if(tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = "Save as";
	if (!urlList || !GM.download || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	if (urlList.length > 1) {
		btn.innerText = "Download all";
	}
	// The button stays blurry until all the AJAX requests to get file extensions are resolved
	btn.style.opacity = "0.3";
	assignClick(btn, urlList, artName).then(() => {
		btn.style.opacity = "";
	});
	return btn;
}

/** Assign the "Save as" event uppon button click. */
async function assignClick(btn, urlList, artName, errorCallback) {
	if(forceFailure) {
		admitFailure(btn, errorCallback);
		return;
	}
	if(typeof urlList === "string") {
		urlList = [urlList];
	}
	// Retrieves the targets extensions
	const extList = [];
	const total = urlList.length;
	for(let i = 0; i < total; ++i) {
		const url = urlList[i];
		const ext = await detectExtension(btn, url, errorCallback);
		extList[i] = ext;
	}
	let completed = 0;
	btn.addEventListener("click", async () => {
		// No rage-clicks
		setBusy();
		// Only one picture to be saved as
		if(total === 1) {
			const url = urlList[0];
			const ext = extList[0];
			await GM.download({
				url: url,
				name: artName + "." + ext,
				saveAs: true,
				onload: response => unsetBusy(),
				onerror: error => handleError(error, ext),
				ontimeout: () => handleTimeout()
			});
		} else {
			// Batch downloading of multiple pictures
			const requestList = [];
			btn.innerText = "Download (0/" + total + ")";
			for(let i = 0; i < total; ++i) {
				const url = urlList[i];
				const ext = extList[i];
				const request = GM.download({
					url: url,
					name: artName + " - " + padWithZeroes(i + 1, total) + "." + ext,
					saveAs: false,
					onload: response => completeOne(),
					onerror: error => handleError(error, ext),
					ontimeout: () => handleTimeout()
				});
				requestList.push(request);
			}
			Promise.all(requestList).then(unsetBusy);
		}
	});
	
	function completeOne() {
		completed++;
		btn.innerText = "Download (" + completed + "/" + total + ")";
	}

	function setBusy() {
		btn.disabled = true;
		btn.style.cursor = "wait";
	}

	function unsetBusy() {
		btn.disabled = false;
		btn.style.cursor = "";
		completed = 0;
	}

	function handleError(error, ext) {
		switch(error.error) {
			case "not_enabled":
				alert("GM_download is not enabled.");
				break;
			case "not_permitted":
				alert("GM_download permission has not been granted.");
				break;
			case "not_supported":
				alert("GM_download is not supported by the browser/version.");
				break;
			case "not_succeeded":
				console.error(error);
				alert("GM_download has vulgarly failed. Please retry.");
				break;
			case "not_whitelisted":
				// https://github.com/Tampermonkey/tampermonkey/issues/643
				alert("The requested file extension (" + ext + ") is not whitelisted.\n\n"
					  +"You have to add it manually (see 'Downloads' in Tampermonkey settings).");
				break;
			case "Download canceled by the user":
				// User just clicked "Cancel" on the prompt
				break;
			default:
				console.error(error);
				alert("GM_download has unexpectedly failed with the following error: " + error.error);
				break;
		}
		unsetBusy();
	}
	
	function handleTimeout() {
		alert("The download target has timed out :(");
		unsetBusy();
	}
}

/** Attempts to detect the extension of the download target from the URL.
  * If that fails, uses a AJAX request and parses it in the response.
  * In that case, we need a cross-scripting permission to access the CDN.
  * It also means the button will take more time to appear.
  * https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest
  */
async function detectExtension(btn, url, errorCallback) {
	// Tries to fetch the file extension from the supplied URL
	// This is the simplest method but it does not alway work
	const type = /\.(\w{3,4})\?|\.(\w{3,4})$/;
	if(type.test(url)) {
		// For some reason, there is sometimes 'undefined' in matched groups...
		const ext = type.exec(url).filter(el => el !== undefined)[1];
		// Excludes web pages that indirectly deliver content
		const invalidExtensions = ["html", "htm", "php", "jsp", "asp"];
		if (!invalidExtensions.includes(ext)) {
			// Finished!
			return ext;
		}
	}
	// If it does not work, we send a head query and infer extension from the response
	if(GM.xmlHttpRequest) {
		let ext = null;
		const response = await GM.xmlHttpRequest({
			method: "head",
			url: url,
			onerror: error => {
				if(error.status === 403) {
					// TODO: add referer
					console.error("Cannot determine extension of target: AJAX request denied by server.", error);
				} else {
					console.error("Cannot determine extension of target.", error);
				}
				admitFailure(btn, errorCallback);
			},
			ontimeout: () => {
				console.error("Cannot determine extension of target: AJAX request timed out.");
				admitFailure(btn, errorCallback);
			}
		});
		const headers = response.responseHeaders;
		const filename = /filename=".*?\.(\w+)"/;
		const mimeType = /content-type: image\/(\w+)/;
		if(filename.test(headers)) {
			ext = filename.exec(headers)[1];
		} else if(mimeType.test(headers)) {
			// Legacy handling of DeviantArt before it went full Eclipse
			ext = mimeType.exec(headers)[1];
		} else {
			console.error("Cannot determine extension of target from head response.", response);
			admitFailure(btn, errorCallback);
		}
		if(ext) {
			// Finished!
			return ext.replace("jpeg", "jpg");
		}
	} else {
		console.error("Cannot determine extension of target: no GM_xmlhttpRequest permission.");
	}
	return null;
}

/** Marks the button as failed and execute the text-only fallback. */
function admitFailure(btn, fallback) {
	btn.classList.add("failed");
	if(fallback) {
		fallback();
	}
}

/** Takes it back. */
function removeFailure(btn) {
	btn.classList.remove("failed");
}

/** Indicates the button won't work. */
function isFailed(btn) {
	return btn == null || btn.classList.contains("failed");
}

/** Eka's Portal sometimes requires XMLHttpRequest for text files. */
function processAryion() {
	const gboxes = document.querySelectorAll(".g-box");
	for(let gbox of gboxes) {
		const bar = gbox.querySelector(".g-box-header + .g-box-header span + span");
		if(bar) {
			const name = parseName(document.title.substr(6, document.title.length));
			const noscript = document.querySelector(".item-box noscript");
			let url = null;
			if(noscript) {
				// Creates download buttons from the noscript picture URL
				url = /src='(.*?)'/.exec(noscript.innerText)[1].replace("//", "https://");
			} else {
				// Slower, because it goes the XMLHttpRequest way to get the file extension
				const downloadAnchor = document.querySelectorAll(".func-box .g-box-header.g-corner-all a")[1];
				url = downloadAnchor.href;
			}
			const sabt = createSaveAsElement("a", url, name, () => {
				// Adds the formatted name under the regular title
				const title = document.createElement("div");
				title.innerHTML = name;
				bar.appendChild(title);
				selectText(title);
			});
			const func = document.querySelector(".func-box .g-box-header.g-corner-all");
			const sep = document.createElement("span");
			sep.innerHTML = " | ";
			func.appendChild(sep);
			func.appendChild(sabt);
			return;
		}
	}
}

/** DeviantArt is horrible to deal with from this end too. */
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

/** FurAffinity */
function processFuraffinity() {
	const actions = document.querySelector("#page-submission .actions");
	const betaSection = document.querySelector("#submission_page .submission-sidebar");
	if(actions) {
		// Classic template (no longer maintened)
		const name = parseName(document.title.substr(0, document.title.length - 26));
		for(let i = 0 ; i < actions.childNodes.length ; ++i) {
			if(actions.childNodes[i].textContent.match("Download")) {
				const dlbt = actions.childNodes[i].childNodes[0];
				dlbt.title = name;
				dlbt.innerHTML = name;
				selectText(dlbt);
				const sabt = createSaveAsElement("button", dlbt.href, name, () => {});
				dlbt.parentElement.parentElement.appendChild(sabt);
				break;
			}
		}
	} else if(betaSection) {
		// Modern template
		const name = parseName(document.title.substr(0, document.title.length - 26));
		const side = betaSection.querySelector("section.buttons");
		const sideDownloadLink = side.querySelector("div.download a");
		const sideSaveAsLink = createSaveAsElement("a", sideDownloadLink.href, name, () => {
			// Adds the formatted name as a new meta info
			const nctn = document.createElement("div");
			const ntag = document.createElement("strong");
			const nval = document.createElement("span");
			ntag.innerText = "Name";
			nval.innerText = name;
			nctn.appendChild(ntag);
			nctn.appendChild(document.createTextNode(" "));
			nctn.appendChild(nval);
			const meta = betaSection.querySelector("section.info.text");
			meta.insertBefore(nctn, meta.firstChild);
			selectText(nval);
		});
		// Adjust styling and insert into sidebar
		sideSaveAsLink.href = "#";
		const sideDownload = sideDownloadLink.parentElement;
		sideDownload.style.padding = "0 8px";
		const sideSaveAs = document.createElement("div");
		sideSaveAs.style.borderRight = "none";
		sideSaveAs.appendChild(sideSaveAsLink);
		sideDownload.insertAdjacentElement("afterend", sideSaveAs);
		// Insert a second button into picture bottom bar
		const bottom = document.querySelector(".favorite-nav");
		const bottomDownloadLink = Array.from(bottom.children).find(a => a.innerHTML === "Download");
		const bottomSaveAsLink = createSaveAsElement("a", sideDownloadLink.href, name, () => {});
		bottomSaveAsLink.className += (" " + bottomDownloadLink.className);
		bottomSaveAsLink.style.marginLeft = "4px"; // simulates a fucking blank space
		bottomDownloadLink.insertAdjacentElement("afterend", bottomSaveAsLink);
	}
}

/** Hentai Foundry */
function processHentaiFoundry() {
	const boxFooter = document.querySelector("#picBox .boxfooter");
	if(boxFooter) {
		const name = parseName(document.title.substr(0, document.title.length - 17));
		const yt0 = boxFooter.querySelector("yt0"); // broken thumb
		const yt1 = boxFooter.querySelector("yt1"); // favorite picture
		const img = document.querySelector(".boxbody img.center");
		const url = img.onclick ? "https:" + /src='(.*?)'/.exec(img.onclick.toString())[1] : img.src;
		const sabt = createSaveAsElement("a", url, name, () => {
			// Replace the picture title with the formatted name
			const boxTitle = document.querySelector("#descriptionBox .boxheader .boxtitle");
			boxTitle.innerHTML = name;
			selectText(boxTitle);
		});
		sabt.classList.add("linkButton");
		sabt.classList.add("picButton");
		// HF uses font-awesome which is convenient
		const icon = document.createElement("i");
		icon.className = "fa fa-floppy-o";
		sabt.innerHTML = "";
		sabt.appendChild(icon);
		const text = document.createElement("span");
		text.innerHTML = "&nbsp;SAVE AS";
		sabt.appendChild(text);
		boxFooter.insertBefore(sabt, boxFooter.firstChild);
	}
}

/** InkBunny */
function processInkbunny() {
	const pictop = document.querySelector("#pictop");
	if(pictop) {
		const name = parseName(document.title.substr(0, document.title.length - 49));
		const sctn = document.querySelector("#size_container");
		const downloadLink = sctn.querySelector("div+a");
		let url;
		if (downloadLink) {
			url = downloadLink.href;
		} else {
			const img = document.querySelector("img#magicbox");
			const picLink = img.parentElement;
			url = picLink.href;
		}
		const sabt = createSaveAsElement("a", url, name, () => {
			// Replace the picture title with the formatted name
			const h1 = pictop.querySelector("h1");
			h1.innerHTML = name;
			selectText(h1);
		});
		const icon = disketSvg();
		icon.style = "height: 14px; vertical-align: text-bottom;";
		sabt.insertBefore(icon, sabt.firstChild);
		sabt.style = "margin-left: 24px; cursor: pointer;";
		sctn.appendChild(sabt);
	}
}

/** Weasyl */
function processWeasyl() {
	const name = parseName(document.querySelector("h1#detail-title").innerText);
	const bar = document.querySelector("ul#detail-actions");
	const dlbt = bar.querySelector("li a[download]");
	const sabt = createSaveAsElement("a", dlbt.href, name, () => {
		// Adds the formatted name under the action bar, above the description
		const nameTxt = document.createElement("div");
		nameTxt.innerHTML = name;
		const detailContent = document.querySelector("#detail-content");
		detailContent.insertBefore(nameTxt, detailContent.firstChild);
		selectText(nameTxt);
	});
	const icon = disketSvg();
	icon.style = "vertical-align: middle; margin-right: 4px;";
	sabt.insertBefore(icon, sabt.firstChild);
	const li = document.createElement("li");
	li.appendChild(sabt);
	bar.insertBefore(li, dlbt.parentElement.nextSibling);
}

/** Newgrounds */
function processNewgrounds() {
	const name = parseName(document.title.substr(0, document.title.length - 14));
	const nav = document.querySelector("#gallery-nav");
	let urlList = [];
	if (nav) {
		// fuck it...
		const dlbt = document.createElement("button");
		dlbt.type = "button";
		dlbt.id = "artname-btn";
		dlbt.innerText = "Download all";
		dlbt.onclick = () => downloadSlideshow(nav, dlbt);
		addButton(dlbt);
	} else {
		const artList = document.querySelectorAll(".pod-body a[data-action=view-image]");
		urlList = [...artList].map(a => a.href);
		const sabt = createSaveAsElement("button", urlList, name, () => {
			console.warn("Unable to create Save As button.");
		});
		addButton(sabt);
	}
	
	async function downloadSlideshow(nav, dlbt) {
		dlbt.disabled = true;
		dlbt.style.cursor = "wait";
		const thumbs = [...nav.querySelectorAll("a.art-gallery-thumb")];
		const total = thumbs.length;
		dlbt.innerText = "Download (0/" + total + ")";
		let url = null;
		for (let i = 0; i < total; ++i) {
			const thumb = thumbs[i];
			thumb.click();
			let nextUrl = null;
			do {
				await sleep(200);
				nextUrl = document.querySelector(".pod-body a[data-action=view-image]").href;
			} while(url === nextUrl);
			url = nextUrl;
			const ext = await detectExtension(dlbt, url);
			await GM.download({
				url: url,
				name: name + " - " + padWithZeroes(i + 1, total) + "." + ext,
				saveAs: false
			});
			dlbt.innerText = "Download (" + (i + 1) + "/" + total + ")";
		}
		dlbt.disabled = false;
		dlbt.style.cursor = "";
	}
	
	function addButton(bt) {
		const icon = disketSvg();
		icon.style = "vertical-align: middle; margin: -2px 4px 0 0;";
		bt.insertBefore(icon, bt.firstChild);
		const span = document.createElement("span");
		span.appendChild(bt);
		const bar = document.querySelectorAll(".pod-head")[0];
		bar.appendChild(span);
	}
}

window.addEventListener("load", function() {
	// Button becomes red if it doesn't work
	addCssRule("#artname-btn.failed {color: red !important;}");
	// URL includes filtering
	switch(location.host) {
		case "aryion.com":
			processAryion();
			break;
		case "www.deviantart.com":
			processDeviantArt();
			break;
		case "www.furaffinity.net":
			processFuraffinity();
			break;
		case "www.hentai-foundry.com":
			processHentaiFoundry();
			break;
		case "inkbunny.net":
			processInkbunny();
			break;
		case "www.weasyl.com":
			processWeasyl();
			break;
		case "www.newgrounds.com":
			processNewgrounds();
			break;
		default:
			console.error("URL include / host filtering mismatch.");
			break;
	}
});

/* Changelog:
 ** 5.4: handled Newgrounds slideshow, improved DA, refactored all the asynchronous sub-processes
 ** 5.3: fixed Newgrounds (+improved integration) and replaced @include with @match
 ** 5.2: fixed dumb issue ("data-hook") with DA
 ** 5.1.1: fixed InkBunny image catching when download link is missing
 ** 5.1
 *  added another "Save as" button at picture bottom on FA
 *  impoved integration with FA
 *  fixed DA
 *  refactored createSaveAsButton() to be clearer
 ** 5.0
 *	added support for Weasyl
 *  improved integration with InkBunny
 *	corrected DeviantArt process yet again
 *	changed name from "Artname" to "Anything Not Saved" because it rocks
 *	changed script icon for something more adequate
 *	added in-script documentation
 *	removed CSS spinner in favor of simpler cursor change over the button
 *	removed options: now the text node is properly used as a fallback mechanism
 *	added a `forceFailure` boolean to test such fallback
 ** 4.0
 *	added support for DeviantArt Eclipse
 *	improved the AJAX system by large
 *	added some error handling
 *	added better graphic integration of the button in websites
 *	made the `addArtName` functionality optional
 */
