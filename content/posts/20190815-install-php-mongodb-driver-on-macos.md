---
title: "筆記 Install php MongoDB driver on MacOS"
date: 2019-08-15T19:59:34+08:00
tags: ["php", "laravel", "mongodb"]
---

> ** 2019.08 更新**
> https://www.php.net/manual/en/mongodb.installation.homebrew.php
> mac php72 請使用 `pecl install mongodb` 安裝 mongodb driver
> 因為 mongodb, xdebug 從 homebrew 被移除了
> 
> [time=Thu, Aug 15, 2019 7:59 PM] 

## 問題描述
想在 `Laravel` 用 `MongoDB`

```sh
composer require jenssegers/mongodb
```

錯誤：
```
the requested PHP extension mongodb is missing from your system.
```

 => 沒有裝 `php` 的擴展

## 解決方案
先來個悲劇， `homebrew` 拿掉 php-mongodb 的擴展了QQ

只好去裝人家的，我的 `php` 版本是 7.1 所以裝 `php71-mongodb`
忘記版本的話可以用 `php --version` 查看
```
brew tap kyslik/php
brew install phpxx-mongodb   {xx = 71,72}
```

裝完惹！ 但是當我輸入 `php -i` 檢查的時候
`dyld: Library not loaded: /usr/local/opt/readline/lib/libreadline.7.dylib`

哎呀QQ 來去 Google 看看
```
ln -s /usr/local/opt/readline/lib/libreadline.8.0.dylib /usr/local/opt/readline/lib/libreadline.7.dylib
```

之後可以輸入來檢查有沒有成功
```sh
» php -m | grep mongodb
mongodb
```

link 我手上有的版本過去之後，一切順利呢！！
```sh
composer require jenssegers/mongodb
```

---

## 後記 - 小踩雷
- 要是```php -i | grep mongodb```什麼都沒有的話可能是當初在安裝php的時候沒有安裝完全
    - 移除php重裝一次
    - 然後 ```brew link phpxx```
    - 你的 ```/usr/local/```有可能會沒有sbin這個資料夾所以就```mkdir sbin```他
    - 然後成功連結他應該就可以惹
    - ※小秘訣：你可以跑 ``` brew doctor``` 叫醫生幫你診斷～
    ![](https://i.imgur.com/6Ei2TAB.png)


- 跑起來遇到
```
Symfony\Component\Debug\Exception\FatalThrowableError  : Call to a member function prepare() on null
```
![](https://i.imgur.com/IskCRFl.png)

可以把原本 extend 的 `Model` 換成 ` \Jenssegers\Mongodb\Eloquent\Model`