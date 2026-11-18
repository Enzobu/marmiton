import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/ThemeToggle.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/theme-quick-access.css', import.meta.url), 'utf8');

const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
});
const component = { exports: {} };
const require = createRequire(import.meta.url);
const loadModule = name => name.endsWith('.css') ? undefined : require(name);
new Function('require', 'exports', outputText)(loadModule, component.exports);
const { ThemeToggle } = component.exports;

test('The navbar uses a single theme control available to guests and members', () => {
  const controls = [...app.matchAll(/<ThemeToggle value=\{themePreference\} onChange=\{updateThemePreference\} disabled=\{preferencesPending\}\/>/g)];
  assert.equal(controls.length, 1);
  assert.ok(controls[0].index < app.indexOf('{profile ? <div className="profile-menu-wrap"'));
});

test('Activating the button cycles the theme and updates the icon and accessible name', () => {
  let value = 'system';
  const onChange = next => { value = next; };

  for (const [mode, label, nextLabel] of [
    ['system', 'Système', 'Clair'],
    ['light', 'Clair', 'Sombre'],
    ['dark', 'Sombre', 'Système'],
  ]) {
    const button = ThemeToggle({ value, onChange });
    assert.equal(button.type, 'button');
    assert.equal(button.props.type, 'button');
    assert.equal(button.props.children.props.kind, mode);
    assert.equal(button.props['aria-label'], `Thème actuel : ${label}. Passer au thème ${nextLabel}.`);
    button.props.onClick();
  }
  assert.equal(value, 'system');
});

test('Quick access is compact at desktop and mobile sizes and respects reduced motion', () => {
  assert.match(styles, /\.theme-quick-trigger\{width:37px;height:37px/);
  assert.match(styles, /@media\(max-width:760px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /var\(--color-paper\)/);
});
