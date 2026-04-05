// SSR 空桩：浏览器专属模块在服务端渲染时不可用
export const router = {
    push() { },
    replace() { },
    back() { },
    forward() { },
    go() { },
    beforeEach() { return () => { } },
    current: {
        subscribe(fn) {
            fn({ path: '/', name: '', params: {}, query: {}, meta: {}, matched: null })
            return () => { }
        },
    },
    routes: [],
    init() { },
    destroy() { },
}
export default {}
