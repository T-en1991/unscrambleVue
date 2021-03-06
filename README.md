VUE2.x&&VUE3.x解读  
======
这是一个对vue2.x及vue3.x源码非常详细的学习项目  

学习源码就是想**提升**自己，也可以小伙伴一起**交流**心得   

将详细注释每行源码代码及所有重要及不重要的内容，也会整理工程化的逻辑，项目运行的机制等等  

不定期回顾已经写过的内容，进行补充或修改  

以下将从N（我也不知道有多少个）个方面用**大白话**去全面解读（希望自己每天都会有更新，笔者水平有限，不一定很正确，如有不足，可以联系我vx：T-en1991）


零、学习顺序
-------
vue源码的文件有很多，同时也存在各种嵌套关系，使得初学者不知道从何入手，这里推荐一种学习的顺序  

* 了解flow
* 了解rollup  
* 了解文件结构介绍  
* 随便看一眼babelrc、eslintrc、flowconfig、gitignore
* 掌握scripts中的配置代码
  - 了解feature-flag  
  - 掌握alias  
  - 掌握config   
  - 掌握build  
 * 掌握core/config.js  
 * 掌握core/util  
    - 了解debug.js   
    - 掌握env.js  
    - 了解lang.js  
    - 掌握next-tick.js  
    - 了解error.js  
    - 随便看看perf.js  
    - 掌握options.js  
    - 掌握props.js  
  
一、文件结构介绍  
------
vue的项目结构大体如下：  
* ## __dist__  
    > ex：构建后文件存放的目录。构建时通过rollup进行打包的，构建的配置及防呆代码在script中
* ## __flow__  
    > ex：js是弱类型，这里用flow进行了变量声明，flow和typescript差不多
* ## __node_modules__  
    > ex:项目依赖
* ## __script__  
    > ex：包含与构建相关的脚本和配置文件。代码写完以后，要进行打包吧？从哪里进入，打包到哪里，打包的时候做什么判断等等配置
    - ### alias.js  
      ex：修改别名。这个文件就是尤大佬将常用的文件入口取一个自己喜欢的名字，以后找这个文件地址，就用别名就行
    - ### build.js  
      ex：打包的逻辑代码。包含知道用户输了什么命令，打包成什么环境，要不要压缩，提示语报错信息等等的内容
    - ### config.js  
      ex：打包的配置信息就在这儿。尤大佬用了rollup进行打包的，配置可以在command中写，不过应该没人会这么做，那么多那么长，谁看得清啊。也可以用一个写好的配置文件，命令去读比如（rollup --c ./build/rollup.config.js）。这里用的rolluo.rollup()方法去调用配置信息的，毕竟配置信息是不能固定死的，需要根据不同场景变化的  
    - ### feature-tag.js  
      ex：功能开关
* ## __src__  
    - ### compiler  
      > ex:待补充  
    - ### core   
      > ex:待补充  
    - ### platforms    
      > ex:待补充  
    - ### shared  
      ex：共享内容  
      > util  工具函数库  
* ## __.babelrc.js__  
  > ex：babale的配置信息  
* ## __.eslintrc.js__  
  > ex：eslint的配置信息  
* ## __.flowconfig__  
  > ex：flow的配置信息  
* ## __.gitignore__  
  > ex：git忽略内容
* ## __package.json__  
  > ex：独立发布的包的目录    
  

二、script配置详解  
------  
  * ### __alias.js__  
    - 简述   
      > 该文件是对常见模块的入口，做一个路径解析和重命名    
       关键点：该文件比较简单。主要是一个函数和一个暴露出去的对象     
        1、对象是对路径的重命名   
        2、函数是拿到该对象的一个全局路径   
       > #### **详解在script/alias.js中**  
    
  * ### __build.js__  
    - 简述  
      > 该文件是build项目的逻辑代码  
      关键点：获取用户输入、获取配置信息、根据不同环境进行打包，中间还有一些打印和压缩过程     
       1、创建dist文件夹：有就算了，没有就创建，用于存放打包后的代码  
       2、获取配置信息  
       3、根据用户输入的执行脚本，筛选有用的构建版本（通过比对文件的目标地址或名称）  
       4、根据3中的想要生成的版本数进行build，异步过程   
       5、判断环境是不是生产，是生产的需要进行压缩，不是的话直接生成   
       6、生成过程中会有一些console信息的展示，用于提示用户  
      > #### **详解在script/build.js中**  

  * ### __config.js__  
    - 简述  
    > 该文件是rollup的配置项  
    关键点：正常配置。中间有一次对自己的配置转换为rollup能认识的函数genConfig  
    > #### **详解在script/config.js中**  

  * ### __feature-flag.js__  
    - 待解读源码后补充  

三、src源码详解  
----
  * ### __compiler__   
    - 待补充   
  * ### __core__   
    - ex：核心模块
      *  #### __components__   
        > 组件  
      *  #### __global-api__   
        > 全局api
      *  #### __observer__
        > 观察者模式  
          定义对象的一对多的依赖关系，一个对象发生状态改变时，所有依赖他的对象都能得到通知  
          1.取代硬编码通知机制，某一对象不需要再显示的调用另一个对象的某个接口  
          2.
      *  #### __util__
        > 工具函数
      > - debug.js    
          ex：这是一个报错信息处理的文件  
      > - env.js  
          ex：这是一个根据不同环境获取信息的文件。文件中有一个比较有意思的函数，有大段的注释  
      > - error.js     
          ex：如何处理报错信息   
      > - env.js   
          ex：判断各种环境，获取各种环境信息   
      > - lang.js   
          ex：待补充  
      > - next=tick.js  
          ex：nextTick的处理函数  
      > - options.js  
          ex：待补充   
      > - perf.js   
          ex：记录性能的  
      > - props.js    
          ex：待补充  
      
      *  #### __vdom__  
      >   虚拟dom  
      *  #### __instance__
      >  instance
      
  * ### __platforms__
    - 待补充
  * ### __shared__
    - utils.js
      > 工具函数  
      为项目开发做准备，提供通用基础方法
      > #### **详解在src/shared/util.js中**  
      
