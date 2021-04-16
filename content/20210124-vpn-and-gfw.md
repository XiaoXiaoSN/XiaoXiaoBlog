---
title: "VPN & GFW - 科學上網"
date: 2021-01-24T01:52:48+08:00
draft: false
tags: ["gfw", "vpn"]
---

## GFW (great fire wall)
中國大陸在 2008 年啟動的計畫，監管所有的網路流量並且阻擋許多境外的網站和不受允許的 IP，例如說 youtube, google search, facebook 都是被禁止的。也因此有了翻牆找自由的需求，幫 QQ 

GFW 擋掉的方法有域名污染、關鍵字阻斷、特徵攔截...等等，只要他看見你的封包含有他不喜歡的關鍵字，或是黑名單的 IP 就直接斷掉你的網路封包。

因此想要繞過 GFW 的審核，就需要用上封包加密，他看不懂的東西他不會隨便的就把你給封鎖掉，也就有機會可以碰觸到外面的世界。
不過這樣會面臨到另一個問題，加密的內容 GFW 看不懂，google 也一樣看不懂，因此需要有一台跳板機來解密，然後跳板機幫你做到你真正想要做的事情，再將結果加密傳回去給你。


## 常用技術與工具們
### VPS (Virtual Private Server)
也就是跳板機啦，常用的供應商有 Linode, Vultr，都是老牌穩定價格合理的廠商。  
他們會租借一台虛擬的主機和 IP 給你，就好像有一台實際的電腦，你可以連線進去在上面做任何的事情~~ 當然也包含架設 VPN 跳板喔

### socks5
跑在第五層(Session Layer)的代理服務，很常被用來作為 VPN 服務的代理，不過這個協定不包含加密，因此一般會再搭配其他服務一起使用。
另外他無法做到全局代理，例如更低層級的 TCP, ICMP 這些協定，你 ping 回來還會是自己的 IP

可以使用類似 tun2sock 這類工具，轉換所有的流量至 socks5，以達到全局代理的效果，當然別忘記還沒加密嘿

### ShadowSocks (SS, SSR)
最有知名度的翻牆工具，內容就是簡單的對封包做對稱加密，支援多種加密法，也有各種語言實作套件，不過也因為他簡單所以有很多人都表示這種翻牆的特徵已經能夠被 GFW 識別出來了，然而目前的翻牆最大宗還是使用 ShadowSocks 再加上 socks5 代理

然後作者在 github 上突然的消失好幾個月惹，大家都說他被中國政府抓去喝茶惹

SSR(ShadowSocksR) 是 ShadowSocks 的 fork 修改版

### V2Ray
來自 Project V，V2Ray 專案就是個超級綜合包，支援許多種不同的協議(當然也包含 ShasowSocks)，可以自定義出口協定、入口協定、白名單...，抽象程度很高可以彈性的做變化，也因此複雜度相當高

也有發行自己的協議 - VMess，他是基於 TLS 的加密演算法，用於保護內容，混淆特徵。

平台上推薦的用法是 VMess + WSS，也就是用 vemss 協議加密再透過 TLS 加密過的 websocket 傳輸，加完密基本上從外觀上看就是一個跟所有人都一樣的正常 websocket 連線，而且被 GFW 抓走的案例也相對少很多，因此被認為是一個主流的翻牆方式～～

### Trojan
不太認識這個QQ，是個後來出現的明日之星(?

他和 V2Ray 相同也是跑在 WSS 上做加密、混淆，不過他不像 V2Ray 有這麼多的選擇，也就更輕量更簡單。

### 專線(IPLC, IEPL)
中國內部的網路有幾種線路，常見的 163, CN2... 還有其他幾種骨感網路的流量，不是很了解但知道他們都是要過 GFW 的。  
IPLC 就厲害啦，他不過 GFW 所以不用翻！不過這線路貴得很，基本不在選項內 XDD

## TODO嗎
像是傳統的 VPN 協議就會有明顯的特徵，
PPTP L2TP openVPN SSTP...


## Ref
https://www.v2ray.com/developer/intro/guide.html
https://www.youtube.com/watch?v=XKZM_AjCUr0&list=PLqybz7NWybwUgR-S6m78tfd-lV4sBvGFG
https://github.com/trojan-gfw/trojan
https://wivwiv.com/post/ssr-v2ray-trojan/
https://blog.wongcw.com/2019/07/03/iepl%E3%80%81iplc%E8%A9%B3%E7%B4%B0%E4%BB%8B%E7%B4%B9%E5%8F%8A%E5%8D%80%E5%88%A5/
