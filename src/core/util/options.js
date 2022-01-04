/* @flow */
/*
所有和选项相关的合并方法，data，watch，filter，methods等等
设计流程
1.针对不同的option，不同的key取什么的合并策略，data，watch，filter，set，hooks等
2.合并之前做一些前置策略，检查名称是不是对的，像props，inject，directive有不同的写法的，进行统一
3.正式合并，判断是否是合规组件，格式化，采取什么策略进行合并
 */

import config from '../config'//导入配置信息
import { warn } from './debug'//导入报错函数
import { set } from '../observer/index'//导入响应式数据里面的set函数
import { unicodeRegExp } from './lang'//导入unicode字符集的校验正则
import { nativeWatch, hasSymbol } from './env'//判断当前程序宿主环境的一些方法

import {
  ASSET_TYPES,//自定义资源类别：自定义组件，自定义指令，自定义过滤器
  LIFECYCLE_HOOKS//生命周期的钩子函数
} from 'shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
const strats = config.optionMergeStrategies//选项合并策略

/**
 * Options with restrictions
 */
//有限制的选项
if (process.env.NODE_ENV !== 'production') {
  //合并策略的element选项和propsData选项采用同一个函数
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      //如果没有vm实例
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 */
//将两个数据对象递归的合并在一起
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to//如果不存在from数据，直接返回to
  let key, toVal, fromVal

  //判断有没有symbol，因为也可能是symbol数据
  //如果存在就有可能在数据对象里面有某些字段key是symbol，所以用reflect.ownkeys()来获取所有key，如果不存在，那就用Object.keys就可以了
  //symbol也是可以相等，进行合并的，symbol.for()就可以
  const keys = hasSymbol
    ? Reflect.ownKeys(from)//Reflect.ownKeys(a)相当于Object.getOwnPropertySymbols(a)【用于找出symbol对象】及Object.getOwnPropertyNames(a)【找出除symbol对象】之和
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    //判断有些属性是不需要合并的
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    //如果目标对象没有key的目标属性，直接set，set：相当于this.$set，merge了一个值并且响应式
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (
      //合并的逻辑，let a={x:{y:1}}  let b={x:{z:1}}===========>c={x:{y:1,z:1}}
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal)
    }
    //这里其实还有一个逻辑没处理，比如，两个中的key相同，那就直接用子的
  }
  return to
}

/**
 * Data
 */
