//记录性能

import { inBrowser } from './env'

export let mark
export let measure

//不在生产环境的时候使用
if (process.env.NODE_ENV !== 'production') {
  const perf = inBrowser && window.performance
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = tag => perf.mark(tag)//记录时间，用来计算多个记录之间的时间差
    /*
    用法非常像console 里的 time 和 timeEnd


    function per() {
      performance.mark('per_begin');
      for(const a = 1; a < 10000;a++) {}
      performance.mark('per_end');
    }
      per();  // 这时候我们调用 performance.getEntriesByType('mark') 就可以看到刚刚我们标记的两个时间戳了
       我们使用 measure 来计算这两个标记点之间所消耗的时间
      performance.measure('per', 'per_begin', 'per_end');
      // 通过 performance.getEntriesByName('per') 就可以看到 measure 的时间了

     */


    measure = (name, startTag, endTag) => {
      perf.measure(name, startTag, endTag)//浏览器性能记录缓存里面创建一个名为name的时间戳，记录两个特殊的标签
      perf.clearMarks(startTag)//
      perf.clearMarks(endTag)//
      // perf.clearMeasures(name)
    }
  }
}
