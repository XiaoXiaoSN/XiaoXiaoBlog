# XiaoXiao Notes
This site is published at https://blog.10oz.tw

## Getting Started
```shell
git clone --depth 1 git@github.com:XiaoXiaoSN/XiaoXiaoBlog.git

cd XiaoXiaoBlog

git submodule update --init
```

runs the web service on your localhost and watch your files change.
Run service on http://localhost:1313/ by default
```shell
hugo server -D
```

Generate a new article.
Will get a response look like `content/posts/{yyyymmdd}-{article-name}.md created`
```shell
hugo new posts/20200816-make-a-hugo-blog.md
```

Use Hugo to build the static Hugo site.
```shell
hugo
```

## TODO
### Known issues
- `/about` 404 not found
- `TOC` feature not implement
