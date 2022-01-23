---
title: 筆記 我是個 go module 的菜鳥
date: 2019-05-01T01:28:22+08:00
tags: ["golang", "gomod"]
---

## 簡介
Golang 官方在 1.11 版推出的相依套件管理工具，還是在測試階段(會在1.13正式登場)
他在 2018/3/20 提交，並於 2018/5/21 被接受
想使用他的話，要開個開關：
環境變數 `GO111MODULE` 控制行為：
- `off`: go command 不使用 modules 功能，而是沿用舊有的 GOPATH 模式
- `on`: 強制使用 modules 功能，只根據 go.mod 下載 dependency 而完全忽略 GOPATH 以及 vendor 目錄
- `auto`: Golang 1.11 預設值，go command 根據當前工作目錄狀態決定是否啟用 modules 功能，滿足任一條件時才啟動此功能:
    * 當前目錄位於 GOPATH/src 之外並且包含 go.mod 文件
    * 當前目錄位於包含 go.mod 文件的目錄下

因此，我們的第一步就是開啟他
```sh
export GO111MODULE=on
```

## 來吧，新專案
```sh
mkdir goModTest
cd goModTest
```

### main.go
```go=
// at goModTest/main.go

package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/health", GetHealthHandler)

	s := &http.Server{
		Addr:    ":8000",
		Handler: router,
	}
	s.ListenAndServe()
}

// GetHealthHandler - GET /health to expose service health
func GetHealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "Service is alive!",
	})
}
```
我們在 `main.go` 裡面用了 `gin` 這個 web framework

```sh
go mod init # 產生 go.mod
go build # 編譯時會去下載缺少的相依套件
```

執行完後發現 `go.mod` 中多了幾個相依套件
還多了一個 `go.sum`， 他就像是其他語言的 `.lock` 一樣，是用來記錄安裝的版本

### tidy
自動幫你檢查你的程式碼中使用到的外部引用，
幫你加入你需要的也幫你移除你用不到的
```sh
go mod tidy
```

### Vendor
預設的情況下，go mod 幫你把相依套件下載到 `$GOPATH`
不過你希望有放在專案目錄下的話...
```sh
go mod tidy # 先做個整理，才不會多下載
go mod vendor
```

### import local package
可以直接 import 專案下的模組，`go.mod` 知道你目前的位置在 `goModTest`
也就是寫在 `go.mod` 的第一行 `module goModTest`
```go
// 程式裡面這樣引用自己專案的package
import dataapi "goModTest/pkg/myapi"
```

---
## Reference
官方連結 https://github.com/golang/go/wiki/Modules
你看人家 Drone 也用了 https://github.com/drone/drone
https://www.lightblue.asia/golang-1-11-new-festures-modules
https://www.lightblue.asia/go-modules-with-insecure-git/