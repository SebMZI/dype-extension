import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

dotenv.config(); 

const maxToken = 60;
let token: number = maxToken; 

export async function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('dype');
	let model = config.get<string>('model');
	let apiKey = config.get<string>('apiKey');

	let ai: any; 

	const initializeGenAI = () => {
		const currentConfig = vscode.workspace.getConfiguration('dype');
		model = currentConfig.get<string>('model');
		apiKey = currentConfig.get<string>('apiKey');

		if (!apiKey) { 
			vscode.window.showErrorMessage('Google API Key is not set in extension settings. Please configure it to use this extension.');
			ai = undefined; 
			return false;
		}

		try {
			
			const { GoogleGenAI } = require("@google/genai"); 
			ai = new GoogleGenAI({
				apiKey: apiKey,
			});
			return true; 
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to initialize Google GenAI: ${error}`);
			ai = undefined;
			return false;
		}
	};

	initializeGenAI();

	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('dype')) {
			initializeGenAI();
		}
	});

	const disposable = vscode.commands.registerCommand('dype.dypeCode', async () => {
		if (!ai) { 
			vscode.window.showErrorMessage('Google GenAI model not initialized. Please ensure your API Key is set correctly.');
			return;
		}
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
				model: `${model || "gemini-pro"}`, 
				contents: [{ text: prompt }],
			});

			vscode.window.activeTextEditor?.edit(editBuilder => { 
				const responseText = response.text(); 
				if (!responseText){
					vscode.window.showErrorMessage('No response text received from the AI model.');
					return;
				}
				editBuilder.replace(range, responseText);
            }).then(success => {
                if (success) {
                    vscode.window.showInformationMessage('Document updated successfully!');
                } else {
                    vscode.window.showErrorMessage('Failed to update the document.');
                }
            });
			success = true;
		}catch (error: unknown) { 
			success = false;
			let errorMessage = 'An unknown error occurred.';
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}
			vscode.window.showErrorMessage('Error analyzing the code: ' + errorMessage);
			return;
		} finally {
			vscode.window.showInformationMessage(`Analysis ${success ? 'completed' : 'failed'}.`); 
			setTimeout(() => {
				token = Math.min(token + 10, maxToken);
			}, 30000);
		}
		
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}