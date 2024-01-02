async function getMediaUrlFromTweetId(id) {
	const apiEndpoint = "https://twitter-video-download.com/fr/tweet/";
	const payload = {
		method: "get",
		url: `${apiEndpoint}${id}`,
		headers: {
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
			"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
			"cache-control": "max-age=0",
			"sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "same-origin",
			"sec-fetch-user": "?1",
			"upgrade-insecure-requests": "1"
		  },
		referrer: "https://twitter-video-download.com/fr",
		referrerPolicy: "strict-origin-when-cross-origin",
		mode: "cors",
		credentials: "omit"
	};
	const request = await GM.xmlHttpRequest(payload);
	if (request.status === 404) {
		console.error("Video not found.");
		return null;
	}
	const regex = /https:\/\/[a-zA-Z0-9_-]+\.twimg\.com\/[a-zA-Z0-9_\-./]+\.mp4/g;
	const text = request.responseText;
	const links = text.match(regex);
	let lq;
	let hq;
	// Calculate the size of a video based on resolution
	function calculateSize(resolution) {
		const parts = resolution.split("x");
		const width = parseInt(parts[0]);
		const height = parseInt(parts[1]);
		return width * height;
	}
	if (!links) return null;
	// Map links to objects with resolution and size
	const linkObjects = links.map(link => {
		const resolutionMatch = link.match(/\/(\d+x\d+)\//);
		const resolution = resolutionMatch ? resolutionMatch[1] : "";
		const size = calculateSize(resolution);
		return { link, resolution, size };
	});
	// Sort linkObjects based on size in descending order
	linkObjects.sort((a, b) => a.size - b.size);
	// Create a Set to track seen links and store unique links
	const uniqueLinks = new Set();
	const deduplicatedLinks = [];
	for (const obj of linkObjects) {
		if (!uniqueLinks.has(obj.link)) {
			uniqueLinks.add(obj.link);
			deduplicatedLinks.push(obj.link);
		}
	}
	lq = deduplicatedLinks[0];
	if (deduplicatedLinks.length > 1) hq = deduplicatedLinks[deduplicatedLinks.length-1];
	// first quality is VERY bad so if can swap to second (medium) then its better
	if (deduplicatedLinks.length > 2) lq = deduplicatedLinks[1];
	return hq ?? lq;
}
