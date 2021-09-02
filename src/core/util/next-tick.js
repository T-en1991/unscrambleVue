/* @flow */
/* globals MutationObserver */

/*
this.$nextTick
等当前页面渲染完成之后再来执行nextTick的指定函数
 */

/*
简单总结
调用nextTick时候发生的变化
一个页面中可能存在很多调用nextTick的地方，将每个回调函数，都放在一个数组中，根据环境优先在微任务中进行调用，如果环境不允许就在宏任务中调用
微任务两个
首先原生的promise存在与否，有直接用原生的
没有
就用mustationObserver，他是监听节点的变化，如果节点变化了，就触发
如果也不存在mustationObserver那就使用setImmediate，
尤大佬这里是使用了，本人用的比较少，这也不是规范中的用法，暂时在ie和node10+版本中用的还算多
实在不行在下一个宏任务中进行，也就是setTimeout
 */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false//是否正在使用微任务服务

//nextTick一个页面里面会有多个，定义一个回调队列
const callbacks = []
//是否处于目前处理环节中
let pending = false

//执行所有的回调任务
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0);//这里相当于深拷贝。但是和深拷贝还是有区别的，如果里面是复杂类型，也没法深拷贝
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()//这里是执行nextTick里面的方法，for循环一个个从队列中获取去执行
  }
}

let timerFunc
//根据不同的环境判断用何种当时进行实现nextTick
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()//promise是立执行，在这里需要宏任务结束以后的微任务操作，所以直接这么写
  timerFunc = () => {
    p.then(flushCallbacks)
    /*
    在ios中，promise.then仍然能用，且大多数情况没有问题，但是会陷入一种奇怪的状态，
    微任务的确放到了微任务队列，但是不会去执行，直到遇到下一次的宏任务，才会去执行，
    执行也是在这个宏任务之前
    就好像是，微任务状态都是对的，就是没执行，到了下一个宏任务开始之前，突然想起来，我还有微任务没执行，立马先执行微任务
    所以这里需要用列如计时器去强刷一下微任务队列
     */
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true//正在微任务中
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  //不是ie平台且MutationObserver存在，且他是原生的或者tostring是那样的
  //如果promise不存在，判断是不是在ie环境下
  //MutationObserver  提供了监视对DOM树所做更改的能力，也是一个微任务
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)//创建了一个观察器
  const textNode = document.createTextNode(String(counter))//新建一个文本节点，不需要插入网页中
  observer.observe(textNode, {
    characterData: true//监视指定目标节点或子节点树中节点所包含的字符数据的变化
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)//触发上面的文本节点的值发生变化，一旦发生变化（任务队列），就会触发observer的回调函数
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  //如果有setImmediate，就用setImmediate
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  //都没有就用setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  //存在传入参数的时候，callbacks中加入函数的回调队列
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  //如果没有进行传参，就返回一个promise对象
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
