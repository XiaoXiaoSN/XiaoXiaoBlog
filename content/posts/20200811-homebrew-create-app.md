---
title: Homebrew 自己寫配方一起來釀酒
date: 2020-08-11T23:16:31+08:00
tags: ["homebrew", "ruby", "pokesay", "pokemon"]
---

## 不囉唆直接上圖

![](https://i.imgur.com/8csSu3h.png)
馬上試試 pokesay

```sh
brew tap xiaoxiaosn/xiaoxiao
brew install pokesay
```

## 起源

這個故事是這樣的，有一天發現了一個有趣的 command [pokemonsay](https://github.com/possatti/pokemonsay)他是 [cowsay](https://en.wikipedia.org/wiki/Cowsay) 的改編版，它可以讓 pokemon 出現說你想要他說的話 XDD  
我用得很快樂的時候發現一件事很不快樂，當一行太多字的時候會換行  
你看！都擠在一起了 R  
![](https://i.imgur.com/ZZlwdAQ.png)

這時我想到 cowsay 應該有這個功能才對呀！ 查詢了之後發現 在 pokemonsay 裡面 `-n` 被用在 `Do not tell the pokémon name.` 也就是最底下不要 show pokemon 的名字

QQ 我不依，我自己改!

## 介紹 Homebrew

首先先介紹一下 homebrew 這個軟體～
他是 MacOS 上的套件管理工具，是 mac 最重要的必裝軟體之一

- `brew` 這個字是釀造的意思，`homebrew` 在家釀造也就是自釀的意思
- `tap` 第三方套件的倉庫，就相當於是 apt 的 ppa 一樣的角色
- `formula` 公式、配方，上面寫著軟體安裝的步驟，也就是釀製(brew)的方法
- `cellar` 酒窖存放釀好的酒，預設存在 `/usr/local/Cellar`，每個資料夾裡面也存有不同的版本，當 brew switch 某個套件版本的時候就是把 `/usr/local/bin` 的 link 指過去
  ![](https://i.imgur.com/D5m64PT.png)

> 補充:
> `brew cask` 用來安裝 macOS apps 也就是可以直接在應用程式裡面看到的圖像化軟體，像是 Chrome, Firefox, 360Safe 之類的

了解完基本架構後，我們知道目標就是製作自己的 `tap`
好讓 `brew` 可以安裝我們釋出的第三方套件

## 開始釀酒

我們分成兩個部分來完成，一個是我們的應用程式另一個是 homebrew 的安裝腳本

### 程式本身

只要任何一個可以執行的命令都行，所以先不著墨於此
範例會用下面這個 repo，已經把我想要的 `-n` 指令加回來啦～～
https://github.com/XiaoXiaoSN/pokesay

### Formula 安裝指南

本文的重點來啦!
首先我們要到 github 上開一個新專案，命名叫做 homebrew-{your-tap-name}，例如我的 `homebrew-xiaoxiao`

進入專案底下新增 `Formula` 資料夾，在底下新增你的 formula

```ruby
# Formula/pokesay.rb

# 定義 Pokesay 繼承 Formula
class Pokesay < Formula
  desc '"pokesay" is like "cowsay" but for pokémon.'
  homepage "https://github.com/XiaoXiaoSN/pokesay"

  # url 說明要去哪裡下載專案
  # https://github.com/{username}/{repo}/{format}/{tag or branch}
  # format 我們都寫 tarball
  # tag or branch 就看你喜歡用哪個囉
  url "https://github.com/XiaoXiaoSN/pokesay/tarball/v1.0.1"

  # sha256 用來確認你上面說的檔案身份，等等下面會說怎麼長出來
  sha256 "43511be3dbb52b380bf7501e3b06a0a17ee0349d0246601537481ca811753a4a"

  # 版本號
  version "v1.0.1"

  # depends_on 定義安裝你的東西前，會用到的依賴套件
  depends_on "cowsay" => :recommended
  depends_on "coreutils" => [:recommended, "with-default-names"] if not OS.linux?

  # 定義安裝步驟
  def install
    system "cp", "-r", "./cows", "#{prefix}/cows"
    system "cp", "pokemonsay.sh", "pokesay"

    # 字串取代，讓 pokesay 在本地也可以找得到參考檔案
    inreplace "pokesay", /^pokemon_path=.*$/, "pokemon_path=#{prefix}/cows"

    # 把 pokesay 複製到這個 formula 的目錄 (/usr/local/Cellar/{pkg}/0.1/bin)
    # 並設定成可執行檔案 (chmod 0555 foo)
    bin.install "pokesay"
  end

  # 安裝完成後的驗證測試，這邊偷懶沒寫 XD
  test do
    system "false"
  end
end
```

如何產生 sha256

```sh
# 用 curl 下載壓縮檔下來， -L 跟隨跳轉 -o 儲存輸出到檔案
curl -L https://github.com/XiaoXiaoSN/pokesay/tarball/v1.0.1 -o pokesay.tar.gz
# 計算 sha256 雜湊值
shasum -a 256 pokesay.tar.gz
```

### brew edit

`brew edit` 會叫出你安裝時下載的 Formula，讓你可以編輯再重新安裝  
也可以藉機偷偷參考別人的 Formula 是如何編寫的～～

```sh
brew edit wget # 會使用預設編輯器開啟
```

## Ref

homebrew 故事 https://www.onejar99.com/mac-homebrew-homebrew-cask-mac/
Formula-Cookbook https://docs.brew.sh/Formula-Cookbook
