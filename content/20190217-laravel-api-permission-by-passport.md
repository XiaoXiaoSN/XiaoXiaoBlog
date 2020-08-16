---
title: 筆記 Laravel API 權限 (Passport)
date: 2019-02-17T09:46:31+08:00
tags: ["php", "laravel", "passport", "jwt"]
---

## 使用 JWT 版本 (2018/09 更新)
> 前面幾個步驟同官方安裝教學

### 步驟說明
##### 1. composer 載回來
`composer require laravel/passport`

##### 2. 開資料表
`php artisan migrate`
然後你會多 5 張表 (主要使用到 `oauth_access_token`)

##### 3.創造 key
`php artisan passport:install`  
他會幫你的 OAuth Server 準備一對 Key (storage/oauth-private.key, storage/outhpublic.key)  
同時也準備 2 個 Client Key 在 `oauth_clients` 資料表內  
```
Personal access client created successfully.
Client ID: 1
Client Secret: ETOhMRq7faRSnb1jN2F168jlbYFcf25MOHj0cOxt
Password grant client created successfully.
Client ID: 2
Client Secret: fibc50RiIjAiYSLR7xceQyoxQE3oGWtIXpCLj9Co
```

##### 4. 附加 passport 至 auth 系統  
- 在 `app\User.php` 新增 `Laravel\Passport\HasApiTokens`
- line:5,11
```php
<?php

namespace App;

use Laravel\Passport\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    // ...
```
- 在 `app/Providers/AuthServiceProvider.php` 新增 passport 的 route  (我們 jwt 版本可以不用)
- line:29
```php
<?php

namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Passport::routes();
        
        // set when access tokens expire
        Passport::tokensExpireIn(now()->addDays(15));
    }
}
```
- 在 `config/auth.php`  
修改 guard 使用 passport
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```
- 修改 `app/Http/Kernel.php`  
加進 web middleware 中 (此步驟 JWT 才需要)
```php
'web' => [
    // Other middleware...
    \Laravel\Passport\Http\Middleware\CreateFreshApiToken::class,
],
```

##### 5. 修改登入步驟
當我們登入成功的時候，回傳加密過的 jwt  
在 `app/Http/Controllers/Auth/LoginController.php` override 掉 authenticated function  
當登入成功的時候會進入這個function  
createToken 第一個參數是 token的名稱 第二個是權限領域(Scopes)，建立後可以在`oauth_xxx` 資料表中確認  
```php
    /**
     * The user has been authenticated.
     * Do not use the origin response of success login with 302, create access token
     * and return json format
     *
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\JsonResponse|\Symfony\Component\HttpFoundation\Response
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function authenticated(Request $request, $user)
    {
        if (!is_null($user)) {
            // create persionalAccessToken for authrizate API
            $token = $user->createToken('access_token', ['guard', 'employee'])->accessToken ?: '';

            return response()->json([
                'access_token' => $token
            ], 200);
        }

        // throw error
        return $this->sendFailedLoginResponse($request);
    }
```

// 加入 scope middleware  
// 在 `app/Http/Kernel.php` 裡面的 `$routeMiddleware`  
`scopes` 是你指定的 scope 們**都要**通過 (AND)  
`scope` 則是你指定的 scope 們**其中之一**通過 (OR)  
可以挑需要用的(我是兩種都加進去了啦)  
```php
'scopes' => \Laravel\Passport\Http\Middleware\CheckScopes::class,
'scope' => \Laravel\Passport\Http\Middleware\CheckForAnyScope::class,
```

- 回到 `app/Providers/AuthServiceProvider.php` 我們可以在這裡設定 `scpoe` 們  
- line:35  
```php
<?php

namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();
        
        // set when access tokens expire
        Passport::tokensExpireIn(now()->addDays(15));

        // set when refresh tokens expire
        Passport::refreshTokensExpireIn(now()->addDays(30));

        Passport::tokensCan([
            'admin' => 'system admin',
            'guard' => 'a good guy',
            'employee' => 'just a poor engineer'
        ]);
    }
}

```

##### 6. 裝備上去
在 `routes/api.php` 加上 middleware `auth` 並指定 guard 是 `api`
這樣有加上 middleware 的 API 們， 沒有 token 就進不去囉！
```php
Route::apiResource('report', 'API\ReportController')
    ->middleware('auth:api')->middleware('scope:employee,guard');
    
Route::post('/report/multi_assign', 'API\ReportController@assignReports')
    ->middleware('auth:api')->middleware('scope:guard');
```


##### 7. 前端接收
在這裡我將token存在local storage裡面  
為了接收內容，所以將 make:auth產生的模板修改成 vue component 了  
範例使用 ajax 做登入  
```javascript
axios.post('/login', {
    'email': this.email,
    'password': this.password
  })
  .then(res => {
    window.localStorage.setItem('accessToken', res.data.access_token)
    window.location.href = this.redirect_to
  })
  .catch(err => {
    console.error('login failed')
    // 處理回傳的錯誤訊息
  })
```

在 `resources/assets/js/bootstrap.js`  
為了不用每一次送 API 請求都要手動加上 token， 我們修改 axios 的預設  
```javascript
/**
 * We will use laravel/passport JWT to verify API permission.
 * Once user success to login, get a access token. The access token will be
 * stored in the Local Storage of browser.
 */
