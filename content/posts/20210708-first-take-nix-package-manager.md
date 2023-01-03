---
title: "認識一次 Nix 套件管理系統"
date: 2021-07-08T03:13:00+08:00
draft: false
tags: ["nix", "nixos"]
---

## 介紹
### Nix (Nixpkgs)
Nix 一般來說是指 `Nixpkgs` 是一套套件管理系統，利用獨特的函數式語
言來定義安裝的套件。在安裝套件為每一個獨立套件的依賴項做版本控制，避免了傳統套件管理系統安裝不同套件用到相同依賴時的版本更新問題！或是移除、安裝某些需要許多依賴的軟體時，能節省你許多時間！！又或者你同時需要 MySQL 5.5, MySQL 5.7 的 Instance 時也適用～

能夠做到原子性安裝、刪除，因此能輕易的退版、升級，更能輕易得做到開發環境的切換。（當然代價是同時會有多個版本的軟體佔用儲存空間）

### NixOS
`NixOS` 則是基於 `Nixpkgs` 來管理整個 Linux Kernel 的 OS，所有的系統設定也都由 nix 支援，能夠配置的切換攜帶到另一台機器上！

### 缺點
自成一格的管理模式固然能做到很多事，但也導致許多套件未能支援，需仰賴社群共同維護的力量持續更新與完善整體生態
所有的 Packages 都在[這邊](https://github.com/NixOS/nixpkgs/blob/master/README.md)，如果發現有缺少的資源可以幫他開 PR 唷～

## 安裝 Nix
跟隨[官方下載教學](https://nixos.org/download.html)的指示，MacOS 這樣裝
```
$ sh <(curl -L https://nixos.org/nix/install)

# 預設只會幫你在 `/etc/bashrc` `/etc/zshrc` 做好引用，
# 如果你想在 fish 使用的話，這裡有人幫忙做連結
fisher install lilyball/nix-env.fish
```


## Nixpkgs 常用指令
### `nix-env` 安裝及管理套件安裝

- `nix-env -i hello` Install the package hello
- `nix-env -e hello` Remove the package hello
- `nix-env -q` List installed packages

### `nix-shell` 安裝套件並在新的 shell 開啟
這在測試一些套件時非常有用，不會影響到你平時使用的環境
```
nix-shell -p pgformatter
```


### `nix-collect-garbage` 清除沒有被使用到的儲存連結

- `nix-collect-garbage --delete-older-than 30d`

### 尋找你要的套件們
https://search.nixos.org/

在 NixOS 環境
```
nix-env -iA nixos.go
```
非 NixOS 環境（單純 Nix Package 管理）
```
nix-env -iA nixpkgs.go
```

列出(query)已安裝套件們
```
nix-env -q
```

解除安裝(uninstall)已安裝套件們
```
nix-env --uninstall direnv
```

## NixOS 常用指令
- `nixos-rebuild switch` 更新 `configuration.nix` 後切換到新的系統環境設定
- `nixos-option` 
    - `nixos-option system.stateVersion` 查看某個設定值說明！


## Ref
https://www.bobby285271.top/zh/ops/nixos-installation
NixOS: How it works and how to install it!
https://youtu.be/oPymb2-IXbg
https://nix.dev/