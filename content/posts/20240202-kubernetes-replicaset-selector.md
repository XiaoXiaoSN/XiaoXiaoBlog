---
title: "ReplicaSet 的 selector 可以選到沒主人的 Pod"
date: 2024-02-02T02:27:00+08:00
draft: false
tags: ["kubernetes"]
---

TL;DR: 如題，之前不知道。平常沒有在直接建 Pods 啊啊啊啊。另外 Deployment 也是一樣道理。

## 小疑問: selector 可以幹嘛

先來一個最簡單 ReplicaSet
```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: debug-image-rs
spec:
  replicas: 1
  selector:
    matchLabels:
      app: debug-image
  template:
    metadata:
      labels:
        app: debug-image
    spec:
      containers:
      - command: ["sleep", "infinity"]
        image: ghcr.io/xiaoxiaosn/debug-image:latest
        name: debug-image
```

我們知道 `.spec.selector.matchLabels` 必須要能選到 `.spec.template.metadata.labels` ，不然會噴錯！

```
spec.template.metadata.labels: Invalid value: map[string]string{"app":"debug-image"}: `selector` does not match template `labels`
```

可是 ReplicaSet 又選不到其他人建的 Pods，一瞬間不能理解為什麼要我寫兩次 QQ


## 來讀文件喔

> A ReplicaSet identifies new Pods to acquire by using its selector. If there is a Pod that has no OwnerReference or the OwnerReference is not a [Controller](https://kubernetes.io/docs/concepts/architecture/controller/) and it matches a ReplicaSet's selector, it will be immediately acquired by said ReplicaSet.
> -- Kubernets Docs: [How a ReplicaSet works](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/#how-a-replicaset-works)

原來如此，他只會去選沒有 OwnerReference 或是 OwnerReference 不是一個 Controller 的 Pods

實驗時間我們先修改一下 `.spec.selector.matchLabels`，順便 `.spec.replicas` 開成兩個等一下方便觀察
```diff
spec:
-  replicas: 1
+  replicas: 2
   selector:
-    matchLabels:
-      app: debug-image
+    matchExpressions:
+    - { key: "app", operator: "In", values: ["debug-image", "hahaball"] }
```

先把他刪掉，等等再加回來
```bash
kubectl delete -f debug-image-rs.yaml
```

然後我們 create 一個擁有 `hahaball` label 的 Pod，預期等一下 ReplicaSet 會收養他把他當作自己的小孩
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hahaball
  labels:
    app: hahaball
spec:
  containers:
  - command: ["sleep", "infinity"]
    image: ghcr.io/xiaoxiaosn/debug-image:latest
    name: hahaball
```

看一眼目前狀況，可以觀察到只有一個 Pod
```bash
$ kubectl get rs,po
NAME           READY   STATUS    RESTARTS   AGE
pod/hahaball   1/1     Running   0          30s
```

把 ReplicaSet 加回來
```bash
kubectl create -f debug-image-rs.yaml
```

再來看一次，發現果然收編了～～
`pod/hahaball` 的 `ownerReferences` 也改成了剛剛部署的 ReplicaSet。
```bash
$ kubectl get rs,po
NAME                             DESIRED   CURRENT   READY   AGE
replicaset.apps/debug-image-rs   2         2         2       5s

NAME                       READY   STATUS    RESTARTS   AGE
pod/debug-image-rs-5lhcv   1/1     Running   0          5s
pod/hahaball               1/1     Running   0          48s
```

因此我們刪除 ReplicaSet 時，底下的兩個 Pods 都會被砍掉
```bash
kubectl delete replicaset.apps/debug-image-rs
```

## Ref
https://kubernetes.io/docs/concepts/architecture/controller/
https://kubernetes.io/docs/concepts/workloads/controllers/replicaset
