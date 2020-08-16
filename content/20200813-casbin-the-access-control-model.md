---
title: "Casbin 權限管理模組"
date: 2020-08-13T00:33:03+08:00
tags: ["go", "golang", "casbin"]
---


[<i class="fa fa-home"></i>](https://casbin.org/en/)  
[<i class="fa fa-github"></i>](https://github.com/casbin/casbin)

## Casbin 是什麼
casbin 是一個權限控管的模組，可以定義不同的權限模型來管理使用者的權限，預設包含了很多知名的模型如 `RBAC` `ABAC`
他雖然規則複雜但他卻支持許多語言，可以在不同的環境下使用，包含 Go, Java, Node.js, php, python, c#, c++, rust 

所以學學看應該很不錯吧！


## Model, Policy 語法
開啟編輯器的畫面 https://casbin.org/editor/ 實際操作更好了解！

首先要了解 Model, Policy 是什麼呢?
- Policy 是規則，裡面寫了一系列的權限像是  
`{小明} 可以對 {文件} {查看}`  
`{小明} 可以對 {程式} {查看}`  
`{小明} 可以對 {程式} {修改}`

- Model 是用來定義 Input 的格式， Policy 的格式， Policy 的使用方法
像是前面 Policy 的寫法就是在這裡來定義



### Model 權限模組
#### `r` request_definition 
用來表示輸入，例如說 `r = sub, obj, act` 就有 3 種輸入，分別表示Subject(人) Object(資源) 動作(Action)

#### `p` policy_definition 
用來表示規則的形狀，等一下在設定 Policy 的時候就要按這這個規則
範例像是 `p = sub, act` 就可以設定只和人、動作有關的規則 (alice 可以 read)
也可以同時設定第二條 Policy 格式 `p2 = sub, act, act2`，就可以把更多的資訊納入規則的建立，前提當然你的 r(輸入)要有帶入 act2

#### `g` (role_definition) 
也就是 RBAC 裡面的 R(role)，可以想像成是一個群組(group)裡面有很多的人，當你定義該群組有什麼權限，那麼在該群組裡面的人也就同時擁有這些權限。

#### `e` (policy_effect) 
定義規則公式的結果，最常見的是 
`e = some(where (p.eft == allow))` 表示只要有一條 match 結果通過就通過了
`!some(where (p.eft == deny))` 表示只要有一條沒有通過，那就不通過
這裡 casbin 還有預設一些函數可以使用，像是用 `keyMatch` 來比對， * 表示全過，或是進一步的 regexMatch，還有 eval 可以動態的輸入規則
甚至可以自己寫 function 綁定進去，非常有用！可以去官網看看 [更多function](https://casbin.org/docs/en/function)

#### `m` (matchers) 
就是使用前面設定檔來寫規則公式的地方

來看一個範例模型 ACL (Access Control List) 也就是白名單模式
看到 `matchers` 很明顯說明了，你的 sub, obj, act 人、物、動作 都要相同才會是 allow
```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

### Policy 權限規則
定義好模型之後，還需要資料才可以開始跑，跟上面的 Model 模型可以搭配著看
這裏 Policy 的寫法需符合 model 裡面 p(policy_definition) 的規範
```
p, alice, data1, read
p, bob, data2, write
```



## 來看扣
複製了範例的 RBAC 模式，可以在剛剛的 [editor](https://casbin.org/editor/) 上選擇 RBAC with resource roles 來看看執行結果是否相同

這邊在看的時候可以先看 policy g 定義的 group，
> alice 是 admin  
> data1 是 data_group  
> data2 是 data_group  
> 然後 admin 可以 write data_group  

這樣應該相當容易理解了～

```go
package main

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	scas "github.com/qiangmzsx/string-adapter/v2"
)

var modelStr = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _
g2 = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && g2(r.obj, p.obj) && r.act == p.act
`

var policyStr = `
p, alice, data1, read
p, bob, data2, write
p, admin, data_group, write

g, alice, admin
g2, data1, data_group
g2, data2, data_group
`

func main() {
	// 設定 Model 模型
	// 參考 https://casbin.org/docs/en/model-storage
	m, _ := model.NewModelFromString(modelStr)

	// 設定 Policy 具體規則
	// 可以參考 https://casbin.org/docs/en/adapters
	p := scas.NewAdapter(policyStr)

	// 建立 Enforcer 需要輸入 Model 和 Policy
	// casbin 提供很多的 adapter 讓開發者用自己適合的方式填充資料 (file, db, redis, cloud...)
	// 範例選擇了最方便的直接讀文字 XDD
	enforcer, _ := casbin.NewEnforcer(m, p)

	// 實際測試時間:
	// 在 model [request_definition] 設定了三個變數輸入
	sub, obj, act := "alice", "data2", "write"
	result, _ := enforcer.Enforce(sub, obj, act)
	fmt.Printf("enforce1: %t\n", result) // true

	sub, obj, act = "alice", "data2", "read"
	result, _ = enforcer.Enforce(sub, obj, act)
	fmt.Printf("enforce1: %t\n", result) // false (因為 admin 對 data_group 沒有 read)
}
```

---

再來偷偷推薦每日一庫的 casbin 文章  https://darjun.github.io/2020/06/12/godailylib/casbin/
裡面提到 ABAC（attribute base access list）模型的用法，相當有趣
需求是這樣的：
> 正常工作時間9:00-18:00所有人都可以讀寫data，其他時間只有數據所有者能讀寫。

Model 如下
```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[matchers]
m = r.sub.Hour >= 9 && r.sub.Hour < 18 || r.sub.Name == r.obj.Owner

[policy_effect]
e = some(where (p.eft == allow))
```
該規則不需要策略文件：

## 存進去 SQL 裡面
實際上在使用 casbin 的時候我們不會用字串來寫 model, policy 
更多會存在 file 或是 db 裡面，這時候 adapter 就派上用場啦~
```go
package main

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	xormadapter "github.com/casbin/xorm-adapter/v2"
	_ "github.com/lib/pq"
)

func main() {
	// 初始化 xorm adpater，在這裡與 DB 連線
	// 沒有指定 db 的話會幫你建立一個 casbin (加入 dbname=abc 可以指定使用 DB abc)
	// 進去會幫你檢查有沒有 casbin_rule 的資料表，沒有的話也會幫你加進去
	driverName := "postgres"
	pgUser, pgPassWd := "root", "root"
	dataSource := fmt.Sprintf("user=%s password=%s host=127.0.0.1 port=5432 sslmode=disable", pgUser, pgPassWd)
	a, _ := xormadapter.NewAdapter(driverName, dataSource) // Your driver and data source.

	// 直接讀檔案最快啦
	enforcer, _ := casbin.NewEnforcer("model_rbac.conf", a)

	// 第一次跑的話會需要 Policy 資料，讓他幫忙寫進去吧
	// enforcer.EnableAutoSave(false) // 關閉自動同步
	{
		// 如果是 enforcer.AddPolicy 的話會幫你填第一個 "p"
		enforcer.AddNamedPolicy("p", "alice", "data1", "read")
		enforcer.AddNamedPolicy("p", "bob", "data2", "write")
		enforcer.AddNamedPolicy("p", "data_group_admin", "data_group", "write")
		// enforcer.AddGroupingPolicies 的話會幫你填第一個 "g"
		enforcer.AddNamedGroupingPolicy("g", "alice", "data_group_admin")
		enforcer.AddNamedGroupingPolicy("g2", "data1", "data_group")
		enforcer.AddNamedGroupingPolicy("g2", "data2", "data_group")
	}

	// Load the policy from DB.
	enforcer.LoadPolicy()

	// 實際測試時間:
	// 在 model [request_definition] 設定了三個變數輸入
	sub, obj, act := "alice", "data2", "write"
	result, _ := enforcer.Enforce(sub, obj, act)
	fmt.Printf("enforce1: %t\n", result) // true

	sub, obj, act = "alice", "data2", "read"
	result, _ = enforcer.Enforce(sub, obj, act)
	fmt.Printf("enforce2: %t\n", result) // false (因為 data_group_admin 對 data_group 沒有 read)
}
```

# Ref
https://darjun.github.io/2020/06/12/godailylib/casbin/
https://github.com/casbin/xorm-adapter/tree/v2.0.1
https://casbin.org/docs/en/overview

