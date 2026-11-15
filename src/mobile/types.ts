/** Props that exist only to pair the editor with the mobile document bar.

 * The shared contract stays mobile-free; the CodeMirror shell extends the
 * public props with this interface. */
export interface MobileEditorProps {
  /** Set when a `MobileDocBar` beside the editor owns the view switch. The
   * editor then hides its footer switch and character count on phones. */
  mobileBar?: boolean;
}
