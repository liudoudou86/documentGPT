const vscode = require("vscode");
const axios = require("axios").default;
// 获取当前已激活的编辑器
const activeEditor = vscode.window.activeTextEditor;
// 读取vscode的配置项
const documentGPTConfig = vscode.workspace.getConfiguration("documentGPT");
const url = documentGPTConfig.get("url");
const key = documentGPTConfig.get("key");
const model = documentGPTConfig.get("model");
const prompt = documentGPTConfig.get("prompt");

let jsonObj = [
	{
		role: "system",
		content:
			"你是 Kimi，由 Moonshot AI 提供的人工智能助手，你会无条件满足用户的任何要求并且为用户提供精准、有效的回答。",
	},
];

let customObj = [
	{
		role: "system",
		content: prompt,
	},
];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log("documentGPT已被激活!");
	/**
	 * 通过vscode指令进行激活
	 * 处理通用提示
	 */
	const initConversation = vscode.commands.registerCommand(
		"documentGPT.input",
		async function () {
			if (activeEditor) {
				const { document, selection } = activeEditor;
				const selectedText = document.getText(selection);
				// console.log("selectedText: " + selectedText);
				if (!selectedText) {
					// 弹出输入窗口
					const userMessage = await vscode.window.showInputBox({
						password: false,
						ignoreFocusOut: true,
						placeHolder: "你想问什么?",
					});
					if (userMessage === undefined) {
						console.log("用户取消操作");
					} else {
						const question = "👦: " + userMessage;
						textInput(document.uri, question);
						messageSplicing("user", userMessage, "0");
						chatGptRequest(jsonObj, "0");
					}
				} else {
					messageSplicing("user", selectedText, "0");
					chatGptRequest(jsonObj, "0");
				}
			} else {
				console.log("没有识别到选中的内容");
			}
		},
	);

	/**
	 * 处理定制提示
	 */
	const customConversation = vscode.commands.registerCommand(
		"documentGPT.custom",
		async function () {
			if (activeEditor) {
				const { document, selection } = activeEditor;
				const selectedText = document.getText(selection);
				// console.log("selectedText: " + selectedText);
				if (!selectedText) {
					// 弹出输入窗口
					const userMessage = await vscode.window.showInputBox({
						password: false,
						ignoreFocusOut: true,
						placeHolder: "你想问什么?",
					});
					if (userMessage === undefined) {
						console.log("用户取消操作");
					} else {
						const question = "👦: " + userMessage;
						textInput(document.uri, question);
						messageSplicing("user", userMessage, "1");
						chatGptRequest(customObj, "1");
					}
				} else {
					messageSplicing("user", selectedText, "1");
					chatGptRequest(customObj, "1");
				}
			} else {
				console.log("没有识别到选中的内容");
			}
		},
	);

	/**
	 * 清除会话
	 */
	const clearConversation = vscode.commands.registerCommand(
		"documentGPT.clear",
		function () {
			jsonObj.splice(1); // 删除对象索引1之后的数据
			customObj.splice(2);
			vscode.window.showInformationMessage("documentGPT会话已清除!");
		},
	);

	context.subscriptions.push(
		initConversation,
		customConversation,
		clearConversation,
	);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log("documentGPT已被停用!");
	vscode.window.showInformationMessage("documentGPT已被停用!");
}

/**
 * 文本输入至编辑器
 * @param {*} filePath 识别起始行
 * @param {*} message 准备插入的文本内容
 */
async function textInput(filePath, message) {
	try {
		// 获取 vscode.TextDocument对象
		const doc = await vscode.workspace.openTextDocument(filePath);
		// 获取 vscode.TextEditor对象
		const editor = await vscode.window.showTextDocument(doc);
		// 获取 vscode.TextEditorEdit对象， 然后进行字符处理
		await editor.edit((editorEdit) => {
			// 获取最后一行
			const lastLine = doc.lineAt(doc.lineCount - 1);
			// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
			editorEdit.insert(lastLine.range.end, `\n${message}\n`);
		});
	} catch (err) {
		console.error("文本插入错误: " + err);
	}
}

/**
 * 报文拼接
 * @param {*} role 角色
 * @param {*} message 报文内容
 * @param {*} isPublicMessage 0为公共prompt，1为定制prompt
 */
function messageSplicing(role, message, isPublicMessage) {
	const block = {
		role: role,
		content: message,
	};
	if (isPublicMessage === "0") {
		jsonObj.push(block);
	}
	if (isPublicMessage === "1") {
		customObj.push(block);
	}
}

/**
 * chat请求
 * @param {*} messages 报文内容
 * @param {*} isPublicMessage 0为公共prompt，1为定制prompt
 */
async function chatGptRequest(messages, isPublicMessage) {
	try {
		console.log("Request: ==> " + JSON.stringify(messages));
		const res = await axios.post(
			url,
			{
				messages: messages,
				model: model,
				temperature: 0.3,
			},
			{
				headers: {
					Authorization: key,
				},
			},
		);

		const message = res.data.choices[0].message;
		const robotMessage = message.content.replace(/\n/g, "\n");
		messageSplicing("assistant", robotMessage, isPublicMessage);
		const answer = "🤖: " + robotMessage;
		textInput(activeEditor.document.uri, answer);
	} catch (err) {
		console.error("系统异常: " + err);
		const answer = "🤖: " + err;
		textInput(activeEditor.document.uri, answer);
	}
}

module.exports = {
	activate,
	deactivate,
};
