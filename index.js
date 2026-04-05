/**
 * esbuild-loader-svelte
 * esbuild 插件集合：编译 Svelte 5 组件、SCSS 样式、SSR 空桩、源码导入、元信息提取
 */
export { sveltePlugin } from './src/SveltePlugin.js'
export { scssPlugin } from './src/ScssPlugin.js'
export { ssrStubPlugin } from './src/SsrStubPlugin.js'
export { rawPlugin } from './src/RawPlugin.js'
export { metaPlugin } from './src/MetaPlugin.js'
export { obfuscatorPlugin } from './src/ObfuscatorPlugin.js'
export { renderTemplate, readTemplate, setTemplatesDir } from './src/TemplateEngine.js'
