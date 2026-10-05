# Photo gallery

Open `/admin/gallery.html`, unlock using the same owner GitHub token as the adventure editor, and add photos. Each photo has a name, description, optional date and comma-separated tags. Use Move up/down to arrange the gallery. Publish saves everything in one commit; GitHub Pages then rebuilds the site.

The editor loads existing photos for metadata edits. Existing images are not uploaded again. Removing a photo removes it from the collection but retains its original repository file. Keep the tab open until publishing completes: drafts are in memory.

Data is stored in `_data/gallery.json`; originals are stored in `images/gallery/` with stable UUID filenames. IDs, dimensions and metadata provide a foundation for future print enquiries or ordering. No payment or ordering system is enabled. Tags are saved for future filtering.

The public `/gallery/` page uses proportion-preserving rows, hover captions, and a keyboard-accessible dialog (Escape closes; arrow keys navigate). The collection starts empty so the owner can curate it.

Checks: `node --test checks/gallery.test.mjs checks/adventure-editor.test.mjs`.
