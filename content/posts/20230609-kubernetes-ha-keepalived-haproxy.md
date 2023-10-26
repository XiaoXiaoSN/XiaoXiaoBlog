---
title: "Kubernetes HA - Keepalived(VRRP) + HAProxy"
date: 2023-06-09T20:01:00+08:00
draft: false
tags: ["kubernetes", "ha", "vrrp"]
---

跟這個專案架構相同 [kubelived](https://github.com/clastix/kubelived)，他的更詳細，可以參考他的介紹

簡單來說就是 Keepalived(VRRP) + HAProxy

## VRRP (Virtual Router Redundancy Protocol)
設計上用來避免單點故障，當主要服務機器失去連線時可以切換到另一台備援機器上。
維護一組 Virtual IP 指向後面的服務們，使用者只需要將 Request 發到這組 VIP 就會被轉發到其中一台 Real Server 上。

### 選舉 Master

當有多台 nodes 時，選舉其中一台作為 Master 其他作為 Backup，依照以下條件競爭
1. Priority 最高者優先
2. VIP 和自身 IP 一致者
3. 選 IP 地址最大的

選舉出 Master 後，Master node 會廣播 ARP 封包將 VIP 的 MAC/IP 設定到自己身上

### Master 失敗 / Backup 搶佔
VRRP Master node 會定時發心跳包給其他 nodes，如果失去連線其他幾台 node 會重新選出 Master，並且發送廣播 ARP 封包將 VIP 重新定位到新的 Master 上。

可以設置 nopreempt (No Preempt)，避免原本的 Master Node 恢復狀態後重新搶佔回 Master。
使用場景：假設 Master Node 出問題了，不斷開開關關導致頻繁切換，中間可能發生不預期的走錯路、掉封包問題

## Keepalived
實際上用來設定 VRRP 的管理員件，設定了 VRRP ID, VIP, 網卡...，也包含用來檢查後端 K8s API Server 是否健康的 script，連續檢查不過就會觸發切換 Master node

設置完成後會看起來像這樣：

非 Master node 網卡上只有自己的 IP
```
$ ip address show enp5s0
2: enp5s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9000 qdisc fq state UP group default qlen 1000
    link/ether 7c:10:c9:d2:70:c3 brd ff:ff:ff:ff:ff:ff
    inet 192.168.97.17/24 metric 100 brd 192.168.97.255 scope global dynamic enp5s0
       valid_lft 241387sec preferred_lft 241387sec
...
```

Master node 網卡上多一筆 VIP，這裡是 `192.168.97.200`
```
$ ip address show enp5s0
2: enp5s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9000 qdisc fq state UP group default qlen 1000
    link/ether 7c:10:c9:d2:71:8c brd ff:ff:ff:ff:ff:ff
    inet 192.168.97.16/24 metric 100 brd 192.168.97.255 scope global dynamic enp5s0
       valid_lft 189537sec preferred_lft 189537sec
    inet 192.168.97.200/32 scope global enp5s0
       valid_lft forever preferred_lft forever
...
```

## HAProxy
前面透過 Keepalived 做到備援切換後，實際透過 HAProxy (port 8443) 將流量導向其他 K8s Control Plane (port 6443)

## Ref
https://github.com/clastix/kubelived
https://www.qikqiak.com/post/use-kube-vip-ha-k8s-lb/
https://zhuanlan.zhihu.com/p/537216766
