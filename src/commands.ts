/**
 * DOM-free toolbar command helpers.
 *
 * The editor uses these through `reactive-md/authoring`; this entry gives hosts
 * a stable specifier when they want the pure text transformations without the
 * React component tree.
 */

export {
  formatBold,
  formatBulletList,
  formatHeading,
  formatInlineCode,
  formatItalic,
  formatOrderedList,
  formatQuote,
  formatStrike,
  formatTaskList,
  indentSelection,
  insertCodeBlock,
  insertDivider,
  insertImage,
  insertLink,
  insertTable,
  insertTemplate,
  insertText,
  outdentSelection,
  readFormatState,
} from 'reactive-md/authoring';
export type {
  EditorEdit,
  EditorFormatState,
  EditorListType,
  EditorLocale,
  EditorSelection,
  InsertTemplateOptions,
} from 'reactive-md/authoring';
