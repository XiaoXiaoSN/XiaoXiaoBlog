---
title: "kubebuilder 旅程"
date: 2022-07-23T23:55:00+08:00
draft: false
tags: ["kubernetes", "crd", "operator"]
---

## 一步一步的開始

### 安裝 kuberbuilder
https://github.com/kubernetes-sigs/kubebuilder/issues/2642
`kuberbuilder` 在支援 1.18 前的準備

首先下載 `kuberbuilder`
```bash
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/
```

或是你發現 Release 版還沒支援 Go version 1.18，從 GitHub 自己編譯最新版的來用

```bash
git clone https://github.com/kubernetes-sigs/kubebuilder.git
cd kubebuilder
make install
```

Note: 後來不用跑 `make install` 可以用 `make deploy` 就好，他會做更多的事情。並且我注意到這個版本的 `make install` 不會幫你取代 Cert manager 的變數，他可以搞砸你的 CRD xDDD

### 開新專案囉
```bash
mkdir unagi
cd unagi
kubebuilder init --domain xiao.xiao --repo github.com/xiaoxiaosn/unagi
```

```bash
Get controller runtime:
$ go get sigs.k8s.io/controller-runtime@v0.12.1
Update dependencies:
$ go mod tidy
```

新增你要的 CRD go code，會問你要不要建 Resource 跟 Controller，我們當然選個 `y`
```bash
kubebuilder create api --group unagi --version v1 --kind UnagiLive
Create Resource [y/n]
y
Create Controller [y/n]
y
```

把 CRD YAML 建立出來，有修改 CRD 定義的話記得重新跑個
```bash
make manifests
```

到 `config/crd/bases/unagi.xiao.xiao_unagilives.yaml` 可以看到你的 CRD，在 `patches` 裡面甚至有 conversion webhook 和 Cert Manager CA injection 的範例，這部分晚點玩

到 `config/samples/unagi_v1_unagilive.yaml` 可以看到範例 CR
```yaml
apiVersion: unagi.xiao.xiao/v1
kind: UnagiLive
metadata:
  name: unagilive-sample
spec:
  # TODO(user): Add fields here
```

