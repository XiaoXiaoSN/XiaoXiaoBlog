---
title: "Vim Color Schemes"
date: 2022-02-05T10:42:08+08:00
draft: false
tags: ["vim"]
---

## 首先
這個網站上找找喜歡的配色 (ﾉ>ω<)ﾉ
https://vimcolorschemes.com/

例如說 [vim-sublime-monokai](https://vimcolorschemes.com/erichdongubler/vim-sublime-monokai) 

## 問題
這次問題是行數左邊那條灰色太討厭了吧!! 這是因為 `airblade/vim-gitgutter` 這個套件會標示出 `git` 變更的項目但這個 theme 顯然沒有料想到這個問題

![](https://i.imgur.com/1m4J7tr.png)

## 認識一下 Vim 語法高亮
首先了解一下 Vim 顏色設定的語法，可以到 Vim 裡面輸入
```vim
:h hi " h 是 help，hi 是 highlight 的簡寫
```

語法像是這樣 
```vim
" hi[ghlight] [default] {group-name} {key}={arg} ..

highlight Comment  gui=bold 
hi Comment  term=bold ctermfg=Cyan guifg=#80a0ff gui=bold 
```

> `:h highlight-group` 可以看到更多的 group-name
> 例如
> Cursor => the character under the cursor
> LineNr => Line number 
> Normal => normal text
> ...

首先有三種類型的 Terminal，不過我大概只會用到 `cterm` 吧
- term (terminal: vt100, xterm...)
- cterm (color terminal: MS-DOS console, color-xterm...)
- gui (Graphical User Interface)

可以搭配 `fg`, `bg` 來改字體和背景顏色，或是不加東西表示屬性像是粗體、底線這類的

可用的 attr-list 有:
| attribute | description                                   |
| --------- |:--------------------------------------------- |
| bold      | 粗體                                          |
| underline | 底線                                          |
| reverse   | 反白，inverse same as reverse                 |
| italic    | 斜體                                          |
| standout  |                                               |
| nocombine | override attributes instead of combining them |
| NONE      | no attributes used (used to reset it)         |

```vim
" 游標所在那行的字變成綠色
hi CursorLine ctermfg=green

" 游標所在那行的反白 + 底線
hi CursorLine cterm=reverse,underline

" 清除掉顏色
hi CursorLine clear

" 憤怒全清
hi clear

" 查看目前設定
verbose hi LineNR
```


## 尋找解決方法
### 如何找到 HighLight Group
把這段 [function](https://stackoverflow.com/a/1467830) 貼到你的 `.vimrc` 下註冊，就可以看到游標所在的那個位置有哪些 `highlight-group` 囉!

### 繼續找問題
可是行數左邊那行沒辦法把游標貼上去看阿QQ

於是直接去翻設定找看看哪裡用到了 `grey` 這個顏色XDDD

[找到了](https://github.com/ErichDonGubler/vim-sublime-monokai/blob/master/colors/sublimemonokai.vim#L159) 原來那一行的名字叫做 `SignColumn` 呀!
```vim=159
call s:h('SignColumn', { 'fg': s:lightblack,  'bg': s:grey })
```

> SignColumn      column where signs are displayed

知道名字其實就很好處理了，把顏色改掉就好啦~~
```vim=159
hi! link SignColumn LineNr 
```

### 相關情報
https://stackoverflow.com/a/46636973 手動開關那條 SignColumn
> If you are using Vim 8.0 or newer (or NeoVim), this is now a simple setting:
> ```
> $ vim "+help signcolumn" "+only"
> ```
> For instance,
> ```
> :set scl=no   " force the signcolumn to disappear
> :set scl=yes  " force the signcolumn to appear
> :set scl=auto " return the signcolumn to the default behaviour
> ```

## Ref
https://youtu.be/XTdxBreTYdM?list=PLBd8JGCAcUAH56L2CYF7SmWJYKwHQYUDI

https://neovim.io/doc/user/options.html#'signcolumn'