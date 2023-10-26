---
title: "How to create an Elasticsearch Data Stream"
date: 2023-08-17T18:43:00+08:00
draft: false
tags: ["elasticsearch"]
---

> Elasticsearch version: 8.x

## 認識 Data Stream
Data Stream 是 Elasticsearch 官方幫常用模式建立的一個模板。
就如他的名字 Stream，他被用來管理跨多個 indexes 的 time series 資料。因此類似 logs, events, metrics 這類的時序資料就可以使用 Data Stream 來管理，

Data Stream 本身其實是多個的 indexes 所組成，包含了 index alias, index lifecycle manager 還有一些預設的 constraints。

要建立一個 Data Stream 有三個主要欄位需要設定，這個 Data Stream 的命名將會被組合成 `{type}-{dataset}-{namespace}`

1. `type`
    可以選 `logs`, `metrics`，未來可能會支援 `traces`, `synthetics`
2. `dataset`
    主要的名字，用來描述這個 Data Stream 放的是什麼資料。例如說 `nginx.access`、`prometheus`，預設值是 `generic`
    以我的使用場景來看的話，系統要存 application logs 和 events，所以我就有兩個 dataset 分別叫做 `application` 和 `event`
3. `namespace`
    單純用來做資料分組，預設值是 `default`

例如說 `logs-apm.app-default` 就是一個 `dataset=logs`, `namespace=apm.app`, `type=logs` 的 Data Stream，而這個 Data Stream 會建立以 `.ds-<data-stream>-<yyyy.MM.dd>-<generation>` 命名的 indexes。

在 Kibana 的 Web UI 中，這些索引預設是隱藏的。如果打開顯示就會看到類似 `.ds-logs-apm.app-default-2023.07.10-000006` 的索引名稱。

和之前的 Index Alias 功能一樣，讀取時會讀取底下的所有 Indexes
![](https://i.imgur.com/Zo4947Q.png)

但只會有一個 Index 是 write only 的！
![](https://i.imgur.com/wYpAe4H.png)

## Step by Step 建立 Data Stream
https://www.elastic.co/guide/en/elasticsearch/reference/current/set-up-a-data-stream.html

### 建立一個 ILM

官方建議使用 Index Lifecycle Manager(ILM) 來幫助管理 Data Stream 下的 indexes

所以我們首先新增一個 ILM Policy `loc-logs-policy`
- 每 30 GB 滾動到下一個 index
- 當資料到 14 days 時轉到 warn phase，並且合併成 1 個 primary shard
- 當資料到 60 days 時刪除舊資料

```
PUT _ilm/policy/loc-logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          // rollover when the size exceeds 10GB
          "rollover": {
            "max_size": "10gb",
            "max_age": "1d"
          }
        }
      },
      // After 14 days, move to the 'warm' phase
      "warm": {
        "min_age": "14d",
        "actions": {
          // shrink the index to 1 primary shard
          "shrink": {
            "number_of_shards": 1
          },
          // force merge index segments to reduce fragment count to 1
          // This action makes the index read-only.
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      // After 60 days, delete index
      "delete": {
        "min_age": "60d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 建立 Index Template

Data Stream 實際上是由多個 Indexes 組成的，為了管理這些 Indexes 我們建立一個 Index Template，當 ILM 達到時間或是 Size 的條件 Rollover 時，新產生的 Index 會自動 Match 到 Index Template 上

```
PUT _index_template/loc-logs-template
{
  "index_patterns": ["logs-application-dev*"],

  // 指定這個 Index Template 是 Data Stream type
  "data_stream": { },

  // 為了避免衝突，官方建議設置 200 以上的 priority
  "priority": 500,

  // 綁定剛剛的 ILM
  "template": {
    "settings": {
      "index.lifecycle.name": "loc-logs-policy"
    }
  },

  // 寫一些有幫助的訊息
  "_meta": {
    "description": "Manage application logs in our Dev environment",
    "last_update": "2023-08-24T17:25:24.254+08:00"
  }
}
```

### 建立一個 Data Stream

必須要符合 Data Stream 規範來命名 `{type}-{dataset}-{namespace}`

```
PUT _data_stream/logs-application-dev
```

由於我們剛剛有指定了 `logs-application-dev` 的 Index Template，在 Create 他會依照這個 Template 的定義產生 Data Stream

回傳看起來會像是這個樣子～～
```
{
  "data_streams": [
    {
      "name": "logs-application-dev",
      "timestamp_field": {
        "name": "@timestamp"
      },
      "indices": [
        {
          "index_name": ".ds-logs-application-dev-2023.08.24-000001",
          "index_uuid": "bDB2EfrJTnCg-lXtVXk31A"
        }
      ],
      "generation": 1,
      "_meta": {
        "description": "Manage application logs in our Dev environment",
        "last_update": "2023-08-24T17:25:24.254+08:00"
      },
      "status": "GREEN",
      "template": "loc-logs-template",
      "ilm_policy": "loc-logs-policy",
      "hidden": false,
      "system": false,
      "allow_custom_routing": false,
      "replicated": false
    }
  ]
}
```

## Ref
https://www.elastic.co/guide/en/ecs/master/ecs-data_stream.html

https://www.elastic.co/guide/en/elasticsearch/reference/current/set-up-a-data-stream.html#create-index-lifecycle-policy
