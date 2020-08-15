---
title: "製造一個 hugo 部落格"
date: 2020-01-24T23:02:16+08:00
tags: ["hugo"]
---

## 步驟教學
### 一、開始之前

目標是用 hugo 協助我們使用 markdown 輕鬆製造靜態網頁，再把這個靜態網頁利用 Github Page 部署出去！

所以我們需要:
1. 一人份的 github 帳號
2. 安裝 hugo [點我看教學](https://gohugo.io/getting-started/installing#quick-install)
3. 挑選喜歡的 hugo 模板 [點我參觀](https://themes.gohugo.io/tags/blog/)

```sh
$ hugo version
Hugo Static Site Generator v0.62.2/extended darwin/amd64 BuildDate: unknown
```

### 二、開跑囉

開啟一個新的 hugo 專案，這邊的 xiaoxiao 可以換成你喜歡的專案名字
```sh
$ hugo new site xiaoxiao
$ cd xiaoxiao
```

會看到目錄長這樣:
``` 
├── archetypes
│   └── default.md         # 產生新文章時的模板
├── config.toml            # 最主要的設定檔案
├── content                # Markdown 的文章在這邊
├── data
├── layouts
├── resources
│   └── _gen
├── static
└── themes                 # 套用的主題包們
    └── hugo-theme-m10c
```

接著挑選一個漂亮的 hugo 模板來下載，我用人家教學[示範的模板](https://themes.gohugo.io/hugo-theme-m10c/)
```sh
$ git clone https://github.com/vaga/hugo-theme-m10c.git themes/hugo-theme-m10c
```

再來，開啟文字編輯器修改 `config.toml`，
最主要是第六行的 `theme` 
和第四行的 `publishDir = "docs"`，docs 是 GithubPage 規定的喔不能改

我的改完長這樣:
```toml
baseURL = "https://xiaoxiaosn.github.io"
languageCode = "en-us"
title = "XiaoXiao Notes"
publishDir = "docs"

theme = "hugo-theme-m10c"
paginate = 10
[params]
  author = "Xiao Xiao"
  description = "XiaoXiao 的筆記書"
```

跑跑看，是不是能看到頁面啦? 服務會在 http://localhost:1313
```sh
$ hugo server -D   # -D 表示我們想看到草稿文章(draft)
```

看到有安捏就對了!
![](https://i.imgur.com/aHQCWn7.png)


### 三、來寫文章r

這邊的 make-a-hugo-blog 可以換成你想要的文章名字，等等會被用在網址上喔
```sh
$ hugo new make-a-hugo-blog
```

這個指令會幫你在 `content` 目錄下新增一個 `make-a-hugo-blog.md` 檔案，
接著我們寫點內容上去，像這樣:
要注意的是 `draft: true` 這行在正式上線的時候記得刪掉喔~
```markdown
---
title: "製造一個 hugo 部落格"
date: 2020-01-24T23:02:16+08:00
tags: ["hugo"]
---

## 開始之前
目標是用 hugo 協助我們使用 markdown 輕鬆製造靜態網頁，再把這個靜態網頁利用 Github Page 部署出去！

所以我們需要:
1. 一人份的 github 帳號
2. 安裝 hugo [點我看教學](https://gohugo.io/getting-started/installing#quick-install)
3. 挑選喜歡的 hugo 模板 [點我參觀](https://themes.gohugo.io/tags/blog/)
```

輸入 `hugo` 指令，讓他跑編譯囉
```sh
$ hugo
```

### 四、來部署r

打開你的 github 按下 new 來新增一個 repo

![](https://i.imgur.com/eZalJYom.png)
![](https://i.imgur.com/dDxBq4s.png)

接下來會進到這個畫面，先不急著跟他操作
![](https://i.imgur.com/psPPTwb.png)


我們要先到 `config.toml` 修改域名
這邊的規則是 `https://帳號.github.io/專案`
```toml
# 修改 config.toml 的這一行
baseURL = "https://xiaoxiaosn.github.io/XiaoXiaoBlog"
```

然後下指令重新產生一下
```sh
$ hugo
```

回到專案，是時候該讓 git 加入了
第二行這邊記得換成你自己的 github 專案喔
```sh
$ git init
$ git remote add origin git@github.com:XiaoXiaoSN/XiaoXiaoBlog.git
```

```sh
$ git add --all 
$ git commit -m "init my hugo blog"
$ git push origin master
```
在 add 的時候出現 warn 不擔心，他只是提醒你在這個 git 專案下還有包含了另一個 git 專案 (theme裡面那個)
![](https://i.imgur.com/zIZreex.png)


更新上去後，我們回到 github，選擇 Setting 後往下拉找到 Github Page

![](https://i.imgur.com/kqawzJ9.png)

選那個 master branch /docs folder

![](https://i.imgur.com/baEgG5z.png)


### 五、收割囉~~
等待 10 秒，然後帶著一顆誠摯的新把連結給按下去 XD
`https://帳號.github.io/專案`

## 選修 - 使用自己的 domain
回到前面部署時候的頁面，Setting 往下滑到 GitHub Pages
![](https://i.imgur.com/ICR6di6.png)

填寫 Custom domain 的這個欄位

這裡我已經有 domain，然後是交給 cloudflare 管理，因此接下來會以此介紹
開啟 cloudflare 選到 `DNS` 後，設定 CNAME 把你的網址導引到 githubPage
![](https://i.imgur.com/czihvqT.png)

接下來到 `Page Rules` 新增一筆強制使用 https 的選項
![](https://i.imgur.com/1Bqyugo.png)
![](https://i.imgur.com/l3G09A1.png)

這樣就設定好囉～ 
記得要回到專案的 `config.toml` 設定新的 url 喔

```toml
baseURL = "https://blog.10oz.tw"
```


---

## References
**hugo**
* https://gohugo.io/documentation/
* https://siddharam.com.tw/post/20190418/

**github page**
* https://gohugo.io/hosting-and-deployment/hosting-on-github/#deployment-of-project-pages-from-docs-folder-on-master-branch
* https://blog.cloudflare.com/secure-and-fast-github-pages-with-cloudflare/