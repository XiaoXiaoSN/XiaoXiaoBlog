---
title: "JavaScript 取得座標位址"
date: 2022-06-24T19:37:41+08:00
draft: false
tags: ["javascript", "location", "geographic"]
---

## 內容開始
已經是很公開的標準了，資料多到不行～～ 還是筆記一下

### 取得座標 - getCurrentPosition
[MDN Doc](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
```javascript
const successCallback = (position) => {
    // position.coords.latitude 緯度
    // position.coords.longitude 精度
    // position.timestamp 取得的時間戳 ex:1624703519728 
}

const errorCallback = (err) => {
    // err.code 列表
    // err.PERMISSION_DENIED: 1
    // err.POSITION_UNAVAILABLE: 2
    // err.TIMEOUT: 3
    if (err.code === err.PERMISSION_DENIED) {
        console.log('你就是沒開嘛')
    }
}

const options = {
    // false | true
    enableHighAccuracy: true,

    // integer (milliseconds)
    // amount of time before the error callback is invoked, 
    // if 0 it will never invoke.
    timeout: 5000,

    // integer (milliseconds)
    // infinity - maximum cached position age.
    maximumAge: 0
}

navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
```

### 定期查看座標 - watchPosition
[MDN Doc](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
```javascript
// 會回傳一個 id 用來取消 watch，其它用法跟 getCurrentPosition 一樣的
const wid = navigator.geolocation.watchPosition(successCallback, errorCallback, options)

// 這樣子關～
navigator.geolocation.clearWatch(wid)
```
### 確認權限
有時候會想要檢查權限現在的狀態
```javascript
navigator.permissions.query({ name: 'geolocation' })
  .then(result => {
    // result.state 有三種
    // granted 允許
    // prompt 要詢問
    // denied 封鎖
  })
```

## Ref
https://www.pluralsight.com/guides/how-to-use-geolocation-call-in-reactjs
https://developer.mozilla.org/zh-TW/docs/Web/API/Navigator/geolocation