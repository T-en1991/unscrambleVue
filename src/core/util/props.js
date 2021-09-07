/* @flow */

//值得校验，props是否有效的

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from 'shared/util'

//props必要参数
type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function
};
//校验props的值
export function validateProp (
  key: string,//索引
  propOptions: Object,//props的选项
  propsData: Object,//props的数据源
  vm?: Component//vue的实例
): any {
  const prop = propOptions[key]//取出对应key的props的选项数据
  const absent = !hasOwn(propsData, key)//判断这个key在目标对象里面
  let value = propsData[key]//取出值
  // boolean casting
  const booleanIndex = getTypeIndex(Boolean, prop.type)//
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      //如果父组件调用子组件时，没有传入子组件所需要的prop的值，并且prop中没有定义默认值，那么此时就会返回一个false
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      //<component :a='' my-attr  />
      const stringIndex = getTypeIndex(String, prop.type)//判断props的tye里面是否存在字符串类型
      //type：【number，boolean，string】
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        //如果传进来的值里面，符合空字符串或是连字符串，那么在预期类型里面不包含字符串类型或是预期的多个类型里面布尔类型的优先级高于字符串了下，会把字符串类型转换为布尔类型
        value = true
      }
    }
  }
  // check default value
  //如果预期类型里面没有布尔值，而且用户又没有传进来一个具体的props的数据值得时候
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key)//获取默认值
/*
1.预留当前全局的监听状态
2.无论当前的监听状态如何，都开启监听状态
3.监听所求取的默认值
4.切换回原来的全局监听状态
 */
    const prevShouldObserve = shouldObserve//获取之前的监听状态
    toggleObserving(true)
    observe(value)
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    assertProp(prop, key, value, vm, absent)//判断prop是否是有效
  }
  return value
}

/**
当value的值为undefined时
 说明父组件根本没有传过来这个prop
 那么我们需要通过下面这个函数来获取prop的默认值

 */

function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default//获取default字段的值
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&//当有实例，且该实例在辈出回话的时候传入prop的值，并且指定key又没有完全传
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
    // 如果type 标记的不是函数，说明这个props的函数是为了去执行之后返回一个真正的默认的值得工具函数
    //如果传的就是一个函数，并且type也是，说明要的就是函数，返回即可
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * 判断prop是否有效
 */
function assertProp (
  prop: PropOptions,
  name: string,
  value: any,
  vm: ?Component,
  absent: boolean
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    )
    return
  }
  if (value == null && !prop.required) {
    return
  }
  let type = prop.type
  let valid = !type || type === true
  const expectedTypes = []
  if (type) {
    if (!Array.isArray(type)) {
      type = [type]
    }
    for (let i = 0; i < type.length && !valid; i++) {
      const assertedType = assertType(value, type[i], vm)
      expectedTypes.push(assertedType.expectedType || '')
      valid = assertedType.valid
    }
  }

  const haveExpectedTypes = expectedTypes.some(t => t)
  if (!valid && haveExpectedTypes) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    )
    return
  }
  const validator = prop.validator
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      )
    }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/

function assertType (value: any, type: Function, vm: ?Component): {
  valid: boolean;
  expectedType: string;
} {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    try {
      valid = value instanceof type
    } catch (e) {
      warn('Invalid prop type: "' + String(type) + '" is not a constructor', vm);
      valid = false;
    }
  }
  return {
    valid,
    expectedType
  }
}

const functionTypeCheckRE = /^\s*function (\w+)/

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE)
  return match ? match[1] : ''
}
//判断是不是相同类型
function isSameType (a, b) {
  return getType(a) === getType(b)
}
//获取类型索引
function getTypeIndex (type, expectedTypes): number {
  if (!Array.isArray(expectedTypes)) {
    //如果期望的类型不是数组
    return isSameType(expectedTypes, type) ? 0 : -1//一致的话返回0，不然返回-1
  }
  //如果期望的是一个数组的话，那么只需要传入值得类型与期望类型的其中一个进行匹配，那么就返回
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}
//获取不可用prop类型的信息
function getInvalidTypeMessage (name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
    //我们的期望类型是【type1,type2,t3,t4】，我们那实际的类型是xxx 不符合规定
  const expectedType = expectedTypes[0]//获取期望的第一个
  const receivedType = toRawType(value)//获取数据的原始类型
  // check if we need to specify expected value
  if (
    expectedTypes.length === 1 &&//当期望类型本身只有一个的时候
      //期望类型和接收到的类型都是可解释类型，但又不是布尔
    isExplicable(expectedType) &&
    isExplicable(typeof value) &&
    !isBoolean(expectedType, receivedType)
  ) {
    message += ` with value ${styleValue(value, expectedType)}`//期望得到什么值
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${styleValue(value, receivedType)}.`
  }
  return message
}
//格式化
function styleValue (value, type) {
  //根据type的几种类型，把value转换成对应的值类型
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

const EXPLICABLE_TYPES = ['string', 'number', 'boolean']//预设的可解释类型
function isExplicable (value) {
  //判断是否是可解释类型，只要符合其中一项
  return EXPLICABLE_TYPES.some(elem => value.toLowerCase() === elem)
}
//判断是否是布尔值
function isBoolean (...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
