---
title: "GraphQL 打招呼"
date: 2020-10-09T01:17:39+08:00
draft: false
tags: ["graphql", "gql"]
---

## 介紹一下
在遇見 GraphQL 的時候最常被比較的就是 Restful API，畢竟 Rustful API 是目前的主流設計，此時我們就必須了解到什麼情況下使用 GraphQL 能帶來效益
- **Over Fetch**
    Restful API 的回傳會是一整個 resource， `/user/1` 會回傳 id=1 的 User 的全部資料，然而在很多情況下我們不需要這麼多的資料，可能 我們僅僅只需要 user 的名字而已
    在 GraphQL 你可以指定你所需要的欄位，大大的減少了傳輸無用資料的消耗
- **Under Fetch**
    也就是 n+1 問題，情景是 user 有很多的 friends，每個朋友都是一名 User，在 Restful 的設計中，每個 User resource 都是一支 API，想想就頭痛 QQ。因此會在後端客製化 API 做 eager loading，一次回傳這些資料
    但到了 GraphQL 這完全不是問題，你可以向下定義你所需要的資料，並嵌入 User 中
    ```graphql
    query {
        User(id: 1) {
            Name
            AvatarURL
            friends {
                ID
                Name
            }
        }
    }
    ```

在設計上，GraphQL 關注 **明確的解釋查詢語言與型態系統** 而不去描述伺服器端實作，前後端之間以 Schema 定義溝通介面，雙方有共通的資料型態以及明確定義的詞彙來討論  
讓一切清楚且簡單～


## 怎麼用r
### 工具會用一點 - GraphQL Playground

### 認識一些 GraphQL Schema
GraphQL 定義自己的語法格式，他是個 SDL (Schema Define Language)  

首先來定義一個 `type` 也就是基本的物件，基本型別有 `Int` `Float` `String` `Boolean` `ID`，也可以用 `!` 來定義該欄位是否是 Nullable 的
```graphql
type Student {
  id: Int!
  name: String!
  "可以寫註解說每個學生都有 sid"
  studentID: String!
  
  """
  多行註解說：
  每個學生都可以填一個電話
  """
  phone: Phone
  
  """
  每個人都可以發很多文
  """
  articles: [Article!]
}

type Phone {
  phoneNumber: String!
}

type Article {
  title: String!
  content: String!
}
```

基本型別不夠用嗎，我們來自定義一下，Date 然後這個型別的實作要伺服器端自己來喔
```
scalar Date

# 用法這樣
type Article2 {
  title: String!
  content: String!
  date: Date!
}
```

也可以定義枚舉類別(enumeration)
```
enum GradingStatus {
    INPROGRESS
    GRADUATED
}

type Student2 {
  gradingStatus: GradingStatus!
}
```

當你的物件可能是不同的結構時，你可以找 union
```
"""
union 定義 User 可能是 Student 也可能是 Teacher
"""
union User = Student | Teacher
```

或是 interface 也能滿足你的需求
```
interface User {
  id: ID!
  name: String!
  phone: Phone
}

type Student implements User {
  id: ID!
  name: String!
  phone: Phone
  
  # 你還可以定義更多更多...
}

type Teacher implements User {
  id: ID!
  name: String!
  phone: Phone
  
  # 你還可以定義更多更多...

}
```

query mutation 驚嘆號
(enum with default)




### 語法知道一下 (query, mutation, subscription)
有三種基本語法 query, mutation, subscription

#### query
可以簡單想像他是 RestfulAPI 中的 `GET`，用來拿各種資料

![](https://dynalist.io/u/1KC6yOKER8CzIOF_5KELO2jL)

**fragment** 可以抽出常用的結構來簡化語法
```graphql
query {
  me {
    ...UserBrief
  }
  
  # 可以一次定義多個 query
  user(name: "foo") {
    id
    ...UserBrief
  }
}

# fragment 可以幫助重用參數
fragment UserBrief on User {
  name
  email
}
```

**union** 有時候回傳的不一定是同一種物件，這時候可以這麼做
```graphql
# 一個 people 可能是 Teacher 或是 Student，不同的 type 會回傳不同的內容
query people {
    ...on Teacher {
        teacherID
        name
    }
    ...on Student {
        studentID
        name
        grade
    }
}

# 等價的，你也可以寫成這樣
query people {
    ...pTeacher
    ...pStudent
}

fragment pTeacher on Teacher {
    teacherID
    name
}

fragment pStudent on Student {
    studentID
    name
    grade
}
```


#### mutation
可以簡單想像他是 RestfulAPI 中的 `POST`，用來變更資料

```graphql
mutation {
  newUser(name: "foo" email: "bar@mail.tw") {
    id # 回傳的 id
    ...UserBrief
  }
}

fragment UserBrief on User {
  name
  email
}
```

也可以用 `$` 開頭寫點變數
```graphql
mutation create($name: String $email: String) {
  newUser(name: $name email: $email) {
    id # 回傳的 id
    ...UserBrief
  }
}

fragment UserBrief on User {
  name
  email
}
```

#### subscription
建立 websocket 長連線來接收資料的變更，用法跟 query 很像，在資料變更時就收到訊息囉

```graphql
subscription {
  me {
    name
    email
  }
}
```

### Introspection 自我查詢
GraphQL 可以利用自我查詢來取得目前的 Schema 
```graphql
query ListTypes {
  __schema {
    # 取得 gql 定義了哪些 Types
    types {
      kind # Object, InputObject, Enum, Scalar
      name
      description
      
      # 這裡也可以直接 fields 拿詳細資訊
    }
  }
}

query TypeDetail {
  # 我們想要拿 Role 這個 Type 的詳細資料
  __type(name: "Role") {
    name
    kind
    fields {
      name
      type { ofType{ name } }
    }
  }
}
```

```graphql
query IntrospectionQuery {
  # 我要拿全部操作(query, mutation, subscription)
  __schema {
    queryType {
      ...OprationDetail
    }
    mutationType {
      ...OprationDetail
    }
    subscriptionType {
      ...OprationDetail
    }
  }
}

fragment OprationDetail on __Type {
  name
  fields { 
    name 
    type { ofType{ name } }
  }
}
```

graphQL 自帶文件，具備一般 API Server 沒有的優勢，棒棒ㄉ


## HASURA
https://cloud.hasura.io/project/88f267cd-3f1b-45fa-a1e1-a7ceed6ba10a/env-vars

## Ref
Think in GraphQL https://ithelp.ithome.com.tw/users/20111997/ironman/1878
https://graphql.org/learn/schema/