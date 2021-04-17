---
title: "我要裝 vim"
date: 2020-09-26T02:03:48+08:00
draft: false
tags: ["vim", "golang"]
---

好文章推推，直接抄爆
https://learnku.com/articles/24924

## 設定開始
### 撰寫設定檔
首先 `vim ~/.vimrc` 改成下面這模樣

```vim
"==============================================================================
" vim 内置配置 
"==============================================================================

" 设置 vimrc 修改保存后立刻生效，不用在重新打开
" 建议配置完成后将这个关闭，否则配置多了之后会很卡
" autocmd BufWritePost $MYVIMRC source $MYVIMRC

" 关闭兼容模式
set nocompatible

set nu " 设置行号
set cursorline "突出显示当前行
set showmatch " 显示括号匹配

" tab 缩进
set tabstop=4 " 设置Tab长度为4空格
set shiftwidth=4 " 设置自动缩进长度为4空格
set autoindent " 继承前一行的缩进方式，适用于多行注释

" 定义快捷键的前缀，即<Leader>
let mapleader="," 

" ==== 系统剪切板复制粘贴 ====
" v 模式下复制内容到系统剪切板
vmap <Leader>c "+yy
" n 模式下复制一行到系统剪切板
nmap <Leader>c "+yy
" n 模式下粘贴系统剪切板的内容
nmap <Leader>v "+p

" 开启实时搜索
set incsearch
" 搜索时大小写不敏感
set ignorecase
syntax enable
syntax on                    " 开启文件类型侦测
filetype plugin indent on    " 启用自动补全

" 退出插入模式指定类型的文件自动保存
au InsertLeave *.go,*.sh,*.php write

"==============================================================================
" 插件配置 
"==============================================================================

" 插件开始的位置
call plug#begin('~/.vim/plugged')

" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
" 可以快速对齐的插件
Plug 'junegunn/vim-easy-align'

" 用来提供一个导航目录的侧边栏
Plug 'scrooloose/nerdtree'

" 可以使 nerdtree Tab 标签的名称更友好些
Plug 'jistr/vim-nerdtree-tabs'

" 可以在导航目录中看到 git 版本信息
Plug 'Xuyuanp/nerdtree-git-plugin'

" 支援更多 git 的功能
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-rhubarb'
Plug 'shumphrey/fugitive-gitlab.vim'

" 可以在文档中显示 git 信息
Plug 'airblade/vim-gitgutter'

" 查看当前代码文件中的变量和函数列表的插件，
" 可以切换和跳转到代码中对应的变量和函数的位置
" 大纲式导航, Go 需要 https://github.com/jstemmer/gotags 支持
Plug 'majutsushi/tagbar'

" 自动补全括号的插件，包括小括号，中括号，以及花括号
Plug 'jiangmiao/auto-pairs'

" Vim状态栏插件，包括显示行号，列号，文件类型，文件名，以及Git状态
Plug 'vim-airline/vim-airline'

" 代码自动完成，安装完插件还需要额外配置才可以使用
Plug 'Valloric/YouCompleteMe'

" 下面两个插件要配合使用，可以自动生成代码块
Plug 'SirVer/ultisnips'
Plug 'honza/vim-snippets'

" 配色方案
Plug 'fatih/molokai'

" go 主要插件
Plug 'fatih/vim-go', { 'tag': '*' }
" go 中的代码追踪，输入 gd 就可以自动跳转
Plug 'dgryski/vim-godef'

" markdown 插件
Plug 'iamcco/mathjax-support-for-mkdp'
Plug 'iamcco/markdown-preview.vim'

" 模糊搜尋
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all'  }
Plug 'junegunn/fzf.vim'

" 多行編輯
Plug 'mg979/vim-visual-multi'

" 搜尋
Plug 'mileszs/ack.vim'
let g:ackprg = 'ag --nogroup --nocolor --column'

" 插件结束的位置，插件全部放在此行上面
call plug#end()


"==============================================================================
" 主题配色 
"==============================================================================

let g:rehash256 = 1
let g:molokai_original = 1
colorscheme molokai
" colorscheme sublimemonokai

"==============================================================================
" vim-go 插件
"==============================================================================
let g:go_fmt_command = "goimports" " 格式化将默认的 gofmt 替换
let g:go_autodetect_gopath = 1
let g:go_list_type = "quickfix"

let g:go_version_warning = 1
let g:go_highlight_types = 1
let g:go_highlight_fields = 1
let g:go_highlight_functions = 1
let g:go_highlight_function_calls = 1
let g:go_highlight_operators = 1
let g:go_highlight_extra_types = 1
let g:go_highlight_methods = 1
let g:go_highlight_generate_tags = 1

let g:go_highlight_format_strings = 1
let g:go_highlight_function_arguments = 1
let g:go_highlight_generate_tags = 1
let g:go_highlight_variable_declarations = 1

let g:godef_split=2


"==============================================================================
" NERDTree 插件
"==============================================================================

" 打开和关闭NERDTree快捷键
map <F10> :NERDTreeToggle<CR>
" 显示行号
let NERDTreeShowLineNumbers=1
" 打开文件时是否显示目录
let NERDTreeAutoCenter=1
" 是否显示隐藏文件
let NERDTreeShowHidden=1
" 设置宽度
" let NERDTreeWinSize=31
" 忽略一下文件的显示
let NERDTreeIgnore=['\.pyc', '\~$', '\.swp', '.git']
" 打开 vim 文件及显示书签列表
let NERDTreeShowBookmarks=2

" 在终端启动vim时，共享NERDTree
let g:nerdtree_tabs_open_on_console_startup=1


"==============================================================================
"  majutsushi/tagbar 插件
"==============================================================================

" majutsushi/tagbar 插件打开关闭快捷键
nmap <F9> :TagbarToggle<CR>

let g:tagbar_type_go = {
    \ 'ctagstype' : 'go',
    \ 'kinds'     : [
        \ 'p:package',
        \ 'i:imports:1',
        \ 'c:constants',
        \ 'v:variables',
        \ 't:types',
        \ 'n:interfaces',
        \ 'w:fields',
        \ 'e:embedded',
        \ 'm:methods',
        \ 'r:constructor',
        \ 'f:functions'
    \ ],
    \ 'sro' : '.',
    \ 'kind2scope' : {
        \ 't' : 'ctype',
        \ 'n' : 'ntype'
    \ },
    \ 'scope2kind' : {
        \ 'ctype' : 't',
        \ 'ntype' : 'n'
    \ },
    \ 'ctagsbin'  : 'gotags',
    \ 'ctagsargs' : '-sort -silent'
\ }


"==============================================================================
"  nerdtree-git-plugin 插件
"==============================================================================
let g:NERDTreeGitStatusIndicatorMapCustom = {
    \ "Modified"  : "✹",
    \ "Staged"    : "✚",
    \ "Untracked" : "✭",
    \ "Renamed"   : "➜",
    \ "Unmerged"  : "═",
    \ "Deleted"   : "✖",
    \ "Dirty"     : "✗",
    \ "Clean"     : "✔︎",
    \ 'Ignored'   : '☒',
    \ "Unknown"   : "?"
    \ }

let g:NERDTreeGitStatusShowIgnored = 1

"==============================================================================
"  nerdtree-git-plugin 插件
"==============================================================================
" [Buffers] Jump to the existing window if possible
let g:fzf_buffers_jump = 1

nnoremap <leader>fl :Lines 
nnoremap <leader>fbl :BLines 
nnoremap <leader>ff :Files 


"==============================================================================
"  Valloric/YouCompleteMe 插件
"==============================================================================

" make YCM compatible with UltiSnips (using supertab)
let g:ycm_key_list_select_completion = ['<C-n>', '<space>']
let g:ycm_key_list_previous_completion = ['<C-p>', '<Up>']
let g:SuperTabDefaultCompletionType = '<C-n>'

" better key bindings for UltiSnipsExpandTrigger
let g:UltiSnipsExpandTrigger = "<tab>"
let g:UltiSnipsJumpForwardTrigger = "<tab>"
let g:UltiSnipsJumpBackwardTrigger = "<s-tab>"


"==============================================================================
"  支援更多 git 
"==============================================================================
" GBrower gitlab
let g:fugitive_gitlab_domains = ['https://gitlab.silkrode.com.tw']
let g:gitlab_api_keys = {'gitlab.silkrode.com.tw': '這個可能不能公開'}


"==============================================================================
"  其他插件配置
"==============================================================================

" markdwon 的快捷键
map <silent> <F5> <Plug>MarkdownPreview
map <silent> <F6> <Plug>StopMarkdownPreview

" tab 标签页切换快捷键
:nn <Leader>1 1gt
:nn <Leader>2 2gt
:nn <Leader>3 3gt
:nn <Leader>4 4gt
:nn <Leader>5 5gt
:nn <Leader>6 6gt
:nn <Leader>7 7gt
:nn <Leader>8 8gt
:nn <Leader>9 8gt
:nn <Leader>0 :tablast<CR>
```

