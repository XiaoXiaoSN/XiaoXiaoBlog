---
title: "出發尋找 WSL2 的旅程"
date: 2020-07-28T10:29:08+08:00
tags: ["wsl2", "windows"]
---

## 步驟說明時間

### 確認 Windows 版本
首先按一下 Windows 鍵輸入 `winver` 來確認目前版本，版本必須是 19041 或是 2004 才可以喔
![](https://i.imgur.com/tsFoWzJ.png)

如果版本不夠的話，更新器下載 >>
https://www.microsoft.com/en-us/software-download/windows10

### 開啟環境設定
用系統管理員身分開啟 PowerShell 後，輸入指令開啟 Linux Subsystem 的支援和 HyperV 的虛擬機器平台
用 HyperV 要記得到 BIOS 開啟虛擬機器的支援喔
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

這時候你需要重啟一下電腦~

然後要更新 linux subsystem kernel
https://docs.microsoft.com/nl-nl/windows/wsl/wsl2-kernel

### 安裝 Linux 發行版
按一下 Windows 鍵輸入 `Microsoft Store` 後開啟商店選擇你要的 Linux 版本，在這裡我選擇 Ubuntu1804
![](https://i.imgur.com/yHDq1Nj.png)

另外偷偷下載了 windows terminal，有比較漂亮R
![](https://i.imgur.com/h2yRjHx.png)

### 看一看 WSL2 的設定
更新完後開啟 PowerShell 將 WSL 預設版本改為 2
```powershell
wsl --set-default-version 2
```

可以用 `wsl -l` 來列出你的 Linux 們，把原本存在的 WSL 升級成 WSL2
```powershell
wsl --set-version Ubuntu-18.04 2
```
![](https://i.imgur.com/6xAOuz3.png)

輸入 `wsl -l -v` 應該可以看見 Version 2，那這樣就對啦~
![](https://i.imgur.com/K8vuPfJ.png)


### Docker Time
首先在 Win10 下載桌面版 Docker，
https://docs.docker.com/docker-for-windows/wsl/ 

下載好了嗎? 打開來選擇 WSL2 作為 backend
![](https://i.imgur.com/S1n7hXh.png)

安裝好之後他會請你重新登入你的 Win10，
完成後選擇 Settings(上方的小齒輪) > General 來確認一下 `Use the WSL2 based engine` 選項
![](https://i.imgur.com/TsL6oUe.png)

再來到 Resources > WSL Integartion，把你的 WSL linux 發行版選起來
![](https://i.imgur.com/SOn3G1M.png)

點右下角的 Apply & Restart

開啟你的 terminal，輸入 `wsl -d <你的系統>` 進入 WSL 的系統內
輸入 `docker ps` 確認有抓到 docker ~
![](https://i.imgur.com/6gf7LGm.png)

開個服務吧 
- `-d` 在背景執行
- `-p` port 導出
- `--name` 幫 container 取名字
```shell
docker run -d -p 8080:80 --name docker_time docker/getting-started
```

看看你的 http://localhost:8080 服務開起來囉
![](https://i.imgur.com/hw2kNUn.png)

測試完 docker 可以工作了，所以刪掉
```shell
docker kill docker_time
```
![](https://i.imgur.com/bgHEO9e.png)

### 任性的個人化時間
```
# 更新一下
sudo apt update && sudo apt upgrade -y

# git 設定
git config --global core.ignorecase false
git config --global alias.co 'checkout'
git config --global alias.chekcout 'checkout'
git config --global alias.log1 'log --oneline -n 10'
git config --global alias.logg 'log --oneline --graph'
git config --global alias.cm 'commit -m'
git config --global alias.cmamend '!git add $1 && git commit --amend --no-edit'

# shell 設定
sudo apt install fish -y
curl -L https://get.oh-my.fish | fish
omf install godfather

# 開專案資料夾
mkdir projects
ln -s (pwd)/projects ~/projects 
```

### Golang 環境 (gvm)
不囉嗦直接抄 >> https://blog.miniasp.com/post/2020/07/27/Build-Golang-Dev-Box-in-Windows?utm_source=Facebook_PicSee
```
sudo apt install binutils bison gcc make build-essential -y

curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer | bash -E
source ~/.gvm/scripts/gvm

set GOVER go1.14
gvm install go1.14 --binary
gvm use go1.14 --default

# 確認我們的工作~~
go version
```

### 紀錄一點問題
> [time=Sat, Aug 8, 2020 1:07 PM]

開啟工作管理員時發現，有一個叫做 vmmem 的佔用了很多的 memory 和 CPU
發現很多人都有這樣的問題，紀錄一下解決方法
移駕到 `c:\users\{{your profile name}}` 開啟或新增 `.wslconfig` 

{%gist lewcianci/d09ef5e6741fe0eff61935d39e9667ee %}

使用系統管理員身分開啟 PowerShell
```powershell
Restart-Service LxssManager
```

參考[文章](https://medium.com/@lewwybogus/how-to-stop-wsl2-from-hogging-all-your-ram-with-docker-d7846b9c5b37)

---
---
---

### ~~MicroK8s Time~~ (請勿參考)

直接遇到問題了，snapd 是不可用的狀態
![](https://i.imgur.com/96BU8YL.png)

```
sudo apt-get update && sudo apt-get install -yqq daemonize dbus-user-session fontconfig
sudo daemonize /usr/bin/unshare --fork --pid --mount-proc /lib/systemd/systemd --system-unit=basic.target
exec sudo nsenter -t $(pidof systemd) -a su - $LOGNAME

snap version
```

還需要開啟 Systemd 把這一段貼上去後關掉視窗重開
```shell
## /etc/profile.d/00-wsl2-systemd.sh

# Create the starting script for SystemD
SYSTEMD_PID=$(ps -ef | grep '/lib/systemd/systemd --system-unit=basic.target$' | grep -v unshare | awk '{print $2}')

if [ -z "$SYSTEMD_PID" ]; then
   sudo /usr/bin/daemonize /usr/bin/unshare --fork --pid --mount-proc /lib/systemd/systemd --system-unit=basic.target
   SYSTEMD_PID=$(ps -ef | grep '/lib/systemd/systemd --system-unit=basic.target$' | grep -v unshare | awk '{print $2}')
fi

if [ -n "$SYSTEMD_PID" ] && [ "$SYSTEMD_PID" != "1" ]; then
    exec sudo /usr/bin/nsenter -t $SYSTEMD_PID -a su - $LOGNAME
fi
```

好，問題解決來安裝吧
```
# 安裝 microk8s
sudo snap install microk8s --classic

# 嘗試一下指令，他會提醒你要給權限照著做吧~記得要把 user 換掉喔
microk8s.status

sudo usermod -a -G microk8s arios
sudo chown -f -R arios ~/.kube
```

完成後離開重新登入，就可以開始開服務囉
```
microk8s.enable dns dashboard
```

## for Win10 2004
你各位阿~!這個中文輸入阿，很不ok阿
當輸入中文的時候需要切換成英文就會爆炸?

往右下角的 中/A 點一下右鍵
![](https://i.imgur.com/eiEZ7gP.png)

一般 > 輸入設定 > "自動將中文模式中的按鍵順序切換為英數字元" 開起來
![](https://i.imgur.com/pFwB7TA.png)

恩~是稍微好點了，不過這個選項也有毛病...... 
你一按錯注音他給你改成英文阿QQ
哪個比較困擾需要個人評估了


## Ref
https://docs.microsoft.com/zh-tw/windows/wsl/install-win10

https://pureinfotech.com/install-windows-subsystem-linux-2-windows-10/

https://blog.miniasp.com/post/2020/07/26/Multiple-Linux-Dev-Environment-build-on-WSL-2

https://docs.docker.com/docker-for-windows/wsl/

https://github.com/microsoft/WSL/issues/5126#issuecomment-653715201

https://wsl.dev/wsl2-microk8s

