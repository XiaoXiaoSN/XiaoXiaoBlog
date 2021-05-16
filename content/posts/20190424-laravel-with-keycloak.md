---
title: 筆記 Laravel with Keycloak
date: 2019-04-24T10:05:56+08:00
tags: ["php", "laravel", "keycloak", "oauth"]
---

> laravel version: 5.8


## 一、安裝篇
裝這個，跟著他的步驟做
https://github.com/robsontenorio/laravel-keycloak-guard


## 二、使用篇
我們假設 Keycloak Server 有大大幫你開好了 (沒有請點[我](https://github.com/jboss-dockerfiles/keycloak/blob/master/docker-compose-examples/keycloak-mysql.yml))

### 取得 Keycloak 金鑰
https://auth.leotekiot.com
預設帳號: admin
預設密碼: Pa55w0rd

登入後，依序操作得到金鑰
Realm Setting > Keys > RS256 Public key
![](https://i.imgur.com/LvkG6ZO.png)

放到 laravel 的 .env 設定中
```env
KEYCLOAK_REALM_PUBLIC_KEY=你的公開金鑰
```

### 登入 Keycloak
Clients > {{ 選個Client }} > Credentials
Secret 那邊就是我們的 Client Secret 了
![](https://i.imgur.com/UohvEBJ.png)

User > View all users > {{ 選個User }} 
或是你要新創一個也可以，
總之要記得你的帳號密碼喔


移駕到 Postman 來嘗試登入
![](https://i.imgur.com/kPJJMGI.png)

用這個 API 取得 token，
`auth_realm` 填上現在使用的 Realm 預設是 Master
```
/auth/realms/{{auth_realm}}/protocol/openid-connect/token
```
需要的參數前面有介紹過了，按照圖片填滿它吧！

送出就有 AccessToken 了
![](https://i.imgur.com/8WzsWqV.png)


### 應用他!!
複製剛才的 access_token 貼到那個需要登入的 API 裡面
Authorization > Type: Bearer Token > 
![](https://i.imgur.com/1l4CLX5.png)

成功登入～


## 三、檢查權限篇
```php
// import Auth
use Illuminate\Support\Facades\Auth;

// 解析 JWT 並取得 token
$tokenString = Auth::token();
return [
    'token' => json_decode($tokenString)
];


// 從 token 來檢查權限(角色)
$Role = 'admin';
$isAdmin = Auth::hasRole($CLIENT, $Role);

```


