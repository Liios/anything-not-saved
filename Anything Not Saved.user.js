// ==UserScript==
// @name		Anything Not Saved
// @namespace	https://openuserjs.org/users/Sauvegarde
// @version 	5.8
// @author		Sauvegarde
// @description	Save every picture you like in one click.
// @match		https://aryion.com/g4/view/*
// @match		https://www.furaffinity.net/view/*
// @match		https://www.furaffinity.net/full/*
// @match		https://www.hentai-foundry.com/pictures/*
// @match		https://inkbunny.net/s/*
// @match		https://inkbunny.net/submissionview.php?id=*
// @match		https://www.weasyl.com/*/submissions/*
// @match		https://www.newgrounds.com/art/view/*/*
// @match		https://twitter.com/*
// @match		https://x.com/*
// @match       https://bsky.app/*
// @match		https://subscribestar.adult/*
// @connect	 	wixmp.com
// @connect		twitter-video-download.com
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
 *     You may have to extend it yourself if you want to download more exotic files ("docx", "pdf", etc).
 *     Go to Dashboard > Parameters > Downloads and add the extensions you want in the list.
 *
 * This script is developed and tested with the plugin TamperMonkey on Firefox.
 */

/* jshint esversion: 11 */

/** For testing purpose. */
const forceFailure = false;

/** SVG path of a universally recognized save icon 💾 :p */
const disketPathData =
	"M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 " +
	"7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z";

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

/**
 * Generates a correct artwork name in the form of "$artist - $title".
 */
function parseName(name) {
	const author = name.replace(/(^.*) by (.*?$)/g, "$2");
	const picture = name.replace(/(^.*) by (.*?$)/g, "$1");
	return clean(author + " - " + picture);
}

/**
 * Replace or remove any character forbidden by Windows.
 */
