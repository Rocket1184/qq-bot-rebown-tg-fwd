# qq-bot-rebown-tg-fwd

Forward msg contains specific words from QQ group to Telegram group

## Usage

1. clone repo

2. `npm install`

3. create `config.js`, follow [config.example.js](/config.example.js)

4. `node index.js`

5. scan QR code to login QQ

## Bot Commands

1. `/whoami`

Query your Telegram uid. Fill `config.tg.manager_id` with the result.

2. `/whereisthis`

Query current chat id. Can be used in `tg_chat_id`.

TIP: To use this command, you must turn off bot's `Group Privacy` via `@BotFather` in `Bot Settings`.