let accessToken = JSON.parse(window.localStorage.getItem('accessToken')|| null);

if (accessToken) {
    window.axios.defaults.headers.common['Authorization'] = accessToken;
}
```

- 補充  
可以在 `app/Exceptions/Handler.php` 做 error handle  
在這裡把全部的 api error 都回傳 `401 未驗證`， 不良示範XDD  
```php  
/**
 * Convert an authentication exception into an unauthenticated response.
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  \Illuminate\Auth\AuthenticationException  $exception
 * @return \Illuminate\Http\Response
 */
protected function unauthenticated($request, AuthenticationException $exception)
{
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Unauthenticated.'], 401);
    }

    $guard = array_get($exception->guards(), 0);
    switch ($guard) {
        case 'web':
            $login = 'login';
            break;
        case 'api':
            return response()->json(['error' => 'API Unauthenticated.'], 401);
            break;
    }

    return redirect()->guest(route($login));
}
```

### 參考
[Laravel 官方](https://laravel.com/docs/master/passport#installation)
[Laravel Passport JWT Authentication](http://chatterjee.pw/larvel-passport-jwt-authentication/)

---

## OAuth2

### 什麼是 OAuth?
例如說你從你的服務要跟 google 拿取使用者的資訊 

| - | - |
| -------- | -------- |
| Resourse Owner | 使用者 |
| Client | 你的服務 |
| Authorization Server | 授權者，服務跟這邊拿token 如: google |
| Resource Server | 服務會跟這裡拿資料 |
 
![](https://camo.githubusercontent.com/3487f5ca4ff38a3ca3b23111dcd9424bdcf6d209/687474703a2f2f626c6f672e676f7069766f74616c2e636f6d2f77702d636f6e74656e742f75706c6f6164732f323031322f31302f63647261772e706e67)

### 開始安裝 - 實戰時間
> 前幾個步驟同官方教學

##### 1. composer 載回來
`composer require laravel/passport`

##### 2. 開表
`php artisan migrate`  
然後你會多 5 張表 (主要使用到 `oauth_access_token`)
```sh
$ php artisan migrate
Migrating: 2016_06_01_000001_create_oauth_auth_codes_table
Migrated:  2016_06_01_000001_create_oauth_auth_codes_table
Migrating: 2016_06_01_000002_create_oauth_access_tokens_table
Migrated:  2016_06_01_000002_create_oauth_access_tokens_table
Migrating: 2016_06_01_000003_create_oauth_refresh_tokens_table
Migrated:  2016_06_01_000003_create_oauth_refresh_tokens_table
Migrating: 2016_06_01_000004_create_oauth_clients_table
Migrated:  2016_06_01_000004_create_oauth_clients_table
Migrating: 2016_06_01_000005_create_oauth_personal_access_clients_table
Migrated:  2016_06_01_000005_create_oauth_personal_access_clients_table
```

##### 3. 創造 key
`php artisan passport:install`  
他會幫你的 OAuth Server 準備一對 Key (storage/oauth-private.key, storage/outhpublic.key)  
同時也準備一組 Client Key 在 `oauth_clients` 資料表內  
```sh
$ php artisan passport:install
Encryption keys generated successfully.
Personal access client created successfully.
Client ID: 1
Client secret: VJZEYfTpsHBkNCv9ULUyHvGBbJvYiD1ZVP86cbYu
Password grant client created successfully.
Client ID: 2
Client secret: l4kh71C2DpdUsNmJFipi0hiDnhdgj6VfF5lGGDam
```

##### 4. 附加 passport 至 auth 系統
- 在 `app\User.php` 新增一個 trait `Laravel\Passport\HasApiTokens`  
- line:5,11  
```php
<?php

namespace App;

use Laravel\Passport\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    // other code...
```
- 在 `app/Providers/AuthServiceProvider.php` 新增 passport 的 route  
- line:5 import passport  
- line:29 add passport routes  
```php
<?php

namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Passport::routes();
        
        // set when access tokens expire
        Passport::tokensExpireIn(now()->addDays(15));
    }
}
```
- 在 `config/auth.php`  
修改 guard 使用 passport  
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```


