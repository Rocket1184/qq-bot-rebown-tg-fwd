'use strict';

const fs = require('fs');
const http = require('http');

const tg = require('telegraf');
const qq = require('qq-bot-rebown');
const config = require('./config');

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && ~req.url.indexOf(config.server.get_qr_path)) {
        fs.createReadStream('/tmp/code.png').pipe(res);
    }
});

server.listen(config.server.port);

const tgBot = new tg.Telegram(config.tg.bot_token);
const qqBot = new qq.QQ();

qqBot.on('group', msg => {
    if (~msg.groupName.indexOf(config.qq.group_name)) {
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
