# qq-bot-rebown-tg-fwd

Forward **text** messages between Telegram group and QQ group

QQ support by [qq-bot-rebown](https://github.com/rocket1184/qq-bot-rebown)

Telegram support by [telegraf](https://github.com/telegraf/telegraf)

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
