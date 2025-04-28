"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createJiraIssue = createJiraIssue;
exports.getActiveSprintId = getActiveSprintId;
exports.attachFileToIssue = attachFileToIssue;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function createJiraIssue(data) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Request data: ", data);
        const res = yield axios_1.default.post(`${process.env.JIRA_URL}/rest/api/3/issue`, data, {
            auth: {
                username: process.env.JIRA_EMAIL,
                password: process.env.JIRA_API_TOKEN
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
        return res.data;
    });
}
function getActiveSprintId() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const boardId = process.env.JIRA_BOARD_ID;
            const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
            const res = yield axios_1.default.get(`${process.env.JIRA_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`, {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
            });
            const activeSprints = res.data.values;
            if (activeSprints.length > 0) {
                return activeSprints[0].id;
            }
            return null;
        }
        catch (error) {
            console.error('Не вдалося отримати активний спринт', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
            return null;
        }
    });
}
function attachFileToIssue(issueKey, fileBuffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const FormData = (yield Promise.resolve().then(() => __importStar(require('form-data')))).default;
        const form = new FormData();
        form.append('file', fileBuffer, { filename });
        yield axios_1.default.post(`${process.env.JIRA_URL}/rest/api/3/issue/${issueKey}/attachments`, form, {
            headers: Object.assign(Object.assign({}, form.getHeaders()), { 'X-Atlassian-Token': 'no-check' }),
            auth: {
                username: process.env.JIRA_EMAIL,
                password: process.env.JIRA_API_TOKEN
            }
        });
    });
}
