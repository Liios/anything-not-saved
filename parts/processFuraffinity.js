function processFuraffinity() {
	const name = parseName(document.title.substr(0, document.title.length - 26));
	insertInto(document.querySelector(".submission-controls-upper"));
	insertInto(document.querySelector("#submission-options"));

	function insertInto(buttonsContainer) {
		const down = getElementsByInnerText(buttonsContainer, "a", "Download")[0];
		const sabt = createAndAssign("a", down.href, name);
		sabt.href = "#";
		sabt.className += down.className;
		down.insertAdjacentElement("afterend", sabt);
		sabt.insertAdjacentHTML("beforebegin", " ");
	}
}
