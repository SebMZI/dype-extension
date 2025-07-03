import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

dotenv.config();  

const maxToken = 60; 
let token: number = maxToken; 

export async function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('dype');
	let model = config.get<string>('model');
	let apiKey = config.get<string>('apiKey');

	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('dype')) {
			model = vscode.workspace.getConfiguration('dype').get<string>('model');
			apiKey = vscode.workspace.getConfiguration('dype').get<string>('apiKey');
		}
	});

	const { GoogleGenAI } = await import("@google/genai");	

	if (!apiKey) {
		vscode.window.showErrorMessage('GOOGLE_API_KEY is not set in the environment variables. Please set it to use this extension.');
		return;
	}

	const ai = new GoogleGenAI({
		apiKey: apiKey || process.env.GOOGLE_API_KEY,
	});

	const disposable = vscode.commands.registerCommand('dype.dypeCode', async () => {
		if (token < 10) {
			vscode.window.showErrorMessage('You have reached the maximum number of requests. Please wait for 30 seconds before trying again.');
			return;
		}

		token -= 10;

		//vscode.window.showInformationMessage(`Tokens: ${token}/${maxToken}`);
		const editor = vscode.window.activeTextEditor;
		
		const document = editor?.document;
		const selection = editor?.selection;

		if (!document) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}

		let range: vscode.Range;

		if (selection && !selection.isEmpty) { 
			const start = new vscode.Position(selection.start.line, 0); 
			const endLine = selection.end.line; 
			const endChar = document.lineAt(endLine).text.length; 
			const end   = new vscode.Position(endLine, endChar);
			range = new vscode.Range(start, end);
		} else {
			const lastLine = document.lineCount - 1;
			range = new vscode.Range(
			new vscode.Position(0, 0),
			new vscode.Position(lastLine, document.lineAt(lastLine).text.length)
			);
		}

		const textFile = document.getText(range);

		const prompt = `
			You are an expert ${document.languageId} coach.
			Analyze this ${document.languageId} file and insert short inline comments at only key spots where errors lie or need advice.
			Return ONLY and ONLY the full ${document.languageId} source—no markdown fences, no extra explanation and respect indentation.

			FILE START
			${textFile}
			FILE END
		`;

		let success: boolean = false;

		try {
			vscode.window.showInformationMessage("Analyzing the code...");
			const response = await ai.models.generateContent({
				model: `${model || "gemini-2.5-flash"}`,
				contents: prompt, 
			});

			vscode.window.activeTextEditor?.edit(editBuilder => { 
				if (!response.text){
					vscode.window.showErrorMessage('No response text received from the AI model.');
					return;
				}
				editBuilder.replace(range, response.text);
            }).then(success => {
                if (success) {
                    vscode.window.showInformationMessage('Document updated successfully!');
                } else {
                    vscode.window.showErrorMessage('Failed to update the document.');
                }
            });
			success = true;
		}catch (error) {
			success = false;
			vscode.window.showErrorMessage('Error analyzing the code: ' + error); // Consider narrowing the type of 'error' (e.g., instanceof Error) for more specific error messages.
			return;
		} finally {
			vscode.window.showInformationMessage(`Analyzis ${success ? 'completed' : 'failed'}.`); 
			setTimeout(() => {
				if (token <= maxToken){
					token += 10;
				}
			}, 30000);
		}
		
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}