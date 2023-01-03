---
title: "K8s master 退出不乾淨之新結點進不來"
date: 2021-09-03T17:11:00+08:00
draft: false
tags: ["kubernetes"]
---

> Ubuntu 18.04
> Kubernetes 1.21.4

## 問題描述
其中一台 Master 機器突然掛掉開不起來，因此決定把他刪掉再加一台新的
```
# 找出有問題的節點
$ kubectl get node
NAME               STATUS                        ROLES                  AGE    VERSION
ip-172-16-16-101   NotReady,SchedulingDisabled   control-plane,master   2d9h   v1.22.1
ip-172-16-16-102   Ready                         control-plane,master   2d9h   v1.21.4
ip-172-16-16-103   Ready                         control-plane,master   23h    v1.21.4

# 處理掉他！！！
$ kubectl drain ip-172-16-16-101 --force --ignore-daemonsets --delete-local-data
$ kubectl delete node  ip-172-16-16-101
```

然後問題來惹，新節點再 kubeadm join 時，竟然等不到剛剛刪掉的機器，卡在這邊跑不下去了！！
```
[etcd] Checking etcd cluster health
```

這裡是加上 `--v=5` 的詳細資料
![](https://i.imgur.com/qCJUtgs.png)

然後看 kubelet 的 log
```
$ systemctl status kubelet

# 滿滿的找不到啊
Failed to get etcd status for https://172.16.16.101:2379: failed to dial endpoint https://172.16.16.101:2379 with maintenance client: context deadline exceeded
```


## 開始處理它
到其他台 Master 去，我們要直接動 ETCD 裡面的資料，
首先安裝工具
```
sudo apt install etcd-client jq
```

使用 `member list` 查看目前的 ETCD 成員紀錄
```
ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key member list -w=json | jq .
```

抓到問題仔還待在裡面
```json
{
  "header": {
    "cluster_id": 17126876678076365000,
    "member_id": 863997665741218400,
    "raft_term": 1998
  },
  "members": [
    {
      "ID": 863997665741218400,
      "name": "ip-172-16-16-103",
      "peerURLs": [
        "https://172.16.16.103:2380"
      ],
      "clientURLs": [
        "https://172.16.16.103:2379"
      ]
    },
    {
      "ID": 11409705404260921000,
      "name": "ip-172-16-16-102",
      "peerURLs": [
        "https://172.16.16.102:2380"
      ],
      "clientURLs": [
        "https://172.16.16.102:2379"
      ]
    },
    {
      "ID": 12364568155915485000,
      "name": "ip-172-16-16-101",
      "peerURLs": [
        "https://172.16.16.101:2380"
      ],
      "clientURLs": [
        "https://172.16.16.101:2379"
      ]
    }
  ]
}
```

要再去拿一次 Hex 的 ID 然後呼叫 `member remove` 砍了他
```
$ ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key member list
bfd894ca145a242, started, ip-172-16-16-103, https://172.16.16.103:2380, https://172.16.16.103:2379
9e576a9d2cd3b2cc, started, ip-172-16-16-102, https://172.16.16.102:2380, https://172.16.16.102:2379
ab97c53a3e73018b, started, ip-172-16-16-101, https://172.16.16.101:2380, https://172.16.16.101:2379

$ ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key member remove ab97c53a3e73018b
```

回到新的節點去 `kubeadm reset` 掉後重跑，就可以囉！

## Ref
https://www.jianshu.com/p/451dc38b1289
https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/
