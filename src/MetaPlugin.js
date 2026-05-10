import { compile, preprocess } from 'svelte/compiler'
import { transform } from 'esbuild'
import path from 'path'
import fs from 'fs'

/**
 * esbuild 插件：提取 Svelte 组件元信息
 * 支持 ?meta 后缀导入，返回组件的 props、源码等信息
 *
 * @param {{ sassModule?: any }} options
 *
 * @example
 * ```js
 * import meta from './Button.svelte?meta'
 * // meta = { source, props: [...], filename, ... }
 * ```
 */
export function metaPlugin(options = {}) {
    return {
        name: 'svelte-meta',
        setup(build) {
            // 拦截 ?meta 后缀的 .svelte 导入
            build.onResolve({ filter: /\.svelte\?meta$/ }, (args) => {
                const filePath = args.path.replace(/\?meta$/, '')
                const resolved = path.isAbsolute(filePath)
                    ? filePath
                    : path.resolve(args.resolveDir, filePath)
                return {
                    path: resolved,
                    namespace: 'svelte-meta',
                    pluginData: { resolveDir: args.resolveDir },
                }
            })

            // 编译并提取元信息
            build.onLoad({ filter: /.*/, namespace: 'svelte-meta' }, async (args) => {
                const source = fs.readFileSync(args.path, 'utf-8')
                const filename = args.path

                // 预处理：TypeScript
                const preprocessors = [
                    {
                        script: async ({ content, attributes }) => {
                            if (attributes.lang !== 'ts' && attributes.lang !== 'typescript') return
                            const result = await transform(content, {
                                loader: 'ts',
                                sourcefile: filename,
                                tsconfigRaw: '{ "compilerOptions": { "verbatimModuleSyntax": true } }',
                            })
                            return { code: result.code }
                        },
                    },
                ]

                // SCSS 预处理
                let sass = options.sassModule
                if (!sass) {
                    try {
                        sass = await import('sass')
                    } catch { /* sass 未安装 */ }
                }
                if (sass) {
                    preprocessors.push({
                        style: ({ content, attributes }) => {
                            if (attributes.lang !== 'scss') return
                            const result = sass.compileString(content, {
                                loadPaths: [path.dirname(filename)],
                            })
                            return { code: result.css }
                        },
                    })
                }

                const preprocessed = await preprocess(source, preprocessors, { filename })

                // 编译提取元信息
                const compiled = compile(preprocessed.code, {
                    filename,
                    generate: 'client',
                    css: 'injected',
                    runes: true,
                    dev: false,
                })

                // 从源码中提取 $props() 定义的属性名（支持多行、类型注解、默认值）
                const propsMatch = source.match(/let\s*\{([\s\S]*?)\}\s*(?::\s*\{[\s\S]*?\})?\s*=\s*\$props\(\)/)
                const props = propsMatch
                    ? propsMatch[1]
                        .split(',')
                        .map((p) => p.trim().split(/[\s=:]/)[0].trim())
                        .filter((p) => p && !p.startsWith('...'))
                    : []

                const meta = {
                    filename: path.basename(filename),
                    source,
                    props,
                    warnings: compiled.warnings.map((w) => ({ code: w.code, message: w.message })),
                    metadata: compiled.metadata || {},
                }

                return {
                    contents: `export default ${JSON.stringify(meta)}`,
                    loader: 'js',
                    resolveDir: args.pluginData?.resolveDir || path.dirname(args.path),
                }
            })
        },
    }
}
