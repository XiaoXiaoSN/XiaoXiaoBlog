---
title: 筆記 安裝 Golang 與他們的套件管理工具
date: 2019-05-01T11:50:36+08:00
tags: ["golang"]
---

> 從 golang 1.13 release(2019/09/03) 後，gomodule 變成預設，大家都用官方的 gomodule 了喔
> 在這之前的版本使用環境變數 GOMODULE111=true 來做管理

## 安裝 golang (on Mac)
### 1. 第一步當然是拿到 golnag 囉
```sh
brew install go
```

### 2. 環境設定
試著在 terminal 輸入 `go env`，能夠拿到 golang 用到的環境變數
特別注意一下幾個環境變數
- `GOROOT`: 是你 golang 執行環境住的地方
- `GOPATH`: 是你的 golang 程式 和 用到的套件們所住的地方
- `GOBIN`: 因為 golang 是編譯式的語言，他可以把相依套件事先build 好，製作成 `.a` 的二進位檔，存在 `GOBIN` 裡面

```sh
# create GOPATH dir
mkdir $HOME/gocode
```

### 永久設定~~
如果你的 shell 是 bash 的話 (預設)
開啟編輯器修改 `$HOME/.bashrc` 檔案，bash 在登入後會做上面的事情
```sh
# edit $HOME/.bashrc
vim $HOME/.bashrc
```

按下 `G` 到最底部後 `i` 進入編輯模式，把環境變數設定貼上去
```sh
export GOPATH=$HOME/gocode
export GOBIN=$GOPATH/bin
export PATH=$PATH:$GOBIN
```
按下`esc`退出編輯模式，輸入`:wq`存檔並離開

or you are using fish `vim ~/.config/fish/config.fish`
```
# GOLANG configurations
set -x GOPATH $HOME/gocode
set -x GOBIN $GOPATH/bin
set -x GOROOT /usr/local/opt/go/libexec
set PATH $GOPATH/bin $GOROOT/bin $PATH
```

重新再開一個小黑窗跑一下新的設定，
再一次 `go env` 看看幾個參數有沒有不同吧

### 3. 下載專案
在下載前，有些事情是我們要知道的
Golang 的資料夾下有 `src` `pkg` `bin` 三個目錄
- `src`: 當你找相依套件時，會來拜訪這裡
- `pkg`: 編譯好的 go 檔案(`*.a`)，使用相依套件時，可以直接取用
- `bin`: 裡面是編譯好的二進位檔案（golang工具）們 

先設定 ssh 下載我們的 repo，而不是 https
```sh
git config --global url."git+ssh://git@gitlab.tenoz.tw/".insteadOf "https://repo.tenoz.tw/"

go get repo.tenoz.tw/leotek/pelipper
```

趕快來確認一下，是不是成功下載回來了呢？
```sh
cd $GOPATH/src/repo.tenoz.tw/leotek/pelipper
```

## 4. 套件管理工具
### go modules
推薦用這個  
先來看看 [go modules 介紹](/20190501-a-new-in-go-module)) 吧

### go vendor
前置任務：下載 [govendor](https://github.com/kardianos/govendor)
```sh
go get -u github.com/kardianos/govendor
```

好，回來看一下  
pelipper 這個專案就是用 govendor 來對他的套件做管理  
看一下 `vendor/vendor.json` 裡面寫了他使用的套件和版本

一個指令下載相依套件
```sh
govendor sync
```

跑跑看~~
```sh
go build
./pelipper
```

雖然跑起來了，
不過他可能會跟你說他需要設定檔喔

---
---
### 附錄、還有其他管理工具
[這裡](https://github.com/golang/go/wiki/PackageManagementTools)有詳細資訊

`dep` 官方推薦的管理包，不過有要被人家取代掉的趨勢  
`Go Modules` 94J個，窩看好ni啦 >> [介紹](https://md.tenoz.tw/NGcbZCdARUWEt5W3usRBnw)

---
## 參考資料
https://github.com/golang/go/wiki/PackageManagementTools
https://ieevee.com/tech/2017/07/10/go-import.html
