/* @flow */

/*
在开发环境下，debug各种信息
在生产环境下就不需要debug信息了
 */


import { noop } from 'shared/util' //本来是../../shared/util，但是在alias编译的时候已经映射了。引入一个不执操作的空函数，主要是为了一些函数提供默认值，防止undefined的抛出
import config from '../config'

/*
* 1.四个基于空函数派生出来的四个函数只能在非生产环境下使用
* 2.生产环境下也是执行的，但执行的是空函数，这也是为什么先要建立四个空函数，否则会报错
* */

export let warn = noop//提示警告
export let tip = noop
export let generateComponentTrace = (noop: any) // 组件追踪的函数
export let formatComponentName = (noop: any)//归整组件的名称


//在开发环境下起作用，因为在生产环境下不需要打印出提示信息
if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      return '<Root>'
    }
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const repeat = (str, n) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1
    }
    return res
  }

  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      const tree = []
      let currentRecursiveSequence = 0
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1]
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++
            vm = vm.$parent
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence]
            currentRecursiveSequence = 0
          }
        }
        tree.push(vm)
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
        }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
            : formatComponentName(vm)
        }`)
        .join('\n')
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}
