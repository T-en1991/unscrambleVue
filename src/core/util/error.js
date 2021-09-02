/* @flow */
/*
如何处理报错信息
 */


import config from '../config'
import { warn } from './debug'
import { inBrowser, inWeex } from './env'
import { isPromise } from 'shared/util'
import { pushTarget, popTarget } from '../observer/dep'//获取操作通知目标函数，当错误函数在处理错误的时候，停用deps跟踪，避免可能出现的无限渲染情况  infiniterendering


//错误处理函数，并且进行错误上报
export function handleError (err: Error, vm: any, info: string) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  pushTarget()//在处理错误处理程序的时候，停用deps跟踪，以避免无限渲染
  try {
    //已传入的为起始项，不断进行回溯
    if (vm) {
      let cur = vm
      while ((cur = cur.$parent)) {//当前节点还存在父节点
        const hooks = cur.$options.errorCaptured
        //这是一个可选的触发函数，在当前组件捕获一个来自子孙组件的错误时，是否调用错误捕获函数
        if (hooks) {
          //如果该组件有专门的定义的错误捕获函数，那就执行，如果没有那就只执行全局的错误处理函数
          for (let i = 0; i < hooks.length; i++) {
            //因为选项合型策略，钩子函数都会被保存在一个数组中
            //如果一个数组的继承链路是父级丛书链路中存在多个errorCaptured钩子函数，那么他们将会北向通的错误逐个唤醒
            try {
              //如果errorCaptured钩子函数自身抛出了一个错误，则这个新增错误和原本被捕获的错误都会发哦送你个给全局config.errorCaptured
              //不能捕获异步promise内部抛出的错误和自身错误
              const capture = hooks[i].call(cur, err, vm, info) === false
              //如果capture是false，阻止其他任何会被这个错误唤醒的errorCaptured钩子和全局config.errorCaptured
              //如果是true，组件的继承会是父级从属链路里面的多个errorCaptured钩子函数都会被同一个错误逐个唤醒
              if (capture) return
              //如果一个errorCaptured钩子可以返回false，已阻止错误继续向上传播
              //从本质上来讲，这个错误已经给搞定了，且应该被忽略，所以其他的钩子都被阻止
            } catch (e) {
              globalHandleError(e, cur, 'errorCaptured hook')
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info)
  } finally {
    popTarget()
  }
}

//异步错误处理函数
export function invokeWithErrorHandling (
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string
) {
  let res
  try {
    res = args ? handler.apply(context, args) : handler.call(context)
    //如果说没有采纳数，那就用call，如果有就用apply
    if (res && !res._isVue && isPromise(res) && !res._handled) {
     // _handle是promise实例的内部变量，默认false，代表onfulfilled  onRejected是否被处理
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true
    }
  } catch (e) {
    handleError(e, vm, info)
  }
  return res
}

//全局错误处理
function globalHandleError (err, vm, info) {
  //如果全局配置了错误处理就用配置的
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, 'config.errorHandler')
      }
    }
  }
  logError(err, vm, info)
}

//错误打印函数
function logError (err, vm, info) {
  //非生产环境下打印warn信息
  if (process.env.NODE_ENV !== 'production') {
    warn(`Error in ${info}: "${err.toString()}"`, vm)
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err)
  } else {
    throw err
  }
}
