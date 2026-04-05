import path from 'path'
import fs from 'fs'

/**
 * esbuild 插件：编译 .scss 文件
 * 将 SCSS 转换为 CSS 供 esbuild 处理
 * @param {{ sassModule?: any }} options
 */
export function scssPlugin(options = {}) {
    return {
        name: 'scss',
        setup(build) {
            let sass = options.sassModule

            build.onResolve({ filter: /\.scss$/ }, (args) => ({
                path: path.isAbsolute(args.path)
                    ? args.path
                    : path.resolve(args.resolveDir, args.path),
                namespace: 'file',
            }))

            build.onLoad({ filter: /\.scss$/ }, async (args) => {
                if (!sass) {
                    try {
                        sass = await import('sass')
                    } catch {
                        throw new Error('sass 未安装，请运行 npm install sass')
                    }
                }

                const result = sass.compile(args.path, {
                    loadPaths: [path.dirname(args.path)],
                })
                return {
                    contents: result.css,
                    loader: 'css',
                    resolveDir: path.dirname(args.path),
                }
            })
        },
    }
}
