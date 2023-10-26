---
title: 筆記 Laravel Eloquent Model 的 relation
date: 2019-04-16T20:35:16+08:00
draft: false
tags: ["php", "laravel", "eloquent", "orm"]
---

> 版本
> Larael 5.7

## 範例模型
**accounts**
```sql
CREATE TABLE `accounts` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `website_id` int(10) unsigned NOT NULL,
    `account` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,

    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,

    PRIMARY KEY (`id`)
);
```

**websites**
```sql
CREATE TABLE `websites` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,

    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,

    PRIMARY KEY (`id`)
) 
```

`accounts` table 底下有個 column `website_id` 用來關聯 `websites` 這張表。 


## 正片開始 - Model 

`Account` 是一個 Model，跟 `websites` 屬於多對一的關係
一個 `website` 底下可以有很多 `account`

### 方案一、加入參數 $with
在 `Account.php` 中...
```php
// Account.php Account Model

// will call getWebsiteAttribute and append to the model object
protected $with = ['website'];

public function website() {
    return $this->belongsTo('App\Website');
    // 等於 $this->belongsTo('App\Website', 'website_id', 'id'); 
}

public function getWebsiteAttribute() {
    return $this->website()->first();
}
```
他會自動幫你找到 `$with` 內的 relation

輸出看起來像這樣，多了 `website`
```json
{
    "id": 1,
    "website_id": 1,
    "account": "ditto",
    "password": "niguai.tenoz.1006",
    "name": "meow",
    "created_at": "2019-01-28 06:58:44",
    "updated_at": "2019-01-28 06:58:44",
    "website": {
        "id": 1,
        "name": "meo.tw",
        "created_at": null,
        "updated_at": null
    }
}
```


### 方案二、 加入參數 $appends
只是把 `$with` 換成 `$appends`，可以達到一樣的效果
```php
// Account.php Account Model

// will call getWebsiteAttribute and append to the model object
protected $appends = ['website'];

public function website() {
    return $this->belongsTo('App\Website');
}

public function getWebsiteAttribute() {
    return $this->website()->first();
}
```

不過為什麼要重複做這樣的功能呢? 
我認為 `appends` 跟 `$with` 的使用時機不同！
`$with` 更用在 **關聯另外的資料表** 時
`$appends` 則是可以用於加入其他資訊，像是:
```php
// Account.php Account Model

protected $appends = ['uniqName'];

public function getUniqNameAttribute() {
    return "{$this->name}#{$this->id}";
}
```

輸出看起來像這樣，多了 `uniqName`
```json
{
    "id": 1,
    "website_id": 1,
    "account": "ditto",
    "password": "niguai.tenoz.1006",
    "name": "meow",
    "created_at": "2019-01-28 06:58:44",
    "updated_at": "2019-01-28 06:58:44",
    "uniqName": "meow#1",
    "website": {
        "id": 1,
        "name": "meo.tw",
        "created_at": null,
        "updated_at": null
    }
}
```

:::info
小Hint:
belongsTo 這個 function 會幫你猜你 relate 的 key column name， 他用的是你呼叫他的那個 function name

因此，
function website() 中的 belongsTo 可以省略掉後面兩個參數
:::

