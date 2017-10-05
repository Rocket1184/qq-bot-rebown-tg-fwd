# qq-bot-rebown-tg-fwd

Forward msg contains specific words from QQ group to Telegram group

## Usage

1. clone repo

2. create `config.js`, follow [config.example.js](/config.example.js)

3. start up

```bash
node index.js
```
4. scan QR code to login QQ

## Bot Commands

1. `/whoami`

Query your Telegram uid. Fill `config.tg.manager_id` with the result.

2. `/whereisthis`

Query current chat id. Can be used in `config.tg.chat_id`.
