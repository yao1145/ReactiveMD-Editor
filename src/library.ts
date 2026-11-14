/** CSS-included root entry. Vite extracts both stylesheets into `styles.css`. */
import './styles/editor.css';
// Loaded after the aggregator so narrow-screen overrides win over base layout.
import './mobile/mobile.css';
import './codemirror/codemirror.css';
export * from './index';
