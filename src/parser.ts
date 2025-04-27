import { supportedIssueTypes, defaultIssueType } from './config';
import userMapping from './accountMappings.json';

export interface ParsedTask {
  title: string;
  labels: string[];
  assignee?: string;
  priority: string;
  issueType: string;
}

export function getJiraUserId(telegramUsername: string | undefined): string | undefined {
  if(!telegramUsername) {return ""}
  return (userMapping as Record<string, string>)[telegramUsername];
}

export function parseSmartMessage(text: string): ParsedTask {
  const typeMatch = text.match(/^\/(bug|feature|task|improvement)/i);
  const issueType = typeMatch ? supportedIssueTypes[typeMatch[1].toLowerCase()] : defaultIssueType;
  const cleanText = text.replace(/^\/\w+/, '').replace(/^TASK:/i, '').trim();
  const title = cleanText.split(/[#@!]/)[0].trim();
  const labels = [...cleanText.matchAll(/#(\w+)/g)].map(m => m[1]);
  const assignee = getJiraUserId(cleanText.match(/@(\w+)/)?.[1]);
  const priorityRaw = cleanText.match(/!(high|medium|low)/i)?.[1]?.toLowerCase();
  const priority = priorityRaw ? priorityRaw[0].toUpperCase() + priorityRaw.slice(1) : 'Medium';

  return { title, labels, assignee, priority, issueType };
}
