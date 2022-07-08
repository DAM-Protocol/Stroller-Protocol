# `Stroller Protocol`

![](/client/docs/images/strollerprotocol.png)

## Need for a `Stroller`

Currently users have no option other than wrapping surplus ERC20 tokens to keep the streams running. These tokens do not earn interest since Superfluid protocol is relatively new and DeFi is yet to be introduced on streams.

Stroller Protocol allows users to earn yield on ERC20 tokens without the compulsion of having to wrap them to Super Tokens. This is enabled by creating Strollers which top-up the streams with just enough Super tokens to keep the streams running without any penalties.

![](https://stream.mux.com/i224Rw0001RO00IuZAHgnsr14QiTdXtpkr4tn5xXcTJu6E/high.mp4)

## Use Case

Users can invest their tokens in other DeFi protocols like `AAVE`, `Harvest`, etc. and approve the receipt tokens for our contracts. For example, Alex invests USDT in `AAVE` and gets `amUSDT` in return. She approves `amUSDT` for our contracts and creates a `stroller`. Whenever her USDTx stream will have low balance to keep the stream running for a threshold, these `amUSDT` tokens will be converted to `USDT` and transferred to Alex as `USDTx`.

![](/client/docs/images/flowdiagram.png)

Using the Top-Up service provided by Stroller Protocol, users can now be tension free about their streams running dry. Approve, create a stroller and relax. The protocol handles the headaches for you.

## Deployments

| Chain                 | Addresses                                                                                                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Polygon Mumbai        | StrollManager: 0x896d448119F6901d27845f77083Dfe5456C05099<br>ERC20StrollOut: 0x20af3f0f49237D0c3f8557dBED9d4B1A6ed4d552<br>AaveV2StrollOut: 0x7606bC78f13d8e9A1B38CE69Fb508cbB0dFa7e13    |
| Rinkeby               | StrollManager: 0x1166363D3005F96E6e2D940860BC346414E0cFB9<br>ERC20StrollOut: 0xa6C537b0e5162b6a220522D0657749144d1a180e                                                                   |
| Polygon PoS (mainnet) | StrollManager: 0x74EC90e367493b3d0e57F0B09eeD760dfdAeDC89<br>ERC20StrollOut: 0x74408A7979a361dB0e16C9D471ab786cF9A59ed3<br>GelatoStrollKeeper: 0xc8c9E0E1B2E77Bb846b90a08A4E5F2567cFA69f4 |
