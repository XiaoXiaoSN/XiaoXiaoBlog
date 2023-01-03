---
title: "kind 筆記"
date: 2021-08-12T12:10:00+08:00
draft: false
tags: ["kubernetes", "kind"]
---

## 安裝
在 docker 裡面啟動 kubernetes 的工具，在 local 端測試相當實用方便!

官方有提供多個平台的安裝方式，看這[點我](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)

這邊用一個 macOS 的 HomeBrew 來裝
```bash
brew install kind
kind version
# kind v0.11.0 go1.16.3 darwin/amd64
```

## 常用指令寫下來
- 建立新群集
    注意要指定 kube config 的位置，不然他會幫你放到 `~/.kube/config` 裡面喔，亂亂的不好整理吧!!
    ```
    kind create cluster --kubeconfig $HOME/.kube/kind.conf
    ```
    還可以用 `--name` 來架設多個群集 (預設 name 會給你 `kind`)
    ```
    kind create cluster --name kind-2
    ```
- 取得目前建立的
    ```
    kind get clusters
    ```
- 刪掉群集
    ```
    kind delete cluster
    ```

## Ref 
https://kind.sigs.k8s.io/