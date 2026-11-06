/**
 * Re-export of the engine's native-component catalog.
 *
 * Titles, descriptions, groups, keywords and templates are default-preset
 * authoring data owned by `reactive-md/authoring`. This module keeps the
 * editor's historical internal import path for the catalog and snippet
 * rendering.
 */

export {
  EXTENDED_NATIVE_COMPONENT_COPY_ZH,
  EXTENDED_NATIVE_COMPONENTS,
  NATIVE_COMPONENT_GROUPS,
  NATIVE_COMPONENT_GROUPS_ZH,
  NATIVE_COMPONENTS,
  NATIVE_COMPONENTS_ZH,
  getNativeComponentCatalog,
  renderNativeSnippet,
} from 'reactive-md/authoring';
export type {
  NativeComponentCatalog,
  NativeComponentDefinition,
  NativeComponentGroup,
  NativeComponentGroupId,
} from 'reactive-md/authoring';
