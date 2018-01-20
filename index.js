'use strict';

const fs = require('fs');
const http = require('http');

const tg = require('telegraf');
const qq = require('qq-bot-rebown');
const SocksProxyAgent = require('socks-proxy-agent');

const config = require('./config');

const telegrafOpt = { telegram: {} };

if (config.tg.proxy) {
    telegrafOpt.telegram.agent = new SocksProxyAgent(config.tg.proxy);
}

const tgBot = new tg(config.tg.bot_token, telegrafOpt);

let qqOpt = {};
if (config.qq.id && config.qq.pwd) {
    qqOpt = {
        app: { login: qq.QQ.LOGIN.PWD },
        auth: { u: config.qq.id, p: config.qq.pwd }
    }
}

const qqBot = new qq.QQ(qqOpt);

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && ~req.url.indexOf(config.server.get_qr_path)) {
        fs.createReadStream(qqBot.options.qrcodePath).pipe(res);
    }
});

server.listen(config.server.port);

function notifyManager(...args) {
    tgBot.telegram.sendMessage(config.tg.manager_id, ...args);
}

// Set bot username
tgBot.telegram.getMe().then((botInfo) => {
    tgBot.options.username = botInfo.username;
});

tgBot.command('whoami', (ctx) => {
    ctx.reply(`Your Telegram uid is \`${ctx.message.from.id}\``, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
    });
});

tgBot.command('whereisthis', (ctx) => {
    let message;
    switch (ctx.message.chat.type) {
        case 'group':
            message = `This group uid is \`${ctx.message.chat.id}\``;
            break;
        case 'private':
            message = `This private chat id as well as your uid is \`${ctx.message.chat.id}\``;
            break;
        default:
            message = `Chat type: ${ctx.message.chat.type}; Chat id ${ctx.message.chat.id}`;
    }
    ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
    });
});

/* eslint-disable  no-case-declarations */

tgBot.on('message', (ctx) => {
    if (!qqBot._alive) return;
    switch (ctx.message.chat.type) {
        case 'group':
        case 'supergroup':
            const { id, username } = ctx.message.chat;
            config.rules.forEach(r => {
                if (r.tg_chat_id == id || r.tg_chat_id == username) {
                    switch (r.type) {
                        case '2way':
                            if (!r.gid) r.gid = qqBot.group
                                .filter(g => g.name == r.qq_group_name)
                                .map(g => g.gid)
                                .pop();
                            const msg = config.qq.transformMsg(ctx.message);
                            // stroe last sent msg, to avoid duplicate forward
                            r.lastMsg = msg;
                            qqBot.sendGroupMsg(r.gid, msg);
                            break;
                        default:
                            break;
                    }
                }
            });
            break;
        default:
            break;
    }
});

tgBot.startPolling();

qqBot.on('group', msg => {
    config.rules.forEach(r => {
        if (r.qq_group_name === msg.groupName) {
            switch (r.type) {
                case '2way':
                    // do not forward if this msg was sent by myself just now
                    if (msg.content === r.lastMsg) return;
                    tgBot.telegram.sendMessage(
                        r.tg_chat_id,
                        config.tg.transformMsg(msg), {
                            parse_mode: 'Markdown'
                        }
                    );
                    break;
                case 'qq2tg':
                    for (let kwd of r.listen_keywords) {
                        if (~msg.content.indexOf(kwd)) {
                            tgBot.telegram.sendMessage(
                                config.tg.chat_id,
                                config.tg.transformMsg(msg, kwd), {
                                    parse_mode: 'Markdown'
                                }
                            );
                            return;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    });
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
        parse_mode: 'Markdown'
    });
});

qqBot.on('disconnect', () => {
    notifyManager('QQ Bot disconnected');
});

qqBot.on('error', err => {
    notifyManager(`QQ Bot encountered error:
\`\`\`
${err}
\`\`\`
`, { parse_mode: 'Markdown' });
})

qqBot.run();
