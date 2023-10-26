---
title: "CRD Version Priority"
date: 2022-07-13T07:47:00+08:00
draft: false
tags: ["kubernetes", "crd"]
---

## 版本優先級
在 K8s 裡面有 preferred version，會選優先值最高的來做為預設值

> 規則 `"^v([\\d]+)(?:(alpha|beta)([\\d]+))?$"`
>
> `v{主版本}alpha|beta{副版本}`


只有 `v` 開頭的穩定版(GA)最先優先，主要版本大的優先度最高。
再來是 `beta` 和 `alpha`
第三個比較 `beta` `alpha` 下的副版本
最後其他的 case 就是按照字母排序 `strings.Compare` (lexicographically)

參考這個範例可以更容易理解
```
- v10        // GA(General availability) 10
- v2         // GA 2
- v1         // GA 1
- v11beta2   // GA 11 + beta 2
- v10beta3   // GA 10 + beta 3
- v3beta1    // GA 3 + beta 1
- v12alpha1  // GA 12 + alpha 1
- v11alpha2  // GA 11 + alpha 2
- foo1       // 用字典順序排
- foo10      // 用字典順序排
```

規則 Code
https://github.com/kubernetes/kubernetes/blob/v1.24.2/staging/src/k8s.io/apimachinery/pkg/version/helpers.go#L34

### APIGroup version
我們有一個 group 叫做 `group.name`，可以看到他會優先採用 `v2`
```
kc proxy & curl localhost:8001/apis/group.name
{
  "kind": "APIGroup",
  "apiVersion": "v1",
  "name": "group.name",
  "versions": [
    {
      "groupVersion": "group.name/v2",
      "version": "v2"
    },
    {
      "groupVersion": "group.name/v1",
      "version": "v1"
    }
  ],
  "preferredVersion": {
    "groupVersion": "group.name/v2",
    "version": "v2"
  }
}
```

會直接影響到 kubectl 的結果，直接 get 會拿到 `v2`
我們的 `group.name` 底下有 kind `Cat`
```
$ kc get cats my-cat -oyaml
```

```yaml
apiVersion: group.name/v2
kind: Cat
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"group.name/v1","kind":"Cat","metadata":{"annotations":{},"name":"my-cat","namespace":"default"},"spec":{"age":18,"color":"#009920"}}
  creationTimestamp: "2022-07-11T17:35:17Z"
  generation: 1
  name: my-cat
  namespace: default
  resourceVersion: "5111716"
  uid: 388993d7-2075-406d-9668-4baec92d1562
spec:
  color: '#009920'
```

不過我們也可以指定 `kind`.`version`.`group` 去拿指定版本的資源
```
$ kc get cats.v1.group.name my-cat -oyaml
```

```yaml
apiVersion: group.name/v1
kind: Cat
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"group.name/v1","kind":"Cat","metadata":{"annotations":{},"name":"my-cat","namespace":"default"},"spec":{"age":18,"color":"#009920"}}
  creationTimestamp: "2022-07-11T17:35:17Z"
  generation: 1
  name: my-cat
  namespace: default
  resourceVersion: "5111716"
  uid: 388993d7-2075-406d-9668-4baec92d1562
spec:
  age: 18
  color: '#009920'
```

另外，kubectl 有 cache 我們也可以去欺騙他（？
```
vim ~/.kube/cache/discovery/127.0.0.1_58359/servergroups.json
```
```diff
    {
      "name": "group.name",
      "versions": [
        {
          "groupVersion": "group.name/v2",
          "version": "v2"
        },
        {
          "groupVersion": "group.name/v1",
          "version": "v1"
        }
      ],
      "preferredVersion": {
-        "groupVersion": "group.name/v2",
-        "version": "v2"
+        "groupVersion": "group.name/v1",
+        "version": "v1"
      }
    },
```

然後再去 `kubectl get` 不指定版本
```
kc get cats my-cat -oyaml
```
```yaml
apiVersion: group.name/v1
kind: Cat
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"group.name/v1","kind":"Cat","metadata":{"annotations":{},"name":"my-cat","namespace":"default"},"spec":{"age":18,"color":"#009920"}}
  creationTimestamp: "2022-07-11T17:35:17Z"
  generation: 1
  name: my-cat
  namespace: default
  resourceVersion: "5111716"
  uid: 388993d7-2075-406d-9668-4baec92d1562
spec:
  age: 18
  color: '#009920'
```

### 看一眼 etcd 來證明
```bash
sudo apt update
sudo apt install etcd-client

alias ec='ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key'
ec get / --prefix --keys-only
```

etcd 的 key 規則類似 `/registry/{group}/{kind}/{namespace}/{name}`

```bash
# 用 json 格式拿出來看，發現是 Base64
$ ec get /registry/unagi.xiao.xiao/unagilives/unagi-system/unagilive-sample -wjson | jq .

# 解開來看到原味內容
$ ec get /registry/unagi.xiao.xiao/unagilives/unagi-system/unagilive-sample -wjson | jq -r .kvs[0].value | base64 -d | jq '.metadata.name, .spec, .status'
"unagilive-sample"
{
  "color": "meow"
}
{
  "reconciledTime": "2022-07-07T09:14:56Z",
  "status": "Reconciled"
}
```

## Ref
https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#version-priority
