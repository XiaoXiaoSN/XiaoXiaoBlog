---
title: "Golang 怎麼處理 JSON"
date: 2020-02-28T23:22:36+08:00
tags: ["golang", "json"]
---

json 格式簡單易讀，經常出現在各種 API、設定檔裡，golang 也有內建處理的 package，寫扣的時候也會經常遇到他喔，來筆記一下！
內文會分成`常用處理json`、`自定義處理 json`和`多層處理` 三個 part， GOGO

## 一、常用方法
```go
package main

import (
	"encoding/json"
	"fmt"
)

// Box 是個箱子
type Box struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

func main() {
	jsonStr := `
{
	"name": "喵喵",
	"color": "blue"
}`

	box := new(Box)

	// 把 bytes 寫進去 Box 物件裡面
	_ = json.Unmarshal([]byte(jsonStr), box)
	fmt.Printf("%+v\n", box) // {Name:喵喵 Color:blue}

  	// 再把物件寫回去 binary json
	box.Color = "黃色的"
	byteJSON, _ := json.Marshal(box)
	fmt.Printf("%s\n", string(byteJSON)) // {"name":"喵喵","color":"黃色的"}
}
```

## 二、更多方法

當我傻傻的以為，json 就這麼結束了的時候

燈愣！！ 還有兩個 interface 可以實作

```go
// Unmarshaler is the interface implemented by types
// that can unmarshal a JSON description of themselves.
// The input can be assumed to be a valid encoding of
// a JSON value. UnmarshalJSON must copy the JSON data
// if it wishes to retain the data after returning.
//
// By convention, to approximate the behavior of Unmarshal itself,
// Unmarshalers implement UnmarshalJSON([]byte("null")) as a no-op.
type Unmarshaler interface {
	UnmarshalJSON([]byte) error
}

// Marshaler is the interface implemented by types that
// can marshal themselves into valid JSON.
type Marshaler interface {
	MarshalJSON() ([]byte, error)
}
```

當你傳進去的物件有實作了這兩個 function 時，他會改用物件自己的方法
看看下面的範例他已經完全地掌握了 json.Marshal 的輸出啦

```go
// Box 是個箱子
type Box struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// UnmarshalJSON 實作箱子的 json.Unmarshaler
func (b *Box) UnmarshalJSON(byteData []byte) (err error) {
	// 臨時變數，不直接用 Box 物件，會遞迴
	type _box Box
	newBox := &struct{ *_box }{
		_box: (*_box)(b),
	}

	newBox.Color = "會被蓋掉"
	return json.Unmarshal(byteData, newBox)
}

// MarshalJSON 實作箱子的 json.Marshaler
func (b *Box) MarshalJSON() (byteData []byte, err error) {
	// 臨時變數，不直接用 Box 物件，會遞迴
	type _box Box
	newBox := &struct{ *_box }{
		_box: (*_box)(b),
	}

	newBox.Name = b.Name + "~~⭐️"
	return json.Marshal(newBox)
}

func main() {
	jsonStr := `
	{
		"name": "喵喵",
		"color": "blue"
	}`

	box := new(Box)
	_ = json.Unmarshal([]byte(jsonStr), box)
	fmt.Printf("%+v\n", box) // &{Name:喵喵 Color:你只能是黑色}

	box.Color = "黃色的"
	byteJSON, _ := json.Marshal(box)
	fmt.Printf("%s\n", string(byteJSON)) // {"name":"喵喵~~⭐️","color":"黃色的"}
}
```

## 三、多層的方法

再來就是混合表演啦，要根據不同的格式回傳不同的 struct 類型

