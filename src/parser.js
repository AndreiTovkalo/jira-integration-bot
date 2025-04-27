"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJiraUserId = getJiraUserId;
exports.parseSmartMessage = parseSmartMessage;
const config_1 = require("./config");
const accountMappings_json_1 = __importDefault(require("./accountMappings.json"));
function getJiraUserId(telegramUsername) {
    if (!telegramUsername) {
        return "";
    }
    return accountMappings_json_1.default[telegramUsername];
}
function parseSmartMessage(text) {
    var _a, _b, _c;
    const typeMatch = text.match(/^\/(bug|feature|task|improvement)/i);
    const issueType = typeMatch ? config_1.supportedIssueTypes[typeMatch[1].toLowerCase()] : config_1.defaultIssueType;
    const cleanText = text.replace(/^\/\w+/, '').replace(/^TASK:/i, '').trim();
    const title = cleanText.split(/[#@!]/)[0].trim();
    const labels = [...cleanText.matchAll(/#(\w+)/g)].map(m => m[1]);
    const assignee = getJiraUserId((_a = cleanText.match(/@(\w+)/)) === null || _a === void 0 ? void 0 : _a[1]);
    const priorityRaw = (_c = (_b = cleanText.match(/!(high|medium|low)/i)) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.toLowerCase();
    const priority = priorityRaw ? priorityRaw[0].toUpperCase() + priorityRaw.slice(1) : 'Medium';
    return { title, labels, assignee, priority, issueType };
}
