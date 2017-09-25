'use strict';

const fs = require('fs');
const http = require('http');

const tg = require('telegraf');
const qq = require('qq-bot-rebown');
const config = require('./config');

const tgBot = new tg.Telegram(config.tg.bot_token);
const qqBot = new qq.QQ();

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && ~req.url.indexOf(config.server.get_qr_path)) {
        fs.createReadStream(qqBot.options.qrcodePath).pipe(res);
    }
});

server.listen(config.server.port);

qqBot.on('group', msg => {
    if (~config.qq.group_names.indexOf(msg.groupName)) {
        for (let kwd of config.qq.listen_keywords) {
            if (~msg.content.indexOf(kwd)) {
                tgBot.sendMessage(
                    config.tg.chat_id,
                    config.tg.transformMsg(msg, kwd), {
                        parse_mode: "Markdown"
                    }
                );
                return;
            }
        }
    }
})

qqBot.run();
