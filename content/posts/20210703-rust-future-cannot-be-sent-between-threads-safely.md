---
title: "Rust - Future cannot be sent between threads safely"
date: 2021-07-03T10:44:00+08:00
draft: false
tags: ["rust", "future"]
---

## 描述問題
錯誤訊息類似這樣：
![](https://i.imgur.com/bfNCQ1r.png)

## 認識問題
原來呢，在 Rust 裡面的 Async 分享變數時會參考 `Send` `Sync` 這兩個 Trait
- `Send` 表示他能在不同的 Thread 中傳遞
    > A type is Send if it is safe to send it to another thread.
- `Sync` 表示他能同時被多個線程分享使用 (`T is Sync` if and only if `&T is Send`)
    > A type is Sync if it is safe to share between threads (T is Sync if and only if &T is Send).


並且要注意， `Send` 和 `Sync` 是自動分配的 Traits，因此大部分接觸到的元件都會是實作 `Send` 或 `Sync` 的，像是可以注意以下幾點例外：
- raw pointers are neither Send nor Sync (because they have no safety guards).
- UnsafeCell isn't Sync (and therefore Cell and RefCell aren't).
- Rc isn't Send or Sync (because the refcount is shared and unsynchronized).


更多的內容請讀 [官方說明](https://blog.rust-lang.org/inside-rust/2019/10/11/AsyncAwait-Not-Send-Error-Improvements.html)

那麼為什麼我們需要這兩個 Auto Trait 呢？
這就是 Rust 對記憶體管理厲害的地方了～

能夠在 Compiler time 就抓出可能發生 race condition 的程式碼，確保變數使用的安全性！

## Ref
https://blog.rust-lang.org/inside-rust/2019/10/11/AsyncAwait-Not-Send-Error-Improvements.html
https://hexilee.me/2019/11/07/async-block-send/
https://doc.rust-lang.org/nomicon/send-and-sync.html
