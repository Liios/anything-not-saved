function processHentaiFoundry() {
	const boxFooter = document.querySelector("#picBox .boxfooter");
	if(boxFooter) {
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
