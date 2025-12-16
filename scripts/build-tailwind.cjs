const fs = require('fs')
const path = require('path')
const postcss = require('postcss')
const tailwind = require('tailwindcss')
const autoprefixer = require('autoprefixer')

async function build() {
  const inputPath = path.resolve(__dirname, '../src/index.css')
  const outPath = path.resolve(__dirname, '../dist/tailwind.css')
  const css = fs.readFileSync(inputPath, 'utf8')
  try {
    const result = await postcss([ tailwind(), autoprefixer() ]).process(css, { from: inputPath, to: outPath })
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, result.css, 'utf8')
    console.log('Wrote', outPath)
  } catch (err) {
    console.error('PostCSS build failed:')
    console.error(err.stack || err)
    process.exit(1)
  }
}

build()
