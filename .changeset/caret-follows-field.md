---
"playthru": patch
---

The drawn caret now hides while a visitor has the pointer over the stage, comes back on resume only if its field is still on screen, and disappears when typing stops or the field closes. Before, it stayed where the demo stopped typing: a second caret in the field while the visitor typed, then a stray bar in the middle of whatever the UI rendered in that spot.
