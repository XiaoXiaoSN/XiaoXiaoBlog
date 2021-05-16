---
title: 筆記 laravel test - 我們也來寫測試
date: 2019-07-03T13:18:13+08:00
tags: ["php", "laravel", "test"]
---

> laravel version: 5.8
> [time=Wed, Jul 3, 2019 1:27 PM]

## 開始之前
test 的設定檔在 `./phpunit.xml` ，
```xml
<!-- phpunit.xml -->

<phpunit>
    <php>
        <!-- laravel 環境設定檔案使用 .emv.testing -->
        <server name="APP_ENV" value="testing"/>

        <!-- 測試環境的資料庫連線設定，我們將使用 sqlite -->
        <server name="DB_CONNECTION" value="sqlite_for_testing"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
```

php 也要加在 `Config/dataset.php`
```php
/* Config/dataset.php */

<?php
'connections' => [
	// ...other db connection configuration

	// 為了方便測試，使用 memory sqlite 做為我們的資料庫
	'sqlite_for_testing' => [
		'driver' => 'sqlite',
		'database' => ':memory:',
		'prefix' => '',
		'foreign_key_constraints' => true,
	],
]
```

確認好設定後，我們執行起來
```sh
# -v 代表 --verbose 顯示更詳細的資訊
./vendor/bin/phpunit -v --debug
```
![](https://i.imgur.com/kx7PVgF.png)

## 寫個測試來跑跑

最近要重構一個 function，覺得裡面的邏輯有點複雜，決定先寫個測試再來開工  
這次的目標是 `app/Http/Services/ScheduleService.php` 裡面的 `checkScheduleAvailable` 這個 function

所以我們先來準備測試檔案:
```
php artisan make:test Schedule/availableTest --unit
```

產生了一個 `tests/Unit/Schedule/availableTest.php` ，來看看裡面有什麼吧
```php
<?php

// test 開頭的 function 會被測試
public function testExample()
{
	// assertTrue 指定結果要是 true, 
	// 因為 (true === true) ，所以我們將會通過測試
	$this->assertTrue(true);
}
```

### 製造假資料

為了測試 function 能夠順利回傳，總要給點資料才能測吧?
```php
<?php
class availableTest extends TestCase
{
    // 資料庫每次用完要復原，才不會讓測試資料一直留在資料庫中
    use RefreshDatabase;
	
	
    public function testQueryUnAvailable(): void
    {
        // inject some fake data into database
        factory(User::class)->create();
        factory(Project::class)->create();
        factory(Pole::class, 5)->create();
        $ad = factory(Ad::class)->make([
            'ad_status_id' => 4,  // ad_status_id: 4 is depolyed
            'ad_types_id' => 1,   // ad_types_id: 1 is slideshow
        ]);
        factory(Ad::class)->create($ad->toArray());
		
        // 測試一波，資料是不是有好好的塞進資料庫了
        $this->assertCount(5, Pole::all());
        $this->assertDatabaseHas('ads', [
            'ad_status_id' => 4,
            'ad_types_id' => 1,
        ]);
    }
}
```

## Ref
https://blog.goodjack.tw/2018/07/laravel-phpunit.html
https://gist.github.com/jaceju/c415c1b42daf4c589f2a
https://laravel.com/docs/5.8/database-testing