---
title: "Rust x WebAssembly 得到開始"
date: 2022-02-01T19:37:00+08:00
draft: false
tags: ["rust", "webassembly"]
---

## 認識一下



## WebAssembly 跟著範例學習
在 [wasm-bindgen examples](https://github.com/rustwasm/wasm-bindgen/tree/main/examples) 裡面也有很多的範例喔喔喔喔

### Example 1: Hello world
跟隨[人家做的教學](https://wasmbyexample.dev/examples/hello-world/hello-world.rust.en-us.html)跑跑看
```bash
cargo install wasm-pack
```

```bash
cargo new learn-wasm --lib
cd learn-wasm
```

更新產生出來的 `Crago.toml`，指定 Crate Type 和需要的依賴套件 `wasm_bindgen`。

這邊的 `crate-type` 指定成 `cdylib`，意思是編譯出來的 dynamic library 是兼容 C/C++ 語言的 FFI 的，也就是會透過這個介面來和其他語言溝通。
詳見 [crate-type](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#the-crate-type-field) 和 [Linkage](https://doc.rust-lang.org/reference/linkage.html) 的官方文件

```toml
[package]
name = "learn-wasm"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

正式開始編輯 `src/lib.rc`，先來寫一個最簡單的 function 並幫他掛上 `#[wasm_bindgen]` macro

```rust
// The wasm-pack uses wasm-bindgen to build and generate JavaScript binding file.
// Import the wasm-bindgen crate.
use wasm_bindgen::prelude::*;

// Our Add function
// wasm-pack requires "exported" functions
// to include #[wasm_bindgen]
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
  return a + b;
}
```

接下來就直接用 `wasm-pack` 來把編譯成 wasm module，`target` 指定成 web。

`wasm-pack` 也支援很多不同的輸出像是 `Webpack` 或是 `Rollup`，但這次就先使用 web 的 `ES6 module`

[點我看更多種 target](https://rustwasm.github.io/docs/wasm-pack/commands/build.html#target)

```bash
wasm-pack build --target web
```

輸出會到 `pkg` 裡面看起來會長這樣，有熟悉的 `package.json` 還有 `.d.ts` 定義檔真讚
```
$ tree pkg/
pkg/
├── learn_wasm.d.ts
├── learn_wasm.js
├── learn_wasm_bg.wasm
├── learn_wasm_bg.wasm.d.ts
└── package.json
```

接下來我們嘗試在 Web 中直接使用剛剛編譯出來的 WebAssembly 模組
```bash
# 產生一個 index.html
vim index.html
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello World - Rust</title>
    <script type="module">
        // Import our outputted wasm ES6 module
        // Which, export default's, an initialization function
        import init from "./pkg/learn_wasm.js";

        const runWasm = async () => {
            // Instantiate our wasm module
            const helloWorld = await init("./pkg/learn_wasm_bg.wasm");

            // Call the Add function export from wasm, save the result
            const addResult = helloWorld.add(24, 24);

            // Set the result onto the body
            document.body.textContent = `Hello World! addResult: ${addResult}`;
        };
        runWasm();
    </script>
  </head>
  <body></body>
</html>
```

我使用了 `wsl2` 在這邊直接點開 `index.html` 遇到了這樣子的 CORS 錯誤 QQ
```
Access to script at 'file://wsl.localhost/Ubuntu-20.04/home/arios/projects/rust/learn-wasm/pkg/learn_wasm.js' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, chrome-untrusted, https.
```

偷偷跑個 HTTP Server 來託管一下，到 `http://localhost:8000/` 就可以看到結果囉
```
python3 -m http.server
```

### Example 2: WebAssembly Linear Memory
完成了最簡單的案例，接下來看看進階一點點的

來使用 memory buffer，我們建立以下三個 function 來輔助
1. 取得這段連續記憶體的開頭 `get_wasm_memory_buffer_pointer` 
2. 設定指定記憶體位置 (index: 0) 的數值
3. 讀取指定記憶體位置 (index: 1) 的數值

```bash
# 開始修改
vim src/lib.rs
```

> NOTE: 在 `rust` 中直接去修改記憶體會需要使用 `unsafe` 關鍵字
```rust
// The wasm-pack uses wasm-bindgen to build and generate JavaScript binding file.
// Import the wasm-bindgen crate.
use wasm_bindgen::prelude::*;

// Create a static mutable byte buffer.
// We will use for passing memory between js and wasm.
// NOTE: global `static mut` means we will have "unsafe" code
// but for passing memory between js and wasm should be fine.
const WASM_MEMORY_BUFFER_SIZE: usize = 2;
static mut WASM_MEMORY_BUFFER: [u8; WASM_MEMORY_BUFFER_SIZE] = [0; WASM_MEMORY_BUFFER_SIZE];

// Function to store the passed value at index 0,
// in our buffer
#[wasm_bindgen]
pub fn store_value_in_wasm_memory_buffer_index_zero(value: u8) {
  unsafe {
    WASM_MEMORY_BUFFER[0] = value;
  }
}

// Function to return a pointer to our buffer
// in wasm memory
#[wasm_bindgen]
pub fn get_wasm_memory_buffer_pointer() -> *const u8 {
  let pointer: *const u8;
  unsafe {
    pointer = WASM_MEMORY_BUFFER.as_ptr();
  }

  return pointer;
}

// Function to read from index 1 of our buffer
// And return the value at the index
#[wasm_bindgen]
pub fn read_wasm_memory_buffer_and_return_index_one() -> u8 {
  let value: u8;
  unsafe {
    value = WASM_MEMORY_BUFFER[1];
  }
  return value;
}
```

再重新編譯一下
```bash
wasm-pack build --target web
```

這次內容比較多，我們新增一個 `index.js` 來寫

剛才分配的 memory 會透過 `rustWasm.memory.buffer` 這個 `ArrayBuffer` 來存取，也用來驗證剛剛建立的 3 個 functions 的功能
```javascript
import wasmInit from "./pkg/learn_wasm.js";

const runWasm = async () => {
  const rustWasm = await wasmInit("./pkg/learn_wasm_bg.wasm");

  /**
   * Part one: Write in Wasm, Read in JS
   */
  console.log("Write in Wasm, Read in JS, Index 0:");

  // First, let's have wasm write to our buffer
  rustWasm.store_value_in_wasm_memory_buffer_index_zero(24);

  // Next, let's create a Uint8Array of our wasm memory
  let wasmMemory = new Uint8Array(rustWasm.memory.buffer);

  // Then, let's get the pointer to our buffer that is within wasmMemory
  let bufferPointer = rustWasm.get_wasm_memory_buffer_pointer();

  // Then, let's read the written value at index zero of the buffer,
  // by accessing the index of wasmMemory[bufferPointer + bufferIndex]
  console.log(wasmMemory[bufferPointer + 0]); // Should log "24"

  /**
   * Part two: Write in JS, Read in Wasm
   */
  console.log("Write in JS, Read in Wasm, Index 1:");

  // First, let's write to index one of our buffer
  wasmMemory[bufferPointer + 1] = 15;

  // Then, let's have wasm read index one of the buffer,
  // and return the result
  console.log(rustWasm.read_wasm_memory_buffer_and_return_index_one()); // Should log "15"

  /**
   * NOTE: if we were to continue reading and writing memory,
   * depending on how the memory is grown by rust, you may have
   * to re-create the Uint8Array since memory layout could change.
   * For example, `let wasmMemory = new Uint8Array(rustWasm.memory.buffer);`
   * In this example, we did not, but be aware this may happen :)
   */
};

runWasm();
```

然後修改一下 `index.html` 的部分，讓他的 `script` 標籤改成讀剛剛的 `.js` Source 檔案
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello World - Rust</title>
    <script type="module" src="./index.js"></script>
  </head>
  <body></body>
</html>
```

回到剛剛用 `python3 -m http.server 8080` host 的網頁上，可以在 Console 看到結果 👍

![](https://i.imgur.com/Ov9BcwZm.png)

另外，也可以謢街在 Dev Tools 上面 Import 來玩玩看~~
```javascript
let module
import('./pkg/learn_wasm.js').then(m => module = m)

let rustWasm
module.default('./pkg/learn_wasm_bg.wasm').then(m => rustWasm = m)
```

### Example 3: Importing Javascript Functions Into WebAssembly

> Q: 我想要 debug，該如何在 WebAssembly 裡面 call `console.log` 呢？

接下來要嘗試反向把 Javascript 的 function 拋進 WebAssembly 裡面使用，這次的範例會是 browser 的 `console.log`

```
vim src/lib.rs
```

```rust
// The wasm-pack uses wasm-bindgen to build and generate JavaScript binding file.
// Import the wasm-bindgen crate.
use wasm_bindgen::prelude::*;

// Let's define our external function (imported from JS)
// Here, we will define our external `console.log`
#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // 綁定到 `window.global_foo`
    #[wasm_bindgen]
    fn global_foo();
}

// Export a function that will be called in JavaScript
// but call the "imported" console.log.
#[wasm_bindgen]
pub fn console_log_from_wasm() {
    log("This console.log is from wasm!");
}

#[wasm_bindgen]
pub fn global_foo_from_wasm() {
    global_foo();
}
```

我們在 `src/lib.rs` 宣告了一個 `namespace = console` 的 `log` function，所以等一下在後面呼叫 log 時就會調用 JavaScript 裡面的 `console.log` 同名 function。

開 build 喔
```bash
wasm-pack build --target web
```

改一下 `index.js` 內容

```javascript
import wasmInit from "./pkg/learn_wasm.js";

window.global_foo = () => {
  console.log("成功綁定 window.global_foo");
  document.title = "foo";
};

const runWasm = async () => {
  const rustWasm = await wasmInit("./pkg/learn_wasm_bg.wasm");

  // Run the exported function
  rustWasm.console_log_from_wasm(); // Should log "This console.log is from wasm!"

  // Run the exported function
  rustWasm.global_foo_from_wasm(); // Should log and change the title to "foo"
};

runWasm();
```


## 跟 React 一起用呢

目標是將專案打包成一個 NPM package，就能給 React Code 使用了！

為了實驗我們 Create 一個新的 React 專案！
```bash
npx create-react-app testing --template typescript
```

然後將剛才編譯好的 wasm 結果加進去
```bash
cd testing
npm install $HOME/projects/learn-wasm/pkg
```

來 diff 一下可以看見 package.json 的 dependencies 底下多了一條
```diff
$ git diff package.json
+ "learn-wasm": "file:../learn-wasm/pkg"
```

範例請看 [magic-box](https://github.com/XiaoXiaoSN/magic-box)


## Wasmer
```bash
brew install wasmer
```


## Ref
https://webassembly.org/

https://developer.mozilla.org/zh-TW/docs/WebAssembly
https://blog.techbridge.cc/2017/06/17/webassembly-js-future/

線上轉 C  https://wasdk.github.io/WasmFiddle/

https://doc.rust-lang.org/cargo/reference/cargo-targets.html#the-crate-type-field

https://www.readfog.com/a/1653827465241530368
