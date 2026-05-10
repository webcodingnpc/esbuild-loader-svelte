import { compile, compileModule, preprocess } from 'svelte/compiler'
import { transform } from 'esbuild'
import path from 'path'
import fs from 'fs'

/**
 * esbuild 插件：编译 .svelte 文件
 * 使用 svelte/compiler 将 Svelte 5 组件编译为 JS
 * 内置 TypeScript 和 SCSS 预处理
 * @param {{
 *   generate?: 'client' | 'server',
 *   sassModule?: any,
 *   filterWarnings?: (code: string) => boolean,
 *   dev?: boolean,
 *   runes?: boolean,
 *   css?: 'injected' | 'external' | 'none',
 *   sourcemap?: boolean,
 * }} options
 */
export function sveltePlugin(options = {}) {
    const generate = options.generate || 'client'
    const dev = options.dev ?? false
    const runes = options.runes ?? true
    const css = options.css ?? 'injected'
    const sourcemap = options.sourcemap ?? false
    const filterWarnings = options.filterWarnings || ((code) =>
        code?.startsWith('a11y_') || code === 'state_referenced_locally'
    )

    return {
        name: 'svelte',
        setup(build) {
            // 解析 .svelte 文件（同时支持 .svelte.ts 模块）
            build.onResolve({ filter: /\.svelte$/ }, (args) => {
                const resolved = path.isAbsolute(args.path)
                    ? args.path
                    : path.resolve(args.resolveDir, args.path)

                // 优先匹配 .svelte.ts 模块文件
                if (fs.existsSync(resolved + '.ts')) {
                    return { path: resolved + '.ts', namespace: 'file' }
                }

                return { path: resolved, namespace: 'file' }
            })

            // 编译 .svelte.ts 模块文件（Svelte 5 Runes 模块）
            build.onLoad({ filter: /\.svelte\.ts$/ }, async (args) => {
                const source = fs.readFileSync(args.path, 'utf-8')

                try {
                    // 先用 esbuild 将 TS 转成 JS
                    const tsResult = await transform(source, {
                        loader: 'ts',
                        sourcefile: args.path,
                        sourcemap: sourcemap ? 'inline' : false,
                        tsconfigRaw: '{ "compilerOptions": { "verbatimModuleSyntax": true } }',
                    })

                    // 使用 compileModule 编译 Svelte 模块
                    const compiled = compileModule(tsResult.code, {
                        filename: args.path,
                        generate,
                        dev,
                    })

                    return {
                        contents: compiled.js.code,
                        loader: 'js',
                        resolveDir: path.dirname(args.path),
                    }
                } catch (err) {
                    return {
                        errors: [{
                            text: err.message || String(err),
                            location: { file: args.path },
                        }],
                    }
                }
            })

            // 编译 .svelte 文件
            build.onLoad({ filter: /\.svelte$/ }, async (args) => {
                const source = fs.readFileSync(args.path, 'utf-8')
                const filename = args.path

                try {
                    // 预处理：TypeScript + SCSS
                    const preprocessors = [
                        // TypeScript 预处理
                        {
                            script: async ({ content, attributes }) => {
                                if (attributes.lang !== 'ts' && attributes.lang !== 'typescript') return
                                const result = await transform(content, {
                                    loader: 'ts',
                                    sourcefile: filename,
                                    sourcemap: sourcemap ? 'inline' : false,
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
                        css,
                        runes,
                        dev,
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
                } catch (err) {
                    return {
                        errors: [{
                            text: err.message || String(err),
                            location: { file: filename },
                        }],
                    }
                }
            })
        },
    }
}
