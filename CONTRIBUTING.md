# Contributing

Small improvements and new story variants are welcome. Run `npm ci` and `npm run check` before submitting a change.

Keep animation deterministic: every pose, transition and audio envelope must derive from frame time. Preserve planted feet and hand/object contact when changing movement. Check both sides of a scene boundary, the board release, the pass-by of all four figures, and the doorway exit. Use the vector-print exporter to review the result; successful encoding alone does not rule out a visual defect.

Keep your music files, local props, render outputs and personal machine paths out of commits. Include licenses for any new redistributable assets. Changes to the final wording should remain editable through the film props.

The code is supplied under the MIT license. Dependencies retain their own licenses.
