---
title: "Learning Elasticsearch"
date: 2019-08-14T00:15:26+08:00
draft: false
tags: ["es", "elasticsearch", "ilm"]
---

> @elasticsearch version 6.8

## STRUCTURE
可以這樣想像  
Relational DB -> Databases -> Tables -> Rows -> Columns  
Elasticsearch -> Indices   -> Types  -> Documents -> Fields  

不過啊，type 要被人家丟掉了（現在是限制只能有一個 type，等同於這層沒意義）
```
Indices created in 6.x only allow a single-type per index.
```
6.x 後建議 `type` 使用 `_doc`，  
然後 8.x: `Specifying types in requests is no longer supported.`

我發現我發現 看一眼 reindex 就很清楚他改了什麼了喔！
```
POST _reindex
{
  "source": {
    "index": "twitter"
  },
  "dest": {
    "index": "new_twitter"
  },
  "script": {
    "source": """
      ctx._source.type = ctx._type;
      ctx._id = ctx._type + '-' + ctx._id;
      ctx._type = '_doc';
    """
  }
}
```


這是一個新增範例，依照 `/Index/Type/ID` 新增一筆 `Document`
```
PUT /employee/_doc/1
{
    "first_name" : "John",
    "last_name" :  "Smith",
    "age" :        25,
    "about" :      "I love to go rock climbing",
    "interests":   ["sports", "music"]
}
```


## USAGE

列出所有 index
```
GET /_cat/indices?v
```

所有在 index 中的 type
```
GET /_mapping?pretty=true
```

### Search - ES DSL
Query DSL(Domain Specific Language)

架構介紹 [來自這邊](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/query-filter-context.html)
```
GET /_search
{
  "query": { 
    "bool": { 
      "must": [
        { "match": { "title":   "Search"        }},
        { "match": { "content": "Elasticsearch" }}
      ],
      "filter": [ 
        { "term":  { "status": "published" }},
        { "range": { "publish_date": { "gte": "2015-01-01" }}}
      ]
    }
  }
}
```
在 `bool` 裡面， `must` `match` 表示檢索的評分項目  
而 `filter` 中的兩個 `term` 和 `range` 表示過濾條件，不會影響到評分

由 index 來搜尋
```
GET users/_search
{
  "query": {
    "match_all": {
      
    }
  }
}
```

#### 多個 index 搜尋是這樣的
```
GET /kimchy,elasticsearch/_search?q=tag:wow
```

#### MatchAll
```
GET /_search
{
    "query": {
        "match_all": {}
    }
}
```
`match_none` 是他的相反

### Rollover Index
可參考 [文件](https://www.elastic.co/guide/en/elasticsearch/reference/6.3/indices-rollover-index.html#indices-rollover-index)。當檔案大時，可以利用 rollover index 來分檔案，並且利用 alias 統一搜尋
```
PUT /logs-000001 
{
  "aliases": {
    "logs_write": {}
  }
}

# Add > 1000 documents to logs-000001

POST /logs_write/_rollover 
{
  "conditions": {
    "max_age":   "7d",
    "max_docs":  1000,
    "max_size":  "5gb"
  }
}
```

也可以使用日期來做
```
# PUT /<logs-{now/d}-1> with URI encoding:
PUT /%3Clogs-%7Bnow%2Fd%7D-1%3E 
{
  "aliases": {
    "logs_write": {}
  }
}
```

### Mapping 
Mapping 可以設定這個 Index 裡面的 Fields 的 type

[ref](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping.html)

> 如果你是 7.x 記得看到 `_doc` 就給它拿掉

```
PUT twitter 
{}

PUT twitter/_mapping/_doc 
{
  "properties": {
    "email": {
      "type": "keyword"
    }
  }
}
```

```
GET /twitter/_mapping/_doc
```

### ILM (Index Lifecycle Management) 

rollover 的條件是當你 call API 的時候才會檢查，也就是說他不會自動生效
而 ILM 的功能就是讓 elasticsearch 排程幫你做 rollover

1. 先開一個 policy
```
PUT _ilm/policy/mylogs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_docs": "4",
            "max_age":  "30d",
            "max_size": "5gb"
          }
        }
      }
    }
  }
}
```

2. 開一個 template 綁定這個 policy
```
PUT /_template/mylogs_template
{
  "index_patterns": ["mylogs-*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "index.lifecycle.name": "mylogs_policy",      
    "index.lifecycle.rollover_alias": "mylogs"
  }
}
```

3. 建立 alias
```
# PUT /<mylogs-000001>
PUT %3Cmylogs-000001%3E
{
  "aliases":{
    "mylogs": {
      "is_write_index":true
    }
  }
}
```

當這個 alias 會被用於寫入時，要將 `is_write_index` 設定成 `true`，同時間 `is_write_index=true` 只會有一筆

4. 一直打資料進去 `mylogs`，他會依照上面的設定 rollover
![](https://i.imgur.com/UrxZDIu.png)
![](https://i.imgur.com/Ejd71hO.png)

**可透過別名查詢所有 index**
```
POST /prod_vpn_event/_refresh
GET /prod_vpn_event/_search
{
  "query": {
    "match_all": {}
  }
}
```

![](https://i.imgur.com/ETrW37P.png)



---
## REFERENCE
https://es.xiaoleilu.com
https://www.elastic.co/guide/en/elasticsearch/reference/6.8/query-dsl.html
ILM https://elasticsearch.cn/article/6358