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


/**
 * Camelize a hyphen-delimited string.
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 */
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind (fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind

/**
 * Convert an Array-like object to a real Array.
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

/**
 * Mix properties into target object.
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
export function noop (a?: any, b?: any, c?: any) {}

/**
 * Always return false.
 */
export const no = (a?: any, b?: any, c?: any) => false

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
export const identity = (_: any) => _

/**
 * Generate a string containing static keys from compiler modules.
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
export function looseEqual (a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
