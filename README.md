# esbuild-loader-svelte

A collection of esbuild plugins for compiling **Svelte 5** components, SCSS styles, SSR stub replacement, raw source import, and component metadata extraction.

[中文文档](./README.zh-CN.md)

## Features

- **sveltePlugin** — Compile `.svelte` files with TypeScript and SCSS preprocessing
- **scssPlugin** — Compile `.scss` files to CSS
- **ssrStubPlugin** — Replace browser-specific modules with stubs during SSR builds (uses external template files)
- **rawPlugin** — Import files as raw text (`?raw` suffix) for code display
- **metaPlugin** — Extract Svelte component metadata (`?meta` suffix) including props, source code, etc.
- **obfuscatorPlugin** — JavaScript code obfuscation with RC4 encryption, control flow flattening
- **renderTemplate / readTemplate** — Template engine for reading and rendering `{{KEY}}` placeholder templates
- Compatible with **CommonJS** and **ES Modules**
- Supports Svelte 5 Runes mode

## Installation

```bash
npm install esbuild-loader-svelte esbuild svelte --save-dev
# SCSS support (optional)
npm install sass --save-dev
# Code obfuscation (optional)
npm install javascript-obfuscator --save-dev
```

## Usage

### Full Import

```js
import {
    sveltePlugin, scssPlugin, ssrStubPlugin,
    rawPlugin, metaPlugin,
    renderTemplate, readTemplate, setTemplatesDir
} from 'esbuild-loader-svelte'
import esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outdir: 'dist',
    plugins: [sveltePlugin(), scssPlugin(), rawPlugin(), metaPlugin()],
})
```

### On-Demand Import

```js
import { sveltePlugin } from 'esbuild-loader-svelte/svelte'
import { scssPlugin } from 'esbuild-loader-svelte/scss'
import { rawPlugin } from 'esbuild-loader-svelte/raw'
import { metaPlugin } from 'esbuild-loader-svelte/meta'
import { obfuscatorPlugin } from 'esbuild-loader-svelte/obfuscator'
import { renderTemplate } from 'esbuild-loader-svelte/templates'
```

### CommonJS

```js
const { sveltePlugin, scssPlugin, rawPlugin, metaPlugin } = require('esbuild-loader-svelte')
```

## API

### `sveltePlugin(options?)`

Compiles `.svelte` files to JavaScript.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `generate` | `'client' \| 'server'` | `'client'` | Compilation mode |
| `dev` | `boolean` | `false` | Enable dev mode (better error messages) |
| `runes` | `boolean` | `true` | Enable Svelte 5 runes mode |
| `css` | `'injected' \| 'external' \| 'none'` | `'injected'` | CSS handling mode |
| `sourcemap` | `boolean` | `false` | Generate inline source maps |
| `sassModule` | `object` | Auto-imported | Manually provide sass module |
| `filterWarnings` | `(code: string) => boolean` | Filters a11y warnings | Return `true` to silence warning |

### `scssPlugin(options?)`

Compiles `.scss` files to CSS.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sassModule` | `object` | Auto-imported | Manually provide sass module |

### `ssrStubPlugin(stubPaths)`

Replaces specified module paths with empty stubs during SSR builds. Stub code comes from external template files (`src/templates/`).

| Parameter | Type | Description |
|-----------|------|-------------|
| `stubPaths` | `string[]` | Path fragments to match; matched modules are replaced with stubs |

```js
// Example: skip router and heavy components during SSR
ssrStubPlugin(['src/router', 'views/HeavyComponent'])
```

### `rawPlugin()`

Import files as raw text for code display scenarios.

```js
// Build config
plugins: [rawPlugin()]

// Usage: import via ?raw suffix
import buttonCode from './Button.svelte?raw'
// buttonCode is the full source code string of Button.svelte
```

### `metaPlugin(options?)`

Extracts Svelte component metadata including props, source code, and compile warnings.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sassModule` | `object` | Auto-imported | Manually provide sass module |

```js
// Build config
plugins: [metaPlugin()]

// Usage: import via ?meta suffix
import meta from './Button.svelte?meta'
// meta = {
//   filename: 'Button.svelte',
//   source: 'full source code',
//   props: ['type', 'size', 'disabled', ...],
//   warnings: [...],
//   metadata: { ... }
// }
```

### `obfuscatorPlugin(options?)`

Obfuscates JavaScript output with RC4 encryption, control flow flattening, and dead code injection. Requires `javascript-obfuscator` as an optional dependency.

```js
import { obfuscatorPlugin } from 'esbuild-loader-svelte/obfuscator'

await esbuild.build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outdir: 'dist',
    plugins: [obfuscatorPlugin()],
})
```

### `renderTemplate(name, vars)`

Reads a template file and replaces `{{KEY}}` placeholders.

```js
import { renderTemplate } from 'esbuild-loader-svelte'

const html = renderTemplate('html.html', {
    TITLE: 'Page Title',
    JS_FILE: 'main.abc123.js',
    CSS_LINK: '<link rel="stylesheet" href="./assets/style.css" />',
    SSR_HEAD: '',
    SSR_BODY: '<div>Pre-rendered content</div>',
})
```

### `readTemplate(name)`

Reads template file content without placeholder replacement.

### `setTemplatesDir(dir)`

Sets a custom template directory to override default templates.

```js
import { setTemplatesDir } from 'esbuild-loader-svelte'
setTemplatesDir('/path/to/my/templates')
```

## Built-in Template Files

| File | Purpose |
|------|---------|
| `html.html` | HTML page template |
| `client-entry.js` | Client entry template |
| `ssr-entry.js` | SSR entry template (with browser API stubs) |
| `ssr-stub.js` | JS module stub (router, etc.) |
| `ssr-stub-svelte.js` | Svelte component stub |
| `ssr-fallback.html` | SSR render failure skeleton |

## License

MIT