function clean(name) {
	name = name.replace(/[?.*_~=`"]/g, " "); // forbidden characters
	name = name.replace(/[\/\\><]/g, "-"); // slashes and stripes
	name = name.replace(/:/g, " - "); // colon
	name = name.replace(/\-+\s+\-+/g, "-"); // redundant dashes
	name = name.replace(/\s+/g, " "); // redundant spaces
	name = name.replace(/^\s|\s$/g, ""); // start/end spaces
	name = name.replace(/^\-+\s+|\s+\-+$/g, ""); // start/end dashes
	return name;
}

/** Highlights all the text in the element, ready for a ctrl+c. */
function selectText(element) {
	if (document.body.createTextRange) {
		const range = document.body.createTextRange();
		range.moveToElementText(element);
		range.select();
	} else if (window.getSelection) {
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
	for (let i = 0; i < nth; ++i) {
		if (!parent) {
			return null;
		}
		parent = parent.parentElement;
	}
	return parent;
}

/**
 * Adds a <style> tag with the rule.
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
	while (strNum.length < paddingLength) {
		strNum = "0" + strNum;
	}
	return strNum;
}

/** Clones and replace the button to remove all previous event listeners. */
function cloneButton(saveBtn) {
	const newSaveBtn = saveBtn.cloneNode(true);
	removeFailure(newSaveBtn);
	saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
	return newSaveBtn;
}

/** Creates a generic "Save as" HTML element with an id and a label. */
function createButton(tagName, text) {
	tagName = tagName ?? "button";
	const btn = document.createElement(tagName);
	if (tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = text ?? "Save as";
	return btn;
}

/**
 * Create a button which opens the "Save as" dialog with the corrected filename.
 * https://www.tampermonkey.net/documentation.php#GM_download
 */
function createAndAssign(tagName, urlList, artName, errorCallback) {
	const btn = createButton(tagName);
	if (!urlList || !GM.download || forceFailure) {
		admitFailure(btn, errorCallback);
		return btn;
	}
	if (typeof urlList === "string") {
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

/** Assign the "Save as" event with the correct extension on button click. */
async function assignClick(btn, urlList, artName, errorCallback) {
	if (forceFailure) {
		admitFailure(btn, errorCallback);
		return;
	}
	if (typeof urlList === "string") {
		urlList = [urlList];
	}
	// Retrieves the targets extensions
	const extList = [];
	const nameWithExt = /(.+)\.(\w{3,4})$/;
	if (nameWithExt.test(artName)) {
		// The name provided already has the file extension
		const twoPartsName = artName.match(nameWithExt);
		artName = twoPartsName[1];
		// We assume every file in the sequence will have the same extension
		urlList.forEach(() => extList.push(twoPartsName[2]));
	} else {
		// The extensions must be derived from the URL
		for (let i = 0; i < urlList.length; ++i) {
			const url = urlList[i];
			const ext = await detectExtension(btn, url, errorCallback);
			extList[i] = ext;
		}
	}
	const pairList = [];
	if (urlList.length !== extList.length) {
		console.warn(`Unable to assign an action to the button: ${urlList.length} URL / ${extList.length} extensions.`);
		return;
	}
	for (let i = 0; i < urlList.length; ++i) {
		pairList.push({url: urlList[i], ext: extList[i]});
	}
	btn.addEventListener("click", event => saveAs(event, btn, pairList, artName));
}

/** Call GM.download and updates the button status on success/failure. */
function saveAs(event, btn, pairList, artName) {
	event.preventDefault();
	let completed = 0;
	const total = pairList.length;
	// No rage-clicks
	setBusy();
	// Only one picture to be saved as
	if (total === 1) {
		const url = pairList[0].url;
		const ext = pairList[0].ext;
		GM.download({
			url: url,
			name: artName + "." + ext,
			saveAs: true,
			onerror: error => handleError(error, ext),
			ontimeout: () => handleTimeout(),
		}).then(unsetBusy);
	} else {
		// Batch downloading of multiple pictures
		const requestList = [];
		btn.innerText = "Download (0/" + total + ")";
		for (let i = 0; i < total; ++i) {
			const url = pairList[i].url;
			const ext = pairList[i].ext;
			const request = GM.download({
				url: url,
				name: artName + " - " + padWithZeroes(i + 1, total) + "." + ext,
				saveAs: false,
				onload: response => completeOne(),
				onerror: error => handleError(error, ext),
				ontimeout: () => handleTimeout(),
			});
			requestList.push(request);
		}
		Promise.all(requestList).then(unsetBusy);
	}

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
		switch (error.error) {
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
				alert(
					"The requested file extension (" +
						ext +
						") is not whitelisted.\n\n" +
						"You have to add it manually (see 'Downloads' in Tampermonkey settings)."
				);
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

/**
 * Attempts to detect the extension of the download target from the URL.
 * If that fails, uses a AJAX request and parses it in the response.
 * In that case, we need a cross-scripting permission to access the CDN.
 * It also means the button will take more time to appear.
 * https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest
 */
async function detectExtension(btn, url, errorCallback) {
	// Tries to fetch the file extension from the supplied URL
	// This is the simplest method but it does not alway work
	const type = /\.(\w{3,4})\?|\.(\w{3,4})$|format=(\w{3,4})/;
	if (type.test(url)) {
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
	if (GM.xmlHttpRequest) {
		let ext = null;
		const response = await GM.xmlHttpRequest({
			method: "head",
			url: url,
			onerror: error => {
				if (error.status === 403) {
					// TODO: add referer
					console.error("Cannot determine extension of target: head request denied.", error);
				} else {
					console.error("Cannot determine extension of target.", error);
				}
				admitFailure(btn, errorCallback);
			},
			ontimeout: () => {
				console.error("Cannot determine extension of target: head request timed out.");
				admitFailure(btn, errorCallback);
			},
		});
		const headers = response.responseHeaders;
		const filename = /filename=".*?\.(\w+)"/;
		const mimeType = /content-type: image\/(\w+)/;
		if (filename.test(headers)) {
			ext = filename.exec(headers)[1];
		} else if (mimeType.test(headers)) {
			// Legacy handling of DeviantArt before it went full Eclipse
			ext = mimeType.exec(headers)[1];
		} else {
			console.error("Cannot determine extension of target from head response.", response);
			admitFailure(btn, errorCallback);
		}
		if (ext) {
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
	if (fallback) {
		fallback();
	}
}

/** Takes it back. */
function removeFailure(btn) {
	btn.classList.remove("failed");
	// Removes the "under construction" status
	btn.style.opacity = "";
}

/** Indicates the button won't work. */
function isFailed(btn) {
	return btn == null || btn.classList.contains("failed");
}

/** Eka's Portal sometimes requires XMLHttpRequest for text files. */
function processAryion() {
	const boxes = document.querySelectorAll(".g-box");
	for (let box of boxes) {
		const bar = box.querySelector(".g-box-header + .g-box-header span + span");
		if (bar) {
			const name = parseName(document.title.substr(6, document.title.length));
			const noscript = document.querySelector(".item-box noscript");
			let url = null;
			if (noscript) {
				// Creates download buttons from the noscript picture URL
				url = /src='(.*?)'/.exec(noscript.innerText)[1].replace("//", "https://");
			} else {
				// Slower, because it goes the XMLHttpRequest way to pull the file extension
				const barLinks = document.querySelectorAll(".func-box .g-box-header.g-corner-all a");
				for (const link of barLinks) {
					if (link.innerText == "Download") {
						url = link.href;
						break;
					}
				}
			}
			const sabt = createAndAssign("a", url, name, () => {
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

/** FurAffinity */
function processFuraffinity() {
	const actions = document.querySelector("#page-submission .actions");
	const betaSection = document.querySelector("#submission_page .submission-sidebar");
	if (actions) {
		// Classic template (no longer maintained)
		const name = parseName(document.title.substr(0, document.title.length - 26));
		for (let i = 0; i < actions.childNodes.length; ++i) {
			if (actions.childNodes[i].textContent.match("Download")) {
				const dlbt = actions.childNodes[i].childNodes[0];
				dlbt.title = name;
				dlbt.innerHTML = name;
				selectText(dlbt);
				const sabt = createAndAssign("button", dlbt.href, name, () => {});
				dlbt.parentElement.parentElement.appendChild(sabt);
				break;
			}
		}
	} else if (betaSection) {
		// Modern template
		const name = parseName(document.title.substr(0, document.title.length - 26));
		const side = betaSection.querySelector("section.buttons");
		const sideDownloadLink = side.querySelector("div.download a");
		const sideSaveAsLink = createAndAssign("a", sideDownloadLink.href, name, () => {
			// Adds the formatted name as a new meta info
			const container = document.createElement("div");
			const strong = document.createElement("strong");
			const nameSpan = document.createElement("span");
			strong.innerText = "Name";
			nameSpan.innerText = name;
			container.appendChild(strong);
			container.appendChild(document.createTextNode(" "));
			container.appendChild(nameSpan);
			const meta = betaSection.querySelector("section.info.text");
			meta.insertBefore(container, meta.firstChild);
			selectText(nameSpan);
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
		const bottomSaveAsLink = createAndAssign("a", sideDownloadLink.href, name, () => {});
		bottomSaveAsLink.className += " " + bottomDownloadLink.className;
		bottomSaveAsLink.style.marginLeft = "4px"; // simulates a fucking blank space
		bottomDownloadLink.insertAdjacentElement("afterend", bottomSaveAsLink);
	}
}

/** Hentai Foundry */
function processHentaiFoundry() {
	const boxFooter = document.querySelector("#picBox .boxfooter");
	if (boxFooter) {
		const name = parseName(document.title.substr(0, document.title.length - 17));
		const yt0 = boxFooter.querySelector("yt0"); // broken thumb
		const yt1 = boxFooter.querySelector("yt1"); // favorite picture
		const img = document.querySelector(".boxbody img.center");
		const url = img.onclick ? "https:" + /src='(.*?)'/.exec(img.onclick.toString())[1] : img.src;
		const sabt = createAndAssign("a", url, name, () => {
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
	if (pictop) {
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
		const sabt = createAndAssign("a", url, name, () => {
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
	const sabt = createAndAssign("a", dlbt.href, name, () => {
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
		const dlbt = createButton("button", "Download all");
		dlbt.onclick = () => downloadSlideshow(nav, dlbt);
		addButton(dlbt);
	} else {
		const artList = document.querySelectorAll(".pod-body a[data-action=view-image]");
		urlList = [...artList].map(a => a.href);
		const sabt = createAndAssign("button", urlList, name, () => {
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
			} while (url === nextUrl);
			url = nextUrl;
			const ext = await detectExtension(dlbt, url);
			await GM.download({
				url: url,
				name: name + " - " + padWithZeroes(i + 1, total) + "." + ext,
				saveAs: false,
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

/** X/Twitter */
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
	observer.observe(document.body, { childList: true, subtree: true });

	function processNode(node) {
		const testAnchor = anchor => /\/status\/\d+/.test(anchor.href);
		switch (node.tagName) {
			case "IMG":
				if (node.src) {
					const isMedia = node.src.startsWith("https://pbs.twimg.com/media/");
					const isQuote = node.src.endsWith("name=240x240") || node.src.endsWith("name=120x120");
					if (isMedia && !isQuote) {
						const parentAnchor = node.closest("a");
						if (parentAnchor) {
							processTweet(parentAnchor, node);
						}
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

/** Bluesky */
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
		const anchorPieces = anchors[3]?.href?.match(/\/profile\/(.+?)(?:\.\w+)*\/post\/(.+)/);
		const locationPieces = location.href.match(/.+\/profile\/(.+?)(?:\.\w+)*\/post\/(.+)/);
		let urlPieces;
		if (anchorPieces) {
			// We are looking at a random post in a timeline
			urlPieces = anchorPieces;
		} else if (locationPieces) {
			// If the URL matches, we are looking at a specific post (which doesn't have anchors)
			urlPieces = locationPieces;
		} else {
			// We are looking at a specific post BUT the URL hasn't updated yet
			return;
		}
		const author = urlPieces[1];
		const postId = urlPieces[2];
		// Generates a name
		const imageUrl = image.src.replace("feed_thumbnail", "feed_fullsize");
		const imageExt = imageUrl.split("@")[1];
		if (!imageExt) {
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
		saBtn.style = "border: none; background: none; color: #6A7F93; cursor: pointer; line-height: 1; border-radius: 20px; padding: 7px;";
		saBtn.addEventListener("mouseenter", event => { event.target.style.background = "#1E2936"; }, false);
		saBtn.addEventListener("mouseleave", event => { event.target.style.background = "none"; }, false);
		const icon = disketSvg();
		icon.style.verticalAlign = "middle";
		saBtn.innerHTML = "";
		saBtn.appendChild(icon);
		const shareBtn = post.querySelector("[data-testid=postShareBtn]");
		const shareCtn = getParent(shareBtn, 3);
		if (shareCtn) {
			// Main post
			const saCtn = document.createElement("div");
			saCtn.className = shareCtn.className;
			saCtn.style = shareCtn.style;
			saCtn.style.cssText = shareCtn.style.cssText; // I don't understand why this is necessary...
			saCtn.appendChild(saBtn);
			shareCtn.parentElement.insertBefore(saCtn, shareCtn);
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

/** Subscribestar */
function processSubscribestar() {
	document.body.addEventListener("click", () => setTimeout(main, 500), true);
	function main() {
		const imgLinks = document.querySelectorAll("a.gallery-image_original_link");
		if (imgLinks.length === 1) {
			const imgLink = imgLinks[0];
			const existing = document.getElementById("artname-btn");
			if (!existing && GM_download) {
				const sabt = createAndAssign("a", imgLink.href, imgLink.download);
				sabt.className = imgLink.className;
				sabt.style.display = "inline-block";
				sabt.style.padding = "0 0 10px 0";
				sabt.style.cursor = "pointer";
				const sep = document.createElement("span");
				sep.innerHTML = "&nbsp;|&nbsp;";
				imgLink.style.display = "inline-block";
				imgLink.style.padding = "10px 0 0 0";
				imgLink.parentElement.appendChild(sep);
				imgLink.parentElement.appendChild(sabt);
			}
		}
	}
}

window.addEventListener("load", function () {
	// Button becomes red if it doesn't work
	addCssRule("#artname-btn.failed {color: red !important;}");
	// URL includes filtering
	switch (location.host) {
		case "aryion.com":
			processAryion();
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
		case "twitter.com":
		case "x.com":
			processTwitter();
			break;
		case "bsky.app":
			processBluesky();
			break;
		case "subscribestar.adult":
			processSubscribestar();
			break;
		default:
			console.error("URL include / host filtering mismatch.");
			break;
	}
});

/* Changelog:
 ** 5.8: added support for Bluesky
 ** 5.7: added support for Subscribestar, dropped support for DeviantArt
 ** 5.6: fixed action bar detection for X/Twitter
 ** 5.5: added partial support for X/Twitter
 ** 5.4: handled Newgrounds slideshow, improved DA, refactored all the asynchronous sub-processes
 ** 5.3: fixed Newgrounds (+improved integration) and replaced @include with @match
 ** 5.2: fixed dumb issue ("data-hook") with DA
 ** 5.1.1: fixed InkBunny image catching when download link is missing
 ** 5.1
 *  added another "Save as" button at picture bottom on FA
 *  improved integration with FA
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
