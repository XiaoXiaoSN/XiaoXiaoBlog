---
title: "Hey! 我想登入 AWS ECR"
date: 2022-10-28T10:28:00+08:00
draft: false
tags: ["aws", "ecr", "docker"]
---

## 描述
私有 AWS ECR 登入指令很好找，文件上到處有
```bash
$ aws ecr get-login-password \
    --region us-west-2 |
    docker login \
        --username AWS \
        --password-stdin \
        000000000000.dkr.ecr.us-west-2.amazonaws.com
```

但是你知道嗎？ AWS 的 Public Registry 沒有分區域，所以你必須要指定 `--region us-east-1` 才可以唷

```bash
$ aws ecr-public get-login-password \
    --region us-east-1 |
    docker login \
        --username AWS \
        --password-stdin \
        public.ecr.aws
```

寫錯或是沒寫用到預設的話
```bash
$ aws ecr get-login-password \
    --region us-west-2 |
    docker -l "debug" login \
        --username AWS \
        --password-stdin \
        public.ecr.aws
Error response from daemon: login attempt to https://public.ecr.aws/v2/ failed with status: 400 Bad Request
```

## Ref
https://stackoverflow.com/a/69274999/6695274
