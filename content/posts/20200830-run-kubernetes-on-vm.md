---
title: "我們想在虛擬機上跑個 K8s"
date: 2020-08-30T21:38:12+08:00
tags: ["kubernetes", "vm", "vagrant"]
---

## 環境
我們先用 macOS Catalina 10.15.2 來做筆記喔


## 1. 虛擬機
一開始當然是虛擬機啦，讓我們用 vagrant 搭配 virtual box 吧～

### 1.1 安裝 vagrant 跟 virtual box
```shell
brew cask install vagrant
vagrant version
```

vagrant 使用版本 2.2.10  
支援的 virtual box 版本沒有到最新的 6， 我們到這邊下載舊版吧  
https://www.virtualbox.org/wiki/

> 如果 mac 不給你開的話，記得可以到 `系統偏好設定` > `安全性與隱私` > `一般` 開啟權限


### 1.2 設定 vagrant
第一步要先建立一個 Vagrantfile，我們選用 ubuntu 16.04 TLS   
這邊也有更多選擇 --> https://app.vagrantup.com/boxes/search
```sh
# 先在你喜歡的地方開個資料夾吧
mkdir -p ~/projects/vagrant/k8s-master
cd ~/projects/vagrant/k8s-master
vim Vagrantfile
```

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # 選用的檔案，xenial 是 ubuntu16 的名字
  config.vm.box = "ubuntu/xenial64"
  # 將虛擬機內部的 6443 port 導出到本機的 26443 port
  # config.vm.network "forwarded_port", guest: 6443, host: 26443
  config.vm.network "private_network", ip: "172.16.16.100"

  # 分配 2GB 的記憶體給虛擬機
  config.vm.provider "virtualbox" do |vb|
    v.name = "k8s-m1"
    vb.memory = 2048
    vb.cpus = 2
  end

  # 設定帳號密碼是 ubuntu:ubuntu
  config.vm.provision 'shell', inline: <<-SHELL
    echo 'ubuntu:ubuntu' | sudo chpasswd
  SHELL
end
```

### 1.3 用 vagrant 啟動虛擬機
設定好後就開起來連進去吧
```
vagrant up
vagrant ssh
```

## 2. 安裝 kubernetes server

### 2.1 安裝 container 服務
最重要的，我們要先裝 docker >> [我是指南](https://kubernetes.io/docs/setup/production-environment/container-runtimes/#docker)

```sh
## 進入 super user 模式來安裝
sudo su

## 以下開始安裝 Docker CE
## Set up the repository:
## Install packages to allow apt to use a repository over HTTPS
apt-get update -y && apt-get install -y \
  apt-transport-https ca-certificates curl software-properties-common

## Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

## Add Docker apt repository.
add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"

## Install Docker CE.
apt-get update -y && apt-get install -y \
  containerd.io=1.2.10-3 \
  docker-ce=5:19.03.4~3-0~ubuntu-$(lsb_release -cs) \
  docker-ce-cli=5:19.03.4~3-0~ubuntu-$(lsb_release -cs)

## Setup daemon.
cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF

mkdir -p /etc/systemd/system/docker.service.d

# Restart docker.
systemctl daemon-reload
systemctl restart docker

# If you want the docker service to start on boot, run the following command:
sudo systemctl enable docker
```

### 2.2 安裝 kubernetes 
我們需要 kubelet、 kubeadm 和 kubectl >> [指南](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)

```sh
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

```sh
# 禁用 swap
swapoff -a; sed -i '/swap/d' /etc/fstab

# 更改網路設定
cat >>/etc/sysctl.d/kubernetes.conf<<EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system
```

### 2.3 kubernetes master 之 kubeadm

連線回來後記得切換回 super user
```sh
vagrant ssh

# 這時候可以看到 hostname 已經變成 k8s-m1
sudo su
```


