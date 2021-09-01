/* @flow */

/*
判断各种环境
 */

// 判断环境中是否有__proto__
//构造函数.prototype===实例['__proto__']
export const hasProto = '__proto__' in {}

// Browser environment sniffing 获取浏览器环境
export const inBrowser = typeof window !== 'undefined'//是否处于浏览器环境
export const inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform//是否在weex
export const weexPlatform = inWeex && WXEnvironment.platform.toLowerCase()//如果处于weex中，那么获取平台的名称信息
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()//如果处于浏览器环境，那就获取浏览器代理信息
export const isIE = UA && /msie|trident/.test(UA)//判断是否是ie
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0//判断是否是ie9
export const isEdge = UA && UA.indexOf('edge/') > 0//判断是否是edge
export const isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android')//判断是否是安卓
export const isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios')//判断是否是ios
export const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge//判断是否是chrome
export const isPhantomJS = UA && /phantomjs/.test(UA)//判断是否是无界面的浏览器
export const isFF = UA && UA.match(/firefox\/(\d+)/)//判断是否是火狐

// Firefox has a "watch" function on Object.prototype...
//火狐浏览器在object原型上有一个watch的原生函数，换言之，有这个watch的就是火狐了
export const nativeWatch = ({}).watch

export let supportsPassive = false//是否支持passive

//当在浏览器环境下
if (inBrowser) {
  try {
    //一旦代码有问题，那么不会阻塞其他业务的正常运行
    const opts = {}
    Object.defineProperty(opts, 'passive', ({
      get () {
        /* istanbul ignore next */
        supportsPassive = true
      }
    }: Object)) // https://github.com/facebook/flow/issues/285
    /*
    这里的知识点是，addEventListener的第三个参数不是boolean值，是一个对象，可以参考：https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
    声明一个自定义的'test-passive'，往window上挂了全局事件（虽然这个事件没有什么用）
    执行的函数为null（这个事件不存在，所以以后也不会触发）
    执行opts，获取到passive的时候，说明浏览器是支持paasive的
    知道passive是否可以使用了，那以后在用的时候就可以拿这个变量supportsPassive去嚣张了
    如果使用passive，表示 listener 永远不会调用 preventDefault()，如果仍然调用，客户端会忽略并且抛错
    如果不理解passive和preventDefault()可以补充一下addEventListener知识
    这篇文章讲的也很好，还具体说了，passive的使用场景：https://segmentfault.com/a/1190000022744664
    简单描述一下使用场景就是，当滚动网页的时候，会触发mousewheel默认行为，浏览器是不知道你会不会有preventDefault()的，
    他是执行完code很耗时间后才知道，但是设置了paasive=true时，直接就告诉浏览器，我不会阻止默认行为的，你放心。，你先滚起来
    window.addEventListener("mousewheel", function(e){
      e.preventDefault()
      //code很耗时间
    }, {
      passive: false
    });
     */
    window.addEventListener('test-passive', null, opts)
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
//服务器渲染
let _isServer//判断是否是在服务器渲染的环境下
export const isServerRendering = () => {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server'
    } else {
      _isServer = false
    }
  }
  return _isServer
}

// detect devtools  判断是否开启开发者工具
export const devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__

/* istanbul ignore next */
//判断某个函数是否是原生函数
export function isNative (Ctor: any): boolean {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

//判断环境是否拥有symbol和reflect
export const hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys)

let _Set//存储Set结构的数据结构接口
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  //原生有用原生的
  // use native Set when available.
  _Set = Set
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = class Set implements SimpleSet {
    set: Object;
    constructor () {
      this.set = Object.create(null)
    }
    has (key: string | number) {
      return this.set[key] === true
    }
    add (key: string | number) {
      this.set[key] = true
    }
    clear () {
      this.set = Object.create(null)
    }
  }
}

export interface SimpleSet {
  has(key: string | number): boolean;
  add(key: string | number): mixed;
  clear(): void;
}

export { _Set }
