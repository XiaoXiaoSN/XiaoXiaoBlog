---
title: "Docker 建立不同架構的 Image"
date: 2020-08-14T23:11:03+08:00
tags: ["docker", "multi-arch", "buildx"]
---

## 問題起源
看看人家，一個 `latest` 有這麼多種架構的版本
羨慕耶 我也想要編一個給我的樹莓派
![](https://i.imgur.com/2f2SBiR.png)

## 執行環境
```
 » docker version
Client: Docker Engine - Community
 Version:           19.03.12
 API version:       1.40
 Go version:        go1.13.10
 Git commit:        48a66213fe
 Built:             Mon Jun 22 15:41:33 2020
 OS/Arch:           darwin/amd64
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          19.03.12
  API version:      1.40 (minimum version 1.12)
  Go version:       go1.13.10
  Git commit:       48a66213fe
  Built:            Mon Jun 22 15:49:27 2020
  OS/Arch:          linux/amd64
  Experimental:     true
 containerd:
  Version:          v1.2.13
  GitCommit:        7ad184331fa3e55e52b890ea95e65ba581ae3429
 runc:
  Version:          1.0.0-rc10
  GitCommit:        dc9208a3303feef5b3839f4323d9beb36df0a9dd
 docker-init:
  Version:          0.18.0
  GitCommit:        fec3683
```



## 開始正題 (buildx 快速版)
這是實驗性功能~ 
Mac & Windows 請進，linux 先來這看看 > https://github.com/docker/buildx ，或是下滑懷舊版

### 設定環節
首先我們要開啟 docker 實驗功能
`vim ~/.docker/config.json` 加上 16 行的 `experimental: "enabled"`
```json=
{
    "auths": {
        "474872403908.dkr.ecr.us-east-1.amazonaws.com": {},
        "917719776018.dkr.ecr.ap-northeast-1.amazonaws.com": {},
        "https://917719776018.dkr.ecr.ap-northeast-1.amazonaws.com": {},
        "https://index.docker.io/v1/": {},
        "https://registry.tenoz.tw": {},
        "registry.heroku.com": {},
        "registry.tenoz.tw": {}
    },
    "HttpHeaders": {
        "User-Agent": "Docker-Client/19.03.1 (darwin)"
    },
    "credsStore": "desktop",
    "stackOrchestrator": "swarm",
    "experimental": "enabled",
    "debug": true
}
```

這樣就可以下指令查看 image 的相關資料
`docker manifest inspect --verbose xiao4011/toolbox:latest`
再來下個指令看看別人的多架構版
`docker manifest inspect --verbose redis:latest`
一看不得了，人家是 array 阿！！ 帥吧


### 編譯 Image

拿出你的 Dockerfile 在 From 前面加上你要執行的 target 
像這樣 `--platform=$TARGETPLATFORM` 
```dockerfile
# Build code
FROM --platform=$TARGETPLATFORM golang:alpine as builder
ENV GO111MODULE=on

WORKDIR /app
COPY . .
RUN apk add --update git ca-certificates
RUN go mod download 
RUN go build -o app .

# pull the binary file and service work really in the layer
FROM --platform=$TARGETPLATFORM alpine:latest

WORKDIR /srv/application
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app /srv/application/toolbox
COPY --from=builder /app/public /srv/application/public

ENTRYPOINT ["./toolbox"]
```

改好了之後呢
編譯給他跑下去，可以選擇幾個你喜歡的 --platform 內容來跑
```sh
docker buildx build \
--push \
--platform linux/amd64,linux/arm64,linux/arm/v7,linux/arm/v6 --tag xiao4011/toolbox:latest .
```

如果不知道你的環境有什麼 platform 可以編譯的話
可以輸入`docker buildx inspect --bootstrap`
![](https://i.imgur.com/euLWtTW.png)

因為我們有加上 `--push` 所以直接出發到 docker hub 上面看一下狀況
直接完成，484很快～
![](https://i.imgur.com/s0R6raP.png)

## 開始正題 (懷舊版)
方法是利用 docker manifest 將多個 docker images 整合在一起
因此首先我們要準備編譯多個 images 

### 編譯 Images
- 方法1： 指定架構拉取 image
這個方法是建立在別人的 mutli-arch image 上的，用不同架構直接來編譯
```sh
# 編譯 amd64 架構
docker build --platform linux/amd64 --pull . -t xiao4011/toolbox:amd64
docker push xiao4011/toolbox:amd64

# 編譯 armv7 架構
docker build --platform linux/arm/v7 --pull . -t xiao4011/toolbox:armv7
docker push xiao4011/toolbox:armv7
```

- 方法2： 手動更換編譯平台架構 image
在 Dockerfile 中加入 `ARG ARCH` 加入一個編譯變數叫做 ARCH 來指定編譯的架構
```Dockerfile
ARG ARCH
FROM $ARCH/golang:alpine as builder

// 更多操作 dockerfile...
```
```sh
# 執行編譯
export ARCH=arm32v7; docker build --build-arg ARCH=$ARCH . -t xiao4011/toolbox:$ARCH
docker push xiao4011/toolbox:$ARCH
```

### 包裝 manifest 檔案
發出去~~
```sh
docker manifest create xiao4011/toolbox:manifest \
    --amend xiao4011/toolbox:amd64 \
    --amend xiao4011/toolbox:armv7

docker manifest push xiao4011/toolbox:manifest
```


## 一言不合就 CI/CD (example for buildx)
更新 images 這種事情當然要自動化一下啊！這次跟著 docker 官方介紹第一次認識了 github actions，他是 github 內建的 pipeline 工具
有個有趣的地方是可以插入別人寫的 actions，幾乎每個步驟都有人給你包好了，只要 call function 就對了

首先我們建立檔案 `vim .github/workflows/cicd.yml`
```yaml
# .github/workflows/cicd.yml
name: build our image

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: install Go
        uses: actions/setup-go@v1
        with:
          go-version: ${{ matrix.go-version }}

      - name: check out path
        uses: actions/checkout@v2

      - name: testing
        run: go test ./...

      - name: install buildx
        id: buildx
        uses: crazy-max/ghaction-docker-buildx@v1
        with:
          version: latest

      - name: login to docker hub
        run: echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin

      - name: build the image
        run: |
          docker buildx build \
            --push \
            --tag xiao4011/toolbox:latest \
            --platform linux/amd64,linux/arm64,linux/arm/v7,linux/arm/v6  .
```

接下來要去 github 設定 Secrets，開啟專案頁面後選擇 Setting > Secrets 選擇 `New secret`
加入 docker 的帳號密碼，等一下 pipeline 在 push image 的時候會使用到

> 也可以額外設定除錯模式 
> `ACTIONS_RUNNER_DEBUG=true`
> `ACTIONS_STEP_DEBUG=true`
> 
![](https://i.imgur.com/PfCUyh4.png)



## Ref
https://www.docker.com/blog/multi-arch-build-and-images-the-simple-way/

https://hub.docker.com/r/ckulka/multi-arch-example

https://docs.docker.com/buildx/working-with-buildx/