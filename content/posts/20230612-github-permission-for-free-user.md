---
title: "GitHub Permission 免費方案權限實驗"
date: 2023-06-12T18:20:00+08:00
draft: false
tags: ["github"]
---

討論不付錢給 GitHub 的使用者，在 Organization 下的權限控制

## 權限

### Organization Teams
GitHub 採 RBAC 權限控管，在 Organization 底下有 teams，teams 底下也可以再有一層 teams。

另外要注意的是，team name 在 Organization 下是唯一的，即使是兩層的 teams 也是。

舉個例子，這樣子 `dev`, `be`, `fe`, `operator` 是四個 Unique name。
```
teams
----
dev
  ├── be
  └── fe
operator
```

此時如果想在 `dev` 底下直接新增一個 team `operator` 是不行的，因為這個名字已經被使用了，會變成將 `operator` 移動到 `dev` 底下。
此時 GitHub 會詢問你是否要移動這個 team 的 parent，這可能會影響到擁有 `dev` team 的成員。

Repository > Settings > Collaborators and teams


### Repository Permissions

有以下這幾種權限，越下面的權限越大同時也包含上一級別的權限

* Read
    Can read and clone this repository.
    Can also open and comment on issues and pull request.
    - 可以開 PR
    - 可以 comment, reviewer PR
    - 不能 close PR （自己開的可以）
    - 不能 assign reviewer
* Triage
    Can also manage issues and pull requests.
    - 可以 assign reviewer
    - 能 close PR
    - 不可以 merge PR
    - 只可以 push branch 到 forked repository
* Write
    Can read, clone, and push to this repository.
    Can also manage issues and pull requests.
    - 可以 merge PR
    - 可以 push branch 到這個 repository
* Maintain
    They can also manage issues, pull requests, and some repository settings.
    - 不可以操作 Settings 下的 Secrets/Variables
    - 不可以操作 Settings 下的成員
* Admin
    - 預設 create repository 的人會成為 admin

可以注意的是，如果同時有 teams 和個人權限發生衝突時，會以權限較大的那一個為主。
GitHub 也會在有衝突的設置旁寫上一個黃色三角形～～
