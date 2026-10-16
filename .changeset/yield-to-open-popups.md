---
"playthru": patch
---

The demo pauses while a menu, listbox or popover outside the stage is open, so its synthetic clicks and pointer moves no longer close it. Popups are detected by `aria-expanded="true"` on their trigger or by `:popover-open`.
