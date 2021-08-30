/* @flow */

// region emptyObject 暴露出去一个空对象
/*
拓展知识：
创建一个空对象的多种方式
相比  let a={}                  存在a.toString()等方法的，有原型     能被扩展，a.a=123
相比  let b=Object.create(null) 真正的空，没有任何属性及原型   b是存在 b.b=123的,也能被扩展
相比  let c= Object.freeze({})  存在a.toString()等方法的，有原型    但不能被扩展  不能被改变
完全意义上的空    Object.freeze(Object.create(null))
*/

//Object.freeze({})不允许去修改，永远为{}
export const emptyObject = Object.freeze({})
// endregion

// region isUndef 判断一个值是否是未定义（undefined或者null）
export function isUndef (v: any): boolean %checks {
  return v === undefined || v === null
}
// endregion

// region isDef 判断一个值是否是定义（undefined或者null）
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}
// endregion

// region isTrue 判断一个值是否为true（布尔值的true）
export function isTrue (v: any): boolean %checks {
  return v === true
}
// endregion

// region isFalse 判断一个值是否为false（布尔值的false）
export function isFalse (v: any): boolean %checks {
  return v === false
}
// endregion

// region isPrimitive 判断是否为原始类型，字符串，数字，symbol，boolean
export function isPrimitive (value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
// endregion


// region isObject 判断是否为obj
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}
// endregion


//提取对象内置的字符串转换方法，因为有时候对象的toString会是【'object'，'Object'】
const _toString = Object.prototype.toString

// region toRawType Object.prototype.toSting.call(value).slice(8,-1)   Array  Number等
export function toRawType (value: any): string {
  return _toString.call(value).slice(8, -1)
}
// endregion


// region isPlainObject 判断严格对象类型，在这种情况下才是最标准的object，而不是function或者是array等
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}
// endregion

// region isRegExp 判断正则类型
export function isRegExp (v: any): boolean {
  return _toString.call(v) === '[object RegExp]'
}
// endregion


// region isValidArrayIndex 判断一个数组是不是合格的索引值（是自然数，不能无穷大，不能是负数，不能有小数点）
export function isValidArrayIndex (val: any): boolean {
  const n = parseFloat(String(val))//
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}
// endregion

// region isPromise 判断是不是promise对象
//虽然 promise对象 instance of promise为true，但是因为promise在一些浏览器及版本中不存在，所以需要使用如下方式
export function isPromise (val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}
// endregion

// region toString 转换为string
export function toString (val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}
// endregion


// region toNumber 转化为number  返回本身或者数字
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}
// endregion


// region makeMap 创建一个map数据结构
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}
// endregion


// region isBuiltInTag 检查标签是不是vue的内置标签
export const isBuiltInTag = makeMap('slot,component', true)
// endregion

// region isReservedAttribute 检查一个水性是不是vue的保留属性
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')
// endregion

// region remove 删除数组指定项,删除一次
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
// endregion


// region hasOwn 判断某个属性是不是自有属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}
// endregion


// region cached 实现一个缓存函数
//创建一个空对象，闭包，有值return原有的，没有加入新鲜的
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    //已有则用已有的，没有的话新建
    return hit || (cache[str] = fn(str))
  }: any)
}
// endregion


// region camelize 将a-b连字符转换为aB这种小驼峰，并且开启缓存
/*
camelize('kkk-zzz-hhh');   kkkZzzHzz;
replace中的第一个参数是正则表达式时，第二个参数可以是一个函数，可以接受多个参数。其中，第一个参数是捕捉到的内容，第二个参数是捕捉到的组匹配（有多少个组匹配，就有多少个对应的参数）
此外，最后还可以添加两个参数，倒数第二个参数是捕捉到的内容在整个字符串中的位置（比如从第五个位置开始），最后一个参数是原字符串

可以参考这篇文章 https://blog.csdn.net/qq_38694034/article/details/102932092
 */


const camelizeRE = /-(\w)/g;//匹配—后面的所有字符
export const camelize = cached((str: string): string => {
  //这里 _ 是 -(\w)匹配的值 c是(\w)匹配的值
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
// endregion

// region capitalize 首字母大写，并且开启缓存
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)//首字符大写，并且拼接后面的
})
// endregion


// region 将驼峰命名转换成连字符，并且开启缓存
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str: string): string => {
  //$1、$2、...、$99	与 regexp 中的第 1 到第 99 个子表达式相匹配的文本。
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})
// endregion


/* istanbul ignore next */
// region polyfillBind polyfill为了防治目标平台没有对应的接口的兼容操作
/*
bind  把某个函数的执行环境指定到某个对象里去   bind不兼容低版本ie
 */
function polyfillBind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length//fn.length就是形参个数
  return boundFn
}
// endregion


// region bind 根据当前代码环境判断是否支持bind，支持就原生不支持就polyfillBind
function nativeBind (fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}
export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind
// endregion


// region 类数组转换为真数组，而且可以指定转换下标的起始点
/*
类数组：nodeList  arguments
类数组拥有部分数组的功能
 */
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}
// endregion


// region 将指定对象的属性混入到目标对象中，如果目标对象中已存在，则覆盖
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
// endregion


// region toObject 将配置项转换为一个obj   [{x:1},{y:2},{z:3}]====>{x:1,y:2,z:3}
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}
// endregion


/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
// region noop  防呆设计   设计一个空函数，主要作用是给某些需要函数作为参数的搞基函数提供默认值，避免undefined的数据传入
export function noop (a?: any, b?: any, c?: any) {}
// endregion


/**
 * Always return false.
 */
// region no    专门返回no的函数
export const no = (a?: any, b?: any, c?: any) => false
// endregion


/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
// region identity    返回相同值，值得拷贝
export const identity = (_: any) => _
// endregion



/**
 * Generate a string containing static keys from compiler modules.
 */

// region genStaticKeys   从编译模块中生产一个静态的建的字符串
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  //接受一个对象数组，然后取出其中的staticKeys，拼接成一个keys的数组，再喊会这个数组的字符串形式
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}
// endregion


/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */

// region looseEqual  判断两个值是不是相等
/*
1.是不是全等
2.是不是object
3.是不是数组
4.数组比较长度和每一项内容，递归
5.是不是时间
6.对象的长度，和每一key值都相等，递归
 */

export function looseEqual (a: any, b: any): boolean {
  if (a === b) return true//全等则相等
  const isObjectA = isObject(a)//是不是对象
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {//是对象
    try {
      const isArrayA = Array.isArray(a)//是不是数组
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {//是数组
        return a.length === b.length && a.every((e, i) => {
          //比较每一项是不是都相同
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        //时间戳比较
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        //不是数组
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        //两个对象长度一样，且key值一样
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false//步骤出错
    }
  } else if (!isObjectA && !isObjectB) {//如果都不是对象
    return String(a) === String(b)//转成string比较
  } else {
    return false
  }
}
// endregion



/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */

// region looseIndexOf  返回一个数组项目在数组中的索引
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}
// endregion


/**
 * Ensure a function is called only once.
 */
// region 代码片段注释 高级函数工具，只会执行一次的函数
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
// endregion
