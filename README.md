**Anything Not Saved** adds a **Save as** button for artworks in compatible websites.

This button queries the full size image and opens the "Save as" prompt for you to save it at the right place in one click. If multiple artworks are present, then the button becomes **Download all**, and the pictures are saved in your default download location.

A Windows-compliant filename is provided in the `artist - artwork` format. Forbidden characters are replaced (typically: `:` => ` - `) or stripped. If the button creation fails, it will sometimes show a text node with a formatted name that can be copied for manual saving.

Supported websites, as of 2026-05-26:
- 🟢 Eka's portal: ![Aryion](https://i.ibb.co/mBN5SwD/eka.png "Aryion")
- 🟡 FurAffinity: ![FurAffinity](https://i.ibb.co/Pt1tQZV/furaffinity.png "FurAffinity")
- 🟢 Hentai-Foundry: ![Hentai-Foundry](https://i.ibb.co/D7ztTDD/hentai-foundry.png "Hentai-Foundry")
- 🟢 InkBunny: ![Inkbunny](https://i.ibb.co/ThDp69m/inkbunny.png "Inkbunny")
- 🟢 Newgrounds: ![Newgrounds](https://i.ibb.co/B4TBcbp/newgrounds-sa.png "Weasyl")
- 🟢 Weasyl: ![Weasyl](https://i.ibb.co/frvTyYx/weasyl.png "Weasyl")
- 🟢 X/Twitter: ![X-Twitter](https://i.ibb.co/rMw4KMw/x-sa.png "X/Twitter")
- 🟢 Bluesky: ![Bluesky](https://i.ibb.co/1BKnc3F/bsky-sa.png "Bluesky")

Remember: anything not saved will be lost. Censorship is rampant and artists sometimes nuke their gallery due to external pressure. If you love it, save it.

This script is developed and tested with the plugin TamperMonkey on Firefox.

Known issues:
- Cloudflare now challenges every XHR request which means FurAffinity is download-only until further notice.
- This script does not function properly with Violentmonkey 2.37.0 as the `saveAs` property of GM.download is not yet supported.
- Weird behavior of the `saveAs` property with audio/video from Newgrounds where the file is force-renamed to .avi / .aac (instead of .mp4 / .mp3).
