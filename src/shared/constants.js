export const SSR_ATTR = 'data-server-rendered'//暂时没什么太大用处，服务器渲染的属性

//自定义资源的类型    自定义的组件   自定义指令    自定义过滤器
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]

//生命周期的钩子函数
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
