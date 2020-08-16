---
title: "Golang 漂亮的輸出 JSON"
date: 2020-02-29T16:18:09+08:00
tags: ["go", "golang", "json", "pretty"]
---

偶爾在 debug 的時候，看到的都是一整行實在不太快樂呀！

我需要排版！！趕快筆記一下


## 一、我有一個 struct
stack overflow 上有重點！！
![](https://i.imgur.com/xGFhCHW.png)


```go
func prettyPrint(data interface{}) {
	jsonByte, err := json.MarshalIndent(data, "", "    ")
	if err != nil {
		fmt.Println("")
	}
	fmt.Printf("%s\n", jsonByte)
}
```


## 二、我有一個 json byte
```go
func prettyPrintByte(jsonByte []byte) {
	var buf bytes.Buffer
	err := json.Indent(&buf, jsonByte, "", "    ")
	if err == nil {
		jsonByte = buf.Bytes()
	}
	fmt.Printf("%s\n", jsonByte)
}
```

## 參考
https://stackoverflow.com/questions/19038598/how-can-i-pretty-print-json-using-go/42426889

