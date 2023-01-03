---
title: "來架一台私有 APT Repository"
date: 2021-09-01T07:53:00+08:00
draft: false
tags: ["ubuntu", "apt"]
---


## 準備 deb 檔
準備兩台實驗機器一台當 Server 一台當做 Client
我們先到 Server 這邊隨便弄個 `.deb` 檔案出來，這次就拿 helm 來當實驗品吧
```bash
curl https://baltocdn.com/helm/signing.asc | sudo apt-key add -
sudo apt-get install apt-transport-https --yes
echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm

# 或是直接下載，會在當前資料夾
apt-get download helm 
```

下載下來的 `.deb` 會 Cache 在這邊 `/var/cache/apt/archives`
```bash
$ ls -al /var/cache/apt/archives | grep helm
-rw-r--r-- 1 root root 13674294 Sep  1 05:25 helm_3.6.3-1_amd64.deb

# 幫她搬個家，開一個任意資料夾來放
sudo mkdir -p /usr/local/mydebs
cp /var/cache/apt/archives/helm_3.6.3-1_amd64.deb /usr/local/mydebs
```

利用 `dpkg-dev` 工具來製造描述檔
```bash
$ sudo apt-get install dpkg-dev

# 跑看看會出什麼
$ dpkg-scanpackages debs/amd64
Package: helm
Version: 3.6.3-1
Architecture: amd64
Maintainer: Matt Fox <matt@getbalto.com>
Installed-Size: 44069
Filename: debs/amd64/helm_3.6.3-1_amd64.deb
Size: 13674294
MD5sum: e9f028c0e7fc7253a912f9021abc4e3d
SHA1: 12cf12bde1fb05aff129bf61f4bc21c5cadd1bc8
SHA256: 27c1a4822b134a2ae4e4e053a5fbb946ef34a33188cdf8a094c2299c3b8ae67b
Section: default
Priority: extra
Homepage: https://helm.sh/
Description: The package manager for Kubernetes
License: unknown
Vendor: matt@Foxes-iMac.hitronhub.home

dpkg-scanpackages: info: Wrote 1 entries to output Packages file.

# 打包起來放
dpkg-scanpackages /usr/local/mydebs | gzip -9c > /usr/local/mydebs/Packages.gz
```


以上前置作業準備好了，已經可以開服務來跑了
在 ubuntu 機器裡面 APT 的來源檔案寫在 `/etc/apt/sources.list` 或是 `/etc/apt/sources.list.d/` 資料夾裡面，可以在這邊加入自己的來源！

本地檔案讀取方法，不過其他台機器就看不到啦～
```bash
echo "deb [trusted=yes] file:/usr/local/mydebs ./" >> /etc/apt/sources.list
```

## 開 HTTP Server
> 你懶的話 `python3 -m http.server` 直接開起來，我試過也可以動 haha
> 不過不知道會不會有什麼風險 😂

可以找 Apache2 來幫忙做 Web Server
```bash
sudo apt-get install apache2
```

Apache Web Server 預設讀取的位置在 `/var/www/html`，我們幫他開一個子目錄來做事
```bash
mkdir /var/www/html/foo
cp /usr/local/mydebs/Packages.gz /var/www/html/foo

# 要提供的機器是 amd64 所以再開一個資料夾，把 `deb` 放進去
mkdir /var/www/html/foo/amd64
cp /usr/local/mydebs/helm_3.6.3-1_amd64.deb /var/www/html/foo/amd64
```

現在的目錄格式像是這樣
```
/var/www/html$ tree
.
├── foo
│   ├── Packages.gz
│   └── amd64
│       └── helm_3.6.3-1_amd64.deb
└── index.html
```

出發去另外一台 Client 的機器，把這個 APT Repository 放進去來源檔～
```bash
# 這邊的 172.16.16.39 是剛剛那台 Apache Server 的內網 IP
echo "deb [trusted=yes] http://172.16.16.39/foo/ /" >> /etc/apt/sources.list

# 然後更新
apt-get update

# 然後就查得到！
apt-cache search helm
```

## 離線安裝 deb 檔案
Install
```bash
sudo dpkg -i package_file.deb

# or 

sudo apt install package_file.deb
```


Remove
```bash
sudo apt-get remove package_name
```

## Ref
https://help.ubuntu.com/community/Repositories/Personal
https://medium.com/sqooba/create-your-own-custom-and-authenticated-apt-repository-1e4a4cf0b864
https://askubuntu.com/a/184340/1411904
Debian APT 格式 https://wiki.debian.org/DebianRepository/Format
https://help.ubuntu.com/kubuntu/desktopguide/C/manual-install.html
