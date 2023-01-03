---
title: "Kubernetes CRD and Conversion Webhook"
date: 2022-04-27T23:18:00+08:00
draft: false
tags: ["kubernetes", "crd"]
---

## Introduction (Agenda)
Hi 大家好我是 XiaoXiao，現職於 FST Network 擔任軟體工程師
這次主要是要分享 Kubernetes 如何在的自定義擴展定義的 CRD 中做到同時支援多個版本，
這場不會講得太深入主要會關注在使用 Conversion webhook 的經驗和一些容易忽略掉的小地方

### 一、使用動機 (Motivation)
1. 在這裡會先間單說明為什麼我為什麼會開始研究 conversion webhook，以及在什麼情況下可以使用 conversion webhook
2. 定義一個 Proxy 的 CRD 作為範例，能在有實際案例的幫助下更好理解文章

### 二、快速認識 CRD (Get to know the CRD quickly)
1. 首先會介紹如何在 Kubernetes 中定義 CRD
2. 並且設定自己的後端來處理 CR 的變化 (Controller & Operator Pattern)

### 三、多版本的 CRD 和 Conversion webhook (Multiple versions CRD and conversion webhook)
1. Kubernetes 中的版本關係
2. 同時配置多個版本的資源更新時會發生什麼事？ 介紹 CRD 的轉換策略選擇
3. 於是會加入 Conversion webhook 以及如何配置 Conversion webhook
4. 實際遇到的問題以及建議方式
    - 以 annotations 儲存消失的欄位
    - 欄位更新時 ConversionReview objects 不會帶完整的 resource 進來（特別是非 Golang 使用者需要注意）

### 四、觀察實際案例 (Case demo)
https://github.com/XiaoXiaoSN/conversion-webhook-example

### 五、補充篇：與 Admission Webhook 一起玩耍
1. Admission webhook 也是一個經常被提及的 Resource，因此也看一下 CRD conversion webhook 與 Admission webhook 之間的工作流程

