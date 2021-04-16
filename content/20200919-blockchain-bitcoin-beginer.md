---
title: "新米 blockchain 混亂中"
date: 2020-09-19T00:56:51+08:00
draft: false
tag: ["blockchain", "bitcoin"]
---

> 這次筆記內容會圍繞在**比特幣**這個區塊鍊加密貨幣系統
> 然後比特幣是一種讓北極熊沒有家住的技術 (?

## 區塊鏈的安全
- **區塊鏈**鏈的模式，保證新的區塊接續前一個區塊，當區塊越多越難被修改
- **共識機制**需要多數節點認同保護資料不易被竄改，也就是**去中心化**的部分啦
- **密碼學**上的困難問題保護使用資產不會被任意取用，也在建立新的區塊時增加難度，就是挖礦的部分啦

### 共識機制
這是在分散式系統中相當常見的問題，當節點多了，在同步上出現分歧時應該要聽誰的?
究竟誰手中的資料才是正確的呢?

#### 拜占庭將軍問題
描述有數個將軍各自在不同地方，但有著相同的任務，而這個任務非常艱難，必須要每個將軍同時進攻、或是同時撤退，否則就會失敗。  
因此在出發之前，每位將軍會投票決定之後才開始行動，
然而...在這樣的條件下，竟有還有幾位將軍是隱藏身分的間諜!?  

在節點中，同樣會遇到這樣的問題，當節點中出現了不遵守規定的惡意節點時，該如何將它的影響降低呢?

#### 挖礦
也就是增加難度，比特幣使用 PoW(Proof-of-Work)，~~讓北極熊沒地方住~~ ，讓每個節點用工作量來證明自己。如果你想要搞破壞的話，你必須付出比整個鏈上過半的計算能力，然而在現在廣大的比特鏈生態來說，這是不可能的。

> 每個鏈上的共識機制都不同，例如乙太鍊上使用的是 PoS

## 激勵機制
在前一個段落的區塊鍊安全那邊有說到使用 PoW 來保證難以隨意的添加區塊，但是認真想想誰要做這麼吃力的事情? 因此激勵機制的部分就是 **給你錢幫我算** (*´∀`)~♥ xdd

### 區塊鏈節點
身為一個去中心化的點對點系統，當然一定要有節點。在比特鏈上可以大致分兩種節點，全節點(Full Node)與輕量節點(Light Node)

- `全節點`: 存放著完整的比特鏈資訊(好幾十GB)，工作是打包區塊上鏈以及驗證其他人上傳區塊的合法性
- `輕量節點`: 也稱為簡單支付驗證（SPV）節點，不需要儲存所有區塊資訊，也不會對鏈上的安全性做出貢獻，就只是個 read user。可以是手機或是電腦的客戶端軟體，他能夠驗證某一筆交易是否在區塊鏈中
- `礦工仔`: 準確來說礦工不一定是比特網路的一部分，礦工只需要向全節點要求交易回來打包、計算，再將節點廣播出去給所有的全節點驗證就好了

### 挖礦仔常見問題
> Q: 挖礦是啥米?

當有一筆交易要進行的時候，交易方拋出他的交易資訊，請人幫他簽核，成功幫他完成任務的人會有獎金

> Q: 這個簽核任務有是啥米?

礦工們會將`交易區塊資訊` + `Nonce` 拿去 hash，不斷的替換 Nonce 取得某一組 hash 值開頭是 n 個 bits 為 0 的解答，第一個拿到解答的就是這次挖礦的成功者。因此越多人參與解題就越難挖到礦

> Q: 這樣不就超難挖礦的嗎?

每經過 2016 個交易認證後難度會改變(要求開頭的 0 變多個或變少)，改變依照之前的交易認證時間，如果太久就變簡單一點，反之亦然。

> Q: 挖礦挖不完的嗎?

會挖完的，最一開始驗證一筆交易礦工可以拿到 50 塊錢比特幣，每次產生出 21萬塊錢比特幣後，獎勵就會少一半，直到最後小於比特幣可以支付的最小單位 (10的-8次方比特幣)


## 交易模型
UTXO Model (Unspent Transaction Output)，在比特幣鏈上的餘額並不是直接儲存一個數字的，如果你今天想要拿到某個地址的餘額的話，就需要從第一個區塊開始看，把每一筆還沒有被消費掉的交易(Unspent Transaction)加起來，這個數字才會是你的餘額。
例如說:
```
A 轉給 C 100 btc .... (tx1)
B 轉給 C 120 btc .... (tx2)

到這裡 C 有 2 筆未使用交易，總共 220 btc

如果 C 要轉給 A 130 塊錢的話，就必須從他的 UTXO 裡面選出來交易
C -> A 130 btc .... (tx3)
C -> C 90 btc .... (tx4) 多餘的錢錢要還給自己呀！

因此最後的結果中，C 消耗了 tx1, tx2 
C 剩下一筆 90 塊的未使用交易 
```

### 粉塵攻擊
在 UTXO 系統中會遇到的身分問題，可以參考這篇寫得很棒 XDD
https://iview.sina.com.tw/post/23868182

---

在區塊上的交易紀錄基本上都是公開透明的，可以共大眾來查找。

公有鏈：完全去中心化，也就是完全公開透明、任何人都可以加入，每個人都可以讀取上面的資料的鏈。
私有鏈：部分去中心化，是完全私有的區塊鏈，寫入權限全被一處中心所把持，而讀取權限則被這處中心限制，但此鏈交易速度比較快並且也保持了不可篡改性，是給私有公司使用的鏈。
聯盟鏈：介於公有鏈和私有鏈之間，和私有鏈最大的不同是，它適用於多個機構共同使用，或者一整個行業、聯盟用的；而私有鏈是一家企業或公司用的


Merkle Tree
不可修改性
如果今天有人想要修改一個區塊的交易紀錄，會需要把後續所有的 Block 都修改才行，

用於快速驗證交易存在某個區塊

---

## BIP (Bitcoin Improvement Proposals)
### BIP-32 HD-Wallet
定義 Hierarchical Deterministic wallet，可以由一個 Seed 來產生多組錢包地址(包含公鑰、私鑰)
好處是只需要記得 Seed 就可以動態錢包，不需要記得很長的密碼

![](https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png)

### BIP-39 助記詞
助記詞(mnemonic)將 Seed 用英文單字來編碼表示，更方便記憶。
做法是 seed + checkSum 然後每 11bits 兌換呈一個對應的字

### BIP-44 多帳號的 HD-Wallet
基於 BIP-32 的系統，讓他同時支援多種幣別，
而一組助記詞可以產出 N 組私鑰，每組私鑰對應一種幣種(BTC, ETH...)
表示形式像是:
```
m / purpose' / coin_type' / account' / change / address_index
```
每個欄位有不同意義
    - `purpose'` 固定寫 44 表示是依照 BIP-44 規則產生後面的樹跟子節點
    - `coin_type'` 一組 Seed 可以為不同幣別產生多個完全獨立的錢包地址，例如比特幣是 0，以太幣是 60 >>> [這邊有列表](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
    - `account'` 一組 Seed 可以為不同帳號產生多個完全獨立的錢包地址
    - `change'` 固定用 0 表示外部鍊(external chain) 用於對外部收款付款， 1 表示內部鍊(internal chain)，這什麼意思...我看不懂QQ
    - `index'` 剛剛說了麻，一個 Seed 可以產很多地址，index 表示你要第幾個錢包地址
| coin | account | chain | address | path |
| ---- | ---- | ---- | ---- | ---- |
| Bitcoin | first | external | first | m / 44' / 0' / 0' / 0 / 0 |
| Bitcoin Testnet | first | external | first | m / 44' / 1' / 0' / 0 / 0 |

可以到這個網站上實際產生一組試試看 https://iancoleman.io/bip39/

## 錢包地址
比特幣錢包地址可能是 `1`, `3`, `bc1` 開頭，測試鏈上的地址是 `m`, `n`, `2`, `tb1` 開頭


## 交易
有分幾種交易簽章模式，差別在如何使用 tx out，每個 tx out 上都有不同的 lock script，可以把這個鎖想像成是一個題目，你必須將題目完整解鎖你才有資格，例如說 lock script 是 `+ 3 = 5`，那你 tx in 的 unlock script 就要是 `2`，組合起來驗證 `2 + 3 = 5` 這樣才是一個合法的交易簽章

主要分成幾種模式：

### P2PKH (Pay to Pubkey Hash)
算是最基礎的模式，使用的 lock script 是
```
OP_DUP OP_HASH160 <Public Key Hash> OP_EQUAL OP_CHECKSIG
```
unlock script
```
<Signature> <Public Key>
```

![](https://miro.medium.com/max/770/1*NtgVAsbc112gcNoS1IDjDg.png)

### P2SH (Pay to Script Hash)
在這之前要先認識一下多簽 (Multi-signature)，他的 lock script 是由多個公鑰組成，你必須完成他指定數量的簽章才能解鎖，

例如說 2-3 多簽，就是你必須要有這 3 個人其中兩個的簽章
```
2 <Public Key A> <Public Key B> <Public Key C> 3 OP_CHECKMULTISIG
```
假設你有 B, C 的同意， unlock script 會像是
```
OP_0 <Signature B> <Signature C>
```

不過，這樣的方式如果人數一多會讓 lock script 變得非常非常長，這樣儲存 UTXO 會浪費掉很多珍貴的記憶體，因此 `P2SH` 來解決問題惹，簡單來說就是把題目放到 lock script，而 unlock script 只存題目的 hash，驗證時首先驗證 lock script 裡面的題目 hash 後是否和 unlock script 相同，相同的話就相信你並接收你的驗證

lock script, 裡面的 redeem scriptHash 就是題目的 hash，  
redeem script(題目): `2 PKA PKB PKC 3 OP_CHECKMULTISIG`

```
OP_HASH160 <redeem scriptHash> OP_EQUAL
```
unlock script 比較一下前面的多簽
```
<SigB> <SigC> 2 PKA PKB PKC 3 OP_CHECKMULTISIG
```

example:
![](https://miro.medium.com/max/1540/1*ix6qCQoBzFROhvPokj6YYw.png)

### P2WPKH ( pay to witness public key hash)

### SegWit (Segregated Witness) 隔離見證

由於每個區塊最多最多只能夠有 1MB，而每一筆交易的簽章佔用了很大的比例，
因此在 BIP141 提出了見證隔離這個方案，將原本一個區塊的最大值從 1MB 改成 4MB，計算單位從 bytes 改成 weight，並將原本簽章的部份抽出來存放，這表示發一筆交易需要的 byte 更少更便宜，經過計算後一個區塊能夠放更多的交易，因此交易速度提高，而礦工打包區塊也可以拿到更多手續費，

Bech32 encoded segwit addresses start with a human-readable


---

### 帳號安全
橢圓曲線用的是這條 secp256k1，他長這樣
```go
secp256k1.P = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F")
secp256k1.N = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141")
secp256k1.B = fromHex("0000000000000000000000000000000000000000000000000000000000000007")
secp256k1.Gx = fromHex("79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798")
secp256k1.Gy = fromHex("483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8")
```

比特幣錢包地址怎麼來的呢?
> 1. 把公鑰拿出來找到他在曲線上的 (x, y)，再拿去 hash 2 次，
> 2. 再將 hash 結果做兩次 sha256 取得前四個 byte 作為 checkSum
> 3. 最後 base58 encode 就是人類看到的地址囉
> 
> hash = ripemd160(sha256(pubkey_bits))
> checkSum = sha256(sha256("00"+hash))[:4]  // (0x00 for Main Network)
> addr = base58(hash + checkSum)
> 詳細可以參考[這篇wiki](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)

以太幣錢包的話有點不同
> 把公鑰拿出來後用的是 Keccak-256(sha-3) 來 hash，特點是長度是不固定的
> 最後加上 EIP55 的大小寫檢查碼 (這是可選的)
> 詳細可以參考這個 https://git.io/ethAddressHash


## Ref
什麼是節點 https://academy.binance.com/zt/articles/what-are-nodes
https://medium.com/taipei-ethereum-meetup/%E8%99%9B%E6%93%AC%E8%B2%A8%E5%B9%A3%E9%8C%A2%E5%8C%85-%E5%BE%9E-bip32-bip39-bip44-%E5%88%B0-ethereum-hd-%EF%BD%97allet-a40b1c87c1f7
https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
比特幣問題們 https://bitcoin.org/zh_TW/faq#wont-the-finite-amount-of-bitcoins-be-a-limitation
關於比特幣地址 https://medium.com/my-blockchain-development-daily-journey/%E9%97%9C%E6%96%BC%E6%AF%94%E7%89%B9%E5%B9%A3%E5%9C%B0%E5%9D%80-%E4%BD%A0%E8%A9%B2%E7%9F%A5%E9%81%93%E7%9A%84%E4%BA%8B-8dd3bbb89ade
隔離見證 https://blockcast.it/2017/04/24/what-is-scalability-issue-and-segregated-witness/
bitcoin tx怎麼包 https://medium.com/taipei-ethereum-meetup/mastering-bitcoin-ch5-transactions-38a387e3819a
比特節點介紹 https://academy.binance.com/zt/articles/what-are-nodes
註記詞與BIP https://www.mdeditor.tw/pl/pCPM/zh-tw
