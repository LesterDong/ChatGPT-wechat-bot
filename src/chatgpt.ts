import { ChatGPTAPI } from 'chatgpt';
import config from './config.js';
import { retryRequest } from './utils.js';

let chatGPT: any = {};
let chatOption = {};
const assistantLabel = 'ChatGPT';
const assistantLabelStatement = 'You are ' + assistantLabel + '. ';
const defaultPromptPrefix =
  assistantLabelStatement + config.defaultPromptPrefix;
let rolePlayPromptPrefix;
export function initChatGPT() {
  chatGPT = new ChatGPTAPI({
    apiKey: config.OPENAI_API_KEY,
    debug: true,
  });
}

function addChatOption(chatOption) {
  const promptPrefix = rolePlayPromptPrefix
    ? rolePlayPromptPrefix
    : defaultPromptPrefix;
  chatOption['promptPrefix'] = promptPrefix;
}

async function getChatGPTReply(content) {
  addChatOption(chatOption);
  const { conversationId, text, id } = await chatGPT.sendMessage(
    content,
    chatOption
  );
  chatOption = {
    conversationId,
    parentMessageId: id,
  };
  console.log('response: ', conversationId, text);
  // response is a markdown-formatted string
  return text;
}

export async function replyMessage(contact, content) {
  try {
    if (
      content.trim().toLocaleLowerCase() === config.resetKey.toLocaleLowerCase()
    ) {
      chatOption = {};
      rolePlayPromptPrefix = undefined;
      await contact.say('Previous conversation has been reset.');
      return;
    }
    // 角色扮演
    if (config.cosplay && config.cosplay.length > 0) {
      for (const i in config.cosplay) {
        const c = config.cosplay[i];
        if (content.trim() === c.key) {
          // 添加语境
          rolePlayPromptPrefix = c.msg;
        }
      }
    }
    const message = await retryRequest(
      () => getChatGPTReply(content),
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
  }
}
