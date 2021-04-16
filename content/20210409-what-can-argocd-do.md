---
title: "究竟阿狗能做什麼呢"
date: 2021-04-09T01:29:53+08:00
draft: false
tags: ["argo", "cd", "gitlab"]
---

## 你問阿狗是什麼
GitOps + Kubernetes 的產物，相當不錯的運維工具

## 先來裝 Argo CD
我們要用 helm 安裝裝起來喔
```
helm repo add argo-cd https://argoproj.github.io/argo-helm
helm repo update
```

來準備個 values.yaml
```yaml
installCRDs: false
global:
  image:
    tag: v1.8.6
dex:
  enabled: false
server:
  extraArgs:
    - --insecure
    # 如果說你有需要用反向代理抓 subpath，可以在這裡設定
    # - --basehref=/argo
    # - --rootpath=/argo
  config:
    # 這裡要把你要監看的 git repo 放上來，
    # 範例是私有 Gitlab 的設定方式
    repositories: |
      - name: dev-argo
        insecure: true
        insecureIgnoreHostKey: true
        sshPrivateKeySecret:
          name: argocd-secret
          key: webhook.gitlab.secret
        type: git
        url: git@gitlab.10oz.tw:self_group/dev-argo.git
  metrics:
    enabled: true
configs:
  secret:
    # 這裡產生一個 ssh key 來設定 gitlab repo 裡面的 deploy key
    # 然後把相應的 private 提供給 Argo 使用
    gitlabSecret: |-
      first set ssh-public-key in gitlab repo, Settings > Repository > Deploy Keys
      and replace the field with ssh-private-key
```
> PS: 後面有說這裏的 Repository 跟 Secret 在哪裡弄 :)
> 反正先裝等等還能改 XDD


下個安裝指令
```
helm install argo-cd argo-cd/argo-cd --version 2.11.0 --namespace argocd --values ./values.yaml
```

你可以把他 port forward 出來看一下
```
kubectl port-forward svc/argo-cd-argocd-server 8080:443 -n argocd
```

帳號是 admin，而密碼會自動產生，預設是 Argo-CD server 的 Pod Name
```bash
# 醬子拿出來看
kubectl get pods -l app.kubernetes.io/name=argocd-server -o name | cut -d'/' -f 2
```

另外，也可以安裝 argo cli 來修改密碼
```
brew install argocd

argocd login localhost:8080
argocd account update-password
```

開起來會看到這樣的畫面 (PS: 那兩個方框框還不會有，等一下才要裝)
![](https://i.imgur.com/5MsQthJ.png)

按到左邊齒輪的 Settings 然後 Repositories，如果說你的 Gitlab Repo 還沒設定的話，這裡不會是綠色勾勾 Success
![](https://i.imgur.com/CrPW9bs.png)


## 再來設定 ArgoCD

### 先來搞定 Gitlab Repo
剛剛上面填了一個 repository 的地址，現在要讓他成真 (?
總之就開一個 self_group/dev-argo Repo 在 gitlab.10oz.tw，請自己依照環境調整齁
開好了之後就點進去吧~~

首先你需要長一個 ssh rsa key 出來
```
ssh-keygen -f ./argo-deploy-key
```

然後把你的 Public Key (argo-deploy-key.pub) 設在這裡～
![](https://i.imgur.com/bti7ojc.png)

這時候 Argo 有能力去看你的 Gitlab Repo 了，他會告訴你說你的 Repo 裡面是空ㄉ喔喔喔喔

讓我們來塞一點東西進去ㄅ，一個 application 用來設定 Argo 的監看目標，而這次監看的目標是 traefik/ingress-route 這個資料夾底下的一般 kubernetes 設定檔案 
```
.
├── README.md
├── applications
│   ├── traefik-ingress-route.yaml
└── traefik
    └── ingress-route
        └── argo-route.yaml
```

applications/traefik-ingress-route.yaml
```yaml
kind: Application
apiVersion: argoproj.io/v1alpha1
metadata:
  name: golang-traefik-ingress-route
  namespace: argocd
spec:
  project: default
  destination:
    name: in-cluster
    namespace: traefik
  source:
    path: traefik/ingress-route
    repoURL: 'git@gitlab.10oz.tw:self_group/dev-argo.git'
    targetRevision: HEAD
  syncPolicy:
    automated:
      prune: true
```

traefik/ingress-route/argo-route.yaml
```yaml
kind: IngressRoute
apiVersion: traefik.containo.us/v1alpha1
metadata:
  name: argocd-server-route
  namespace: argocd
spec:
  routes:
    - kind: Rule
      match: Host(`foo.10oz.tw`) && PathPrefix(`/argo`)
      services:
        - name: argo-cd-argocd-server
          port: 80
```

Commit 推出去，就醬子就能動了喔 👍👍

## Ref
https://argoproj.github.io/argo-cd/#quick-start
https://www.qikqiak.com/post/gitlab-ci-argo-cd-gitops/
