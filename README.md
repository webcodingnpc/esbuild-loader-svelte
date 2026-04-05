# esbuild-loader-svelte

esbuild 插件集合，用于编译 **Svelte 5** 组件、SCSS 样式、SSR 空桩替换、源码导入和元信息提取。

## 特性

- **sveltePlugin** — 编译 `.svelte` 文件，支持 TypeScript 和 SCSS 预处理
- **scssPlugin** — 编译 `.scss` 文件为 CSS
- **ssrStubPlugin** — SSR 构建时将浏览器专属模块替换为空桩（使用外部模板文件）
- **rawPlugin** — 以原始文本方式导入文件（`?raw` 后缀），适用于代码展示
- **metaPlugin** — 提取 Svelte 组件元信息（`?meta` 后缀），包括 props、源码等
- **renderTemplate / readTemplate** — 模板引擎，读取并渲染 `{{KEY}}` 占位符模板
- 兼容 **CommonJS** 和 **ES Modules**
- 支持 Svelte 5 Runes 模式

## 安装

```bash
npm install esbuild-loader-svelte esbuild svelte --save-dev
# SCSS 支持（可选）
npm install sass --save-dev
```

## 使用

### 全量引入

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

### 按需引入

```js
import { sveltePlugin } from 'esbuild-loader-svelte/svelte'
import { scssPlugin } from 'esbuild-loader-svelte/scss'
import { rawPlugin } from 'esbuild-loader-svelte/raw'
import { metaPlugin } from 'esbuild-loader-svelte/meta'
import { renderTemplate } from 'esbuild-loader-svelte/templates'
```

### CommonJS

```js
const { sveltePlugin, scssPlugin, rawPlugin, metaPlugin } = require('esbuild-loader-svelte')
```

## API

### `sveltePlugin(options?)`

编译 `.svelte` 文件为 JavaScript。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `generate` | `'client' \| 'server'` | `'client'` | 编译模式 |
| `sassModule` | `object` | 自动导入 | 手动传入 sass 模块 |
| `filterWarnings` | `(code: string) => boolean` | 过滤 a11y 警告 | 返回 `true` 则静默该警告 |

### `scssPlugin(options?)`

编译 `.scss` 文件为 CSS。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sassModule` | `object` | 自动导入 | 手动传入 sass 模块 |

### `ssrStubPlugin(stubPaths)`

SSR 构建时将指定路径的模块替换为空桩。桩代码来自外部模板文件（`src/templates/`），不再使用内联字符串。

| 参数 | 类型 | 说明 |
|------|------|------|
| `stubPaths` | `string[]` | 匹配的路径片段，命中则替换为空桩 |

```js
// 示例：SSR 构建时跳过路由和某些组件
ssrStubPlugin(['src/router', 'views/HeavyComponent'])
```

### `rawPlugin()`

以原始文本方式导入文件，适用于代码展示场景。

```js
// 构建配置
plugins: [rawPlugin()]

// 使用：在代码中通过 ?raw 后缀导入
import buttonCode from './Button.svelte?raw'
// buttonCode 是 Button.svelte 的完整源码字符串

// 在 DemoBlock 中使用
<DemoBlock title="按钮" code={buttonCode}>
    <Button type="primary">主要按钮</Button>
</DemoBlock>
```

### `metaPlugin(options?)`

提取 Svelte 组件的元信息，包括 props、源码、编译警告等。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sassModule` | `object` | 自动导入 | 手动传入 sass 模块 |

```js
// 构建配置
plugins: [metaPlugin()]

// 使用：在代码中通过 ?meta 后缀导入
import meta from './Button.svelte?meta'
// meta = {
//   filename: 'Button.svelte',
//   source: '完整源码',
//   props: ['type', 'size', 'disabled', ...],
//   warnings: [...],
//   metadata: { ... }
// }
```

### `renderTemplate(name, vars)`

读取模板文件并替换 `{{KEY}}` 占位符。

```js
import { renderTemplate } from 'esbuild-loader-svelte'

const html = renderTemplate('html.html', {
    TITLE: '页面标题',
    JS_FILE: 'main.abc123.js',
    CSS_LINK: '<link rel="stylesheet" href="./assets/style.css" />',
    SSR_HEAD: '',
    SSR_BODY: '<div>预渲染内容</div>',
})
```

### `readTemplate(name)`

读取模板文件原始内容（不替换占位符）。

### `setTemplatesDir(dir)`

设置自定义模板目录，用于覆盖默认模板。

```js
import { setTemplatesDir } from 'esbuild-loader-svelte'
setTemplatesDir('/path/to/my/templates')
```

## 内置模板文件

| 文件名 | 用途 |
|--------|------|
| `html.html` | HTML 页面模板 |
| `client-entry.js` | 客户端入口模板 |
| `ssr-entry.js` | SSR 入口模板（含浏览器 API 空桩） |
| `ssr-stub.js` | JS 模块空桩（路由等） |
| `ssr-stub-svelte.js` | Svelte 组件空桩 |
| `ssr-fallback.html` | SSR 渲染失败时的骨架屏 |

## License

MIT
