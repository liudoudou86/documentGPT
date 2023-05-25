const vscode = require('vscode');
const axios = require('axios').default;
// 获取当前已激活的编辑器
const { document, selection } = vscode.window.activeTextEditor;
// 读取vscode的配置项：documentGPT.key
const documentGPTConfig = vscode.workspace.getConfiguration('documentGPT');
const key = documentGPTConfig.get('key');
const url = documentGPTConfig.get('url');

var jsonArray = [
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

	console.log('documentGPT已被激活!');
	// 通过vscode指令进行激活
	let disposable = vscode.commands.registerCommand('documentGPT.input', function () {
		// vscode.window.showInformationMessage('documentGPT已被激活!');
		// 弹出输入窗口
		vscode.window.showInputBox({
					password: false,
					ignoreFocusOut: true,
					placeHolder: '你想问什么?',
					// validateInput: function(text){return text;}
			}).then(function(question){
				// console.log("用户问题: " + question);
				inputUserQuestion(document.uri, question);
				var user = {};
				user.role = 'user';
				user.content = question;
				jsonArray.push(user);
				console.log(jsonArray);
				chatGptRequest(jsonArray);
			});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log('documentGPT已被停用!');
	vscode.window.showInformationMessage('documentGPT已被停用!');
}

// 修改在VSCode编辑器中打开的文档内容并且继续展示
function inputUserQuestion(filePath, message) {
	// 获取 vscode.TextDocument对象
	vscode.workspace.openTextDocument(filePath).then(doc => {
			// 获取 vscode.TextEditor对象
			vscode.window.showTextDocument(doc).then(editor => {
					// 获取 vscode.TextEditorEdit对象， 然后进行字符处理
					editor.edit(editorEdit => {
							// 读取末尾行
							const number = doc.lineAt(doc.lineCount - 1);
							const lastLine = number['a'];
							// console.log('最后一行: ' + lastLine);
							// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
							editorEdit.insert(new vscode.Position(lastLine, 0), "👦: " + message + "  \r\n");
					}).then(isSuccess => {
							if (isSuccess) {
									console.log("插入成功");
							} else {
									console.log("插入失败");
							}
					}, err => {
							console.error("插入错误: , " + err);
					});
			});
	}).then(undefined, err => {
			console.error(err);
	});
}

// 修改在VSCode编辑器中打开的文档内容并且继续展示
function inputSystemAnswer(filePath, message) {
	// 获取 vscode.TextDocument对象
	vscode.workspace.openTextDocument(filePath).then(doc => {
			// 获取 vscode.TextEditor对象
			vscode.window.showTextDocument(doc).then(editor => {
					// 获取 vscode.TextEditorEdit对象， 然后进行字符处理
					editor.edit(editorEdit => {
							// 读取末尾行
							const number = doc.lineAt(doc.lineCount - 1);
							const lastLine = number['a'];
							// console.log('最后一行: ' + lastLine);
							// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
							editorEdit.insert(new vscode.Position(lastLine, 0), "🤖: " + message + "  \r\n");
					}).then(isSuccess => {
							if (isSuccess) {
									console.log("插入成功");
							} else {
									console.log("插入失败");
							}
					}, err => {
							console.error("插入错误: " + err);
					});
			});
	}).then(undefined, err => {
			console.error(err);
	});
}

function chatGptRequest(messages) {
	axios({
		method: 'post',
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
		let answer = res.data.choices[0].text
		// console.log("系统回答: " + answer);
		inputSystemAnswer(document.uri, answer);
		var assistant = {};
		assistant.role = 'assistant';
		assistant.content = answer;
		jsonArray.push(assistant);
		console.log(jsonArray);
	})
	.catch(function (err) {
		console.log("请求错误: " + err);
		inputSystemAnswer(document.uri, "网络错误 - " + err);
	});
}

module.exports = {
	activate,
	deactivate
}
