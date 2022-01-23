# XiaoXiao Notes
This site is published at http://blog.10oz.tw/

## Getting Started
```
git clone --depth 1 git@github.com:XiaoXiaoSN/XiaoXiaoBlog.git

cd XiaoXiaoBlog

git submodule update --init
```

runs the web service on your localhost and watch your files change.
Run service on http://localhost:1313/ by default
```
hugo server -D
```

Generate a new article.
Will get a response look like `content/posts/{yyyymmdd}-{article-name}.md created`
```
hugo new posts/20200816-make-a-hugo-blog.md
```

Use Hugo to build the static Hugo site.
```
hugo
```
