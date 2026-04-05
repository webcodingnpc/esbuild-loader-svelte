import { compile, preprocess } from 'svelte/compiler'
import { transform } from 'esbuild'
import path from 'path'
import fs from 'fs'

/**
 * esbuild 插件：编译 .svelte 文件
 * 使用 svelte/compiler 将 Svelte 5 组件编译为 JS
 * 内置 TypeScript 和 SCSS 预处理
 * @param {{ generate?: 'client' | 'server', sassModule?: any, filterWarnings?: (code: string) => boolean }} options
 */
export function sveltePlugin(options = {}) {
    const generate = options.generate || 'client'
    const filterWarnings = options.filterWarnings || ((code) =>
        code?.startsWith('a11y_') || code === 'state_referenced_locally'
    )

    return {
        name: 'svelte',
        setup(build) {
            // 解析 .svelte 文件
            build.onResolve({ filter: /\.svelte$/ }, (args) => ({
                path: path.isAbsolute(args.path)
                    ? args.path
                    : path.resolve(args.resolveDir, args.path),
                namespace: 'file',
            }))

            // 编译 .svelte 文件
            build.onLoad({ filter: /\.svelte$/ }, async (args) => {
                const source = fs.readFileSync(args.path, 'utf-8')
                const filename = args.path

                // 预处理：TypeScript + SCSS
                const preprocessors = [
                    // TypeScript 预处理
                    {
                        script: async ({ content, attributes }) => {
                            if (attributes.lang !== 'ts') return
                            const result = await transform(content, {
                                loader: 'ts',
                                tsconfigRaw: '{ "compilerOptions": { "verbatimModuleSyntax": true } }',
                            })
                            return { code: result.code }
                        },
                    },
                ]

                // SCSS 预处理（需要安装 sass）
                let sass = options.sassModule
                if (!sass) {
                    try {
                        sass = await import('sass')
                    } catch {
                        // sass 未安装，跳过 SCSS 预处理
                    }
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

                // 编译 Svelte 组件
                const compiled = compile(preprocessed.code, {
                    filename,
                    generate,
                    css: 'injected',
                    runes: true,
                    dev: false,
                })

                // 输出编译警告（根据过滤函数过滤）
                for (const warning of compiled.warnings) {
                    if (filterWarnings(warning.code)) continue
                    console.warn(`[svelte] ${filename}: ${warning.message}`)
                }

                return {
                    contents: compiled.js.code,
                    loader: 'js',
                    resolveDir: path.dirname(args.path),
                }
            })
        },
    }
}
