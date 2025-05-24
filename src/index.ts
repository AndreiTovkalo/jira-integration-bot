import TelegramBot, { Message } from 'node-telegram-bot-api';
import axios from 'axios';
import { createJiraIssue, attachFileToIssue, getActiveSprintId } from './jira';
import { parseSmartMessage } from './parser';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true });

bot.on('message', async (msg: Message) => {
  if (
    !msg.text?.toLowerCase().startsWith('task:') &&
    !msg.caption?.toLowerCase().startsWith('task:') &&
    !msg.text?.startsWith('/')
  ) return;

  console.log(`Incoming message from @${msg.from?.username}: ${msg.text || msg.caption}`);

  const task = parseSmartMessage(msg.text ? msg.text : msg.caption!);
  const sprintId = await getActiveSprintId();

  const issueData = {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: task.title,
      issuetype: { name: task.issueType },
      ...(task.issueType !== 'Task' && { priority: { name: task.priority } }),
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
                text: `Created by @${msg.from?.username}`,
              },
            ],
          },
        ],
      },
      ...(sprintId && { 'customfield_10020': sprintId }),
    },
  } as any;

  if (task.assignee) {
    issueData.fields.assignee = { id: task.assignee };
  }

  console.log(`Parsed task:\n${JSON.stringify(task, null, 2)}`);
  console.log(`Sprint ID: ${sprintId}`);
  console.log(`Jira payload:\n${JSON.stringify(issueData, null, 2)}`);

  try {
    const result = await createJiraIssue(issueData);
    const issueKey = result.key;
    console.log(`Created Jira issue: ${issueKey}`);

    const file = msg.document || (msg.photo && msg.photo.at(-1));
    if (file) {
      const fileLink = await bot.getFileLink(file.file_id);
      const fileRes = await axios.get(fileLink, { responseType: 'stream' });

      await attachFileToIssue(issueKey, fileRes.data, (file as any).file_name || 'file.jpg');
      console.log(`Attached file: ${(file as any).file_name || 'file.jpg'}`);
    }

    const messageText = `✅ Створено задачу в Jira: ${issueKey}\n👉${process.env.JIRA_URL}/browse/${issueKey}`;
    const options = msg.message_thread_id ? { message_thread_id: msg.message_thread_id } : {};

    await bot.sendMessage(msg.chat.id, messageText, options);
  } catch (error: any) {
    const errorText = error.response?.data?.errors
      ? JSON.stringify(error.response.data.errors)
      : JSON.stringify(error.response?.data || error.message || error);

    console.error(`Jira error:\n${errorText}`);

    const options = msg.message_thread_id ? { message_thread_id: msg.message_thread_id } : {};

    await bot.sendMessage(msg.chat.id, `❌ Не вдалося створити задачу.\n${errorText}`, options);
  }
});
