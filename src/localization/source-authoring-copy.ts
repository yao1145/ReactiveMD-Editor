import type { AuthorCompletion } from '../contracts/authoring';
import type { EditorLocale } from '../contracts/types';

interface AuthoringCopy {
  region: string;
  title: string;
  format: string;
  formatTitle: string;
  suggestions: string;
  suggestionsTitle: string;
  completionLabel: string;
  completionEmpty: string;
  completionCount: (count: number) => string;
  kinds: Record<AuthorCompletion['kind'], string>;
  bindingsLabel: string;
  noBindings: string;
  caretLabel: string;
  noBindingAtCaret: string;
  declarationCount: (count: number) => string;
  referenceCount: (count: number) => string;
  declaration: string;
  reference: string;
  locateTitle: string;
  renameLabel: string;
  renamePlaceholder: string;
  renameAction: string;
  renameTitle: string;
  renameHint: string;
  renameEmpty: string;
  renameSame: string;
  renameDone: (from: string, to: string) => string;
  renameFailed: (detail: string) => string;
  formatApplied: string;
  formatUnchanged: string;
  formatFailed: (detail: string) => string;
  typeLabel: string;
  unknownType: string;
  typeNames: Record<string, string>;
  position: (line: number, column: number) => string;
}

const ENGLISH: AuthoringCopy = {
  region: 'Source authoring tools',
  title: 'Authoring',
  format: 'Format',
  formatTitle: 'Normalise spacing inside recognised Reactive MD tags',
  suggestions: 'Suggest',
  suggestionsTitle: 'Show tag, attribute and binding suggestions (Ctrl+Space)',
  completionLabel: 'Source suggestions',
  completionEmpty: 'No suggestions at this position.',
  completionCount: (count) => `${count} suggestion${count === 1 ? '' : 's'}`,
  kinds: { tag: 'Tag', attribute: 'Attribute', binding: 'Binding', value: 'Value' },
  bindingsLabel: 'Bindings',
  noBindings: 'No bindings in this source.',
  caretLabel: 'At caret',
  noBindingAtCaret: 'Caret is not on a binding.',
  declarationCount: (count) => `${count} declaration${count === 1 ? '' : 's'}`,
  referenceCount: (count) => `${count} reference${count === 1 ? '' : 's'}`,
  declaration: 'Declaration',
  reference: 'Reference',
  locateTitle: 'Locate in editor',
  renameLabel: 'Rename selected binding',
  renamePlaceholder: 'New name',
  renameAction: 'Rename',
  renameTitle: 'Rename this binding everywhere it is declared or read',
  renameHint: 'Updates declarations, references and plot parameters.',
  renameEmpty: 'Enter a new name.',
  renameSame: 'The new name is the current name.',
  renameDone: (from, to) => `Renamed ${from} to ${to}.`,
  renameFailed: (detail) => `Rename failed: ${detail}`,
  formatApplied: 'Formatted as one undo step.',
  formatUnchanged: 'The source is already formatted.',
  formatFailed: (detail) => `Formatting failed: ${detail}`,
  typeLabel: 'Type',
  unknownType: 'Unknown',
  typeNames: {
    string: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    array: 'List',
    'number-array': 'Number list',
    null: 'Null',
  },
  position: (line, column) => `Line ${line}:${column}`,
};

const CHINESE: AuthoringCopy = {
  region: '源码作者工具',
  title: '作者工具',
  format: '格式化',
  formatTitle: '整理已识别 Reactive MD 标签内的空白',
  suggestions: '补全',
  suggestionsTitle: '显示标签、属性与绑定建议（Ctrl+Space）',
  completionLabel: '源码补全建议',
  completionEmpty: '当前位置没有补全建议。',
  completionCount: (count) => `${count} 条建议`,
  kinds: { tag: '标签', attribute: '属性', binding: '绑定', value: '值' },
  bindingsLabel: '绑定',
  noBindings: '源码中没有绑定。',
  caretLabel: '光标位置',
  noBindingAtCaret: '光标不在绑定上。',
  declarationCount: (count) => `${count} 处声明`,
  referenceCount: (count) => `${count} 处引用`,
  declaration: '声明',
  reference: '引用',
  locateTitle: '在编辑器中定位',
  renameLabel: '重命名选中绑定',
  renamePlaceholder: '新名称',
  renameAction: '重命名',
  renameTitle: '重命名所有声明与引用位置',
  renameHint: '同时更新声明、引用与绘图参数。',
  renameEmpty: '请输入新名称。',
  renameSame: '新名称与当前名称相同。',
  renameDone: (from, to) => `已将 ${from} 重命名为 ${to}。`,
  renameFailed: (detail) => `重命名失败：${detail}`,
  formatApplied: '已格式化，可一步撤销。',
  formatUnchanged: '源码无需格式化。',
  formatFailed: (detail) => `格式化失败：${detail}`,
  typeLabel: '类型',
  unknownType: '未知',
  typeNames: {
    string: '文本',
    number: '数字',
    boolean: '布尔值',
    array: '列表',
    'number-array': '数字列表',
    null: '空值',
  },
  position: (line, column) => `第 ${line} 行 ${column} 列`,
};

export const AUTHORING_COPY: Record<EditorLocale, AuthoringCopy> = { en: ENGLISH, zh: CHINESE };
