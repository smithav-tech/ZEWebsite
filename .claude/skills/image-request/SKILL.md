---
name: image-request
description: Use whenever the work needs an image that Claude cannot make itself, such as a doodle, illustration, photo, icon, texture, background, hero or section art, or a replacement for an existing asset. Claude writes a ready-to-paste generation prompt plus the file specs, asks the user whether to wait for the image or to continue without it, and if they choose to wait, stops until they upload it. Also use when the user says "I'll generate it" or asks for an image prompt.
---

# Image request

Claude can't generate raster images. The user makes them (usually in Gemini) and hands them back. Whenever a task needs a new or replacement image, follow these steps instead of skipping the image, inventing an SVG stand-in on your own, or quietly leaving a hole.

## 1. Notice the need early

Before writing code that depends on an image, decide whether a suitable file already exists (check `design/`, `public/media/`, `assets-originals/`). Only request a new image when none fits. If a task needs several images, collect them all and request them together in one message, numbered, so the user can generate them in one sitting.

## 2. Write the request

For each image, give the following, in this order:

**Image N: <short name>**
- **Used for:** where it goes on the site and what it has to communicate (one line).
- **Save as:** the exact path and filename, e.g. `design/doodles/8-water.png`.
- **Specs:** aspect ratio and minimum size (e.g. 4:3, at least 2048 px wide), format (PNG, or WEBP for photos), and background (transparent or plain white).
- **Prompt:** in its own fenced `text` block so it copies cleanly:

```text
<the full prompt>
```

- **Avoid:** what would make the image unusable (text in the image, extra objects, shading, a busy background, cropped subject, and so on).
- **Check before sending:** 1 to 3 quick things the user should eyeball (e.g. "one unbroken line", "cow faces left").

Prompt-writing rules:
- Make every prompt self-contained. The generator has no memory of the site, so restate the style each time.
- Order the prompt as: subject and action, composition and framing, style, line and colour, background, and exclusions.
- Be concrete about count, pose, direction, and where the subject sits in the frame. Leave padding around the subject so it can be cropped.
- Match the existing style. Open one or two current images in the same family with Read and describe what you see instead of guessing.
- Never ask for words, logos, or brand marks inside the image. Text is added in HTML.

### This project's house styles

- **Chapter doodles** (`design/doodles/`): a single continuous black line on a transparent or white background. It is a freehand, hand-drawn one-line drawing with no fills, no shading, no colour, and no lifted pen. The line should enter from the left edge and exit at the bottom. These are traced by `scripts/trace_doodle.py` through `scripts/build_traced.py`, so a broken line or a stray mark breaks the trace. After a new doodle lands, add or adjust its `SCENES` entry (crop, entry, exit) and re-run `python scripts/build_traced.py`.
- **People and project photos** (`assets-originals/`): these are real photos and are never generated. Ask the user for the real photo instead of writing a prompt.

Gemini notes: the "Download full-sized image" button sometimes saves the wrong image, so remind the user to check the file. Transparent PNGs look blank or black in some viewers. Composite them on white before judging them.

## 3. Ask: wait or continue?

Straight after the request, call `AskUserQuestion` (one question, header `Image`):

- **Wait for the image (Recommended when the image shapes the layout or code):** "I'll stop here until you upload it."
- **Continue with a placeholder:** "I'll keep going with a clearly marked placeholder and swap it in when the image arrives."
- **Skip this image:** "Drop it from this task."

If several images were requested, ask once for the batch, and let the user say in "Other" if they want different handling per image.

## 4a. If they choose Wait

- End the turn right away. Don't write the code that depends on the image, and don't guess at its dimensions.
- Close with one line saying exactly what you're waiting for: "Waiting for `design/doodles/8-water.png`. Save it there (or drop it in chat) and tell me when it's in."
- When the user replies, check that the file exists at the path, open it with Read, and verify it against the specs and the "Avoid" list. For PNGs, also check the size and mode with a quick PIL one-liner. If the image is only attached in chat and not on disk, ask the user to save it to the path, because you can see a chat attachment but can't write it to disk.
- If it misses the spec, say what's wrong in one line and give a corrected prompt. Then wait again. Don't patch over a bad image in code.
- Once it passes, carry on with the original task from where you stopped.

## 4b. If they choose Continue

- Use an obvious placeholder at the final path's consumer, such as a grey box with the target aspect ratio or the nearest existing image, and mark it in code with `// TODO(image): <filename>` (or the CSS or HTML comment equivalent).
- Keep a running list of pending images. At the end of the turn, list every image that's still outstanding with its save path, so nothing gets forgotten.
- When the image arrives later, verify it as in 4a, swap it in, and remove the TODO.

## 4c. If they choose Skip

Remove the need for the image from the change, and mention in the final summary what was left out.
