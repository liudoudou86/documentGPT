const vscode = require("vscode");
const axios = require("axios").default;
// 获取当前已激活的编辑器
const activeEditor = vscode.window.activeTextEditor;
// 读取vscode的配置项: documentGPT.key
const documentGPTConfig = vscode.workspace.getConfiguration("documentGPT");
const url = documentGPTConfig.get("url");
const key = documentGPTConfig.get("key");
const prompt = documentGPTConfig.get("prompt");

let jsonObj = [
	{
		"role": "system",
		"content": "请以markdown的形式返回答案"
	}
];

let customObj = [
	{
		"role": "system",
		"content": "请以markdown的形式返回答案"
	},
	{
		"role": "user",
		"content": prompt
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
	const initConversation = vscode.commands.registerCommand("documentGPT.input", async function () {
		if (activeEditor) {
			const { document, selection } = activeEditor;
			const selectedText = document.getText(selection);
			console.log("selectedText: " + selectedText);
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
					processUserMessage(userMessage, "0");
					chatGptRequest(jsonObj, "0");
				}
			} else {
				processUserMessage(selectedText, "0");
				chatGptRequest(jsonObj, "0");
			}
		} else {
			console.log("没有识别到选中的内容");
		}
	});

	/**
	 * 处理定制提示
	 */
	const customConversation = vscode.commands.registerCommand("documentGPT.custom", async function () {
		if (activeEditor) {
			const { document, selection } = activeEditor;
			const selectedText = document.getText(selection);
			console.log("selectedText: " + selectedText);
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
					processUserMessage(userMessage, "1");
					chatGptRequest(customObj, "1");
				}
			} else {
				processUserMessage(selectedText, "1");
				chatGptRequest(customObj, "1");
			}
		} else {
			console.log("没有识别到选中的内容");
		}
	});

	/**
	 * 清除会话
	 */
	const clearConversation = vscode.commands.registerCommand("documentGPT.clear", function () {
		jsonObj.splice(1); // 删除对象索引1之后的数据
		customObj.splice(2);
		console.log("clear: " + JSON.stringify(jsonObj));
		console.log("clear: " + JSON.stringify(customObj));
		vscode.window.showInformationMessage("documentGPT会话已清除!");
	});

	context.subscriptions.push(initConversation, clearConversation, customConversation);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log("documentGPT已被停用!");
	vscode.window.showInformationMessage("documentGPT已被停用!");
}

/**
 * 文本输入
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
		await editor.edit(editorEdit => { 
			const lastLine = doc.lineAt(doc.lineCount - 1);
			console.log("最后一行: " + JSON.stringify(lastLine));
			// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
			editorEdit.insert(lastLine.range.end, `\n${message}`);
		});
		console.log("文本插入成功");
	} catch (err) {
		console.error("文本插入错误: " + err);
	}
}


/**
 * GTP请求
 * @param {*} messages 
 * @param {*} isPublicMessage 0为公共prompt
 */
async function chatGptRequest(messages, isPublicMessage) {
	try {
		const res = await axios.post(url, {
			messages: messages,
			model: "gpt-3.5-turbo"
		}, {
			params: {
				key: key
			}
		});

		const robotMessage = res.data.choices[0].text;
		const answer = "🤖: " + robotMessage;
		textInput(activeEditor.document.uri, answer);

		const assistant = {
			role: "assistant",
			content: robotMessage
		};

		if (isPublicMessage === "0") {
			jsonObj.push(assistant);
			console.log("assistant: " + JSON.stringify(jsonObj));
		} else {
			customObj.push(assistant);
			console.log("assistant: " + JSON.stringify(customObj));
		}
	} catch (err) {
		console.error("系统异常: " + err);
	}
}


/**
 * 报文拼装
 * @param {*} userMessage 
 * @param {*} isPublicMessage 0为公共prompt
 */
function processUserMessage(userMessage, isPublicMessage) {
	const user = {
		role: "user",
		content: userMessage
	};
	if (isPublicMessage === "0") {
		jsonObj.push(user);
		console.log("user: " + JSON.stringify(jsonObj));
	} else {
		customObj.push(user);
		console.log("user: " + JSON.stringify(customObj));
	}
}


module.exports = {
	activate,
	deactivate
};