這邊簡單選用默認的 Flannel 實作 pod 與 pod 間溝通的介面~
> kubeadm only supports Container Network Interface (CNI) based networks
>
```sh
kubeadm init \
    --apiserver-advertise-address=172.16.16.100 \
    --pod-network-cidr=172.16.0.0/16
```

等待個 2~3 分鐘   
成功後會提示你以下訊息！ 就表示成功了
```sh
Your Kubernetes control-plane has initialized successfully!

## 讓 user 可以連線到 k8s cluster 
To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

## 加入 node 到 cluster，複製起來晚點開好其他 node 後要用
Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 10.0.2.15:6443 --token 3vex22.6kqkhji310d3ckp0 \
    --discovery-token-ca-cert-hash sha256:cb8bb2fde074ba2a294413122a5a9208479b12a73ec316c01bd9a8b485add2fa
```

先跑個他提示的訊息，讓 user 可以連線到 cluster
```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 2.4 安裝 kubernetes 網路介面 
接下來要為我們的 k8s cluster 建立 pod network，他的工作是負責跟 Container 連線，他們各自有實作 CNI( Container Network Interface)，詳細可以來參考[Kubernetes網絡模型列表](https://kubernetes.io/docs/concepts/cluster-administration/networking/#how-to-implement-the-kubernetes-networking-model)  

這裡我們選擇官方偷偷推薦的 `Calico` (CentOS 的 `Flannel` 也很多人用)
```
kubectl create -f https://docs.projectcalico.org/v3.14/manifests/calico.yaml
```

### 2.5 image 存起來才可以複製好多個
回到本地端 vagrant 的資料夾，把目前的狀態打包起來  
給想要有很多台 master 的你~~
```sh
vagrant package --output k8s-master.box
```

### 2.6 讓 master 可以用於部署
在預設情況下，為了安全和穩定性，master node 會被隔離開來，不允許部署 Pod 上去   
但是如果你要做單節點的話~~
```sh
kubectl taint nodes --all node-role.kubernetes.io/master-
```


## 3. 安裝 kubernetes worker
### 3.1 Vagrant 啟動檔案
```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  NodeCount = 4

  (1..NodeCount).each do |i|
    config.vm.define "k8s-w#{i}" do |node|
      node.vm.box = "ubuntu/xenial64"
      node.vm.hostname = "k8s-w#{i}"
      node.vm.network "private_network", ip: "172.16.16.10#{i}"
      
      node.vm.provider "virtualbox" do |v|
        v.name = "k8s-w#{i}"
        v.memory = 2048
        v.cpus = 1
      end

      node.vm.provision 'shell', inline: <<-SHELL
        echo 'ubuntu:ubuntu' | sudo chpasswd
      SHELL

    end
  end

end
```

### 3.2 安裝步驟
`2.1` `2.2`

> vagrant 開多台vm時，連線回去要加上名字:  
> vagrant ssh k8s-w1

### 3.3 加入 kubernetes cluster
到 master 機器上拿到加入 cluster 的指令
```sh
kubeadm token create --print-join-command
```

再回來 worker 機器上，使用 sudo 加入節點後貼上剛才拿到的指令  
```
sudo su
kubeadm join 172.16.16.100:6443 --token 7fz9ob.a6sno93d0zwcz3v9     --discovery-token-ca-cert-hash sha256:cb8bb2fde074ba2a294413122a5a9208479b12a73ec316c01bd9a8b485add2fa
```

回到 master
```
kubectl get nodes
```
![](https://i.imgur.com/lO2Anvv.png)


以上 k8s 架設就大功告成了，把 master 的 `~/.kube/config` 複製一份回到本地端就可以用 local 端拜訪囉~


## Reference
https://rickhw.github.io/2019/03/17/Container/Install-K8s-with-Kubeadm/
https://zhuanlan.zhihu.com/p/31398416
https://www.vagrantup.com/docs/providers/virtualbox
https://www.youtube.com/watch?v=mMmxMoprxiY
更換 master IP https://github.com/kubernetes/kubeadm/issues/338
