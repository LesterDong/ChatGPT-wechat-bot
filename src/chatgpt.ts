import { ChatGPTAPI } from 'chatgpt';
import pTimeout from 'p-timeout';
import config from './config.js';
import { retryRequest } from './utils.js';
import { getCookies } from './auth.js';

let chatGPTConfig = config;

const conversationMap = new Map();
let chatGPT: any = {};
export async function initChatGPT() {
  const cookies: any = await getCookies();
  console.log('cookies------: ', Array.isArray(cookies));
  const { value: clearanceToken } =
    cookies.find(({ name }) => name === 'cf_clearance') || {};
  const { value: sessionToken } =
    cookies.find(({ name }) => name === '__Secure-next-auth.session-token') ||
    {};
  chatGPTConfig = {
    ...chatGPTConfig,
    sessionToken,
    clearanceToken,
  };
  console.log('chatGPTConfig', chatGPTConfig);
  chatGPT = new ChatGPTAPI({
    sessionToken: chatGPTConfig.sessionToken,
    clearanceToken: chatGPTConfig.clearanceToken,
    userAgent: chatGPTConfig.userAgent,
  });
}

function resetConversation(contactId: string) {
  if (conversationMap.has(contactId)) {
    conversationMap.delete(contactId);
  }
}

function getConversation(contactId: string) {
  if (conversationMap.has(contactId)) {
    return conversationMap.get(contactId);
  }
  const conversation = chatGPT.getConversation();

  conversationMap.set(contactId, conversation);
  return conversation;
}

async function getChatGPTReply(content, contactId) {
  const currentConversation = getConversation(contactId);

  await chatGPT.ensureAuth();

  // send a message and wait for the response
  const threeMinutesMs = 3 * 60 * 1000;
  const response = await pTimeout(currentConversation.sendMessage(content), {
    milliseconds: threeMinutesMs,
    message: 'ChatGPT timed out waiting for response',
  });
  console.log('response: ', response);
  // response is a markdown-formatted string
  return response;
}

export async function replyMessage(contact, content, contactId) {
  try {
    if (
      content.trim().toLocaleLowerCase() === config.resetKey.toLocaleLowerCase()
    ) {
      resetConversation(contactId);
      await contact.say('Previous conversation has been reset.');
      return;
    }
    const message = await retryRequest(
      () => getChatGPTReply(content, contactId),
      config.retryTimes,
      500
    );

    if (
      (contact.topic && contact?.topic() && config.groupReplyMode) ||
      (!contact.topic && config.privateReplyMode)
    ) {
      const result = content + '\n-----------\n' + message;
      await contact.say(result);
      return;
    } else {
      await contact.say(message);
    }
  } catch (e: any) {
    console.error(e);
    if (e.message.includes('timed out')) {
      await contact.say(
        content +
          '\n-----------\nERROR: Please try again, ChatGPT timed out for waiting response.'
      );
    }
    conversationMap.delete(contactId);
  }
}
