/**
 * esbuild-loader-svelte 构建脚本
 * 输出 ESM (.mjs) + CJS (.cjs) + 模板文件
 */
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const SRC_TEMPLATES = path.join(ROOT, 'src', 'templates')
const DIST_TEMPLATES = path.join(DIST, 'templates')

if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true })
}
fs.mkdirSync(DIST, { recursive: true })

// 复制模板文件到 dist（运行时需要读取）
fs.mkdirSync(DIST_TEMPLATES, { recursive: true })
for (const file of fs.readdirSync(SRC_TEMPLATES)) {
    fs.copyFileSync(path.join(SRC_TEMPLATES, file), path.join(DIST_TEMPLATES, file))
}
console.log(`  📄 已复制 ${fs.readdirSync(SRC_TEMPLATES).length} 个模板文件到 dist/templates/`)

const commonOptions = {
    entryPoints: [path.join(ROOT, 'index.js')],
    bundle: true,
    external: ['esbuild', 'svelte', 'svelte/*', 'sass', 'javascript-obfuscator', 'path', 'fs', 'url'],
    platform: 'node',
    target: 'node18',
    logLevel: 'info',
}

console.log('🔨 构建 esbuild-loader-svelte...\n')

// ESM
await esbuild.build({
    ...commonOptions,
    format: 'esm',
    outfile: path.join(DIST, 'index.mjs'),
})

// CJS
await esbuild.build({
    ...commonOptions,
    format: 'cjs',
    outfile: path.join(DIST, 'index.cjs'),
})

console.log('\n✅ 构建完成！')
