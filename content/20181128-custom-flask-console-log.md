---
title: 筆記 自定義 flask 的 console log 之路
date: 2018-11-28T03:19:15+08:00
draft: false
tags: ["python", "flask"]
---

## 需求
讓 console log 可以正確顯示來源 ip
而不是被 web server 轉發的 ip

![](https://i.imgur.com/2saUiKz.png)


## 實作修改
覆蓋掉 address_string 這個 function `line:8`
覆蓋掉 log function `line:9`
```python=
import logging

# get werkzeug_logger
werkzeug_logger = logging.getLogger('werkzeug')

# Override the built-in werkzeug logging function in order to change the log line format.
from werkzeug.serving import WSGIRequestHandler
WSGIRequestHandler.address_string = lambda self: \
    self.headers.get('X-Forwarded-For') if self.headers.get('X-Forwarded-For') else self.client_address[0]
WSGIRequestHandler.log = lambda self, type, message, *args: \
    getattr(werkzeug_logger, type)('%s %s' % (self.address_string(), message % args))
```
