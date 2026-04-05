import fs from 'fs'
import path from 'path'

/**
 * esbuild 插件：以原始文本方式导入文件
 * 支持 ?raw 后缀导入，将文件内容作为字符串导出
 * 适用于代码展示场景（如 DemoBlock 的 code 属性）
 *
 * @example
 * ```js
 * import buttonCode from './Button.svelte?raw'
 * // buttonCode 是 Button.svelte 的源码字符串
 * ```
 */
export function rawPlugin() {
    return {
        name: 'raw',
        setup(build) {
            // 拦截 ?raw 后缀的导入
            build.onResolve({ filter: /\?raw$/ }, (args) => {
                const filePath = args.path.replace(/\?raw$/, '')
                const resolved = path.isAbsolute(filePath)
                    ? filePath
                    : path.resolve(args.resolveDir, filePath)
                return {
                    path: resolved,
                    namespace: 'raw-loader',
                    pluginData: { resolveDir: args.resolveDir },
                }
            })

            // 读取文件并作为字符串导出
            build.onLoad({ filter: /.*/, namespace: 'raw-loader' }, (args) => {
                const content = fs.readFileSync(args.path, 'utf-8')
                return {
                    contents: `export default ${JSON.stringify(content)}`,
                    loader: 'js',
                    resolveDir: args.pluginData?.resolveDir || path.dirname(args.path),
                }
            })
        },
    }
}
