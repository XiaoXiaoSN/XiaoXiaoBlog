---
title: "go get 與私有 Gitlab"
date: 2021-03-16T01:49:55+08:00
draft: false
tags: ["golnag", "gitlab", "subgroup"]
---

> GitLab Community Edition 12.7.0 
> go version go1.15 darwin/amd64

## 問題描述
事實上這次包含兩個問題，一個是 Privite Gitlab 的認證另一個是 Gitlab Subgroup 的支援

## Privite Gitlab

存取私有的 Gitlab 可以修改你的 go env
```
export GOPRIVATE=gitlab.company.com.tw
```

## Subgroup
你的 go.mod
```
module example.com/test

require gitlab.com/org/subgroup/repo/pkg/foo v0.0.0

replace gitlab.com/org/subgroup/repo/pkg/foo => gitlab.com/org/subgroup/repo.git/pkg/foo v1.0.0
```

## Ref
https://gitlab.com/gitlab-org/gitlab-foss/-/issues/30785
