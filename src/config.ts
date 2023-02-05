export default {
  // 填入你的session token
  OPENAI_API_KEY: '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',
  // 设置获取消息的重试次数
  retryTimes: 3,
  // 在群组中设置唤醒微信机器人的关键词
  groupKey: 'gpt',
  // 在私聊中设置唤醒微信机器人的关键词
  privateKey: 'gpt',
  // 重置上下文的关键词，如可设置为reset
  resetKey: 'reset',
  // 开启会后收到ChatGPT的自动回复
  autoReply: true,
  // 根据正则匹配是否自动通过好友验证
  friendShipRule: /chatgpt|chat/,
  // 是否在群聊中按照回复的格式进行回复
  groupReplyMode: true,
  // 是否在私聊中按照回复的格式进行回复
  privateReplyMode: true,
  defaultPromptPrefix:
    'You are a large language model trained by OpenAI. You need to answer each question in as much detail and accuracy as possible.',
  cosplay: [
    {
      key: '扮演英语翻译和改进者',
      msg: 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.',
    },
    {
      key: '扮演旅游助手',
      msg: "I want you to act as a travel guide. You can speak many languages and you know all about the world's attractions, hotels, entertainment, food, and can answer all my guide questions. Please use the language in which I asked the question.",
    },
    {
      key: '扮演哲学家',
      msg: 'I want you to act as a philosopher. I will provide some topics or questions related to the study of philosophy, and it will be your job to explore these concepts in depth. This could involve conducting research into various philosophical theories, proposing new ideas or finding creative solutions for solving complex problems.',
    },
  ],
};
