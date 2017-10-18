import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import * as babel from 'babel-core'
import resolvePath from 'resolve'
import babelTransformGio from 'babel-plugin-transform-gio'
import findUp from 'find-up'

const log = cb => (...args) => {
  console.log(...args)
  return cb(...args)
}

const readFileAsync = promisify(fs.readFile)
const resolvePathAsync = promisify(resolvePath)

export function resolve (module, basedir = process.cwd()) {
  return resolvePathAsync(module, { basedir })
    .then(path => readFileAsync(
      path,
      { encoding: 'utf8' }
    ))  
}

function rejectNone(msg) {
  return function (value) {
    if(!value) {
      throw new Error(msg)
    }
    return value
  }
}

export function resolveConfig (basedir = process.cwd(), babelConfigFilename = '.babelrc', debug = console) {
  return findUp(babelConfigFilename, { cwd: basedir })
    .then(rejectNone(`Could not locate the configuration file for Babel:${babelConfigFilename}`))
    .then(path => readFileAsync(
      path,
      { encoding: 'utf8' }
    ))
    .then(config => JSON.parse(config))
    .catch(e => {
      debug.warn(`${e}`)
      return {}
    })
}

export function transform (code, config = {}, babelTransform = babel.transform, gioPlugin = babelTransformGio) {
  return babelTransform(code, {
      ...config,
      plugins: [
        ...(config.plugins || []),
        gioPlugin(babel)
      ]
    })
}