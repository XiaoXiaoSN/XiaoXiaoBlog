---
title: "小紀錄更新 Rinkeby Ethereum 節點"
date: 2021-03-26T01:41:50+08:00
draft: false
tags: ["blockchain", "ethereum", "geth"]
---

> 這是發生在測試鏈 Rinkeby 與 EIP-1559 的故事
> 也是沒有好好更新節點版本又不認真追時事的故事

## 事件發生
大約在晚上 11 點，在家裡測試 SIT 環境的 feature 時，剛好需要幫我的以太錢包充值
發現！ 不妙！ 充不進去耶，怎麼沒反應咧？

找 log 但一切正常，這時發現卡在 8,290,928 想說這個位置是不是發生了什麼奇怪的交易，來查查看好了～
google 後發現， EIP 1559 實裝在 Rinkeby 惹！ 雖然之前沒有認真關注這個提案，但還是知道他是一個吵很大的硬分叉
馬上 ssh 連到我們的 full node 去看看，最高節點就是在 8,290,928 的位置

好啦，找到原因了～～
我們來跟一下硬分叉吧

## 更新一下
首先下載最新的包~~
```bash
sudo add-apt-repository -y ppa:ethereum/ethereum -y
apt-cache policy ethereum # 確認版本
sudo apt-get upgrade ethereal
geth version # 確認版本
```

然後重啟就好囉
```bash
# 再重新開回服務
geth --rinkeby --http --http.addr 0.0.0.0 --ws --ws.addr 0.0.0.0 --ws.origins * --rpcvhosts=* 
```

知道問題後就也不難了，但是開發這個真的要跟時事呀😂  
不然會跟我一樣，都分叉一天了才發現自己的服務沒有更新 QQ
