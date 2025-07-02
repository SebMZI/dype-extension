import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

dotenv.config(); // Consider if `dotenv` is the most robust way to manage environment variables for a VS Code extension, especially when packaged. User settings or secrets API might be better for sensitive data.

export async function activate(context: vscode.ExtensionContext) {
	console.log(process.env.GOOGLE_API_KEY ) // Good for debugging, but remove this `console.log` before publishing the extension.
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
		vscode.window.showInformationMessage(`${JSON.stringify(document)}`); // This will show the entire document object. Remove or modify for a more user-friendly message in production.
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
				contents: prompt, // The `contents` parameter typically expects an array of Parts (e.g., `[{ text: prompt }]`), not just a string directly. Check the SDK's type definition for `GenerateContentRequest`.
			});

			vscode.window.activeTextEditor && vscode.window.activeTextEditor.edit(editBuilder => { // It's good practice to re-verify `vscode.window.activeTextEditor` is not null here, even if checked earlier, if there's a possibility the editor could close between checks.
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                editBuilder.replace(fullRange, response.text || document.getText()); // If `response.text` is empty, this replaces the document with itself. Consider if this is the desired fallback behavior or if an error message would be more appropriate.
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
			vscode.window.showInformationMessage("Analysis complete."); // This message will show even if an error occurred. Consider moving this to the `then` block of the `edit` promise for success or making it conditional based on error presence.
		}
		
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}