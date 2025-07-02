import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
	const { GoogleGenAI } = await import("@google/genai");	

	const ai = new GoogleGenAI({
		apiKey: process.env.GOOGLE_API_KEY || ''
	});

	const disposable = vscode.commands.registerCommand('dype.dypeCode', async () => {
		const document = vscode.window.activeTextEditor?.document;
		if (!document) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}
		vscode.window.showInformationMessage(`${JSON.stringify(document)}`);
		const textFile = document.getText();

		const prompt = `
			You are an expert ${document.languageId} coach.
			Analyze this ${document.languageId} file and insert short inline comments at only key spots where errors lie or need advice.
			Return ONLY the full ${document.languageId} source—no markdown fences, no extra explanation.

			FILE START
			${textFile}
			FILE END
			`;


		try {
			vscode.window.showInformationMessage("Analyzing the code...");
			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: prompt,
			});

			vscode.window.activeTextEditor.edit(editBuilder => {
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                editBuilder.replace(fullRange, response.text || document.getText());
            }).then(success => {
                if (success) {
                    vscode.window.showInformationMessage('Document updated successfully!');
                } else {
                    vscode.window.showErrorMessage('Failed to update the document.');
                }
            });

		}catch (error) {
			vscode.window.showErrorMessage('Error analyzing the code: ' + error);
			return;
		} finally {
			vscode.window.showInformationMessage("Analysis complete.");
		}
		
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
