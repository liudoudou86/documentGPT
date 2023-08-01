const vscode = require("vscode");
const axios = require("axios").default;
// 获取当前已激活的编辑器
const activeEditor = vscode.window.activeTextEditor;
// 读取vscode的配置项: documentGPT.key
const documentGPTConfig = vscode.workspace.getConfiguration("documentGPT");
const key = documentGPTConfig.get("key");
const url = documentGPTConfig.get("url");

let jsonObj = [
	{
		"role":"system",
		"content":"请以markdown的形式返回答案"
	}
];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log("documentGPT已被激活!");
	// 通过vscode指令进行激活
	let initConversation = vscode.commands.registerCommand("documentGPT.input", async function () {
		if (activeEditor) {
			const { document, selection } = activeEditor;
			const selectedText = document.getText(selection);
			activeEditor.revealRange(selection);
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
					let question = "👦: " + userMessage;
					textInput(document.uri, question);
					let user = {
						role: "user",
						content: userMessage
					};
					jsonObj.push(user);
					console.log("user: " + JSON.stringify(jsonObj));
					chatGptRequest(jsonObj);
				}
			} else {
				// 通过识别是否有所选内容进行判断
				let user = {
					role: "user",
					content: selectedText
				};
				jsonObj.push(user);
				console.log("user: " + JSON.stringify(jsonObj));
				chatGptRequest(jsonObj);
			}
		} else {
			console.log("没有识别到选中的内容");
		}
	});

	let clearConversation = vscode.commands.registerCommand("documentGPT.clear", function () {
		jsonObj.splice(1); // 删除对象索引1之后的数据
		console.log("clear: " + JSON.stringify(jsonObj));
		vscode.window.showInformationMessage("documentGPT会话已清除!");
	});

	context.subscriptions.push(initConversation, clearConversation);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log("documentGPT已被停用!");
	vscode.window.showInformationMessage("documentGPT已被停用!");
}

/**
 * 
 * @param {*} filePath 识别起始行
 * @param {*} message 准备插入的文本内容
 */
function textInput(filePath, message) {
	// 获取 vscode.TextDocument对象
	vscode.workspace.openTextDocument(filePath).then(doc => {
		// 获取 vscode.TextEditor对象
		vscode.window.showTextDocument(doc).then(editor => {
			// 获取 vscode.TextEditorEdit对象， 然后进行字符处理
			editor.edit(editorEdit => {
				// 读取末尾行
				const number = doc.lineAt(doc.lineCount - 1);
				const lastLine = number["a"];
				// console.log('最后一行: ' + lastLine);
				// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
				editorEdit.insert(new vscode.Position(lastLine, 0), message + "  \r\n");
			}).then(isSuccess => {
				if (isSuccess) {
					console.log("文本插入成功");
				} else {
					console.log("文本插入失败");
				}
			}, err => {
				console.error("文本插入错误: " + err);
			});
		});
	}).then(undefined, err => {
		console.error(err);
	});
}


/**
 * 
 * @param {*} messages 向GPT请求的文本内容
 */
function chatGptRequest(messages) {
	axios({
		method: "post",
		url: url,
		params: {
			key: key
		},
		data: {
			"messages": messages,
			"model": "gpt-3.5-turbo"
		},
	})
		.then(function (res) {
			let robotMessage = res.data.choices[0].text;
			let answer = "🤖: " + robotMessage;
			textInput(activeEditor.document.uri, answer);
			let assistant = {
				role: "assistant",
				content: robotMessage
			};
			jsonObj.push(assistant);
			console.log("assistant: " + JSON.stringify(jsonObj));
		})
		.catch(function (err) {
			console.log("系统异常: " + err);
		});
}

module.exports = {
	activate,
	deactivate
};
