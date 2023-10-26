---
title: "Backup Elasticsearch index in File System"
date: 2023-02-16T20:28:00+08:00
draft: false
tags: ["elasticsearch"]
---

## Step by Step
### 部署 Elasticsearch

因為接下來會讓備份檔案儲存在 File System 內，所以先準備一個 PVC 給 Elasticsearch

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: elasticsearch-snapshot
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 20Gi
  storageClassName: "fs-sc"
```

這邊用 ECK (Elastic Cloud on Kubernetes) 來召喚一組新的 Elasticsearch。
在部署 Elasticsearch CR 時多 mount 一個 `path.repo` 這個 PV 是等等要用來存 snapshot 的地方

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: backup-es
spec:
  nodeSets:
  - config:
      path.repo: "/backup"
    count: 1
    name: default
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          volumeMounts:
          - mountPath: "/backup"
            name: backup
        volumes:
        - name: backup
          persistentVolumeClaim:
            claimName: elasticsearch-snapshot
    volumeClaimTemplates:
    - metadata:
        name: backup
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
  version: 8.6.0
```

### 在 Elasticsearch 建立 Snapshot

部署好之後，建立一筆 snapshot repository 名字叫做 `my_backup`。
注意說這邊如果使用 `fs` 一定要指定 `path.repo` 包含的路徑
```
PUT /_snapshot/my_backup
{
  "type": "fs",
  "settings": {
    "location": "/backup/loc"
  }
}
```

或是你有一個 `s3` 可以用來存備份檔 > u <
```
PUT _snapshot/my_backup
{
  "type": "s3",
  "settings": {
    "client": "secondary",
    "bucket": "name-of-bucket",
    "region": "region-of-bucket-same-as-cluster"
  }
}
```

指定要在這個 snapshot repository 中備份的 index，這邊把 index `system_search` 備份到 snapshot `system_search_snapshot` 裡面
```
PUT /_snapshot/my_backup/system_search_snapshot
{
  "indices": "system_search",
  "ignore_unavailable": true,
  "include_global_state": false
}
```

### 測試一下它有效 - 刪除及復原

如果想測試的話，敲一筆資料進去
```
POST /system_search/_doc
{
    "data_process_permanent_identity": "26bd375d-9be7-4c1c-9846-5cd187fd9b5d",
    "data_process_revision": 2,
    "data_process_name": "TEST-BACKUP",
    "logic_permanent_identity": "10b785f5-f833-4c94-9dfb-eeacc8ea88bf",
    "logic_revision": 2,
    "logic_name": "TEST-BACKUP-LOGIC",
    "execution_id": "Y3NtSqO4eboPm_oD_puy2A",
    "task_id": "WSCRLsEwGFGh6oAV4EqciA",
    "timestamp": 1668566827117,
    "sequence": 2,
    "type": "default",
    "meta": "",
    "source_digital_identity": "sourceDID",
    "target_digital_identity": "TargetDID",
    "label_id": "b428b5d9-df19-5bb9-a1dc-115e071b836c",
    "label_name": "test"
}
```

查一下確認他寫進去了，也可以看一下 total
```
POST /system_search/_search
```

直接讓這個 index 消失
```
DELETE /system_search
```

然後 restore 他就回來了，可以再 search 確認資料無誤
```
POST /_snapshot/my_backup/system_search_snapshot/_restore?wait_for_completion=true
```

#### Other notions
ECK 在 Latest 2.6 版本，官方提供的 `Kubernetes` 版本只有 1.21-1.25 最新的 1.26 呢 QQ

https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s_supported_versions.html
