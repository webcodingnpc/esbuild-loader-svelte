// SSR 环境下提供浏览器 API 空桩，防止部分组件顶层代码报错
if (typeof globalThis.document === 'undefined') {
    const noop = () => { }
    globalThis.document = {
        getElementById: () => null,
        createElement: () => ({ style: {}, appendChild: noop }),
        body: { appendChild: noop, style: {} },
        head: { appendChild: noop },
        documentElement: { style: {} },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: noop,
        removeEventListener: noop,
    }
}
if (typeof globalThis.window === 'undefined') {
    const noop = () => { }
    globalThis.window = {
        addEventListener: noop,
        removeEventListener: noop,
        getComputedStyle: () => new Proxy({}, { get: () => '' }),
        innerWidth: 1024,
        innerHeight: 768,
        document: globalThis.document,
        navigator: { userAgent: '' },
    }
}

import { render } from 'svelte/server'
import App from '{{VIEW_PATH}}'

const result = render(App)
export const body = result.body
export const head = result.head
