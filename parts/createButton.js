function createButton(tagName, text) {
	tagName = tagName ?? "button";
	const btn = document.createElement(tagName);
	if(tagName === "button") {
		btn.type = "button";
	}
	btn.id = "artname-btn";
	btn.innerText = text ?? "Save as";
	return btn;
}
