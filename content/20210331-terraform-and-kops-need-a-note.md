---
title: "想用 Terraform 與 kOps 也得寫個筆記"
date: 2021-03-31T01:32:54+08:00
draft: false
tags: ["terraform", "kops"]
---

## 流水帳開始 😂

### Terraform 先裝點東西吧
來安裝 terraform
```
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

首先登入你的 aws iam 建立一組 Access key, Secret key

直接產一個 `main.tf` 檔案~
下面有指令直接來跑跑看，你應該要多一個 ec2 機器👍
```
provider "aws" {
  #   access_key = "$AWS_ACCESS_KEY_ID"
  #   secret_key = "$AWS_SECRET_ACCESS_KEY"
  region = "ap-northeast-1"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# resource <resource_type> <resource_name>
resource "aws_instance" "example" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
}
```
上面這一段開一個基本 ec2 instance 的範例，其實官方有教 [點我](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance)

第一次進來要先初始化一下！
```
terraform init
```

```bash
terraform fmt   # 格式化文件
terraform plan  # 檢查與線上版本的差異
terraform apply # 準備部署 注意喔，再來個 yes 你就發射出去了
# terraform destroy
```

### kOps 出現了
跟隨官方腳步走，kOps 帶你部署 terraform >> [點我](https://github.com/kubernetes/kops/blob/master/docs/terraform.md)
networking 那邊可以選你需要的 CNI，不填寫也可以動啦，不過你會得到預設的 Kubenet

```
kops create cluster \
  --networking calico \ 
  --name=ptcg.10oz.tw \
  --state=s3://ptcg-bucket-tf \
  --dns-zone=ptcg.10oz.tw \
  --zones=ap-northeast-1a \
  --out=. \
  --target=terraform
```

會看到以下的 log
```
I0331 02:43:11.734871   11785 new_cluster.go:231] Inferred "aws" cloud provider from zone "ap-northeast-1a"
I0331 02:43:12.025276   11785 subnets.go:180] Assigned CIDR 172.20.32.0/19 to subnet ap-northeast-1a
I0331 02:43:13.000070   11785 create_cluster.go:713] Using SSH public key: /Users/xiaorenhao/.ssh/id_rsa.pub
I0331 02:43:17.504798   11785 executor.go:111] Tasks: 0 done / 79 total; 45 can run
I0331 02:43:17.521376   11785 dnszone.go:242] Check for existing route53 zone to re-use with name "ptcg.10oz.tw"
W0331 02:43:17.904862   11785 vfs_castore.go:604] CA private key was not found
I0331 02:43:18.010251   11785 keypair.go:195] Issuing new certificate: "etcd-clients-ca"
I0331 02:43:18.017672   11785 keypair.go:195] Issuing new certificate: "etcd-peers-ca-events"
I0331 02:43:18.022377   11785 keypair.go:195] Issuing new certificate: "etcd-manager-ca-events"
I0331 02:43:18.022427   11785 keypair.go:195] Issuing new certificate: "apiserver-aggregator-ca"
W0331 02:43:18.022450   11785 vfs_castore.go:604] CA private key was not found
I0331 02:43:18.022474   11785 keypair.go:195] Issuing new certificate: "ca"
I0331 02:43:18.029875   11785 keypair.go:195] Issuing new certificate: "master"
I0331 02:43:18.034989   11785 keypair.go:195] Issuing new certificate: "etcd-manager-ca-main"
I0331 02:43:18.131053   11785 keypair.go:195] Issuing new certificate: "etcd-peers-ca-main"
I0331 02:43:18.247347   11785 dnszone.go:249] Existing zone "ptcg.10oz.tw." found; will configure TF to reuse
I0331 02:43:19.689156   11785 executor.go:111] Tasks: 45 done / 79 total; 16 can run
I0331 02:43:19.694681   11785 executor.go:111] Tasks: 61 done / 79 total; 16 can run
I0331 02:43:20.133663   11785 executor.go:111] Tasks: 77 done / 79 total; 2 can run
I0331 02:43:20.134776   11785 executor.go:111] Tasks: 79 done / 79 total; 0 can run
I0331 02:43:20.156638   11785 target.go:221] Terraform output is in .
I0331 02:43:20.433778   11785 update_cluster.go:313] Exporting kubecfg for cluster
kops has set your kubectl context to ptcg.10oz.tw

Terraform output has been placed into .
Run these commands to apply the configuration:
   cd .
   terraform plan
   terraform apply

Suggestions:
 * validate cluster: kops validate cluster --wait 10m
 * list nodes: kubectl get nodes --show-labels
 * ssh to the master: ssh -i ~/.ssh/id_rsa ubuntu@api.ptcg.10oz.tw
 * the ubuntu user is specific to Ubuntu. If not using Ubuntu please use the appropriate user based on your OS.
 * read about installing addons at: https://kops.sigs.k8s.io/operations/addons.
```

會看見 kOps 幫你建立好了可以開啟 Kubernetes 服務的 terraform 檔案，直接給他跑下去
```
terraform plan
terraform apply
```

跑完後用這個指令來檢查你的 k8s cluster 是否有健康跑起來了
```
kops validate cluster --wait 10m
```


開出來的 admin token 一天就會過期，建議是自己建立一個適合自己用的 Service Account，
不過你需要 admin token 的時候可以這麼做
```
kops export kubecfg --admin
```

附錄：我想你會需要 Ingress Route
```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.44.0/deploy/static/provider/cloud/deploy.yaml
```

## 打完收工
```
kops delete cluster \
  --name=ptcg.10oz.tw \
  --state=s3://ptcg-bucket-tf \
  --yes
```

```
terraform destroy
```

然後建議要多人工檢查一下，因為我下完指令後很開心的洗洗睡了，隔天才注意到 Mount 的 PV 沒有幫我刪掉QQ
下次請記得到 EC2 Volume 看看喔！！


## Ref
https://shazi7804.github.io/terraform-manage-guide/command/plan.html
https://medium.com/@chihsuan/terraform-%E8%87%AA%E5%8B%95%E5%8C%96%E7%9A%84%E5%9F%BA%E7%A4%8E%E6%9E%B6%E6%A7%8B%E4%BB%8B%E7%B4%B9-f827e8975e98
https://godleon.github.io/blog/DevOps/terraform-getting-started/

