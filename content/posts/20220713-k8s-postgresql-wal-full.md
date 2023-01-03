---
title: "筆記 Debug PostgreSQL WAL 滿ㄌ"
date: 2022-07-26T12:59:00+08:00
draft: false
tags: ["kubernetes", "postgres"]
---

## 前情提要
這是一台架設在 Kubernetes 上，使用 Postgres Operator 部署的單節點資料庫，SRE 大大發現他的硬碟空間滿了，趕快來看一下
由於硬碟滿了 SQL Query 也下不了，於是先幫他加了 2 GB 的 pv。

這是他的 log 
```log
2022-01-27 03:09:49,785 INFO: Lock owner: None; I am MY_DB_NAME-0
2022-01-27 03:09:49,786 INFO: starting as a secondary
2022-01-27 03:09:50 UTC [413]: [1-1] 61f20cfe.19d 0     FATAL:  could not write lock file "postmaster.pid": No space left on device
2022-01-27 03:09:50,085 INFO: postmaster pid=413
/var/run/postgresql:5432 - no response
2022-01-27 03:09:50,102 WARNING: Postgresql is not running.
2022-01-27 03:09:50,102 INFO: Lock owner: None; I am MY_DB_NAME-0
2022-01-27 03:09:50,107 INFO: pg_controldata:
  pg_control version number: 1300
  Catalog version number: 202007201
  Database system identifier: 7024396656819753043
  Database cluster state: in archive recovery
  pg_control last modified: Thu Jan 27 02:04:18 2022
  Latest checkpoint location: 10/C800AA10
  Latest checkpoint's REDO location: 10/C800A9D8
  Latest checkpoint's REDO WAL file: 0000000900000010000000C8
  Latest checkpoint's TimeLineID: 9
  Latest checkpoint's PrevTimeLineID: 9
  Latest checkpoint's full_page_writes: on
  Latest checkpoint's NextXID: 0:52538
  Latest checkpoint's NextOID: 50198
  Latest checkpoint's NextMultiXactId: 1
  Latest checkpoint's NextMultiOffset: 0
  Latest checkpoint's oldestXID: 479
  Latest checkpoint's oldestXID's DB: 1
  Latest checkpoint's oldestActiveXID: 52538
  Latest checkpoint's oldestMultiXid: 1
  Latest checkpoint's oldestMulti's DB: 1
  Latest checkpoint's oldestCommitTsXid: 0
  Latest checkpoint's newestCommitTsXid: 0
  Time of latest checkpoint: Thu Jan 27 00:10:32 2022
  Fake LSN counter for unlogged rels: 0/3E8
  Minimum recovery ending location: 10/C9000000
  Min recovery ending loc's timeline: 9
  Backup start location: 0/0
  Backup end location: 0/0
  End-of-backup record required: no
  wal_level setting: replica
  wal_log_hints setting: on
  max_connections setting: 100
  max_worker_processes setting: 8
  max_wal_senders setting: 10
  max_prepared_xacts setting: 0
  max_locks_per_xact setting: 64
  track_commit_timestamp setting: off
  Maximum data alignment: 8
  Database block size: 8192
  Blocks per segment of large relation: 131072
  WAL block size: 8192
  Bytes per WAL segment: 16777216
  Maximum length of identifiers: 64
  Maximum columns in an index: 32
  Maximum size of a TOAST chunk: 1996
  Size of a large-object chunk: 2048
  Date/time type storage: 64-bit integers
  Float8 argument passing: by value
  Data page checksum version: 0
  Mock authentication nonce: da09cd91aff4fc04822b4475aa0944dee4f3a297badcac611f47ff91071988b9
```

## 健康檢查時間
總之先 psql 進去資料庫 Query 一些資訊出來看看吧!

pg_database_size 9009 kB 而已呀少少
```sql
SELECT pg_size_pretty(pg_database_size('YOUR_DB_NAME'));
```

退出 psql 直接看一下儲存空間，發現是 WAL log 占用掉了資源。
```
du -h | sort -h
```

回到 psql 再來查看一下 WAL 的相關設定
```sql
SHOW ALL;
-- 或是
SELECT * FROM pg_settings WHERE name LIKE '%wal%'
```

注意在 PostgreSQL 13 將 `wal_keep_segments` 換成了 `wal_keep_size`，不過基本上還是類似功能的東西
```
wal_keep_size = wal_keep_segments * wal_segment_size (typically 16MB)
```

WAL 的 SIZE 設定看上去沒有甚麼問題，不過另外發現了他的同步機制是開啟的，因此只開了單台的 Postgres 沒辦法同步變更到另外一台 Replicate

按照 Postgres Operator [Issue](https://github.com/zalando/postgres-operator/issues/1664#issuecomment-961761544) 這邊寫的，把 `archive_mode` 關掉吧!!!

期待有大大幫修這張 Issue，在這之前都要自己記得喔 👍

## Ref
https://isdaniel.github.io/postgresql-wal-introduce/

https://kknews.cc/zh-tw/code/g4b4nny.html

https://www.slideshare.net/wenchen3/postgre-sql-wal

https://www.postgresql.fastware.com/blog/how-to-solve-the-problem-if-pg_xlog-is-full

https://github.com/zalando/postgres-operator/issues/1664#issuecomment-961761544