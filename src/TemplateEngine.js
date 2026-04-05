import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 定位模板目录（ESM 环境使用 import.meta.url，CJS 回退到 __dirname）
function resolveTemplatesDir() {
    try {
        if (import.meta.url) {
            return path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates')
        }
    } catch { /* CJS 环境无 import.meta */ }
    // CJS 回退：esbuild 打包后 __dirname 指向 dist/
    if (typeof __dirname !== 'undefined') {
        return path.join(__dirname, 'templates')
    }
    return path.join(process.cwd(), 'node_modules', 'esbuild-loader-svelte', 'src', 'templates')
}

let _templatesDir = null

/** 获取模板目录（支持自定义覆盖） */
function getTemplatesDir() {
    if (!_templatesDir) _templatesDir = resolveTemplatesDir()
    return _templatesDir
}

/**
 * 设置自定义模板目录
 * @param {string} dir — 模板文件所在目录
 */
export function setTemplatesDir(dir) {
    _templatesDir = dir
}

/**
 * 读取模板文件并替换占位符
 * 占位符格式：{{KEY}}
 * @param {string} name — 模板文件名（如 'html.html'、'client-entry.js'）
 * @param {Record<string, string>} vars — 替换变量
 * @returns {string}
 */
export function renderTemplate(name, vars = {}) {
    const tplPath = path.join(getTemplatesDir(), name)
    let content = fs.readFileSync(tplPath, 'utf-8')
    for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{{${key}}}`, value)
    }
    return content
}

/**
 * 读取模板文件原始内容
 * @param {string} name — 模板文件名
 * @returns {string}
 */
export function readTemplate(name) {
    return fs.readFileSync(path.join(getTemplatesDir(), name), 'utf-8')
}
