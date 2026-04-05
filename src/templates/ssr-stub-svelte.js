// SSR 空桩：Svelte 组件在服务端渲染时返回空内容
export default function SsrStubComponent($$payload) {
    $$payload.out += '<!-- ssr-stub -->'
}
