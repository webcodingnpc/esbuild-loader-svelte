import path from 'path'
import { readTemplate } from './TemplateEngine.js'

// 启动时一次性读取模板，避免重复 IO
const jsStubCode = readTemplate('ssr-stub.js')
const svelteStubCode = readTemplate('ssr-stub-svelte.js')

/**
 * esbuild 插件：SSR 构建时替换浏览器专属模块为空桩
 * 路由模块依赖 window/history 等浏览器 API，SSR 阶段需要跳过
 * .svelte 文件返回 Svelte 5 SSR 空组件桩，普通 JS 返回路由空桩
 * @param {string[]} stubPaths — 匹配的路径片段列表
 */
export function ssrStubPlugin(stubPaths = []) {
    return {
        name: 'ssr-stub',
        setup(build) {
            // 拦截 .svelte 文件（优先匹配，返回 SSR 空组件桩）
            build.onResolve({ filter: /\.svelte$/ }, (args) => {
                const resolved = path.isAbsolute(args.path)
                    ? args.path
                    : path.resolve(args.resolveDir || '', args.path)
                const normalised = resolved.replace(/\\/g, '/')

                for (const stub of stubPaths) {
                    if (normalised.includes(stub)) {
                        return { path: normalised, namespace: 'ssr-stub-svelte' }
                    }
                }
            })

            // 拦截普通 JS 模块（路由等）
            build.onResolve({ filter: /.*/ }, (args) => {
                const resolved = path.isAbsolute(args.path)
                    ? args.path
                    : path.resolve(args.resolveDir || '', args.path)
                const normalised = resolved.replace(/\\/g, '/')

                for (const stub of stubPaths) {
                    if (normalised.includes(stub)) {
                        return { path: normalised, namespace: 'ssr-stub' }
                    }
                }
            })

            // 普通 JS 模块空桩（路由等）— 从模板文件加载
            build.onLoad({ filter: /.*/, namespace: 'ssr-stub' }, () => ({
                contents: jsStubCode,
                loader: 'js',
            }))

            // Svelte 组件空桩（SSR 模式下返回空渲染函数）— 从模板文件加载
            build.onLoad({ filter: /.*/, namespace: 'ssr-stub-svelte' }, () => ({
                contents: svelteStubCode,
                loader: 'js',
            }))
        },
    }
}
