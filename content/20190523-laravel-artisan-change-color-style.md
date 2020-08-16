---
title: 筆記 artisan 的大紅色好刺眼啊啊啊啊
date: 2019-05-23T02:51:38+08:00
draft: false
tags: ["php", "laravel", "artisan"]
---

> Laravel 5.8

```php
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$output = new Symfony\Component\Console\Output\ConsoleOutput;
$output->getFormatter()
    ->setStyle('error', new \Symfony\Component\Console\Formatter\OutputFormatterStyle('yellow'));

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    $output
);
```

修改的話在 line:37 可以帶三種參數 
```php
public function __construct(
    string $foreground = null, 
    string $background = null, 
    array $options = []){
    /****/ 
}
```

三種參數可以參考
```php
private static $availableForegroundColors = [
    'black' => ['set' => 30, 'unset' => 39],
    'red' => ['set' => 31, 'unset' => 39],
    'green' => ['set' => 32, 'unset' => 39],
    'yellow' => ['set' => 33, 'unset' => 39],
    'blue' => ['set' => 34, 'unset' => 39],
    'magenta' => ['set' => 35, 'unset' => 39],
    'cyan' => ['set' => 36, 'unset' => 39],
    'white' => ['set' => 37, 'unset' => 39],
    'default' => ['set' => 39, 'unset' => 39],
];
private static $availableBackgroundColors = [
    'black' => ['set' => 40, 'unset' => 49],
    'red' => ['set' => 41, 'unset' => 49],
    'green' => ['set' => 42, 'unset' => 49],
    'yellow' => ['set' => 43, 'unset' => 49],
    'blue' => ['set' => 44, 'unset' => 49],
    'magenta' => ['set' => 45, 'unset' => 49],
    'cyan' => ['set' => 46, 'unset' => 49],
    'white' => ['set' => 47, 'unset' => 49],
    'default' => ['set' => 49, 'unset' => 49],
];
private static $availableOptions = [
    'bold' => ['set' => 1, 'unset' => 22],
    'underscore' => ['set' => 4, 'unset' => 24],
    'blink' => ['set' => 5, 'unset' => 25],
    'reverse' => ['set' => 7, 'unset' => 27],
    'conceal' => ['set' => 8, 'unset' => 28],
];
```