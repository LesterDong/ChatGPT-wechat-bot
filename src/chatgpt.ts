import { ChatGPTAPI } from 'chatgpt';
import config from './config.js';
import { retryRequest } from './utils.js';

let chatGPT: any = {};
let chatOption = {};
const switchRoleStr = '切换角色';
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

function getCosplayConfig(content) {
  if (content.indexOf(switchRoleStr) !== 0) {
    return;
  }
  let index;
  try {
    index = parseInt(content.replace(switchRoleStr, ''));
  } catch (e) {
    throw new Error('请输入正确的指令.');
  }
  // 角色扮演
  if (index && config.cosplay && config.cosplay.length > 0) {
    const result = config.cosplay[index - 1];
    if (result) {
      return result;
    } else {
      throw new Error('当前不存在角色' + index + '，清重新输入');
    }
  }
}

function reset() {
  chatOption = {};
  rolePlayPromptPrefix = undefined;
}

function getCosPlaySceneTitleListMenu() {
  if (config.cosplay && config.cosplay.length > 0) {
    const arr = [];
    for (const i in config.cosplay) {
      const segment = config.cosplay[i];
      const index = parseInt(i) + 1;
      arr[i] = '角色' + index + ': ' + segment.title;
    }
    const menu =
      '以下是当前支持的角色: ' +
      '\n**********************\n' +
      arr.join('\n') +
      '\n**********************\n' +
      '清输入 "' +
      switchRoleStr +
      'n" 来进入情景对话模式，如：“' +
      switchRoleStr +
      '3”';
    return menu;
  }
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
      reset();
      await contact.say('Previous conversation has been reset.');
      return;
    }
    if (content.trim().toLocaleLowerCase() === '情景对话') {
      const menu = getCosPlaySceneTitleListMenu();
      const resp = menu ? menu : '当前不支持情景对话模式';
      await contact.say(resp);
      return;
    }
    let respMsg;
    let cosConfig;
    try {
      // 角色扮演
      cosConfig = getCosplayConfig(content);
    } catch (error: any) {
      await contact.say('Warn: ' + error.message);
      return;
    }

    if (cosConfig) {
      reset();
      // 添加语境
      rolePlayPromptPrefix =
        cosConfig.limitLanguage === true
          ? cosConfig.sceneMsg + config.defaultLanguageLimitPhrase
          : cosConfig.sceneMsg;
      if (
        cosConfig.needSendMsg2GptAdvance === false &&
        cosConfig.questionDemo
      ) {
        // 返回到微信给用户示例问题
        respMsg =
          '好的，已为您开启【' +
          cosConfig.title +
          '】情景模式，您可以这样跟我说：“' +
          cosConfig.questionDemo +
          '”';
      } else {
        respMsg = await retryRequest(
          () => getChatGPTReply(rolePlayPromptPrefix),
          config.retryTimes,
          500
        );
      }
    } else {
      respMsg = await retryRequest(
        () => getChatGPTReply(content),
        config.retryTimes,
        500
      );
    }

    if (
      (contact.topic && contact?.topic() && config.groupReplyMode) ||
      (!contact.topic && config.privateReplyMode)
    ) {
      const result = content + '\n-----------\n' + respMsg;
      await contact.say(result);
      return;
    } else {
      await contact.say(respMsg);
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
