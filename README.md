# DocumentGPT

  - vscode插件
  - 文档类型的GPT辅助工具,可以通过输入问题在vscode中方便的查看AI的回答，并且便于直接保存
  - 需要定期更新documentGPT的key，此key为请求GPT的钥匙

```json
{
  "documentGPT.url": "https://api.aigcfun.com/api/v1/text",
  "documentGPT.key": "FCYLFSDJ47RHP9JG2N",
  "documentGPT.prompt": "我想让你充当前端开发专家。我将提供一些关于Js、Node等前端代码问题的具体信息，而你的工作就是想出为我解决问题的策略。",
}  

```
记录项目的常用命令
```
yo code # 创建项目
vsce package # 打包项目
```

TODO: 投喂文档进行GPT知识库问答, 文档格式: excel、pdf