---
title: "Chromedp 殭屍進程"
date: 2021-03-06T01:26:39+08:00
draft: false
tags: ["chromedp", "chromium", "golang", "linux"]
---

## 問題描述
這幾天工作遇到 [chromedp](https://github.com/chromedp/chromedp) 爬蟲執行完後沒有被關閉！ 導致 memory 不斷堆積

因為監測 metrics 的最小單位是 container，一開始調查以為是程式記憶體過高所以嘗試用 pprof 錄了一段後發現沒有直接的上升，於是直接進入容器裡面觀察 process 佔用的資源

哇嗚，發現好多 chrome 的屍體
![](https://i.imgur.com/JGGQRKFm.png)

好了，開始研究為什麼 chromedp 沒幫我們把它關掉。
此時發現一張 [Issue](https://github.com/chromedp/chromedp/issues/752#issuecomment-780883933) 有這個問題和其他人的研究成果

## 解決方法
其實解決方法 chromedp 已經給你了
```dockerfile=
FROM chromedp/headless-shell:latest
...
# Install dumb-init or tini
RUN apt install dumb-init
# or RUN apt install tini
...
ENTRYPOINT ["dumb-init", "--"]
# or ENTRYPOINT ["tini", "--"]
CMD ["/path/to/your/program"]
```
就是第 7 行的那個，在 docker image 中不要直接去跑你的程式而是用 `dumb-init` 去包起來跑！ 就可以避免殭屍進程了

原因是這樣的，一般來說在執行 OS 的時候 Pid 為 1 的服務會是系統服務(ex: systemd, launchd)，然而在 Container 裡面 Pid=1 是我們自己的程式！

> $ man launchd
> launchd(8)                BSD System Manager's Manual               launchd(8)
>
> NAME
     launchd -- System wide and per-user daemon/agent manager

當一個 Process 被關閉時，他的 SubProcess 會被託管給 Pid=1 的 Process，但是我們寫的程式並沒有託管的功能所以那些 SubProcess 就被 hang 在那邊成為殭屍。

更多深入了解可以看 [dumb-init github](https://github.com/Yelp/dumb-init) 和 [dumb-init：一个 Docker 容器初始化系统](https://www.infoq.cn/article/2016/01/dumb-init-docker)

## Ref
https://github.com/chromedp/chromedp/issues/752
https://github.com/chromedp/docker-headless-shell#using-as-a-base-image
https://github.com/Yelp/dumb-init
詳細說明 https://www.infoq.cn/article/2016/01/dumb-init-docker
