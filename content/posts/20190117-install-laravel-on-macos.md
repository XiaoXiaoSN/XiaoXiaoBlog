---
title: "筆記 安裝 Laravel on MacOS"
date: 2019-01-17T12:03:16+08:00
draft: false
tags: ["php", "laravel"]
---

## Step by Step 安裝指南
### 事前準備
#### HomeBrew
首先安裝 [HomeBrew](https://brew.sh/index_zh-tw)，他是 Mac 上的套件管理工具  
在終端機執行他： (裝過了可以跳過)
```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

#### ＊ Docker 
安裝 [Docker](https://hub.docker.com/editions/community/docker-ce-desktop-mac)， 以會需要他多多照顧  
不想登入可以直接點 [下載連結](https://hub.docker.com/editions/community/docker-ce-desktop-mac) 下載 .dmg 並安裝

#### 安裝 python3
用 `brew` 裝，已經裝好了，跳過

#### 安裝 docker-compose
就是把 docker 組隊，一次把一群不同 docker 給開起來的工具
```sh
pip3 install docker-compose
```

#### ＊ 安裝 PHP (7.1.3以上)
```sh
brew install php@7.2
```

#### ＊ 下載 Composer
`composer` 是 php 的套件管理工具，想像他跟 `pip`, `npm` 這些的傢伙是一樣的 

##### 可以直接跑下面的指令，或是到[下載頁面](https://getcomposer.org/download/)下載
```sh
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php -r "if (hash_file('sha384', 'composer-setup.php') === '93b544968e392c0362774670ac182b134cd3b3a09695e5dca5e53c3728f1a9f115f20b3b754bf9a1be329d521bdaa8b26ac6a13e9a62d6444cdb0dc8a1da0806156398a5cbe587c3f0fe57a54d8f5') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
php composer-setup.php
php -r "unlink('composer-setup.php');"
```

##### 裝完後會多出一個 `composer.phar`，我們把它放到可使用指令區
```sh
sudo mkdir /usr/local/bin -p
sudo mv composer.phar /usr/local/bin/composer
```


#### ＊ 安裝 NodeJS 
來這邊安裝 https://nodejs.org/en/download/
目前我使用的版本是 `8.12` ，不過下載到 10版的應該也不會有問題啦 > <

---
### 下載 Laravel 框架
#### 移動到要安裝的資料夾，例如：
```sh
cd ~/project
```
#### 利用 git 下載， 完成後會多一個 `practice` 資料夾
```sh
git clone https://github.com/laravel/laravel.git practice
```

#### 安裝 Laravel 相依套件
##### 移動到專案資料夾
```sh
cd practice
```
##### 利用 composer 安裝 php 的相依套件
```
composer install
```
##### 更新一下 js 套件
```
npm install
```

##### 更改權限
```
sudo chmod -R 777 storage/ bootstrap/cache/
```

### 試試看能不能開服務啦～～～ 
```sh
php artisan serve
```
用你的瀏覽器開這個 http://127.0.0.1:8000

敲棒der～～～
![](https://i.imgur.com/fEbm0nB.png)

##### 開過後，更改權限2
```
sudo chmod -R 777 storage/
```

---

## 好像...還缺了些東西？
那我的資料庫呢？ 我們找 [Laradock](http://laradock.io/)來幫我們吧!

### ＊ 在 project 裡面安裝 laradock
```sh
# cd ~/project/practice
git submodule add https://github.com/Laradock/laradock.git
```

##### 裝好之後, 我們複製一份 `laravel` 的設定檔
```
cp .env.example .env
```

##### 產生 app key
```
php artisan key:generate
```

##### 然後修改一下 `MySQL` 連線的設定
```yml
# at ~/project/practice/.env
# line 9
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=default
DB_USERNAME=default
DB_PASSWORD=secret
```

##### 還有 `laradock` 的也是
```sh
cd laradock
cp env-example .env
```

##### 最後我們要小改一下，改變 `laradock` 存檔的位置
```bash
# line 14
DATA_PATH_HOST=~/.laradock/practice-data
```

##### 下載 docker image
```sh
docker pull xiao4011/laradock_mysql
docker tag xiao4011/laradock_mysql:latest laradock_mysql:latest
```

## 看起來設定好了，跑跑看？
laradock 也可以幫你開很多不同的服務，這裡我們先開好我們需要用的
```sh
docker-compose up -d mysql phpmyadmin
```

#### 試試看連線
回到外層，也就是 `~/project/practice`

執行一下這個指令
```sh
php artisan migrate
```
![](https://i.imgur.com/oK6cjq7.png)
他幫你建了幾張 table 你就成功了

### Bonus
找個視窗開啟服務 `php artisan serve`
執行一下這個指令，看看多了些什麼
```
php artisan make:auth
```
就自動幫你建好會員登入系統了，很方便ㄅ 


---
To Be Continue... [下集待續](/20190123-a-new-in-laravel)
