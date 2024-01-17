async function apiDownload(btn, name) {
	const id = name.split(" - ")[1];
	const url = await getMediaUrlFromTweetId(id);
	if (url) {
		saveAs(btn, url, "mp4", name);
	} else {
		admitFailure(btn);
	}
}

async function recDownload(btn, name, video) {
	const mediaSource = URL.getFromObjectURL(video.src);
	// https://github.com/gildas-lormeau/SingleFile/issues/565
	// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element
	const stream = video.captureStream?.exec() ?? video.mozCaptureStream();
	const mediaRecorder = new MediaRecorder(stream);
	const videoData = [];
	mediaRecorder.ondataavailable = e => videoData.push(e.data);
	video.pause();
	video.currentTime = 0;
	video.playbackRate = 60.0;
	await video.play();
	mediaRecorder.start();
	video.addEventListener("ended", () => {
		const url = URL.createObjectURL(new Blob(videoData));
		saveAs(btn, url, "mp4", name);
	});
	// https://developer.mozilla.org/en-US/docs/Web/API/SourceBufferList
	const sourceBuffers = mediaSource.sourceBuffers;
	sourceBuffers.addEventListener("addsourcebuffer", () => {
		const buff = sourceBuffers[0];
		buff.addEventListener("updateend", () => {
			// console.log(buff);
		});
	});
}

// Special blob button
const btn = createButton();
btn.addEventListener("click", async () => {
	// Try to rip directly from the media source
	//recDownload(btn, name, srcElem);
	// Fallback solution
	apiDownload(btn, name);
});
addButton(btn, article);
return;
