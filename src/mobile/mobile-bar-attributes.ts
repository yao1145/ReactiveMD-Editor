/** Root attributes that mark an editor paired with a `MobileDocBar`.

 * `mobile.css` keys the footer suppression on this attribute, so the name
 * lives beside the stylesheet that reads it. Spread the result onto the
 * editor root element. */
export function mobileBarAttributes(mobileBar: boolean): Record<string,string> {
  return mobileBar?{'data-mobile-bar':''}:{};
}
