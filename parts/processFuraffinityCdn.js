function processFuraffinityCdn() {
	const searchParams = new URLSearchParams(location.search);
	const name = searchParams.get("name");
	if (name) {
		const a = document.createElement("a");
		a.href = location.href;
		a.download = name;
		a.target = "_blank";
		a.rel = "noopener";
		a.click();
	}
}
