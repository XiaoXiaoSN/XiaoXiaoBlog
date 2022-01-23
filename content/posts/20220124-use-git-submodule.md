---
title: "用一下 Git Submodule 啦"
date: 2022-01-24T01:06:08+08:00
draft: false
tags: ["git", "hugo"]
---

## 開始使用
上次更換了一下 Blog 的 hugo theme，但是後來發現直接用 `git clone` 下載下來的 theme 沒有更新到 GitHub 上面 `(╯•̀ὤ•́)╯`。

歐給歐給，我們改用一下 Submodule 處理一下

### 加入 Submodule
這次目標要把從 Gitee 上 Clone 回來的 Repo `XiaoXiaoSN/hugo-theme-pure` 作為 Theme，
放到 `XiaoXiaoSN/XiaoXiaoBlog` 的 `themes/pure` 資料夾下！

```shell
git rm themes/pure

git submodule add git@github.com:XiaoXiaoSN/hugo-theme-pure.git themes/pure
```

完成後我們會多一個 `.gitmodules` 檔案，裡面的內容也很直觀
```
[submodule "themes/pure"]
	path = themes/pure
	url = git@github.com:XiaoXiaoSN/hugo-theme-pure.git
```

把更新推出去～ `git push origin master`
![](https://i.imgur.com/LNujTew.png)


### 第一次使用 Submodule 的話
為了測試我再另外下載一份
```shell
git clone --depth 1 git@github.com:XiaoXiaoSN/XiaoXiaoBlog.git testXiaoXiaoBlog
```

進去後我們可以用 `git submodule` 查看目前的狀態
```shell
$ git submodule
 c97723a02ac3abace65a6433eab381f0acbe2719 themes/pure
```

```shell
$ git submodule init
子模組 'themes/pure'（git@github.com:XiaoXiaoSN/hugo-theme-pure.git）已對路徑 'themes/pure' 註冊

$ git submodule update
正複製到 '/Users/arios/Project/XiaoXiaoBlog/themes/pure'...
子模組路徑 'themes/pure'：簽出 'c97723a02ac3abace65a6433eab381f0acbe2719'
```

或是也可以合在一起做
```
git submodule update --init
```

## 更新 Submodule
要測試更新 Submodule 所以我們先到被註冊的 Submodule 製造一個 Commit 模擬依賴的模組被更新的狀態～
```shell
# cd hugo-theme-pure
git commit -m 'chore: just a empty commit' --allow-empty
```

再來我們回到剛剛的專案內，並且 `cd` 到 Submodule 的資料夾
```shell
# cd themes/pure
$ git pull origin master
來自 github.com:XiaoXiaoSN/hugo-theme-pure
 * branch            master     -> FETCH_HEAD
更新 c97723a..afa94b2
Fast-forward
```

回到這邊發現 Submodule 已經更新了
```
# cd ../..
$ git submodule
+afa94b26c59df0c4ce226f173d88fdc8ba9a0246 themes/pure (heads/master)
```

再重新推出去就好囉～～
```shell
git add --all
git commit -m 'feat: upgrade `themes/pure`'
git push origin master
```

看那個 Commit Hash 是不是不一樣了呀 >u<
![](https://i.imgur.com/iiOEzWO.png)


## Ref
https://blog.wu-boy.com/2011/09/introduction-to-git-submodule/