![](https://i.imgur.com/ixKFht1.png)


## 使用動機 (Motivation)
首先，看一下什麼時候會需要使用到 CRD 的 Conversion webhook

- 穩定的推進版本 (v1alpha1, v1)，同時向下相容
- 支援新的欄位，或是將舊欄位改名、改結構
- 同一個 Cluster 下，不同的 Namespace 同時間支援著不同版本的 Controller

第三項就是我們在開發時實際遇到的困難！

在我們的開發環境中同時存在有開發環境、串接環境、測試環境三套完整的系統各自在三個不同的 namespace 下，也就同時有三組 Operator 管理著各自 namespace 下的 CRDs

然而，CRD 在 Kubernetes Cluster 下是共用的，當開發環境發生更新時，不可避免的也會影響到其他人在使用的穩定環境，因此更好的做法是在推出新的 CRD 版本且同時支援舊的版本！

#### 簡介一個 Demo 案例
![](https://i.imgur.com/th2iSbA.png)
我們建立一個 `Proxy` 的 CRD 作為範例，並用這個範例帶入後面的介紹

目標透過這個 CRD 產生一個能夠透過 IP 阻擋使用者 HTTP 請求的 Proxy，通過 Proxy 的檢查能看到後面的網頁，沒有通過則會得到 403 的錯誤訊息

## About Kubernetes CRD
CRD 的全名是 Custom Resource Definition，他本身也是一個 Kubernetes 的 Resource

在 K8s 中有許多 Build-in 的資源、API 定義，CRD 提供使用者編寫自己的定義來擴展 Kubernetes 的 Declarative API (宣告式 API)。 CRD 在整個 Kubernetes 生態中被非常廣泛的使用！

Declarative API (宣告式 API)：
- API 宣告他想要的狀態，而不是直接要求實時狀態
    API represents a desired state, not an exact state
- 通常是 CRUD 風格就已經足夠

CRD 是定義，而依照 CRD 規格定義產生的資源稱為 CR

[官方 CRD 定義文件](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions)

#### CRD 編寫格式

在定義好 CRD 之後，使用者僅需要編寫 YAML，就能以宣告式的方式定義服務的模樣
而此後 CR 任務的排程與資源的調度都能藉由 K8s 來幫你完成

[文件](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#specifying-a-structural-schema)上額外規定的 4 個規則，包含保留字或是 `properties` 擺放方式

實際上我們可以透過 CRD 提供的 `openAPIV3Schema` 欄位定義這個 Resource 的欄位，他提供了更嚴格的 OpenAPI V3 Schema 寫法，並且加上了一些 `x-kubernetes-` 開頭的擴充功能

例如說： `x-kubernetes-int-or-string` 能同時支援數字和字串，這樣你就能輕鬆辦到 `cpu: 5` or `cpu: "5000m"` 了！

來個範例
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: proxies.example.group
spec:
  group: example.group
  names:
    kind: Proxy
    listKind: ProxyList
    plural: proxies
    singular: proxy
  scope: Namespaced
  versions:
  - name: v1
    schema:
      openAPIV3Schema:
        properties:
          apiVersion:
            type: string
          kind:
            type: string
          metadata:
            type: object
          spec:
            description: ProxySpec defines the desired state of Proxy
            properties:
              CIDR:
                type: string
              upstream:
                type: string
            type: object
          status:
            description: ProxyStatus defines the observed state of Proxy
            type: object
        type: object
    served: true
    storage: true
```

### 先來認識一下 CRD 在 Kubernetes 的行為

瞧瞧你的 CRD
```bash
kubectl api-resources

# 瞧瞧有什麼欄位可以用
kubectl explain proxy --recursive=true
# 也可以指定版本
kubectl explain proxy --api-version='example.group/v3' --recursive=true

# 瞧瞧我們的的新版本 :)
kubectl api-versions
```

```bash
# 或是 `kubectl proxy` 然後直接使用 RESTful API
curl 127.0.0.1:8001

# 或是 `/apis/{group}`, `/apis/{group}/{version}`
curl 127.0.0.1:8001/apis/example.group
curl 127.0.0.1:8001/apis/example.group/v1
```

### Custom Controller

我們首先可以先了解一下 Kuberntes Controller！

Controller 的工作是負責將指定的資源製造成和宣告的一樣，這個動作稱為 Reconcile (協調、調和？)

我們以新增一筆 ReplicaSet 來看，
1. (透過 kubectl) 發送新增 Request 給 kube-apiserver
2. kube-apiserver 驗證使用者的權限、欄位的正確性
3. kube-apiserver 在 etcd 中存入 ReplicaSet record
4. Controller watch kube-apiserver 發現 etcd 的變化，並去取得完整的 ReplicaSet
5. Controller 檢查 Cluster 內的狀況，確任 current state 是否和 desired state 相同
6. Controller 確保 Cluster 內的 pods, rs 等狀況和宣告的相同 （就是 Reconcile）
    6.1 如果相同，Reconcile 完成，等待下一筆變更
    6.2 不同的話，Reconcile 將狀態設為 requeue，過幾秒再來重新 Reconcile 一次

#### Data Flow

官方範例 kubernetes/sample-controller 中的圖
https://github.com/kubernetes/sample-controller/blob/master/docs/controller-client-go.md
![](https://i.imgur.com/gNfrhtU.png)


From https://lihaoquan.me/posts/k8s-crd-develop/ 介紹 CRD Controller
![](https://i.imgur.com/NYxl1qm.png)

#### Difference between Operator Pattern
本質上 Operator 就是 Custom Controller。

Controller 在 Kubernetes 中的核心元件，在 Kubernetes 中內建的 Resources 也是經過 Controller 來達到 Desired state 的。

因此可以說 Operator 是 CRD + Controller 以區別 Kubernetes build-in 的 Controller。

## Conversion Webhook

一起看完前置的一些知識，再來可以來看看 Conversion webhook

### What is it

瞧瞧註解
> a Webhook strategy instruct API server to call an external webhook for any conversion between custom resources.

> With CRDs, however, each Kind will correspond to a single resource.
> -- kubebuilder

Storaged version and Served Version

誒嘿～！ kubectl 會去抓你目前存的最高的版本當作目標版本 (要部署過一次是哪招？)
不過我們還是可以在 annotations 上看見他實際的型狀 `kubectl.kubernetes.io/last-applied-configuration`


![](https://i.imgur.com/5SwqqZ8.png)
儲存進 etcd 之前會先經過轉換，實際在是以 etcd 的形狀存在，因此雖然創建 v1 的時候有 age 欄位，但讀取出來時不會有

```yaml
# 每个 version 可以通过 served 标志启用或禁止
served: true

# 有且只能有一个 version 必须被标记为存储版本
storage: true

# 此属性标明此定制资源的 v1alpha1 版本已被弃用。
# 发给此版本的 API 请求会在服务器响应中收到警告消息头。
deprecated: true
# 此属性设置用来覆盖返回给发送 v1alpha1 API 请求的客户端的默认警告信息。
deprecationWarning: "example.com/v1alpha1 CronTab is deprecated; see http://example.com/v1alpha1-v1 for instructions to migrate to example.com/v1 CronTab"
```

> Kubernetes functions by reconciling desired state (Spec) with actual cluster state (other objects’ Status) and external state, and then recording what it observed (Status).
> -- kubebuilder


### 為什麼需要和什麼時候用

- 你的服務足夠穩定想要推進版本 (v1, v1alpha1)，同時間兩種我都要
- 想支援的新的欄位
- 不想破壞原本使用者的體驗，想要順暢的升級
- **你的同一個 Cluster 下，不同 Namespace 同時有著支援不同版本的 Controller**


那麼我們什麼時候會需要 Conversion webhook 呢？

我們想要將舊的欄位修改，但不想影響到使用中的用戶，
想要穩定的去推進版本並且能夠向下相容，在發出新版本 v1 後，過去使用 v1alpha1 的使用者也能繼續使用

最後一點，同一個 Cluster 下，有著支援不同 CR 版本的 Controller 是我們在開發上實際遇到的問題。
兩個 Controller 一個想要 v1 版本一個想要 v2 版本時，就會需要 Conversion webhook 來幫忙做版本之間的轉換


### 怎麼用

如果沒有設定 conversion webhook 的話，那麼會將目前儲存的直接套用到新版上，並將它改成對應版本

> 如果儲存版本有必填欄位是否就會失敗?

#### 看一眼 etcd 來證明
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

簡化成腳本方便截圖
```bash
ETCDCTL_API=3 etcdctl \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/peer.crt \
    --key=/etc/kubernetes/pki/etcd/peer.key \
    get $1 -wjson |
    jq -r .kvs[0].value |
    base64 -d |
    jq '{"name": .metadata.name, "spec": .spec}'
```

#### Conversion Strategy
不過其實策略也只有 Webhook 或 None 可以選，預設是 None
```
σ`∀´)σ
```

![](https://i.imgur.com/YUvfPBy.png)


---
解釋 `status.storedVersions` （曾經用過的儲存版本）

#### 註冊 Conversion webhook

接下來實際來看 conversion webhook，可以在 CRD 中這樣註冊
```yaml
spec:
  conversion:
    strategy: Webhook
    webhook:
      clientConfig:
        service:
          namespace: system
          name: webhook-service
          path: /convert
      conversionReviewVersions:
      - v1
```

注意這邊的 `conversionReviewVersions` 指的是 [ConversionReview](https://pkg.go.dev/k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1#ConversionReview) 的版本，會按照 Array 的順序去支援，可選的有 `v1`, `v1beta1`，不過 `v1beta1` 在 1.16 就已經棄用了，基本這裡只會有 `v1`

Conversion Review example

```json
{
    "apiVersion": "apiextensions.k8s.io/v1",
    "kind": "ConversionReview",
    "request": {
      # Random uid uniquely identifying this conversion call
      "uid": "705ab4f5-6393-11e8-b7cc-42010a800002",

      # The API group and version the objects should be converted to
      "desiredAPIVersion": "example.com/v1",

      # The list of objects to convert.
      # May contain one or more objects, in one or more versions.
      "objects": [
        {
          "kind": "CronTab",
          "apiVersion": "example.com/v1beta1",
          "metadata": {
            "creationTimestamp": "2019-09-04T14:03:02Z",
            "name": "local-crontab",
            "namespace": "default",
            "resourceVersion": "143",
            "uid": "3415a7fc-162b-4300-b5da-fd6083580d66"
          },
          "hostPort": "localhost:1234"
        }
      ]
    }
  }
```

想要添加 CRD conversion webhook 只要在 `sepc.conversion.webhookClientConfig` 設定好指定的 server，再添加 CA Bundle 的配置就可以了


### 轉換方案

注意所有 (Served) 的版本之間都要能夠自由轉換，且不會遺失資料

> In Kubernetes, all versions must be safely round-tripable through each other.
> -- kubebuilder docs

#### 透過 Hub、中轉站
但是為了達到這個目標，當我們有 n 個 versions 時，難道我們就要寫 $n * (n-1)$ 個版本轉換邏輯嗎？

這顯然是有點麻煩的，我們也可以做一個中轉的結構 v1 -> Hub(storaged) -> v3

也就能將原本的轉換拓墣簡化：

![](https://i.imgur.com/uU8jf5z.png)

版本之間的轉換關係：
![](https://i.imgur.com/kueKGQy.png)

#### 維護向前、向後版本

又或者承上面提到的，所有的版本都要能自由轉換！
因此我們也可以讓每個版本維護上一個版本的轉換規則 v1 -> v2 -> v3

![](https://i.imgur.com/jhpK0fF.png)

因此，當新增 v1 版本而 storage version 是 v3 時，就會先轉成 v2 再轉成 v3。
這樣的機制下每個版本只要負責向前和向後轉換的規則就好，減少撰寫轉換邏輯複雜度且能夠輕易的新增、移除版本

### 消失的欄位

設計好了轉換的模式後，再來會遇到一個問題：storage version 中不存在的欄位怎麼樣轉換回去？

假設場景 v1 (storage version) 中有 `CIDR` 欄位
```yaml
apiVersion: example.group/v1
kind: Proxy
spec:
    CIDR: "192.168.0.0/24"
    upstream: "web:80"
```

而 v2 多了 `CIDRs`, `timeoutSeconds` 欄位，但卻將 `CIDR` 欄位給移除了
```yaml
apiVersion: example.group/v2
kind: Proxy
spec:
    CIDRs:
        - "192.168.0.0/24"
        - "123.0.0.1/32"
    upstream: "web:80"
    timeoutSeconds: 10
```

由於資料量較少的 v1 是儲存版本，因此新增一筆 v2 CR 時會先轉成 v1 再儲存，`timeoutSeconds` 欄位就會無家可歸，幫QQ
再次將新增的 CR 以 v2 格式取出來時也會發現缺少欄位！

可以考慮使用第三方資料庫或是直接用 Kubernetes `metadata.annotations` 來幫存缺少的欄位，例如說我們將 v2 轉成 v1 時如下

```yaml
apiVersion: example.group/v1
kind: Proxy
metadata:
    annotations:
        proxy.v2.example.group/state: |
            {
                "CIDRs": ["192.168.0.0/24", "123.0.0.1/32"]
                "timeoutSeconds": 10
            }
spec:
    CIDR: "192.168.0.0/24"
    upstream: "web:80"
```

這樣子編寫 v1 to v2 的 conversion 邏輯時就能夠從 `metadata.annotations` 中取得缺少的欄位了！

### 撰寫 API
這其實就是一隻 HTTPS 的 JSON API，會用 POST 發到你指定的 webhook 上～

[官方範例就是讚](https://github.com/kubernetes/kubernetes/blob/v1.24.4-rc.0/test/images/agnhost/crd-conversion-webhook/main.go)

https://kubernetes.io/zh-cn/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#webhook-%E8%AF%B7%E6%B1%82%E5%92%8C%E5%93%8D%E5%BA%94

#### 接下來這段在官方文件中有提到
##### [新增版本的步驟](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#writing-reading-and-updating-versioned-customresourcedefinition-objects)
1. 注意 etcd 內存的版本，不會經過 conversion webhook

##### 刪除版本的步驟
1. 確保所有的客戶端都沒有在使用這個版本了，可以到 `kube-apiserver` 的 log 再次確認
2. 將欲刪除的版本 `served` 設置成 `false`，並確保你的客戶沒有叫
3. 到 CRD 的 `status.storedVersions` 確保 etcd 內沒有你欲刪除的版本
4. 把他刪掉吧～ 記得 conversion webhook 的轉換也可以刪了

`kubernetes-sigs/kube-storage-version-migrator` 這個能用？
https://github.com/kubernetes-sigs/kube-storage-version-migrator

```
kubectl proxy &
curl --header "Content-Type: application/json-patch+json" \
  --request PATCH http://localhost:8001/apis/apiextensions.k8s.io/v1/customresourcedefinitions/<your CRD name here>/status \
  --data '[{"op": "replace", "path": "/status/storedVersions", "value":["v1"]}]'
```

#### Example
ConversionReview 可以用的有哪些 `v1` `v1alpha1`

> 版本优先级
> 不考虑 CustomResourceDefinition 中版本被定义的顺序，kubectl 使用 具有最高优先级的版本作为访问对象的默认版本。 通过解析 name 字段确定优先级来决定版本号，稳定性（GA、Beta 或 Alpha） 级别及该稳定性级别内的序列。

### 他在 Kubernetes 中怎麼運作流程

`tail /var/log/kubernetes/audit.log | grep example.group`

會收到 [ConversionReview](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1/types.go)

### 實際案例 Cert manager

> tag: `v1.0.0-alpha.1`
> pkg/internal/apis/certmanager `func Convert_`

Cert Manager 有過 Conversion Webhook https://github.com/cert-manager/cert-manager/pull/3178
    - 新增 deploy/crds/crd-certificaterequests.yaml ㄉ
    - 刪除 deploy/crds/crd-issuers.yaml ㄉ

> Warning: Do not reuse a CA that is used in a different context unless you understand the risks and the mechanisms to protect the CA's usage.
> -- from Kubernetes docs

#### HTTP Proxy CRD 案例描述

1. 我們有 dev, sit namespace 下的兩個後端服務和兩個 Controller
2. 在獨立的 namespace 有著 conversion webhook
3. 

## Field Managed

> Defaulting: Values for fields that appliers do not express explicit interest in should be defaulted. This prevents an applier from unintentionally owning a defaulted field that might cause conflicts with other appliers. If unspecified, the default value is nil or the nil equivalent for the corresponding type.
> -- https://kubernetes.io/blog/2021/08/06/server-side-apply-ga/#using-server-side-apply-in-a-controller

為了避免不小心修改到，因此僅會給明確關注的欄位，其他的就是 Default value

### 一問一答
Q: 存在 etcd 的 v1 被更新後，會變成 v2 存進去嗎
> 不會，他會保持原樣。甚至可能過不了新的欄位檢查

Q: 在沒有 Conversion webhook 的情況下我部署非 stored 的版本會怎樣？
> 會使用 None 的策略
> for conversion without webhook more precisely:
> `None`: The converter only change the apiVersion and would not touch any other field in the custom resource.
> https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.24/#customresourceconversion-v1-apiextensions-k8s-io

Q: CRD versions 的 served 表示啟用與否，但他和刪除的差異是什麼？
> 使用上基本沒有差了，但是 `status.storedVersions` 還存在時不能夠刪除版本但可以切換成不 served
> 補充 served: false 是直接不能使用，但標記 deprecated 只是提醒不能用

Q: 某個資源在 etcd 裡面是 v1，storage version 從 v1 改成 v2 後，這時候去 get v1 版本他會經過轉換嗎？
> 這是個流程問題，應該是先拿出來指定資源後，再去檢查是否有效果
> 因此我想答案是不會

## 拿來跟 Admissions webhook 比較

conversion webhook 和 admissions webhook 的先後次序
應該是：
Aggregator –> KubeAPIServer –> APIExtensions

搭配前面的 Admission Webhook 講解
https://stackoverflow.com/questions/69198043/what-happens-when-creaing-crd-without-relating-operator


## Ref
https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/

apiextensions go doc https://pkg.go.dev/k8s.io/apiextensions-apiserver@v0.24.2/pkg/apis/apiextensions

解析kubernetes Aggregated API Servers https://blog.csdn.net/u010278923/article/details/78890533?spm=a2c6h.12873639.article-detail.3.e432294cdAIfpg

Docker compose -> Kubernetes https://youtu.be/pCXFhCfOAIg

https://speakerdeck.com/david50407/operator-sdk-dai-ni-wan-zhuan-kubernetes?slide=63

Kubernetes CRD开发实践 https://lihaoquan.me/posts/k8s-crd-develop/

### Operator pattern	
https://www.readfog.com/a/1654115901312700416
diff between Controller and Operator https://stackoverflow.com/a/47857073/6695274

### Kubebuilder
https://book.kubebuilder.io/architecture.html
