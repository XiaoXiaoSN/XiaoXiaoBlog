---
title: "筆記 解決VSCode上pylint無法解析c函式庫的內容"
date: 2018-11-08T12:04:17+08:00
tags: ["python", "vscode"]
---

## 問題
![](https://i.imgur.com/fczhIaz.png)
當你的函示庫底層使用**C語言**而不是純python編寫時
pylint可能會無法正確的找到他，此問題可能出現在`numpy`或是本例的`mysqlclient`上

## 解決方法

加入以下至白名單
$`vim ~/.pylintrc`
```
extension-pkg-whitelist=MySQLdb
```