例子是箱子裡面還可以再裝箱子，還可以裝各種不同的箱子～
```go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
)

type iBox interface{}

// Box 是個箱子
type Box struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Box   iBox   `json:"box,omitempty"`
}

// UnmarshalJSON 實作箱子的 json.Unmarshaler
func (b *Box) UnmarshalJSON(byteData []byte) (err error) {
	// 臨時變數，不要直接用 Box 物件，會遞迴
	type _box Box
	newBox := &struct{ *_box }{
		_box: (*_box)(b),
	}
	err = json.Unmarshal(byteData, &newBox)
	if err != nil {
		return
	}

	// 上面處理完了其他變數，再來依照 newBox 的 type 來包裝裡面的 box
	if newBox.Box != nil {
		switch newBox.Type {
		case "box":
			innerBox := &struct {
				InnerBox Box `json:"box"`
			}{}
			err = json.Unmarshal(byteData, &innerBox)
			if err != nil {
				return
			}
			newBox.Box = innerBox.InnerBox
		case "xbox":
			innerBox := &struct {
				InnerBox xBox `json:"box"`
			}{}
			err = json.Unmarshal(byteData, &innerBox)
			if err != nil {
				return
			}
			newBox.Box = innerBox.InnerBox
		}
	}

	return
}

// xBox 是特別的箱子
type xBox struct {
	Type string `json:"type"`
	Name string `json:"xName"`
	Foo  string `json:"foo"`
	Box  iBox   `json:"box,omitempty"`
}

// UnmarshalJSON 實作 x箱子的 json.Unmarshaler
func (b *xBox) UnmarshalJSON(byteData []byte) (err error) {
	type _box xBox
	newBox := &struct{ *_box }{
		_box: (*_box)(b),
	}
	err = json.Unmarshal(byteData, &newBox)
	if err != nil {
		return
	}

	if newBox.Box != nil {
		switch newBox.Type {
		case "box":
			innerBox := &struct {
				InnerBox Box `json:"box"`
			}{}
			err = json.Unmarshal(byteData, &innerBox)
			if err != nil {
				return
			}
			newBox.Box = innerBox.InnerBox
		case "xbox":
			innerBox := &struct {
				InnerBox xBox `json:"box"`
			}{}
			err = json.Unmarshal(byteData, &innerBox)
			if err != nil {
				return
			}
			newBox.Box = innerBox.InnerBox
		}
	}

	return
}

func getInnerBox(boxType string, byteData []byte) (iBox, error) {
	switch boxType {
	case "box":
		innerBox := &struct {
			InnerBox Box `json:"box"`
		}{}
		err := json.Unmarshal(byteData, &innerBox)
		if err != nil {
			return nil, err
		}
		return innerBox.InnerBox, nil

	case "xbox":
		innerBox := &struct {
			InnerBox xBox `json:"box"`
		}{}
		err := json.Unmarshal(byteData, &innerBox)
		if err != nil {
			return nil, err
		}
		return innerBox.InnerBox, nil
	}

	return nil, errors.New("unknown type of box")
}

func main() {
	jsonStr := `
	{
		"type": "box",
		"name": "喵喵",
		"color": "藍色",
		"box": {
			"type": "xbox",
			"name": "裡面的",
			"foo": "bar",
			"box": {
				"type": "box",
				"color": "更裡面的",
				"box": {
					"type": "box",
					"name": "最裡面"
				}
			}
		}
	}`

	box := new(Box)
	_ = json.Unmarshal([]byte(jsonStr), box)

	// 然後你可以這樣!
	// layer 1 全部
	fmt.Printf("layer 1:\n%#v\n\n", box)
	// layer 2 "name=喵喵"
	fmt.Printf("layer 2:\n%#v\n\n", box.Box.(Box))
	// layer 3 "name=裡面的"
	fmt.Printf("layer 3:\n%#v\n\n", box.Box.(Box).Box.(xBox))
	// layer 4 "name="更裡面的"
	fmt.Printf("layer 4:\n%#v\n\n", box.Box.(Box).Box.(xBox).Box)
	// layer 5 "name=最裡面" 這層沒有 box，所以是 nil
	fmt.Printf("layer 5:\n%#v\n\n", box.Box.(Box).Box.(xBox).Box.(Box).Box)
}
```

也可以把重複的部份抽出來，不然豈不是每次新增新的 box 時都要改以前的 code？

```go
// UnmarshalJSON 實作 x箱子的 json.Unmarshaler
func (b *xBox) UnmarshalJSON(byteData []byte) (err error) {
	type _box xBox
	newBox := &struct{ *_box }{
		_box: (*_box)(b),
	}
	err = json.Unmarshal(byteData, &newBox)
	if err != nil {
		return
	}

	// 上面處理完了其他變數，再來依照 newBox 的 type 來包裝裡面的 box
	if newBox.Box != nil {
		newBox.Box, err = getInnerBox(newBox.Type, byteData)
		if err != nil {
			return
		}
	}

	return
}

func getInnerBox(boxType string, byteData []byte) (iBox, error) {
	switch boxType {
	case "box":
		innerBox := &struct {
			InnerBox Box `json:"box"`
		}{}
		err := json.Unmarshal(byteData, &innerBox)
		if err != nil {
			return nil, err
		}
		return innerBox.InnerBox, nil

	case "xbox":
		innerBox := &struct {
			InnerBox xBox `json:"box"`
		}{}
		err := json.Unmarshal(byteData, &innerBox)
		if err != nil {
			return nil, err
		}
		return innerBox.InnerBox, nil
	}

	return nil, errors.New("unknown type of box")
}
```


## 結論
原本傻傻的不會用 `Unmarshaler` `Marshaler`，很難去做到多層的實作，現在會惹QQ


## 參考資料
https://medium.com/@xfstart07/go-json-%E7%9A%84%E7%BC%96%E7%A0%81%E5%92%8C%E8%A7%A3%E7%A0%81-e689522a1f1f
https://github.com/line/line-bot-sdk-go/blob/362880a2e613ce24eb32e1b72cd345370578b6df/linebot/flex_unmarshal.go#L23
