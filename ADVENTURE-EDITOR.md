# Adventure editor

Open `/admin/` or click **Add new post** on Adventures. Existing posts have an **Edit post** link. Unlock with a fine-grained GitHub token for `thchrischoi`, scoped to this repository with **Contents: Read and write**. The token is held in memory only.

## Create and edit

- Start a new post, or select a post under **Edit a published post** and click **Open post**.
- Enter one date, or check **This adventure spans multiple days** and enter an end date.
- Add paragraphs, headings, lists, media, and maps. Preview before publishing.
- To arrange existing images, select their **Select photo for grouping** checkboxes and choose side by side (2–3) or carousel (2+). Grouping places them at the first selected image's position, in their original order. Groups can be reordered, captioned, and ungrouped.
- To upload directly into a group, choose its display mode before selecting files. Use the file control inside an existing group to add more photos (rows are limited to three).
- Carousels support swiping/scrolling and arrow buttons. Clicking photos opens an expanded viewer with previous/next controls and Escape to close.
- **Save changes** updates the existing post and keeps its URL. Existing media files are reused, not duplicated. Removing an image from a post does not delete the original repository file.

The first editor's posts, including Whitney/Muir, import as editable story sections with existing media. Older handwritten Markdown posts open with their original body in a labeled source field so custom formatting is preserved; new blocks can be added after it. New and updated posts store their editable structure in an encoded comment alongside the rendered content. If manually editing those posts in GitHub, update or remove that comment too; otherwise the editor uses the saved structure.

## Media

The picker intentionally has no photo-only filter. On phones, choose **Browse / Choose Files** to find GIFs, videos, and GPX files.

Supported: JPG/JPEG, PNG, GIF, WebP, MP4, WebM, MOV, M4V, GPX. Uppercase extensions and files without browser-supplied MIME types are supported. Limits: 25 MiB per file, 75 MiB of new attachments per save. MP4 with H.264 is the most compatible video format; MOV/M4V playback depends on the browser and codec. A download link is included for videos. No transcoding or image recompression occurs.

## Maps and GPX

**+ Map location** supports either latitude/longitude and a zoom level, or a Google Maps / OpenStreetMap embed URL or iframe. For Google Maps, use Share → Embed a map. Only supported HTTPS embed endpoints are accepted; arbitrary iframe hosts are rejected.

Upload a `.gpx` file using the individual-media option. It is validated and displayed on an interactive OpenStreetMap map; track segments stay separate. Track points, route points, and waypoints are supported. Large tracks are sampled for display (roughly 10,000 points); the downloadable original keeps every point. Add a caption and preview the route before publishing. The GPX and its original coordinates become public with the post.

Maps use bundled Leaflet 1.9.4 and OpenStreetMap tiles, with attribution. A tile-server connection is required for the base map. Embed maps contact the chosen map provider.

## Saving and recovery

The editor targets `master` with GitHub Pages building from its root. Files and the post are saved in a single commit; non-forced branch updates prevent concurrent changes from being overwritten. Editing checks that the post's source SHA still matches the loaded version. If another edit changed it, copy your draft changes and reopen the latest post.

Upload progress and completion appear both near the top and beside Publish. Each GitHub request has a two-minute timeout. A timeout after the final save may still mean the post was saved: check the live page or GitHub before retrying. Never refresh or close an unsaved draft; drafts live only in the current tab. Lock clears the token but retains the draft in that tab.

Pull remote changes before editing this repository locally, since browser publishing commits directly to GitHub.

## Checks

`node --test checks/adventure-editor.test.mjs` covers rendering, date ranges, media validation, encoded-data round-trips, authorization, stale-edit protection, atomic publishing, map embed restrictions, and timeouts. Browser verification also covers importing the real first-editor post, GPX parsing, grouping, expansion, map preview, and mocked saving. No test publishes a user post.
