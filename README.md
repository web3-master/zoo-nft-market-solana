![🏆](https://github.com/dany-armstrong/zoo-nft-market-solana/blob/main/screenshot.jpg?raw=true)

# 🏆🏆🏆 Zoo NFT Market Solana 🏆🏆🏆

Simple but full fledged NFT market place built with Anchor framework for solana blockchain.

## 📺 LIVE ON (Solana Devnet)

https://zoo-nft-market-solana.surge.sh

## 📜 Program

### ⚔️ Used technologies

> [<b>Rust langage</b>](<https://en.wikipedia.org/wiki/Rust_(programming_language)>): General-purpose programming language designed for performance and safety.

> [<b>Cargo</b>](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html) : Rust build system and package manager.

> [<b>Anchor framework</b>](https://book.anchor-lang.com/introduction/what_is_anchor.html): A framework for quickly building secure Solana programs.

> [<b>Solana cli</b>](https://docs.solana.com/cli): Command line tool to interact solana cluster.

<br/>

### 📝 Description

[Program Address in Devnet](https://explorer.solana.com/address/nXWqyd8v3SxxqiHJCYQ2xKamkrGaDkBJqnwUU4DcDDs?cluster=devnet)

Program implemented 2 main features.

1. NFT minting.

2. NFT marketplace.

## Build & Test

All working and failing cases are covered by unit test scripts.<br/>
By ts-mocha, chai node.js library.

### Build

```
$ anchor build
```

### Test

```
$ anchor test
```

## 📺 DApp

### ⚔️ Used technologies

> @solana/web3.js: Node.js library to integrate the front end into the solana program backend.

> antd: Excellent UI template library for react.js.

> React.js: For our front end building.

> ipfs: Decentralized storage service. We stores all images and metadata here.

### 📝 Description

This is react.js based decentralized front-end application for our animal owners and buyers.
Now it has the following features.

1. Wallet connection.
   It supports major Solana wallets such as Phantom and Solflare.
2. Mint.
   Any user can mint his/her own animal's NFT here.
3. Market.
   All animals' NFTs are listed here.
   NFT owner can start fixed price sale or auction.
   Buyer can buy fixed price sale item or bid to live auction to win.
