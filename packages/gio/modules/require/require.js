import resolvePath from 'resolve'
import fs from 'fs'

import babel from 'babel-core'
import babelTransformGio from 'babel-plugin-transform-gio'

export function resolve (module) {
  return fs.readFileSync(
    resolvePath.sync(module),
    { encoding: 'utf8' }
  )
}

export function transform (code, transform = babel.transform, gioPlugin = babelTransformGio) {
  return transform(code, {
      plugins: [
        gioPlugin(babel)
      ]
    })
}