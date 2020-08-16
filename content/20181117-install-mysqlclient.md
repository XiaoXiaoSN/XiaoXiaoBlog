---
title: "筆記 mysqlclient 安裝, error: python setup.py egg_info "
date: 2018-11-17T14:11:06+08:00
tags: ["python", "mysql", "mysqlclient"]
---

## 錯誤:

目標是成功執行它：
```sh
pip3 install mysqlclient
```

```sh
arios@AriosMac: pymysql_pool » pip3 install mysqlclient
Collecting mysqlclient
  Using cached https://files.pythonhosted.org/packages/ec/fd/83329b9d3e14f7344d1cb31f128e6dbba70c5975c9e57896815dbb1988ad/mysqlclient-1.3.13.tar.gz
    Complete output from command python setup.py egg_info:
    /bin/sh: mysql_config: command not found
    Traceback (most recent call last):
      File "<string>", line 1, in <module>
      File "/private/var/folders/xf/g7567kgs05vf5t8zfrnfh9th0000gn/T/pip-install-pqr5axvg/mysqlclient/setup.py", line 18, in <module>
        metadata, options = get_config()
      File "/private/var/folders/xf/g7567kgs05vf5t8zfrnfh9th0000gn/T/pip-install-pqr5axvg/mysqlclient/setup_posix.py", line 53, inget_config
        libs = mysql_config("libs_r")
      File "/private/var/folders/xf/g7567kgs05vf5t8zfrnfh9th0000gn/T/pip-install-pqr5axvg/mysqlclient/setup_posix.py", line 28, inmysql_config
        raise EnvironmentError("%s not found" % (mysql_config.path,))
    OSError: mysql_config not found

    ----------------------------------------
Command "python setup.py egg_info" failed with error code 1 in /private/var/folders/xf/g7567kgs05vf5t8zfrnfh9th0000gn/T/pip-install-pqr5axvg/mysqlclient/
```


## 解決方法

for ubuntu 16 LTS：
```sh
apt install -y libmysqlclient-dev
```

for mac:
```sh
brew install mysql
```