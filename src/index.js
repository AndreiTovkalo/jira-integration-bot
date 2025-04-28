"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const axios_1 = __importDefault(require("axios"));
const jira_1 = require("./jira");
const parser_1 = require("./parser");
const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_TOKEN, { polling: true });
bot.on('message', (msg, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    console.log(JSON.stringify(metadata));
    console.log(JSON.stringify(msg));
    if (!((_a = msg.text) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith('task:')) && !((_b = msg.caption) === null || _b === void 0 ? void 0 : _b.toLowerCase().startsWith("task:")) && !((_c = msg.text) === null || _c === void 0 ? void 0 : _c.startsWith('/')))
        return;
    const task = (0, parser_1.parseSmartMessage)(msg.text ? msg.text : msg.caption);
    const sprintId = yield (0, jira_1.getActiveSprintId)();
    const issueData = {
        fields: Object.assign({ project: { key: process.env.JIRA_PROJECT_KEY }, summary: task.title, issuetype: { name: task.issueType }, priority: { name: task.priority }, labels: task.labels, description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `Created by @${(_d = msg.from) === null || _d === void 0 ? void 0 : _d.username}`
                            }
                        ]
                    }
                ]
            } }, (sprintId && { 'customfield_10020': sprintId }))
    };
    if (task.assignee) {
        issueData.fields.assignee = { id: task.assignee };
    }
    try {
        const result = yield (0, jira_1.createJiraIssue)(issueData);
        const issueKey = result.key;
        const file = msg.document || (msg.photo && msg.photo.at(-1));
        if (file) {
            const fileLink = yield bot.getFileLink(file.file_id);
            const fileRes = yield axios_1.default.get(fileLink, { responseType: 'stream' });
            yield (0, jira_1.attachFileToIssue)(issueKey, fileRes.data, file.file_name || 'file.jpg');
        }
        yield bot.sendMessage(msg.chat.id, `✅ Створено задачу в Jira: ${issueKey}\n👉${process.env.JIRA_URL}/browse/${issueKey}`, { message_thread_id: msg.message_thread_id });
        yield bot.sendSticker(msg.chat.id, `CAACAgEAAxkBAAEOX_poDlp4q9qtZbx6JtYFCePuUDrxPwACgwEAAnY3dj8x5r4EoeawcTYE`, { message_thread_id: msg.message_thread_id });
    }
    catch (error) {
        console.error(((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error);
        yield bot.sendMessage(msg.chat.id, `❌ Не вдалося створити задачу.\n${JSON.stringify((_f = error.response) === null || _f === void 0 ? void 0 : _f.data.errors)}`, { message_thread_id: msg.message_thread_id });
        yield bot.sendSticker(msg.chat.id, 'CAACAgEAAxkBAAEOYAABaA5fv4UQMwABj3mJJaJ6GNQDe3YrAAKEAQACdjd2P-GcU4Z766ifNgQ', { message_thread_id: msg.message_thread_id });
    }
}));
