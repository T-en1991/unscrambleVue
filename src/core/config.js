/* @flow */
/*
什么时候开启工具
1.是否需要开启警告信息
2.是否需要开启开发工具
 */

import {
  no,//返回false
  noop,//返回空函数
  identity//返回相同的值
} from 'shared/util'

import { LIFECYCLE_HOOKS } from 'shared/constants'

export type Config = {
  // user   用户
  optionMergeStrategies: { [key: string]: Function };//合并策略，比如mixin extends等的选项是怎么合并的
  silent: boolean;//是否开启警告
  productionTip: boolean;//在启动时，是否显示生产模式的提示信息
  performance: boolean;//是记录性能报告数据，对应开发者工具中的performance
  devtools: boolean;//是否开启devtools，一般在生产使禁用
  errorHandler: ?(err: Error, vm: Component, info: string) => void;//当有错误时怎么去处理，观察者错误的处理程序
  warnHandler: ?(msg: string, vm: Component, trace: string) => void;//当有警告时怎么去处理，观察者警告的处理程序
  ignoredElements: Array<string | RegExp>;//忽略某些指定的自定义元素，因为有些第三方标签，开发工具是无法识别的，比如el-button等
  keyCodes: { [key: string]: number | Array<number> };//v-on的自定义用户keycode的别名或是自定义

  // platform   平台
  isReservedTag: (x?: string) => boolean;//检查是否为平台保留的标签，不能自建一个组件叫p,h1啥的，是的话没办法注册成组件
  isReservedAttr: (x?: string) => boolean;//检查是否为保留属性
  parsePlatformTagName: (x: string) => string;//解析特定平台的真实标签名称
  isUnknownElement: (x?: string) => boolean;//检查标签是否是未知元素
  getTagNamespace: (x?: string) => string | void;//获取命名空间名称
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;//必须使用prop

  // private
  async: boolean;//异步执行更新，给vue test utils来使用，如果设置了FALSE，这样的话可以大大的降低性能

  // legacy     保持和祖传代码统一
  _lifecycleHooks: Array<string>;//生命周期钩子数组
};

export default ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),//创建的一个是原子，什么是原子呢，就是它是对象，但是不继承Object()

  /**
   * Whether to suppress warnings.
   */
  silent: false,//是否取消警告

  /**
   * Show production mode tip message on boot?
   */
  productionTip: process.env.NODE_ENV !== 'production',//如果是开发环境，则是true，表示显示提示信息，在生产环境则不显示

  /**
   * Whether to enable devtools
   */
  devtools: process.env.NODE_ENV !== 'production',//是否启用devtools

  /**
   * Whether to record perf
   */
  performance: false,//是否记录性能

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,//观察程序错误的错误处理程序

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,//观察程序警告的警告处理程序

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],//忽略某些自定义元素

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),//v - on的自定义用户keyCode

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,//检查是否保留了标记，以便它不能注册为组件。这取决于平台，可能会被覆盖

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,//检查属性是否被保留，以便不能用作组件道具。这取决于平台，可能会被覆盖

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,//检查标记是否为未知元素。取决于平台

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,//获取元素的命名空间

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,//解析特定平台的真实标签名称

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,//检查是否必须使用属性（例如值）绑定属性。这个取决于平台

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS//生命周期钩子数组
}: Config)