準備好後開始安裝 CRD 到 K8s 中，如果發現 Kustomize 太舊了下載不到那可以參考[這邊](https://github.com/kubernetes-sigs/kustomize/releases)改個數字
```bash
export KUSTOMIZE_VERSION=4.5.5 # or other version you want
make install
```

你可以在 K8s 中看到剛剛加上去的 CRD
```bash
$ kubectl get crd unagilives.unagi.xiao.xiao
NAME                         CREATED AT
unagilives.unagi.xiao.xiao   2022-06-26T15:42:17Z
```

你還可以部署 CR 上去玩，然後用 `kubectl get unagilive` 看他
```bash
kubectl apply -f config/samples/unagi_v1_unagilive.yaml
```


為了將 Controller 放到 K8s 中，我們需要做 docker image
```bash
# make docker-build docker-push IMG=<some-registry>/<project-name>:tag
make docker-build docker-push IMG=xiaoxiaosn/unagi:latest
```

然後部署上去
```bash
# make deploy IMG=<some-registry>/<project-name>:tag
make deploy IMG=xiaoxiaosn/unagi:latest
```

如果你用 kind 也可以提供一個不用 push 的方法直接 load
```bash
# kind load docker-image <your-image-name>:tag --name <your-kind-cluster-name>
kind load docker-image xiaoxiaosn/unagi:latest
```

就長出來啦
```bash
$ kubectl get all -n unagi-system
NAME                                            READY   STATUS    RESTARTS   AGE
pod/unagi-controller-manager-7c99bd7fb7-9t6gr   2/2     Running   0          114s

NAME                                               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/unagi-controller-manager-metrics-service   ClusterIP   10.96.251.167   <none>        8443/TCP   114s

NAME                                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/unagi-controller-manager   1/1     1            1           114s

NAME                                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/unagi-controller-manager-7c99bd7fb7   1         1         1       114s
```

### 認識專案開始跑
我們確實有了一個架構，再來我們要開始加一些自定義的行為！

#### 修改 CRD
首先到 `api/v1/unagilive_type.go` 這邊會定義 `UnagiLive`
這個 CRD 的 Spec，我們在這邊加個喜歡的欄位

我們希望我們養的 `Unagi` 有顏色跟尺寸大小，修改一下
```go
// UnagiLiveSpec defines the desired state of UnagiLive
type UnagiLiveSpec struct {
    Color string `json:"color,omitempty"`
    
    Size string `json:"size,omitempty"`

    HasHorn bool `json:"hasHorn,omitempty"`
}
```

還希望知道這個 CRD 被 Controller 處理的狀況如何
```go
type UnagiLiveStatus struct {
	Status string `json:"status,omitempty"`

	// +optional
	ReconciledTime *metav1.Time `json:"reconciledTime,omitempty"`
}
```

再加個 `additionalPrinterColumns` 因為想用 kubectl 看到更多資訊～
Status 多了個 `priority` 大於 1 的，就要用 `-o wide` 才給看
```go
// UnagiLive is the Schema for the unagilives API
// +kubebuilder:printcolumn:name="Status",type=string,JSONPath=`.status.status`,description="Unagi Status"
// +kubebuilder:printcolumn:name="Color",type=string,JSONPath=`.spec.color`,description="Unagi Color",priority=1
type UnagiLive struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   UnagiLiveSpec   `json:"spec,omitempty"`
	Status UnagiLiveStatus `json:"status,omitempty"`
}
```

#### 修改 Controller
來到 `controllers/unagilive_controller.go`

我們要把收到的 Unagi 給設定 Status，另外也增加一些 `log` 方便觀察
```go
func (r *UnagiLiveReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	log.Info(fmt.Sprintf("Request: %+v\n-----\n", req))

	// Load the named UnagiLive object
	var unagiLive unagiv1.UnagiLive
	if err := r.Get(ctx, req.NamespacedName, &unagiLive); err != nil {
		log.Error(err, "unable to fetch unagiLive")
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	log.Info(fmt.Sprintf("Request unagiLive: %#v\n-----\n", unagiLive))

	unagiLive.Status.Status = "Reconciled"
	unagiLive.Status.ReconciledTime = &metav1.Time{Time: time.Now()}

	if err := r.Status().Update(ctx, &unagiLive); err != nil {
		log.Error(err, "unable to update unagiLive status")
		return ctrl.Result{}, err
	}

	log.Info("----- END -----\n\n")

	return ctrl.Result{}, nil
}
```

重新部署 CRD 和 Controller
```bash
make manifest

make docker-build docker-push IMG=xiaoxiaosn/unagi:latest
kubectl rollout restart deploy -n unagi-system
```

等他跑完後可以看到我們新的 Controller 設定好 Status 了～
```bash
kubectl get unagilive -oyaml
```

```yaml
apiVersion: v1
items:
- apiVersion: unagi.xiao.xiao/v1
  kind: UnagiLive
  metadata:
    annotations:
      kubectl.kubernetes.io/last-applied-configuration: |
        {"apiVersion":"unagi.xiao.xiao/v1","kind":"UnagiLive","metadata":{"annotations":{},"name":"unagilive-sample","namespace":"unagi-system"},"spec":null}
    creationTimestamp: "2022-06-26T16:20:15Z"
    generation: 3
    name: unagilive-sample
    namespace: unagi-system
    resourceVersion: "3228189"
    uid: 0dfaee8d-4396-42e5-9df2-112c1c330f86
  spec:
    color: meow
  status:
    reconciledTime: "2022-06-26T19:34:27Z"
    status: Reconciled
kind: List
metadata:
  resourceVersion: ""
  selfLink: ""
```

### 召喚 Admission webhook

可以從 `kuberbuilder create webhook --help` 看到用法（defaulting webhook
他就是 mutating webhook）
```
--defaulting                if set, scaffold the defaulting webhook
--programmatic-validation   if set, scaffold the validating webhook
```

```bash
kubebuilder create webhook --group unagi --version v1 --kind UnagiLive --defaulting --programmatic-validation
```

我們建立好了兩之 Admission webhooks (mutating and validation)，可以到 `api/v1/unagilive_webhook.go` 去看一下主要的邏輯


我們修改 Mutating webhook 的 `Default` function，讓我們的 resource 進來時，會先照我們的邏輯做一次改變
```go
// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *UnagiLive) Default() {
	unagilivelog.Info("default", "name", r.Name)

    // 沒有填寫的話預設是 `m` 尺寸
	if r.Spec.Size == "" {
		r.Spec.Size = "m"
	}

    // 沒有填寫的話預設是黃色
	if r.Spec.Color == "" {
		r.Spec.Color = "yellow"
	}
}
```

validating 的 Admission webhook 則有 `Create`, `Update` and `Delete` 三種，分別對應到資源的新增、修改、刪除，檢查新的 resource 以及變化是否符合預期～

例如我們可以限制尺寸是不可修改的！
```go
// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *UnagiLive) ValidateUpdate(old runtime.Object) error {
	unagilivelog.Info("validate update", "name", r.Name)

	oldSize := old.(*UnagiLive).Spec.Size
	newSize := r.Spec.Size
	if newSize != oldSize {
		return fmt.Errorf("cannot change size after creation. try from `%s` update to `%s`", oldSize, newSize)
	}

	return nil
}
```

再來來到 `config/webhook/manifests.yaml` 看一下 resource 的定義，包含了說要監聽哪一些 resource 的哪一些行為，然後要掛哪裡的 webhook
```yaml
---
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  creationTimestamp: null
  name: mutating-webhook-configuration
webhooks:
- admissionReviewVersions:
  - v1
  clientConfig:
    service:
      name: webhook-service
      namespace: system
      path: /mutate-unagi-xiao-xiao-v1-unagilive
  failurePolicy: Fail
  name: munagilive.kb.io
  rules:
  - apiGroups:
    - unagi.xiao.xiao
    apiVersions:
    - v1
    operations:
    - CREATE
    - UPDATE
    resources:
    - unagilives
  sideEffects: None
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  creationTimestamp: null
  name: validating-webhook-configuration
webhooks:
- admissionReviewVersions:
  - v1
  clientConfig:
    service:
      name: webhook-service
      namespace: system
      path: /validate-unagi-xiao-xiao-v1-unagilive
  failurePolicy: Fail
  name: vunagilive.kb.io
  rules:
  - apiGroups:
    - unagi.xiao.xiao
    apiVersions:
    - v1
    operations:
    - CREATE
    - UPDATE
    resources:
    - unagilives
  sideEffects: None
```

#### 準備部署上去玩玩

記得確保你有 Cert Manager 喔，我們會用到它的 webhook 來幫忙你注入 CA Bundle

到 `config/default/kustomization.yaml` 確認一下，這些選項要開 (主要都是 Cert Manager && Webhook 的部分)

```yaml
bases:
# [WEBHOOK] To enable webhook, uncomment all the sections with [WEBHOOK] prefix including the one in
# crd/kustomization.yaml
- ../webhook
# [CERTMANAGER] To enable cert-manager, uncomment all sections with 'CERTMANAGER'. 'WEBHOOK' components are required.
- ../certmanager

patchesStrategicMerge:
# [WEBHOOK] To enable webhook, uncomment all the sections with [WEBHOOK] prefix including the one in
# crd/kustomization.yaml
- manager_webhook_patch.yaml

# [CERTMANAGER] To enable cert-manager, uncomment all sections with 'CERTMANAGER'.
# Uncomment 'CERTMANAGER' sections in crd/kustomization.yaml to enable the CA injection in the admission webhooks.
# 'CERTMANAGER' needs to be enabled to use ca injection
- webhookcainjection_patch.yaml

# the following config is for teaching kustomize how to do var substitution
vars:
# [CERTMANAGER] To enable cert-manager, uncomment all sections with 'CERTMANAGER' prefix.
 - name: CERTIFICATE_NAMESPACE # namespace of the certificate CR
   objref:
     kind: Certificate
     group: cert-manager.io
     version: v1
     name: serving-cert # this name should match the one in certificate.yaml
   fieldref:
     fieldpath: metadata.namespace
 - name: CERTIFICATE_NAME
   objref:
     kind: Certificate
     group: cert-manager.io
     version: v1
     name: serving-cert # this name should match the one in certificate.yaml
 - name: SERVICE_NAMESPACE # namespace of the service
   objref:
     kind: Service
     version: v1
     name: webhook-service
   fieldref:
     fieldpath: metadata.namespace
 - name: SERVICE_NAME
   objref:
     kind: Service
     version: v1
     name: webhook-service
```

還有 `config/crd/kustomization.yaml` 的這些
```yaml
patchesStrategicMerge:
# [WEBHOOK] To enable webhook, uncomment all the sections with [WEBHOOK] prefix.
# patches here are for enabling the conversion webhook for each CRD
- patches/webhook_in_unagilives.yaml
#+kubebuilder:scaffold:crdkustomizewebhookpatch

# [CERTMANAGER] To enable cert-manager, uncomment all the sections with [CERTMANAGER] prefix.
# patches here are for enabling the CA injection for each CRD
- patches/cainjection_in_unagilives.yaml
#+kubebuilder:scaffold:crdkustomizecainjectionpatch
```

改好 kustomizate 後，來部署基本跟剛剛一樣
```bash
# make docker-build docker-push IMG=<some-registry>/<project-name>:tag
make docker-build docker-push IMG=xiaoxiaosn/unagi:latest

# make deploy IMG=<some-registry>/<project-name>:tag
make deploy IMG=xiaoxiaosn/unagi:latest
```

看一下成果，多了一個 service 從同一個 `controller-manager` 導出到 admission webhook 預設的 443 port
```bash
$ kubectl get po,svc
NAME                                            READY   STATUS    RESTARTS   AGE
pod/unagi-controller-manager-6c779679c6-w266v   2/2     Running   0          98s

NAME                                               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/unagi-controller-manager-metrics-service   ClusterIP   10.96.251.167   <none>        8443/TCP   3d23h
service/unagi-webhook-service                      ClusterIP   10.96.96.235    <none>        443/TCP    98s
```

#### 成果驗收

來部署這個，預期可以看到 mutating webhook 給我們上 default 數值
```yaml
apiVersion: unagi.xiao.xiao/v1
kind: UnagiLive
metadata:
  name: try-admission-webhook
  namespace: unagi-system
spec: {}
```

使用 `kubectl get unagilive try-admission-webhook -oyaml` 拿回來看，會發現 spec 被貼上預設值啦～
且原本在被修改前的數值也被更新到 `annotations.kubectl.kubernetes.io/last-applied-configuration` 裡面
```yaml
apiVersion: unagi.xiao.xiao/v1
kind: UnagiLive
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"unagi.xiao.xiao/v1","kind":"UnagiLive","metadata":{"annotations":{},"name":"try-admission-webhook","namespace":"unagi-system"},"spec":{}}
  creationTimestamp: "2022-06-30T15:46:03Z"
  generation: 1
  name: try-admission-webhook
  namespace: unagi-system
  resourceVersion: "3718189"
  uid: 77c4d9c1-ef32-49d9-b106-ebdf8889baee
spec:
  color: red
  size: m
  hasHorn: true
status:
  reconciledTime: "2022-06-30T15:46:03Z"
  status: Reconciled
```

再來看舊的 resource，由於他早就在 Kubernetes 內了，因此沒有經過 webhook，還是保持原本的模樣

先把它拿出來看 `kubectl get unagilive unagilive-sample -oyaml`，這是一個沒有填寫 `size` 的 CR，後面
```yaml
apiVersion: unagi.xiao.xiao/v1
kind: UnagiLive
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"unagi.xiao.xiao/v1","kind":"UnagiLive","metadata":{"annotations":{},"name":"unagilive-sample","namespace":"unagi-system"},"spec":null}
  creationTimestamp: "2022-06-26T16:20:15Z"
  generation: 3
  name: unagilive-sample
  namespace: unagi-system
  resourceVersion: "3717289"
  uid: "0dfaee8d-4396-42e5-9df2-112c1c330f86"
spec:
  color: meow
status:
  reconciledTime: "2022-06-30T15:39:37Z"
  status: Reconciled
```

然後改他 `kubectl edit unagilive unagilive-sample`，結果發現無法修改！！
```
error: unagilives.unagi.xiao.xiao "unagilive-sample" could not be patched: admission webhook "vunagilive.kb.io" denied the request: 
cannot change size after creation. try from `` update to `m`
```

原來是我們剛剛的 mutating webhook 的預設值跟 validation webhook 的不可變更檢查衝突了呀

1. 暫時把 validating webhook 給刪了 (?
2. webhook 邏輯應該修改一下，特例允許從空值更改成預設值 `m`
3. 我們可能需要迭代新版本的 CRD

### Mutilple versions CRD

使用和產生第一個 `v1` 時相同的方式來產生 `v2`，這次 `Resource` 選 `y` 而第二個選項的 `Controller` 因為已經有了所以要選 `n`，不然會失敗！
```
kubebuilder create api --group unagi --version v2 --kind UnagiLive
Create Resource [y/n]
y
Create Controller [y/n]
n
```

接下來比較麻煩，有不少地方要留意

首先我們要為我們新版本的 `UnagiLive` 定義結構形狀，移動到`api/v2/unagilive_type.go`，參考 v1 更改預設產生的 Spec, Status，這次我增加了一個 `Speed` 欄位，我希望 Unagi 有移動速度可以設定～
```go
// UnagiLiveSpec defines the desired state of UnagiLive
type UnagiLiveSpec struct {
	Color string `json:"color,omitempty"`

	Size string `json:"size,omitempty"`

	HasHorn bool `json:"hasHorn,omitempty"`

	Speed int `json:"speed"`
}

// UnagiLiveStatus defines the observed state of UnagiLive
type UnagiLiveStatus struct {
	Status string `json:"status,omitempty"`

	// +optional
	ReconciledTime *metav1.Time `json:"reconciledTime,omitempty"`
}
```

因為我們的 CRD 有了多版本，我們要指定在 etcd 中的實際儲存版本，我們在`api/v2/unagilive_types.go` 加上這行（或是你想加在 `v1` 也可以的）
```go
//+kubebuilder:storageversion
```

[更多 kubebuilder 的選項可以參考文件](https://book.kubebuilder.io/reference/markers/crd.html)

這樣子基本的定義就完成了，不過版本發生改變時要怎麼同時兼容新版和舊版？ 所以需要有人來負責做這個不同版本之間的轉換器，這個角色就是 `conversion webhook`

然而我們馬上就會遇到一個問題：如果我們有 $n$ 個 versions，兼容所有轉換是不是表示我們就要有 $n* (n-1)$ 這麼多個呢？

在 `kubebuilder` 的概念中多準備了一個 Hub 的角色，所有的轉換都先經過 Hub 在轉換成其他的版本
![](https://i.imgur.com/Wl2yK5S.png)

例如說想要從 v2 轉成 v3，而目前的儲存版本是 v1 的時候會像是 `v2` -> `hub(v1)` -> `v3`
![](https://i.imgur.com/UYq3ov2.png)


理解完後我們來實作，使用 `kubebuilder` 建立 storaged version 是 `v1` 的 webhook 服務 Code
```bash
kubebuilder create webhook --group unagi --version v1 --kind UnagiLive --conversion
```

來開一個 `api/v1/unagilive_convetion.go` 我們要在這邊宣告他是 `Hub` 或是一個 `Convertible`，在這裡因為 `v1` 是 storaged version 所以給他個 Hub
```go
package v1

/*
Implementing the hub method is pretty easy -- we just have to add an empty
method called `Hub()` to serve as a
[marker](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/conversion?tab=doc#Hub).
We could also just put this inline in our `cronjob_types.go` file.
*/

// Hub marks this type as a conversion hub.
func (*UnagiLive) Hub() {}
```

再來到 `api/v2/unagilive_convetion.go` 幫她實作從 `Hub` 過來的邏輯，他是一個 `Convertible`
```go
package v2

/*
For imports, we'll need the controller-runtime
[`conversion`](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/conversion?tab=doc)
package, plus the API version for our hub type (v1), and finally some of the
standard packages.
*/
import (
	"sigs.k8s.io/controller-runtime/pkg/conversion"

	v1 "github.com/xiaoxiaosn/unagi/api/v1"
)

// +kubebuilder:docs-gen:collapse=Imports

/*
Our "spoke" versions need to implement the
[`Convertible`](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/conversion?tab=doc#Convertible)
interface.  Namely, they'll need `ConvertTo` and `ConvertFrom` methods to convert to/from
the hub version.
*/

/*
ConvertTo is expected to modify its argument to contain the converted object.
Most of the conversion is straightforward copying, except for converting our changed field.
*/
// ConvertTo converts this UnagiLive to the Hub version (v1).
func (src *UnagiLive) ConvertTo(dstRaw conversion.Hub) error {
	dst := dstRaw.(*v1.UnagiLive)

	// Spec
	dst.Spec.Color = src.Spec.Color
	dst.Spec.Size = src.Spec.Size
	dst.Spec.HasHorn = src.Spec.HasHorn

	// Status
	dst.Status.Status = src.Status.Status
	dst.Status.ReconciledTime = src.Status.ReconciledTime

	// +kubebuilder:docs-gen:collapse=rote conversion
	return nil
}

/*
ConvertFrom is expected to modify its receiver to contain the converted object.
Most of the conversion is straightforward copying, except for converting our changed field.
*/

// ConvertFrom converts from the Hub version (v1) to this version.
func (dst *UnagiLive) ConvertFrom(srcRaw conversion.Hub) error {
	src := srcRaw.(*v1.UnagiLive)

	// Spec
	dst.Spec.Color = src.Spec.Color
	dst.Spec.Size = src.Spec.Size
	dst.Spec.HasHorn = src.Spec.HasHorn

	if src.Spec.Color == "red" && src.Spec.HasHorn {
		dst.Spec.Speed = 3
	} else {
		dst.Spec.Speed = 1
	}

	// Status
	dst.Status.Status = src.Status.Status
	dst.Status.ReconciledTime = src.Status.ReconciledTime

	// +kubebuilder:docs-gen:collapse=rote conversion
	return nil
}
```

在上述的轉換邏輯中，因為 `v2` 多了一個 `Speed` 欄位，而 `v1` 到 `v2` 又沒有這個欄位，因此給他一個邏輯，當你是紅色有角時，你的速度就是 3 倍。

#### 準備部署

來到 config 這邊把註解掉的部分打開
- 到 `config/crd/kustomization.yaml` 打開 `patches/webhook_in_<kind>.yaml` 和 `patches/cainjection_in_<kind>.yaml`，你也可能已經在 Admission webhook 中開過了
- 到 `config/default/kustomization.yaml`
    - 打開 `bases` 底下的 `../certmanager` 和 `../webhook`
    - 打開 `patchesStrategicMerge` 底下的 `manager_webhook_patch.yaml` 和 `webhookcainjection_patch.yaml`
    - 打開 `CERTMANAGER` 下的所有參數


安裝下去
```bash
make docker-build docker-push IMG=xiaoxiaosn/unagi:latest
make deploy IMG=xiaoxiaosn/unagi:latest

# kubectl rollout restart deployment.apps/unagi-controller-manager
```

#### 見證更改

首先直接 get 會發現他給的 v2 的版本，kubectl 會自動去抓優先級最高的版本，
```bash
kubectl get unagilive
```

```bash
kubectl get UnagiLive.v1.unagi.xiao.xiao 
```

如預期般拿到轉換過後的版本 ：）

## Ref
https://book.kubebuilder.io/quick-start.html
https://mp.weixin.qq.com/s/Y0GwLgz9o2HONkl4FJdlVQ
https://mp.weixin.qq.com/mp/appmsgalbum?action=getalbum&album_id=1851829124558848001

Tutorial https://github.com/kubernetes-sigs/kubebuilder/tree/master/docs/book/src

https://www.cnblogs.com/charlieroro/p/15960829.html
