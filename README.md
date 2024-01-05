**Anything Not Saved** adds a **Save as** button for artworks in compatible websites.

This button queries the full size image and opens the "Save as" prompt for you to save it at the right place in one click. If multiple artworks are present under the same name then the button becomes **Download all**, and the pictures are saved in your default download location.

A Windows-compliant filename is provided as `artist - artwork` format. Forbidden characters will be replaced (typically: `:` => ` - `) or stripped. If the button creation fails, it will sometimes fallback to a text node with the formatted name (pre-highlighted for ctrl+c plus manual saving).

Requisite permissions:
- `GM_xmlhttpRequest` to get the file extension (with a head request) when the website uses a CDN.
- `GM_download` to make the "Save as" button work.

Supported websites, as of 2024-01-05:
- DeviantArt: ![DeviantArt](https://i.ibb.co/TWWzdd2/deviantart.png "DeviantArt")
- Eka's portal: ![Aryion](https://i.ibb.co/mBN5SwD/eka.png "Aryion")
- FurAffinity: ![FurAffinity](https://i.ibb.co/Pt1tQZV/furaffinity.png "FurAffinity")
- Hentai-Foundry: ![Hentai-Foundry](https://i.ibb.co/D7ztTDD/hentai-foundry.png "Hentai-Foundry")
- InkBunny: ![Inkbunny](https://i.ibb.co/ThDp69m/inkbunny.png "Inkbunny")
- Newgrounds: ![Newgrounds](https://i.ibb.co/B4TBcbp/newgrounds-sa.png "Weasyl")
- Weasyl: ![Weasyl](https://i.ibb.co/frvTyYx/weasyl.png "Weasyl")
- X/Twitter: ![X-Twitter](https://i.ibb.co/rMw4KMw/x-sa.png "X/Twitter")

Remember: anything not saved will be lost. Censorship is rampant and artists sometimes nuke their gallery due to external pressure. If you love it, save it.

This script is developed and tested with the plugin TamperMonkey on Firefox.
