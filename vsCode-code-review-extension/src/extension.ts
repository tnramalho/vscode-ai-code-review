import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('claude-ai-code-review.codeReview', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const code = editor.document.getText(editor.selection);
            sendCodeReviewRequest(code);
        }
    });

    let submitFileDisposable = vscode.commands.registerCommand('claude-ai-code-review.codeReviewFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const code = editor.document.getText();
            sendCodeReviewRequest(code);
        }
    });

    let submitProjectDisposable = vscode.commands.registerCommand('claude-ai-code-review.codeReviewProject', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const code = getCodeFromProject(workspaceFolders[0].uri.fsPath);
            sendCodeReviewRequest(code);
        }
    });

    context.subscriptions.push(disposable, submitFileDisposable);
}

function getCodeFromProject(folderPath: string): string {
    const excludedFolders = ['node_modules', 'dist', '.vscode', '.git', '.husky'];
    let code = '';

    const processFile = (filePath: string) => {
        const fileExtension = path.extname(filePath);
        if (fileExtension === '.tsx' || fileExtension === '.js' || fileExtension === '.ts' || fileExtension === '.json') {
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            code += fileContent + '\n\n';
        }
    };

    const processFolder = (folderPath: string) => {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileStats = fs.statSync(filePath);

            if (fileStats.isDirectory()) {
                if (!excludedFolders.includes(file)) {
                    processFolder(filePath);
                }
            } else {
                processFile(filePath);
            }
        }
    };

    processFolder(folderPath);
    
    return code;
}

function sendCodeReviewRequest(code: string) {
    const requestBody = JSON.stringify({
        codeAsContext: code,
        codeToReview: ''
    });

    const options = {
        host: 'localhost',
        port: 3001,
        path: '/claude-api/code-review',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestBody.length.toString()
        },
        timeout: 60000 
    };

    const request = http.request(options, (response) => {
        let responseBody = '';
        response.on('data', (chunk) => {
            responseBody += chunk;
        });
        response.on('end', () => {
            if (response.statusCode && 
                response.statusCode >= 200 && 
                response.statusCode < 300 ) {
                try {
                    const jsonResponse = JSON.parse(responseBody);
                    showCodeReviewResponse(jsonResponse.data);
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to parse the response from the API.');
                }
            } else {
                console.error(' error >>', response);
                vscode.window.showErrorMessage(`Request failed with status code ${response.statusCode}`);
            }
        });
    });

    request.on('error', (error) => {
        vscode.window.showErrorMessage(`Failed to send the code review request: ${error.message}`);
    });

    request.write(requestBody);
    request.end();
}
function showCodeReviewResponse(response: string) {
    const panel = vscode.window.createWebviewPanel(
        'codeReviewPanel',
        'Code Review Response',
        vscode.ViewColumn.Beside,
        {}
    );

    // Load the HTML content for the webview
    panel.webview.html = getWebviewContent(response);
}

function getWebviewContent(response: string) {
    const formattedResponse = response.replace(/\n\n/g, '<br>').trim();

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    line-height: 1.4;
                }
                
                pre {
                    white-space: pre-wrap;
                    word-break: break-all;
                }
            </style>
        </head>
        <body>
            <h1>Code Review Response:</h1>
            <pre>${formattedResponse}</pre>
        </body>
        </html>
    `;
}
