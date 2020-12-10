---
title: "已知用火 - git.io 短網址"
date: 2020-08-31T01:34:04+08:00
draft: false
tags: []
---

## 介紹
GitHub 在 2018 年推出的短網址服務: [git.io](https://git.io)  
他可以把 GitHub 的網址縮短~

![](https://i.imgur.com/h1ow1UH.png)
![](https://i.imgur.com/QWxv1qU.png)

## with fish
其實會發現他的原因，是因為在尋找 fish 的 plugin  
https://github.com/jorgebucaran/gitio.fish

fisher 是一個 fish 的套件管理工具，我們用它來安裝 fish 版 gitio  
```
fisher add jorgebucaran/gitio.fish
```

用這個工具的話可以自定義名稱喔！ 網頁版的 UI 好像就沒有這個選項 QQ  
安裝完成後 `gitio key=url` 就可以了
```bash
gitio yamcha=https://github.com/XiaoXiaoSN/YamCha
# https://git.io/yamcha
```

## without fish?
直接自己組 queryString 打過去也是可以的
```bash
export url=https://github.com/XiaoXiaoSN/YamCha                                             
export code=yamcha                                                                         
curl https://git.io/ --data-urlencode "url=$url" --data-urlencode code="$code"
```
