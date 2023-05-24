const vscode = require('vscode');
const axios = require('axios').default;
// 获取当前已激活的编辑器
const { document, selection } = vscode.window.activeTextEditor;
const key = 'FCYLFSDJ47RHP9JG2N';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('documentGPT已被激活!');
	// 通过vscode指令进行激活
	let disposable = vscode.commands.registerCommand('documentGPT.input', function () {
		// 弹出输入窗口
		vscode.window.showInputBox({
					password: false,
					ignoreFocusOut: true,
					placeHolder: '你想问什么?',
					// validateInput: function(text){return text;}
			}).then(function(question){
				console.log("用户问题: " + question);
				inputUserQuestion(document.uri, question)
				chatGptRequest(question)
			});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {
	console.log('document已被停用!');
}

// 修改在VSCode编辑器中打开的文档内容并且继续展示
function inputUserQuestion(filePath, message) {
	// 获取 vscode.TextDocument对象
	vscode.workspace.openTextDocument(filePath).then(doc => {
			// 获取 vscode.TextEditor对象
			vscode.window.showTextDocument(doc).then(editor => {
					// 获取 vscode.TextEditorEdit对象， 然后进行字符处理
					editor.edit(editorEdit => {
							// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
							editorEdit.insert(new vscode.Position(0, 0), "👦 Question: " + message + "\r\n");
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
							// 这里可以做以下操作: 删除, 插入, 替换, 设置换行符
							editorEdit.insert(new vscode.Position(1, 0), "🤖 Answer: " + message + "\r\n");
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

function chatGptRequest(text) {
	axios({
		method: 'post',
		url: 'https://api.aigcfun.com/api/v1/text',
		params: {
			key: key
		},
		data: {
			"messages": [
				{
					"role": "system",
					"content": "请以markdown的形式返回答案"
				},
				{
					"role": "user",
					"content": text
				}
			],
			"tokensLength": 55,
			"model": "gpt-3.5-turbo"
		},
	})
	.then(function (res) {
		let answer = res.data.choices[0].text
		console.log("系统回答: " + answer);
		inputSystemAnswer(document.uri, answer)
	})
	.catch(function (err) {
		console.log(err);
	});
}

module.exports = {
	activate,
	deactivate
}
