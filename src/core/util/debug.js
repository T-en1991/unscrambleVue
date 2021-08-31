/* @flow */

/*
在开发环境下，debug各种信息
在生产环境下就不需要debug信息了

该文件就是处理warn和error信息在console中的打印，打印的组件不能有连字符

 */


import { noop } from 'shared/util' //本来是../../shared/util，但是在alias编译的时候已经映射了。引入一个不执操作的空函数，主要是为了一些函数提供默认值，防止undefined的抛出
import config from '../config'

/*
* 1.四个基于空函数派生出来的四个函数只能在非生产环境下使用
* 2.生产环境下也是执行的，但执行的是空函数，这也是为什么先要建立四个空函数，否则会报错
* */

export let warn = noop//提示错误
export let tip = noop//提示警告
export let generateComponentTrace = (noop: any) // 组件追踪的函数
export let formatComponentName = (noop: any)//归整组件的名称


//在开发环境下起作用，因为在生产环境下不需要打印出提示信息
if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'//判断当前环境是否具有console的函数
  //作用：将连字符后面的字母转换为大写且去掉连字符，my-div=====>myDiv
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  //错误打印函数
  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  //警告打印函数
  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

//函数作用：定位到报错的组件，如果你在组件里面定义了name属性值，会取这个值，否则会匹配文件名
//vm:组件实例，includeFile：是否在组件里面包含文件地址
  formatComponentName = (vm, includeFile) => {
    //如果是根组件，直接返回<Root>
    if (vm.$root === vm) {
      return '<Root>'
    }
    /*
    为什么有可能是function
    TODO
     */
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag//
    const file = options.__file//非生产环境下，vue-loader会注入一个__file的字段，来提升调试体验
    if (!name && file) {
      //如果不存在组件name和file，解析路径获取名字
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }


  /*
重复指定的字符串数量
repeat('ab',3)===>'ababab'
 */
  const repeat = (str, n) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1
    }
    return res
  }


  //组件追踪树
  /*
  获取传入的组件的追踪链，以便于定位当前组件所在的层级和结构
  通俗的将就是，一个组件有问题了，你需要将它打印在console面板，并且要把他的父级调用，祖辈调用全找出来
  找到一个就放tree的数组中，直到这一个和上一个的实例的constructor相等，那就没有了
  有父级调用链以后，根据想要打印出来的样式进行打印即可
   */

  generateComponentTrace = vm => {
    //该组件是否是vue实例，且他有父组件
    if (vm._isVue && vm.$parent) {
      const tree = []
      let currentRecursiveSequence = 0//当前循环的序列号
      while (vm) {
        //当结构树中存在一个大的实例的时候
        if (tree.length > 0) {
          const last = tree[tree.length - 1]//去除当前结构书里面最上一级的实例
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++
            vm = vm.$parent
            //如果一直没有回溯到根节点，name这里会一直循环，一单循环次数过多，会自动报栈溢出错误
            continue
          } else if (currentRecursiveSequence > 0) {
            //循环次数大于0，下一次循环的时候就重置
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
        .join('\n')//每条数据都用换行符连接
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}