//vue.2x中的data是对象或者是函数
//vue3.x中的data是函数
export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    //如果vm实例不存在的话
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    //如果实例不存在但是数据都存在，则返回数据合并的函数
    return function mergedDataFn () {
      //可能性较多
      /*
      obj--->obj
      obj--->fn
      fn---->fn
      fn---->obj

      data(){
        return{
          x:1,
          y:2,
          z:this.x+this.y
        }
      }
       */
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      //实例的数据合并，和上面的逻辑差不多
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

//
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    //如果vm实例不存在，当子数据存在但不为函数时，compontent中的data需要为函数
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 */
//钩子函数的合并，create，mounted等
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal//如果子数据存在且父数据也存在，以父为基础，数组合并。如果父数据不存在，则判断子是不是数组，是返回，否则改造为数组
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res//res是否存在
    ? dedupeHooks(res)//存在去重
    : res//不存在直接返回undefined
}
//hooks数组去重
function dedupeHooks (hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */

/*
当vm存在，我们需要在构造函数选项，实例选项，和复选项之间进行三项合并
 */

function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)//存在父数据，根据父数据派生出一个新对象
  if (childVal) {
    //当处于开发环境时，断言key确实是可以访问的
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)//拓展数据，如果目标对象里存在key，直接覆盖，子覆盖父
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
//watchers字段函数数据是不能直接被覆盖，最好正对某一个数据的变化，有点像addeventlistener我们可以去激活依一系列的函数
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // 判断一下watch是否是火狐自带的，火狐自带watch
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  //如果子数据不存在，则直接返回一个派生自父数据的新数据对象，因为这里是需要将父合并到子，创建后才能合并
  if (!childVal) return Object.create(parentVal || null)
  if (process.env.NODE_ENV !== 'production') {
    //首先是按断子数据的数据是不是对象，能不能做出objec.key的操作
    assertObjectType(key, childVal, vm)
  }
  //如果父数据不存在，直接返回子
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)//先把父数据拓展到这个新的空数据对象上面
  for (const key in childVal) {
    //对子数据进行遍历
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {

      parent = [parent]//取出父数据里面与当前子数据key同名的字段
    }
    ret[key] = parent
      ? parent.concat(child)//此时parent存在的话，那必然是一个数组，所以无论子数据是否是素组，都可以直接进行contact操作
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * Other object hashes.
 */
//props、methods、inject、computed属性选项的合并
strats.props =
  strats.methods =
    strats.inject =
      strats.computed = function (
        parentVal: ?Object,
        childVal: ?Object,
        vm?: Component,
        key: string
      ): ?Object {
        if (childVal && process.env.NODE_ENV !== 'production') {
          //子数据存在，且当前处于开发环境
          assertObjectType(key, childVal, vm)
        }
        if (!parentVal) return childVal
        const ret = Object.create(null)
        extend(ret, parentVal)
        if (childVal) extend(ret, childVal)
        return ret
      }
strats.provide = mergeDataOrFn//provide使用mergeDataOrFn

/**
 * Default strategy.
 */
//子覆盖父
const defaultStrat = function (parentVal: any, childVal: any): any {
  //子数据有则子，子数据无，就父数据
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names
 */
//合并component选项
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

//校验合法的component名字
export function validateComponentName (name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
//格式化props
/*
props有两种基本大类

数据类：props:['title','name']
对象类：props:{
          title:{
            type:String,
            default:''
                }
            }
 */
function normalizeProps (options: Object, vm: ?Component) {
  //获取vm和选项数据
  const props = options.props
  if (!props) return//如果不存在props，直接返回
  const res = {}
  let i, val, name
  //如果props是数组格式的时候
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)//连字符转换成驼峰
        res[name] = { type: null }
        //对于采用数组字符串格式props，统一转化成对象，并且type设置为null
        //后面是无法检测props是否传入的与预期的不符合
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    //如果props是对象格式
    for (const key in props) {
      val = props[key]
      name = camelize(key)//获取props key的数组，驼峰转化
      res[name] = isPlainObject(val)//不是对象转化为对象
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 */
//格式化inject，如同normalizeProps逻辑
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
格式化  指令
 directive
 两种基本格式：
 1：由几个钩子函数组成的对象
 2：单独函数
 最终格式化，格式化成一个包含钩子函数的对象
 directives={
  [key:string]:{
  bind:function,
  update:function,
  inserted?:function,
  componentUpdated?:function,
  unbind?:function
  }
 }
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      //directive的两种用法，一种是对象，则直接满足要求。一种是方法方法中只有bind和update
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

//断言变量类型
function assertObjectType (name: string, value: any, vm: ?Component) {
  //判断是否是对象
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
将两个options对象合并到一个新的对象中间，用于哪些实例化或是继承vue
 */
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    //如果处于开发环境，需要检查一下child里面的组件是否合理
    checkComponents(child)
  }

  if (typeof child === 'function') {
    //如果传入的child是一个函数，而不是一个对象，name则使用函数的options属性
    child = child.options
  }

  normalizeProps(child, vm)//检查props
  normalizeInject(child, vm)//检查inject
  normalizeDirectives(child)//检查指令

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  //在子选项都合规后，再来执行合并操作
  //为了达到这样的效果，我们可以给mergeOptions的选项做一个标记，_base
  //并且如果存在了extend或是mixins的属性，则进行递归处理
  if (!child._base) {
    //当child不存在_base属性的时候才进行处理
    if (child.extends) {
      //如果存在extends属性，则直接吧extends作为对象，与parent进行合并
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      //如果存在mixins属性，则挨个把mixins的单个项目与parent合并
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
    //mixins会覆盖extends
  }

  const options = {}//存储最终合并结果
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    //先父后子，当父选项中没有key时，说明没有对这个key的父子数据进行操作，如果有说明已经合并过一次了，我们就不需要重复操作
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)//采用专门的策略来进行处理
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
//解析资源，使用这个函数使子实例可以访问到祖先是咧中定义的资源数据
//这里面对id进行了一个拓展，可以使得我们再祖册组建的时候，可以写成连字符，驼峰，或是字母大小写的形式，最后将组件构造器返回
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  //如果资源不存在，直接返回
  if (typeof id !== 'string') {
    return
  }
  //如果不能直接用id来拿，那么我们就要做一些兼容处理
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  //解析失败
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}

//20.1---22.1
