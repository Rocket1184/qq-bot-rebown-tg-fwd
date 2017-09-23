# qq-bot-rebown-tg-fwd

Forward msg contains specific words from QQ group to Telegram group

## Usage

1. clone repo

2. create `config.js`, follow:

```js
module.exports = {
    server: {
        // Visit `http://${host}:${port}${get_qr_path}` to get QQ login QR code
        get_qr_path: '/tg-qq-fwd/qq-qr-code',
        port: 34737
    },
    tg: {
        // Telegram bot token
        bot_token: '123456:ABCdef_ghiJKLmnOPQrstu-vw',
        // Telegram group chat ID, can be number or @group_name
        chat_id: '@group_name',
        // function to transform forwarded msg, you can use markdown in output
        // arguments:
        // msg: { name: string; content: string; groupName: string }
        // kwd: string, matched keyword
        transformMsg: function (msg, kwd) {
            return `[${msg.name}] ${msg.content.replace(kwd, `\`${kwd}\``)}`;
        }
    },
    qq: {
        // QQ group FULL name
        group_name: '...',
        // keywords to listen
        listen_keywords: [
            'fwd',
            'test'
        ]
    }
}
```

3. start up

```bash
node index.js
```

4. scan QR code to login QQ
