'use strict';

const fs = require('fs');
const http = require('http');

const tg = require('telegraf');
const qq = require('qq-bot-rebown');
const SocksProxyAgent = require('socks-proxy-agent');

const config = require('./config');

const telegrafOpt = { telegram: {}, msgId: null, qrMsgId: null };

if (config.tg.proxy) {
    telegrafOpt.telegram.agent = new SocksProxyAgent(config.tg.proxy);
}

const tgBot = new tg(config.tg.bot_token, telegrafOpt);

let qqOpt = { online: false };
if (config.qq.id && config.qq.pwd) {
    Object.assign(qqOpt, {
        app: { login: qq.QQ.LOGIN.PWD },
        auth: { u: config.qq.id, p: config.qq.pwd }
    });
}

const qqBot = new qq.QQ(qqOpt);

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith(config.server.get_qr_path)) {
        fs.createReadStream(qqBot.options.qrcodePath).pipe(res);
    }
});

server.listen(config.server.port);

function notifyManager(...args) {
    if (telegrafOpt.msgId) {
        return tgBot.telegram.editMessageText(config.tg.manager_id, telegrafOpt.msgId, null, ...args);
    }
    return tgBot.telegram
        .sendMessage(config.tg.manager_id, ...args)
        .then(ret => {
            telegrafOpt.msgId = ret.message_id;
            return ret;
        });
}

function sendQRImage(...args) {
    return tgBot.telegram
        .sendPhoto(config.tg.manager_id, ...args)
        .then(ret => {
            telegrafOpt.qrMsgId = ret.message_id;
            return ret;
        });
}

function deleteQRImage() {
    if (telegrafOpt.qrMsgId) {
        tgBot.telegram.deleteMessage(config.tg.manager_id, telegrafOpt.qrMsgId);
        telegrafOpt.qrMsgId = null;
    }
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
            message = `Chat type: ${ctx.message.chat.type}; Chat id \`${ctx.message.chat.id}\``;
    }
    ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
    });
});

/* eslint-disable  no-case-declarations */

function tgMsgHandler(ctx, next, handler) {
    if (!qqBot._alive) return;
    const message = ctx.message || ctx.editedMessage;
    switch (message.chat.type) {
        case 'group':
        case 'supergroup':
            const { id, username } = message.chat;
            config.rules.forEach(r => {
                if (r.tg_chat_id == id || r.tg_chat_id == username) {
                    switch (r.type) {
                        case '2way':
                            if (!r.gid) r.gid = qqBot.group
                                .filter(g => g.name == r.qq_group_name)
                                .map(g => g.gid)
                                .pop();
                            const msg = {
                                name: message.from.username || `${message.from.first_name} ${message.from.last_name || ''}`,
                                content: handler(message)
                            };
                            const text = config.qq.transformMsg(msg);
                            // stroe last sent msg, to avoid duplicate forward
                            r.lastMsg = text;
                            qqBot.sendGroupMsg(r.gid, text);
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
}

tgBot.on(['text', 'edited_message'], (ctx, next) => tgMsgHandler(ctx, next, message => message.text));

tgBot.on('sticker', (ctx, next) => tgMsgHandler(ctx, next, message => `(Sticker) ${message.sticker.emoji}`));

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
                        config.tg.transformMsg(msg),
                        { parse_mode: 'HTML' }
                    );
                    break;
                case 'qq2tg':
                    for (let kwd of r.listen_keywords) {
                        if (msg.content.includes(kwd)) {
                            tgBot.telegram.sendMessage(
                                r.tg_chat_id,
                                config.tg.transformMsg(msg, kwd),
                                { parse_mode: 'HTML' }
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
    if (qqOpt.online) return;
    notifyManager('Login...');
});

qqBot.on('qr', (path, img) => {
    deleteQRImage();
    sendQRImage({ source: img });
});

qqBot.on('qr-expire', () => deleteQRImage());

qqBot.on('start-poll', () => {
    if (qqOpt.online) return;
    notifyManager(`${qqBot.selfInfo.nick} online`);
    qqOpt.online = true;
    deleteQRImage();
});

qqBot.on('cookie-expire', () => {
    qqOpt.online = false;
    // send new message when cookie expired
    telegrafOpt.msgId = null;
    telegrafOpt.qrMsgId = null;
})

qqBot.on('error', err => {
    notifyManager(`QQ Bot error:\n<pre>${err}</pre>`, { parse_mode: 'HTML' });
})

qqBot.run();
