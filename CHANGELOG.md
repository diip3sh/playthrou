# playthru

## 0.1.2

### Patch Changes

- [`c1e0d64`](https://github.com/diip3sh/playthrou/commit/c1e0d64dfa3f4e96da248131f66a458f698fbd6e) Thanks [@diip3sh](https://github.com/diip3sh)! - The drawn caret now hides while a visitor has the pointer over the stage, comes back on resume only if its field is still on screen, and disappears when typing stops or the field closes. Before, it stayed where the demo stopped typing: a second caret in the field while the visitor typed, then a stray bar in the middle of whatever the UI rendered in that spot.

- [`e51115b`](https://github.com/diip3sh/playthrou/commit/e51115be7a3f788abf221476ca833ac3bd78b065) Thanks [@diip3sh](https://github.com/diip3sh)! - Steps now skip targets that are no longer on screen, and typing stops when a visitor has edited the field. Before, a visitor who took over mid-demo and closed a form left the script typing into the hidden field and aiming at a hidden button, which sent the cursor to the corner of the stage and fired a click the visitor never saw.

## 0.1.1

### Patch Changes

- [`0c5a692`](https://github.com/diip3sh/playthrou/commit/0c5a692289c47d50799b9ec176ccdaba1381c0c7) Thanks [@diip3sh](https://github.com/diip3sh)! - The demo pauses while a menu, listbox or popover outside the stage is open, so its synthetic clicks and pointer moves no longer close it. Popups are detected by `aria-expanded="true"` on their trigger or by `:popover-open`.
