---
title: "筆記 python: Error 24: too many open files"
date: 2018-11-20T03:19:29+08:00
tags: ["python"]
---

## 問題描述
同時開太多連線啦

### 環境
Ubuntu 16.04

## 解決方法
https://blog.csdn.net/qq_23926575/article/details/76619827

開啟這個檔案
`sudo vim /etc/security/limits.conf`

在最底下新增兩行
```
* soft nofile 10000
* hard nofile 10000
```

記得重開Server
