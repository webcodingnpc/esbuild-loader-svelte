// SSR 环境下提供浏览器 API 空桩，防止部分组件顶层代码报错
if (typeof globalThis.document === 'undefined') {
    const noop = () => { }
    globalThis.document = {
        getElementById: () => null,
        createElement: () => ({ style: {}, appendChild: noop, setAttribute: noop, removeAttribute: noop }),
        createTextNode: () => ({}),
        createComment: () => ({}),
        createDocumentFragment: () => ({ appendChild: noop }),
        body: { appendChild: noop, removeChild: noop, style: {} },
        head: { appendChild: noop, removeChild: noop },
        documentElement: { style: {} },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: noop,
        removeEventListener: noop,
        createEvent: () => ({ initEvent: noop }),
        cookie: '',
    }
}
if (typeof globalThis.window === 'undefined') {
    const noop = () => { }
    globalThis.window = {
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: noop,
        getComputedStyle: () => new Proxy({}, { get: () => '' }),
        requestAnimationFrame: (cb) => setTimeout(cb, 16),
        cancelAnimationFrame: (id) => clearTimeout(id),
        matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop }),
        innerWidth: 1024,
        innerHeight: 768,
        scrollX: 0,
        scrollY: 0,
        scrollTo: noop,
        document: globalThis.document,
        navigator: { userAgent: '', language: 'en' },
        location: { href: '', pathname: '/', search: '', hash: '', origin: '' },
        history: { pushState: noop, replaceState: noop, back: noop, forward: noop, go: noop },
        localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop },
        sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop },
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        setInterval: globalThis.setInterval,
        clearInterval: globalThis.clearInterval,
    }
}
if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = { userAgent: '', language: 'en' }
}
if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16)
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}

import { render } from 'svelte/server'
import App from '{{VIEW_PATH}}'

const result = render(App)
export const body = result.body
export const head = result.head