### 安裝相關插件

#### Plug - vim 套件管理工具
我們要用 `Plug` 來裝插件 https://github.com/junegunn/vim-plug

unix 版本
```
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

然後輸入 `vim +PlugInstall` 開始安裝
再來安裝 `vim +GoInstallBinaries` golang tools，雖然沒意外的話早就裝過惹呢XDD

#### 你完成我 - 自動補齊工具
YouCompleteMe 剛才已經用 Plug 下載下來了，不過還不能直接使用
```bash
cd .vim/plugged/YouCompleteMe

brew install cmake macvim # 可選: python mono go nodejs

# 如果不指定 go 的話，他會安裝 C# Go JavaScript Rust Jaca
python3 install.py --go-completer
```

## 使用者筆記

### 插件們
雖然剛剛裝了滿滿的 plugin 但也要會用才行rrr 😂😂

#### NERDTree - 左邊的 Sidebar
- `C_w` + [上下左右] 切換到 [上下左右] 的分割視窗
- `C_w` + `w` 切換到下一個分割視窗
- 在 NERDTress 對檔案 `t` 開啟新分頁
- 在 NERDTress 對檔案 `o` 開啟新分頁，並跳過去
- 在 NERDTress 對資料夾 `o` 展開/縮合資料夾
- 在 NERDTress 按下 `m` 會進入檔案管理模式，再來按 `a` 可以新增檔案
- 切換到指定分頁 `<Leader>[1-9]` 或是上面有設定 `[1-9]gt` 

#### vim-fugitive 提供了很多在 vim 上面整合 git 的功能
- `:Gdiffsplit` 水平分割 git diff 畫面 (上下)
- `:Gvdiff` 垂直分割 git diff 畫面 (看左右好像比較習慣)
- `:GBrowser` 直接在網頁(github, gitlab)上開啟目前的檔案

### Vim 基本常用指令
- 多行修改: `C_V` 選取， `I` 進入修改模式
- `C_d` 下滑一頁
- `C_b` 上滑一頁
- `:set syn=yaml` 設定語法高亮

## Ref
https://learnku.com/articles/24924
https://github.com/ycm-core/YouCompleteMe
