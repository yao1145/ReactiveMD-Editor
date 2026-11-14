/** CSS-included CodeMirror entry. Both stylesheets are extracted by Vite. */
import '../styles/editor.css';
// Loaded after the aggregator so narrow-screen overrides win over base layout.
import '../mobile/mobile.css';
import './codemirror.css';
export * from './index';
