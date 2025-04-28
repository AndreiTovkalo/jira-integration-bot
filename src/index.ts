import TelegramBot, {Message, Metadata} from 'node-telegram-bot-api';
import axios from 'axios';
import {createJiraIssue, attachFileToIssue, getActiveSprintId} from './jira';
import {parseSmartMessage} from "./parser";


const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true });

bot.on('message', async (msg: Message, metadata: Metadata) => {
  console.log(JSON.stringify(metadata))
  console.log(JSON.stringify(msg));
  if (!msg.text?.toLowerCase().startsWith('task:') && !msg.caption?.toLowerCase().startsWith("task:") && !msg.text?.startsWith('/')) return;


  const task = parseSmartMessage(msg.text ? msg.text : msg.caption!);
  const sprintId = await getActiveSprintId();
  const issueData = {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: task.title,
      issuetype: { name: task.issueType },
      priority: { name: task.priority },
      labels: task.labels,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `Created by @${msg.from?.username}`
              }
            ]
          }
        ]
      },
        ...(sprintId && {'customfield_10020': sprintId})
    }
  } as any;

  if (task.assignee) {
    issueData.fields.assignee = { id: task.assignee };
  }
  try {
    const result = await createJiraIssue(issueData);
    const issueKey = result.key;
    const file = msg.document || (msg.photo && msg.photo.at(-1));
    if (file) {
      const fileLink = await bot.getFileLink(file.file_id);
      const fileRes = await axios.get(fileLink, { responseType: 'stream' });

      await attachFileToIssue(issueKey, fileRes.data, (file as any).file_name || 'file.jpg');
    }

    await bot.sendMessage(msg.chat.id, `✅ Створено задачу в Jira: ${issueKey}\n👉${process.env.JIRA_URL}/browse/${issueKey}`, {message_thread_id: msg.message_thread_id});
    await bot.sendSticker(msg.chat.id, `CAACAgEAAxkBAAEOX_poDlp4q9qtZbx6JtYFCePuUDrxPwACgwEAAnY3dj8x5r4EoeawcTYE`, {message_thread_id: msg.message_thread_id});
  } catch (error: any) {
    console.error(error.response?.data || error);
    await bot.sendMessage(msg.chat.id, `❌ Не вдалося створити задачу.\n${JSON.stringify(error.response?.data.errors)}`, {message_thread_id: msg.message_thread_id});
    await bot.sendSticker(msg.chat.id, 'CAACAgEAAxkBAAEOYAABaA5fv4UQMwABj3mJJaJ6GNQDe3YrAAKEAQACdjd2P-GcU4Z766ifNgQ', {message_thread_id: msg.message_thread_id})
  }
});

