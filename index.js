'use strict';

const fs = require('fs');
const http = require('http');

const tg = require('telegraf');
const qq = require('qq-bot-rebown');
const config = require('./config');

const tgBot = new tg(config.tg.bot_token);
const qqBot = new qq.QQ();

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && ~req.url.indexOf(config.server.get_qr_path)) {
        fs.createReadStream(qqBot.options.qrcodePath).pipe(res);
    }
});

server.listen(config.server.port);

function notifyManager(...args) {
    tgBot.telegram.sendMessage(config.tg.manager_id, ...args)
}

// Set bot username
tgBot.telegram.getMe().then((botInfo) => {
    tgBot.options.username = botInfo.username
});

tgBot.command('whoami', (ctx) => {
    ctx.reply(`Your Telegram uid is \`${ctx.message.from.id}\``, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
    });
});

tgBot.startPolling();

qqBot.on('group', msg => {
    if (~config.qq.group_names.indexOf(msg.groupName)) {
        for (let kwd of config.qq.listen_keywords) {
            if (~msg.content.indexOf(kwd)) {
                tgBot.telegram.sendMessage(
                    config.tg.chat_id,
                    config.tg.transformMsg(msg, kwd), {
                        parse_mode: "Markdown"
                    }
                );
                return;
            }
        }
    }
});

qqBot.on('login', () => {
    notifyManager('Login action detected');
});

qqBot.on('qr', (path, img) => {
    tgBot.telegram.sendPhoto(config.tg.manager_id, {
        source: qqBot.options.qrcodePath,
        filename: `QR_Code_${Date.now()}.png`
    });
});

qqBot.on('qr-expire', () => {
    notifyManager('Previous QR Code has expired');
});

qqBot.on('start-poll', () => {
    notifyManager(`QQ Bot \`${qqBot.selfInfo.nick}\` on line`, {
        parse_mode: "Markdown"
    });
});

qqBot.on('disconnect', () => {
    notifyManager('QQ Bot disconnected');
});

qqBot.run();
