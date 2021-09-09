//回顾订阅发布模式
import Watcher from "./watcher";

let salesOffice={};//定义售楼处，数据源
salesOffice.customerList=[];//存放需要这个信息的对象,订阅者
salesOffice.listen=function (fn) {
    //将订阅的人要做的事放到数组中
    this.customerList.push(fn)
}

salesOffice.trigger=function () {//发布者
    for (let i=0,fn;fn=this.customerList[i++];){
        fn.apply(this,arguments)
    }
}

//很多的订阅者，他们有自己想做的事
salesOffice.listen(function (msg) {
    console.log(msg,'订阅者A想做的事情')
})
salesOffice.listen(function (msg) {
    console.log(msg,'订阅者B想做的事情')
})
salesOffice.listen(function (msg) {
    console.log(msg,'订阅者C想做的事情')
})

//发布了一条消息
let i=0
let t=setInterval(function () {
    salesOffice.trigger('消息'+i)
    i++
    if (i>4) clearInterval(t)
},2000)


class Watcher{
    constructor(){
        this.customerList={}
    }
    listen(key,fn){
        if (!this.customerList[key]){
            this.customerList[key]=[]
        }
        this.customerList[key].push(fn)
    }
    trigger(){
        let key=Array.prototype.shift.call(arguments);
        let fns=this.customerList[key]
        if (!fns||fns.length===0){
            return false
        } 
        for (let i=0,fn;fn=fns[i++];){
            fn.apply(this,arguments)
        }
    }
    remove(key,fn){
        let fns=this.customerList[key];
        if (!fns||fns.length===0){
            return false
        }
        if (!fn){
            fns&&(fns.length=0)
        } else{
            let index=fns.indexOf(fn)
            index>-1?fns.splice(index,1):'';
            
        }
    }
}

let headComponentWatcher=new Watcher();
headComponentWatcher.listen('msg',function (...msg) {
    console.log('msg1发生变化了',msg)
})
headComponentWatcher.listen('msg',function (...msg) {
    console.log('msg2发生变化了',msg)
})
headComponentWatcher.listen('info',function (...info) {
    console.log('info发生变化了',info)
})