import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function createJiraIssue(data: any) {

  console.log("Request data: ", data)
  const res = await axios.post(`${process.env.JIRA_URL}/rest/api/3/issue`, data, {
    auth: {
      username: process.env.JIRA_EMAIL!,
      password: process.env.JIRA_API_TOKEN!
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  console.log(JSON.stringify(res.data, null, 2));
  return res.data;
}

export async function attachFileToIssue(issueKey: string, fileBuffer: any, filename: string) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', fileBuffer, { filename });

  await axios.post(
    `${process.env.JIRA_URL}/rest/api/3/issue/${issueKey}/attachments`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-Atlassian-Token': 'no-check'
      },
      auth: {
        username: process.env.JIRA_EMAIL!,
        password: process.env.JIRA_API_TOKEN!
      }
    }
  );
}
