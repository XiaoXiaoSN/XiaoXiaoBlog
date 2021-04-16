---
title: "helm3 說 has no deployed releases"
date: 2021-03-26T01:24:28+08:00
draft: false
tags: ["kubernetes", "helm"]
---

## 問題描述
helm release 明明就存在，但是他就是跟你說沒有部署的版本
```
Error: UPGRADE FAILED: "code-server" has no deployed releases
```

## 處理一下
原來是狀態不對，可能上一次部署的時候失敗了，只要你加上 `--force` 再給他跑下去就好

或者說去找到 secrets sh.helm.release.v1.{server_name}.v{version} 修改一下裡面的 
labels status，改成 `deployed`
```yaml
metadata:
  name: sh.helm.release.v1.code-server.v31
  namespace: foo
  uid: b94b5861-8f98-4e8c-bb81-e715975d8c22
  resourceVersion: '46153334'
  creationTimestamp: '2021-03-04T06:12:08Z'
  labels:
    modifiedAt: '1614838331'
    name: code-server
    owner: helm
    status: failed # 改這裏成 deployed
    version: '31'
```

再重新 Retry 一下 helm upgrade 就可以囉
