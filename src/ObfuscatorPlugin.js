import fs from 'fs'
import path from 'path'

/**
 * esbuild 插件：构建后对 JS 产物进行代码混淆
 * 使用 javascript-obfuscator 对输出的 JS 文件进行混淆处理
 * 支持自定义混淆选项，默认启用高强度混淆
 *
 * @param {{ enabled?: boolean, options?: object }} config
 * - enabled: 是否启用混淆，默认 true
 * - options: javascript-obfuscator 配置项，覆盖默认配置
 *
 * @example
 * ```js
 * import { obfuscatorPlugin } from 'esbuild-loader-svelte'
 *
 * await esbuild.build({
 *   entryPoints: ['src/index.js'],
 *   outdir: 'dist',
 *   plugins: [obfuscatorPlugin()],
 * })
 * ```
 */
export function obfuscatorPlugin(config = {}) {
    const { enabled = true, options = {} } = config

    // 默认混淆配置
    const defaultOptions = {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.7,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        disableConsoleOutput: true,
        log: false,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 1,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersType: 'function',
        renameGlobals: false,
        selfDefending: false,
        identifierNamesGenerator: 'hexadecimal',
        unicodeEscapeSequence: false,
        numbersToExpressions: true,
        simplify: true,
        transformObjectKeys: true,
    }

    const mergedOptions = { ...defaultOptions, ...options }

    return {
        name: 'obfuscator',
        setup(build) {
            if (!enabled) return

            // 动态导入 javascript-obfuscator（可选依赖）
            let JavaScriptObfuscator = null

            build.onEnd(async (result) => {
                if (result.errors.length > 0) return

                // 延迟加载 javascript-obfuscator
                if (!JavaScriptObfuscator) {
                    try {
                        const mod = await import('javascript-obfuscator')
                        JavaScriptObfuscator = mod.default || mod
                    } catch {
                        console.warn('[obfuscator] javascript-obfuscator 未安装，跳过代码混淆。请运行: npm install javascript-obfuscator')
                        return
                    }
                }

                // 获取输出目录
                const outdir = build.initialOptions.outdir
                const outfile = build.initialOptions.outfile
                const outputPaths = []

                if (outdir) {
                    // 从 metafile 获取输出文件
                    if (result.metafile) {
                        for (const outputPath of Object.keys(result.metafile.outputs)) {
                            if (outputPath.endsWith('.js') || outputPath.endsWith('.mjs')) {
                                outputPaths.push(outputPath)
                            }
                        }
                    } else {
                        // 没有 metafile 时，扫描输出目录
                        if (fs.existsSync(outdir)) {
                            const files = fs.readdirSync(outdir)
                            for (const file of files) {
                                if (file.endsWith('.js') || file.endsWith('.mjs')) {
                                    outputPaths.push(path.join(outdir, file))
                                }
                            }
                        }
                    }
                } else if (outfile && (outfile.endsWith('.js') || outfile.endsWith('.mjs'))) {
                    outputPaths.push(outfile)
                }

                // 混淆每个 JS 文件
                for (const jsPath of outputPaths) {
                    const fullPath = path.isAbsolute(jsPath) ? jsPath : path.resolve(jsPath)
                    if (!fs.existsSync(fullPath)) continue

                    const code = fs.readFileSync(fullPath, 'utf-8')
                    const obfuscated = JavaScriptObfuscator.obfuscate(code, mergedOptions)
                    fs.writeFileSync(fullPath, obfuscated.getObfuscatedCode())
                }
            })
        },
    }
}
