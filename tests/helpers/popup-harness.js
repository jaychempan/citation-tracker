const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM fixture for exercising popup behavior without a browser dependency.
class Element {
  constructor(tagName, document) {
    this.tagName = tagName;
    this.document = document;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.className = '';
    this._value = '';
    this.classList = {
      toggle: (name, force) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        const enabled = force === undefined ? !classes.has(name) : force;
        if (enabled) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
        return enabled;
      }
    };
  }
  get textContent() {
    return this.children.map(child => typeof child === 'string' ? child : child.textContent).join('');
  }
  set textContent(value) { this.children = [String(value)]; }
  get value() {
    if (this.tagName !== 'select') return this._value;
    if (this._value) return this.options.some(option => option.value === this._value) ? this._value : '';
    return this.options[0]?.value || '';
  }
  set value(value) { this._value = String(value); }
  get options() { return this.children.filter(child => child.tagName === 'option'); }
  get childElementCount() { return this.children.filter(child => typeof child !== 'string').length; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'value') this.value = value;
    if (name === 'hidden') this.hidden = true;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  async dispatch(type) {
    for (const listener of this.listeners[type] || []) await listener({ target: this });
  }
  focus() { this.document.activeElement = this; }
}

function createDocument(html) {
  const elements = [];
  const listeners = {};
  const document = {
    getElementById: id => elements.find(element => element.getAttribute('id') === id),
    querySelectorAll: selector => {
      const attribute = selector.slice(1, -1);
      return elements.filter(element => element.getAttribute(attribute) !== null);
    },
    createElement: tagName => new Element(tagName, document),
    createElementNS: (namespaceURI, tagName) => Object.assign(new Element(tagName, document), { namespaceURI }),
    addEventListener: (type, listener) => { listeners[type] = listener; },
    ready: () => listeners.DOMContentLoaded()
  };
  const stack = [];
  const voidTags = new Set(['meta', 'link', 'img', 'input']);
  for (const token of html.match(/<[^>]+>|[^<]+/g)) {
    if (token.startsWith('<!')) continue;
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (!token.startsWith('<')) { stack.at(-1)?.append(token); continue; }
    const tagName = token.match(/^<([\w-]+)/)[1];
    const element = document.createElement(tagName);
    elements.push(element);
    for (const match of token.matchAll(/([\w-]+)="([^"]*)"/g)) element.setAttribute(match[1], match[2]);
    if (/\shidden(?:\s|>)/.test(token)) element.hidden = true;
    if (tagName === 'html') document.documentElement = element;
    if (tagName === 'body') document.body = element;
    stack.at(-1)?.append(element);
    if (!voidTags.has(tagName)) stack.push(element);
  }
  return document;
}

async function loadPopup({ browserLanguage = 'en-US', storage = {}, mode = '', storageWriteFails = false, stateReadFails = false, now = '2026-09-30T12:00:00.000Z' } = {}) {
  const root = path.join(__dirname, '..', '..');
  const document = createDocument(fs.readFileSync(path.join(root, 'chrome', 'popup.html'), 'utf8'));
  const storageListeners = [];
  const messages = [];
  const fixedNow = new Date(now).getTime();
  class PopupDate extends Date {
    constructor(...args) { super(...(args.length ? args : [fixedNow])); }
    static now() { return fixedNow; }
  }
  const context = vm.createContext({
    document, URL, URLSearchParams, Intl, Date: PopupDate,
    navigator: { language: browserLanguage },
    location: { search: `?mode=${mode}` },
    localStorage: { getItem() { return null; } },
    addEventListener() {}
  });
  context.window = context;
  const runFile = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  runFile('tests/popup-preview.js');
  const state = vm.runInContext('previewState', context);
  context.chrome = {
    i18n: { getUILanguage: () => browserLanguage },
    storage: {
      local: {
        async get() { return { ...storage }; },
        async set(values) {
          if (storageWriteFails) throw new Error('Storage unavailable');
          const changes = Object.fromEntries(Object.entries(values).map(([key, newValue]) => [key, { oldValue: storage[key], newValue }]));
          Object.assign(storage, values);
          storageListeners.forEach(listener => listener(changes, 'local'));
        }
      },
      onChanged: { addListener(listener) { storageListeners.push(listener); } }
    },
    runtime: {
      async sendMessage(message) {
        messages.push(message);
        if (stateReadFails && message.type === 'getState') throw new Error('Reload the extension and try again.');
        return message.type === 'getState' ? state : { ok: true };
      }
    }
  };
  runFile('chrome/i18n.js');
  runFile('chrome/paper-utils.js');
  runFile('chrome/popup.js');
  await document.ready();
  return { document, context, state, storage, messages };
}

module.exports = { loadPopup };
