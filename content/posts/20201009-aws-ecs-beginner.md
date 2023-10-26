---
title: "有一天路過 AWS ECS"
date: 2020-10-09T14:04:00+08:00
draft: false
tags: ["aws"]
---

## 架構
ECS(Elastic Container Service) 是 AWS 上的容器管理服務，架構上可以簡單分成幾層:
- Cluster
    一個群集 :)
- Service
    可以把它當作 "執行企劃"，就像是一個 docker-compose 將多個 docker 服務包裝起來
- Task
    由 Service 產生的工作任務，負責維護 Container 的部署，在 EC2 模式就是他負責部署服務到機器上的
- Container
    你的 AP 在這裡，他就是最底層的容器服務啦
![](https://i.imgur.com/8HQwtxS.png)


分成兩種模式，差別在底層的機器是否需要自己管理，
無論是哪種都可以做 Auto Scaling 來確保服務的可用性
- Fargate mode
    ECS 的預設選擇模式，是比較後來才出來的功能。
    不需要自己來管理底層的機器(EC2)，還會幫忙處理掉 Auto Scaling 和 loading balance，讓開發人員可以專注在服務、網路層級，**推薦使用**
- EC2 mode
    底層的機器是自己分配的 EC2 instance，也可以設定 Spot 模式在不需要的時候是關機的，價格低非常多


### 按照官方教的走
https://docs.aws.amazon.com/zh_tw/AmazonECS/latest/developerguide/ecs-cli-tutorial-fargate.html

```
# 一個新的 ECS Cluster
ecs-cli configure --cluster silkrode --default-launch-type FARGATE --config-name tutorial --region ap-northeast-1
ecs-cli configure profile --access-key AKIAW5********SDNHKT --secret-key YFFP36xe+b********pnOSlVT1+JLs7Ck07kGYJS --profile-name tutorial-profile
ecs-cli up --cluster-config tutorial --ecs-profile tutorial-profile
aws ec2 describe-security-groups --filters Name=vpc-id,Values=vpc-0d0b9a2b847dd6eaf --region ap-northeast-1
aws ec2 authorize-security-group-ingress --group-id sg-0a8d7d69bd7302908 --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region ap-northeast-1
```

docke-compose.yml
```yaml
version: '3'
services:
  web:
    image: xiao4011/toolbox
    ports:
      - "8000:8000"
    depends_on:
      - "redis"
    logging:
      driver: awslogs
      options:
        awslogs-group: tutorial
        awslogs-region: ap-northeast-1
        awslogs-stream-prefix: web
  redis:
    image: redis
```

ecs-params.yml
```yaml
version: 1
task_definition:
  task_execution_role: ecsTaskExecutionRole
  ecs_network_mode: awsvpc
  task_size:
    mem_limit: 0.5GB
    cpu_limit: 256
run_params:
  network_configuration:
    awsvpc_configuration:
      subnets:
        - subnet-007b5172614cc7c27
      security_groups:
        - sg-0a8d7d69bd7302908
      assign_public_ip: ENABLED
```

```
ecs-cli compose --project-name tutorial service up --create-log-groups --cluster-config tutorial --ecs-profile tutorial-profile
```

服務開完就關掉惹 XDD

## Ref
AWS ECS vs Kubernetes: https://cloud.netapp.com/blog/aws-ecs-vs-kubernetes-an-unfair-comparison
ECS介紹 (EC2 mode & Fargate mode) https://youtu.be/22IsSW3YD0A
https://docs.aws.amazon.com/AmazonECS/latest/developerguide/clusters.html
