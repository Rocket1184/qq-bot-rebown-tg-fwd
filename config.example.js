const keywordList = ['fwd', 'test'];
const moreKeywords = [...keywordList, 'more', 'again'];

module.exports = {
    server: {
        // Visit `http://${host}:${port}${get_qr_path}` to get QQ login QR code
        get_qr_path: '/tg-qq-fwd/qq-qr-code',
        port: 34737
    },
    tg: {
        // Use proxy to connect telegram. Support `socks:` and `socks5:`
        // Fill it with `null` if you do not want to use proxy
        proxy: 'socks5://127.0.0.1:1080',
        // Telegram bot token
        bot_token: '123456:ABCdef_ghiJKLmnOPQrstu-vw',
        // Bot Manager ID, for receiving QR Codes
        manager_id: 123456789,
        // function to transform msg from QQ, you can use markdown in output
        // arguments:
        // msg: { name: string; content: string; groupName: string }
        // kwd: string, matched keyword, can be `undefined` in mode 'both'
        transformMsg: function (msg, kwd) {
            if (kwd) {
                return `*[${msg.name}]* ${msg.content.replace(kwd, `\`${kwd}\``)}`;
            } else {
                return `*[${msg.name}]* ${msg.content}`;
            }
        }
    },
    qq: {
        // function to transform msg from Telegram. Plain text only.
        // argument:
        // msg: {
        //     text: string; 
        //     from: {
        //         id: number,
        //         first_name: string,
        //         last_name: string,
        //         username: string
        //     }
        // }
        transformMsg: function (msg) {
            return `[${msg.from.username}] ${msg.text}`;
        }
    },
    rules: [
        {
            // forward msg from qq group which contains specific keyword to tg
            type: 'qq2tg',
            // QQ group FULL name
            qq_grop_name: 'The Origin Group',
            // Telegram group chat ID, can be number or @group_name
            tg_chat_id: '@the_target_group',
            // keywords. MUST be an array of string.
            listen_keywords: keywordList
        },
        {
            // forward any msg qq->tg and tg->qq
            type: '2way',
            // QQ group FULL name
            qq_group_name: 'Some Group',
            // Telegram group chat ID, can be number or @group_name
            tg_chat_id: -987654321
        }
        // may add more following above ...
    ]
};
