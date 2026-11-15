/** Single source for the JavaScript side of the narrow-screen threshold.

 * One primary number drives the whole mobile layer: the editor frame at 760px
 * or narrower is narrow, and the viewport at 760px or narrower is the
 * host-facing equivalent for chrome that lives outside the frame (the
 * `MobileDocBar` and the paired editor's footer suppression). CSS repeats 760
 * because stylesheets cannot import these values; the stylesheet headers list
 * it. `TINY_SCREEN_WIDTH = 400` is a density tweak for very small phones, not a
 * behaviour change. Pointer queries cover touch devices at any width. */
export const NARROW_FRAME_WIDTH = 760;
export const NARROW_VIEWPORT_QUERY = '(max-width: 760px)';
export const TINY_SCREEN_WIDTH = 400;
