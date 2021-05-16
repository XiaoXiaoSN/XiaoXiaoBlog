---
title: "gRPC - protobuf v3 產生 nullable 欄位"
date: 2020-11-23T00:56:51+08:00
draft: false
tag: ["grpc", "protobuf", "golang"]
---

## 關於 protobuf null value
golang 預設建出來的是沒有指標的，但是有時候就是需要指標來判斷啊！

### option
protobuf v3 從 1.12 開始支援實驗性功能 option，讓用戶可以像是 v2 時一樣使用 option 去產生一個 nullable 的欄位
```protobuf
syntax = "proto3";

message Foo {
    int32 bar = 1;
    optional int32 baz = 2;
}
```
https://stackoverflow.com/a/62566052/6695274

### wrappers
不過， gogo-proto 並不支援阿QQ，  
但也不能就這麼捨棄 gogo-proto，因此我們需要選擇另一個方案
```proto
import "google/protobuf/wrappers.proto";

message Foo {
    int32 bar = 1;
    google.protobuf.Int32Value baz = 2;
}
```
https://stackoverflow.com/a/50099927/6695274

記得在 `--go-output=` 內加上 `Mgoogle/protobuf/wrappers.proto=github.com/gogo/protobuf/types`

但是但是，無法支援 enum 我難過

### custom wrappers

只好自己動手做 (?
```protobuf
enum Status {
    STATUS_OK = 0;
    STATUS_FAIL = 1;
}

message NullInt32 {
    bool valid = 1;
    int32 value = 2;
}

message NullStatus {
    bool valid = 1;
    Status value = 2;
}

message Foo {
    int32 bar = 1;
    NullInt32 baz = 2;
    NullStatus status = 3;
}
```

gen 成 golang 的 code 之後就這樣用，基本上跟 wrappers 的用法是一樣的
```go
type NullStatus struct {
	Valid                bool     `protobuf:"varint,1,opt,name=valid,proto3" json:"valid,omitempty"`
	Value                Status   `protobuf:"varint,2,opt,name=value,proto3,enum=blackblock.Status" json:"value,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *NullStatus) GetValid() bool {
	if m != nil {
		return m.Valid
	}
	return false
}

func (m *NullStatus) GetValue() Status {
	if m != nil {
		return m.Value
	}
	return Status_STATUS_OK
}

type Foo struct {
	Bar                  int32       `protobuf:"varint,1,opt,name=bar,proto3" json:"bar,omitempty"`
	Baz                  *NullInt32  `protobuf:"bytes,2,opt,name=baz,proto3" json:"baz,omitempty"`
	Status               *NullStatus `protobuf:"bytes,3,opt,name=status,proto3" json:"status,omitempty"`
	XXX_NoUnkeyedLiteral struct{}    `json:"-"`
	XXX_unrecognized     []byte      `json:"-"`
	XXX_sizecache        int32       `json:"-"`
}
```

好啦，希望不要用到啦😅
