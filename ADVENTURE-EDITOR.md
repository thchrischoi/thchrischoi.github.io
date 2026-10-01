# Adventure editor

After deploying these changes, open `/adventures/` and click **Add new post**, or go directly to `/admin/`.

## One-time setup

Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) while signed in as `thchrischoi`. Select only `thchrischoi.github.io`; grant **Contents: Read and write**. Choose an expiration and save the token in a password manager. Do not put it in this repository or send it through chat.

The editor targets the existing `master` branch and expects GitHub Pages to build from its root. If the Pages source differs, change `BRANCH` in `admin/core.mjs` and the branch label in `admin/index.html`. Branch rules requiring pull requests will block direct publishing. The token must have permission to write to the branch.

## Writing

1. Click **Add new post** and paste the token to unlock the editor.
2. Enter the title, date, and introduction. Add paragraphs, headings, and lists without writing Markdown or HTML.
3. Choose photos, GIFs, or videos. Add captions and reorder sections using the arrows. The first image becomes the Adventures cover.
4. Preview, then **Publish adventure**. Wait for the success message and GitHub Pages rebuild.

Supported attachments: JPEG, PNG, GIF, WebP, MP4, WebM. Limits imposed by this editor: 25 MiB per attachment and 75 MiB total. Video playback also depends on the codec; H.264 MP4 works in common browsers. Files live in the public repository. Large clips should be compressed before upload.

Drafts and the token stay in memory, not browser storage. Closing/reloading the tab loses the draft. Lock clears the token while keeping the draft in that open tab. To renew or revoke a token, use GitHub token settings. The editor has no third-party scripts and restricts network connections to GitHub's API.

## Publishing behavior

Posts are saved under `_pages/adventures/`, with attachments under `images/adventures/`. New posts have `adventure: true` and appear automatically in the Adventures list. Existing stories and URLs are retained. The editor creates all attachments and the story in one commit, and uses a non-forced branch update so concurrent changes cannot be overwritten. Failed uploads keep the draft in the editor. A retry checks for the same post before creating another commit.

The admin page and button are public, but publishing requires a token with repository write access. The editor additionally checks the signed-in account is `thchrischoi`; GitHub is the actual security boundary. As with any repository, other people independently granted write access can change files outside this editor.

Once posts have been published online, pull the latest repository changes before making local changes. This editor creates new posts only; existing posts can still be edited in GitHub.

## Verification

Run `node --test checks/adventure-editor.test.mjs` for formatting, escaping, attachment limits, authorization, and mocked publishing tests. A full live publishing check needs the owner's token and creates a public post; automated checks do not do that.
