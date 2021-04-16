---
title: "新米 Istio 篇"
date: 2020-11-15T01:36:30+08:00
draft: false
tags: ["kubernetes", "istio", "service-mesh"]
---

## 開始安裝
下載後會得到一個資料夾 `istio-1.7.4` 把他加入你的執行檔中吧
```
curl -L https://istio.io/downloadIstio | sh -

export PATH=$PWD/istio-1.7.4/bin:$PATH
istioctl version # 成功就是有囉
```

預設的 Profile 們有六個，我就先用 default 吧
|                      | default | demo | minimal | remote | empty | preview |     |
| -------------------- | ------- | ---- | ------- | ------ | ----- | ------- | --- |
| Core components      |         |      |         |        |       |         |     |
| istio-egressgateway  |         | X    |         |        |       |         |     |
| istio-ingressgateway | X       | X    |         |        |       | X       |     |
| istiod               | X       | X    | X       |        |       | X       |     |
```
istioctl profile list
istioctl install --set profile=default
```

裝好之後來實驗一下喔，開一個新的 namespce 並安裝官方範例 book info，裡面包含 4 個微服務
```
kubectl create namespcae istio-bookinfo

# kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -n istio-bookinfo -f https://raw.githubusercontent.com/istio/istio/release-1.7/samples/bookinfo/platform/kube/bookinfo.yaml
```

目前的 pod 裡面都只有 1 個 Container，我們要注入 istio 的 envoy proxy 讓每個 Pod 裡面多一個 sidecar
```
> ~/istio » kubectl get po -n istio-bookinfo
NAME                              READY   STATUS    RESTARTS   AGE
details-v1-79c697d759-9kvrq       1/1     Running   0          3m41s
productpage-v1-65576bb7bf-w9gf6   1/1     Running   0          3m38s
ratings-v1-7d99676f7f-tq9kw       1/1     Running   0          3m40s
reviews-v1-987d495c-j655s         1/1     Running   0          3m40s
reviews-v2-6c5bf657cf-l595s       1/1     Running   0          3m39s
reviews-v3-5f7b9f4f77-4qdtb       1/1     Running   0          3m39s
```

```
kubectl label namespace istio-bookinfo istio-injection=enabled
kubectl get namespace -L istio-injection

# 重新部署，就把 Pod 都刪掉吧
kubectl delete (kubectl get all | grep pod | awk '{print $1}')
```

如果要關掉的話
```
kubectl label namespace default istio-injection-
```

再來看看，是不是每個 Pod 裡面都多一個 Container 啦~
```
> ~/istio » kubectl get pod
NAME                              READY   STATUS    RESTARTS   AGE
details-v1-79c697d759-lqt6k       2/2     Running   0          3m15s
productpage-v1-65576bb7bf-zwgqd   2/2     Running   0          3m15s
ratings-v1-7d99676f7f-fqvvd       2/2     Running   0          3m15s
reviews-v1-987d495c-kbc4z         2/2     Running   0          3m14s
reviews-v2-6c5bf657cf-749bn       2/2     Running   0          3m14s
reviews-v3-5f7b9f4f77-f7wvk       2/2     Running   0          3m14s
```

我們的服務目前長這樣
![](https://istio.io/latest/docs/examples/bookinfo/withistio.svg)
```
kubectl port-forward svc/productpage 9080:9080 -n istio-bookinfo
```

### 利用 Kaili 視覺化 traffic
```
# 詳細內容在 https://github.com/istio/istio/tree/1.7.0/samples/addons
kubectl apply -f samples/addons
```
檢查 namespace `istio-system` 內，多了 grafana, kiali, prometheus, tracing, zipkin 這幾個服務

來看看 kaili 喔～
```
port-forward svc/kiali 20001:20001 -n istio-system
```

kaili 可以用流量直接幫我們畫出 service 之間的關係圖
![](https://i.imgur.com/r66NCjQ.png)

## Reference
https://istio.io/latest/docs/setup/getting-started/
https://istio.io/latest/docs/setup/additional-setup/config-profiles/
https://istio.io/latest/docs/examples/bookinfo/
