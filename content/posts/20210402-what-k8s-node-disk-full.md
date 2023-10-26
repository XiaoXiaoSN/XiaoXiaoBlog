---
title: "啥? k8s node 硬碟空間滿了"
date: 2021-04-02T01:19:30+08:00
draft: false
tags: ["docker", "linux", "log"]
---


## 發現 k8s 機器的硬碟空間滿了
滿了耶！！怎麼會這樣
![](https://i.imgur.com/09T0qb3.png)

趁還有空間趕快 ssh 進去看一眼
```
dev@k8s07:~$ df -h
Filesystem                         Size  Used Avail Use% Mounted on
udev                               5.9G     0  5.9G   0% /dev
tmpfs                              1.2G  4.5M  1.2G   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv   98G   70G   23G  76% /
tmpfs                              5.9G     0  5.9G   0% /dev/shm
tmpfs                              5.0M     0  5.0M   0% /run/lock
tmpfs                              5.9G     0  5.9G   0% /sys/fs/cgroup
/dev/sda2                          976M  213M  696M  24% /boot
tmpfs                              1.2G     0  1.2G   0% /run/user/1000
```

閉眼先清空一波 Docker image, volume...
```
docker system prune -a
```

檢查一下還有啥米東西佔用了我們的空間
```
sudo du -ahx / | sort -rh | head -n 20
```

```
find /var/lib/docker/ -name "*.log" -exec ls -sh {} \; | sort -h -r | head -20
```

一看發現原來我有一個 30G 一個 18G 的 docker logs，有夠大啦😂
看一下 log 內容就發現了原因是最近新增的爬蟲的關係 QQ (還有 fluent-bit 也不小)

## 解決他
沒事沒事，之前可能大意了沒有想到這種 Case 簡單加個規則就好了
```
cat > /etc/docker/daemon.json <<EOF
{
   "exec-opts": ["native.cgroupdriver=cgroupfs"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "1g",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
```

The max-size is a limit on the docker log file, so it includes the json or local log formatting overhead. And the max-file is the number of logfiles docker will maintain. After the size limit is reached on one file, the logs are rotated, and the oldest logs are deleted when you exceed max-file.

> Note: Restart Docker for the changes to take effect for newly created containers. Existing containers do not use the new logging configuration.

```
# Restart docker.
systemctl restart docker

# 手動刪除舊的大檔案
cat /dev/null > 大檔案.log
```

### 一個小坑
另外要注意，我第一次寫的時候 daemon.json docker cgroup driver 設定成 systemd 就炸掉了XDD
```
$ journalctl -xeu kubelet
# ....something
failed to run Kubelet: misconfiguration: kubelet cgroup driver: "cgroupfs" is different from docker cgroup driver: "systemd"
# ...something
```

## Ref
https://www.linode.com/community/questions/16922/my-disk-is-filling-up-how-can-i-find-the-culprit
https://docs.docker.com/config/containers/logging/configure/#configure-the-default-logging-driver
https://stackoverflow.com/questions/31829587/docker-container-logs-taking-all-my-disk-space
