---
title: 筆記 laravel 真新手時間
date: 2019-01-23T20:36:55+08:00
tags: ["php", "laravel"]
---

## 新手入門
### 結構介紹
我們現在在 laravel v5.7  
一起來看一下 laravel 專案的結構吧

#### app
大部份的網頁**後端主要程式碼** 也就是說他很重要

* (Model)放在外面的大寫開頭們～  
例如說 `User.php` 就是，
他們是 `Model`，定義了資料庫的物件模式

* Http/
    * Controllers/  
    `controller`可以作為路由進來後的流程控制器，可以想像它負責告訴大家要做什麼
    * Middleware/  
    `middleware`叫做中間層，用來包著你的程式內容，request 進出都會經過

#### bootstrap
程式啟動第一個執行的套件

#### config
所有應用的設定檔們

#### database
顧名思義：資料庫～
* migrations/  
紀錄了資料庫的心路歷程  
其中定義了`up`跟`down`，模擬建立資料還有需要rollback回去時的動作
* fatories/  
定義了一些資料的模式，可以使用seeder批量製造
* seeds/  
他是一顆會長出資料的種子，當你需要產生測試用的資料的時候很常遇到他

#### public
對外公開給使用者看得到的資源  
* Ex: 圖片、webpack包裝過的檔案

#### resources
本地資源
* Ex: js的原始碼、CSS...

* /assets
    * /js/components  
    裡面寫了好多 vue component 們，他們是前端主力!
* /views  
    這邊放了 `blade` ，他是 laravel選用的模板引擎，幫你更智慧的寫你的html

#### routes
* api.php 裡面註冊API
* web.php 裡面註冊網頁

他們最大的差別就是套用了不同的`middleware`

#### storage
網頁被儲存的資源
* Ex: log日誌檔案(紀錄檔)、檔案快取

#### tests
測試單元、整合測試  
大家都說用TDD比較快ㄛ

#### vender
放別人code的地方  
拿別人的code來用

#### laradock
它幫助我們使用`docker`來建制服務
* `laradock/.env` 存放 laradock的設定參數


#### 其他檔案
* `.env`
在這個網頁會用到的參數，像是資料庫的密碼
* `artisan`
放了些 laravel 的工作指令
* `composer.json`
composer 用在 php 的套件管理
當你需要幫你的 php 程式裝點別人的套件的時候，你會進來這邊看看
* `package.json`
javascript 的套件版本管理，還有 npm 指令喔
* `webpack.min.js`
webpack 會幫你打包前端的資源們

### 簡單操作 (by Xiao & Andrew & Dagg)
#### 註冊路由

寫在 routes/web.php

這邊可以試著用你的路由連上預設的welcome首頁了

> 你要在postman測試的話
> 要關掉csrf防禦
> app/Http/Middleware/VerifyCsrfToken.php

#### migrate - 開個資料表
```
php artisan make:migration crete_todoList_table
```

檔案會在 ./database/migration/
檔名範例: 2018_01_22_170244_crete_todoList_table


column 建立說明
https://laravel.com/docs/5.5/migrations#creating-columns


#### 寫個Controller 

```
php artisan make:controller TodoListController
```
在 ./app/Http/Controller/ 會長出來


#### resource
> 如果你加上 --resource 的話,它會長出預設的幾個功能框框
而你可以在route裡面 Route::resource() 來管理他們
https://laravel.com/docs/5.5/controllers#resource-controllers


```
不得已用简体中文输入法的补充：
关于controller:
    中层的class，管理http之间的行為（ ex: get and post method ）
    另一种则是管理资源的class,管理对于资源的事件（ex: 图片的新增、修改、删除）,
    称為resource controller
    每一个controller都可以注册一个路由方便管理
    如果想要resourcecontroller继承特定model特性的话,
    可以在指令后方加上 --model=[model name]
```

所以我們的結論:  
API Controller + Model 的產生方法 
```sh
php artisan make:controller TodoListController --resource --model=TodoList
```

如果不需要頁面的話　`--resource` 可以換成加上 `--api` 喔
```sh
php artisan make:controller API/TodoListController --api
```

#### 用個model裝起來
```sh
php artisan make:model TodoList
```

會長出 ./app/TodoList.php   
在裡面寫你跟資料庫的互動等等(static function)  
然後你可以在controller裡面呼叫他們

#### Resource 打包你的資料
```sh
php artisan make:resource TodoList
```

:::info
app/Providers/AppServiceProvider 裡面的 boot() 可以加上
use Illuminate\Http\Resources\Json\Resource;
Resource::withoutWrapping();
它會不包裝你的response
:::

#### Collection 打包你的資料們
```sh
php artisan make:resource TodoListCollection
```


#### 來灌些假資料
factory製造出假的資料、資料型態, seeder把他們寫起來 
```sh
php artisan make:seeder TodoListSeeder
php artisan make:factory TodoListFactory
```

首先去DatabaseSeeder 的 run 裡面, 把你要跑的seeder註冊個
```php
$this->call([
    TodoListSeeder::class,
    //other seeder
]);
```

再來是目標的TodoListSeeder
會用到factory回傳資料, 到 TodoListFactory 設計
這樣它會回傳5筆 fake 資料到資料庫
```php
//call factory to fake data
factory(App\TodoList::class, 5)->create();
```

執行 `DatabaseSeeder` 中被指定的 seeder 們
```
./artisan db:seed 
```

---
## BLOG - 實作時間 (by Dagg)

###  建立Article的Model

為了建立存放文章的Model輸入指令:
`php artisan make:model 'Article' --migration`
同時建立該model的migration

###  管理Article的Model

```php
class Article extends Model
{
    protected $table = 'articles'; 

    // $fillable  為可以填入的table
    protected $fillable = [
        'content'
    ];
}
```

###  建立Migration文件中資料表的欄位格式

* $table->increment('_'); // 自動產生的key
* $table->longText('_');  // 放置無限字元的欄位 例如:文章內容
* $table->string('_');    // 放置255字元內的字串欄位
* $table->softDeletes();  // 建立一個判別軟刪除的欄位
* $table->timestamps();   // 建立時間標記的欄位(會建立兩個欄位，一個放建立時間一個放更新時間)
    
調整完你要產生的欄位行別之後在終端機輸入:
$ `php artisan migrate`


### Controller
```php
public function store(Request $request)  // 建立一個store的函式 會接收Request
{
    $article = $request->input('article'); //把Request的input丟進去$article這個變數裡面
    $show = new Article();      // 建立一個新的Article物件
    $show->content = $article;  // 讓新建的Article物件轉成Request的input
    $show->user_id = 1;         // 紀錄user_id
    $show->save();              // 把這個Article這個物件save
    return 'Hi';                // 測試用寫爽的 想不到吧
}
```
