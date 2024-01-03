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
