export class AstParser {
  /**
   * Replaces a specific function implementation in a file content using regex.
   * This is a lightweight Regex-based implementation as requested.
   */
  replaceFunction(fileContent: string, functionName: string, newImplementation: string): string {
    // Matches standard function definitions: function foo(...) { ... }
    const functionRegex = new RegExp(`(function\\s+${functionName}\\s*\\([^{]*\\)\\s*\\{)[^}]*(\\})`, 'g');
    
    // Matches arrow functions or assignments: const foo = (...) => { ... }
    const arrowRegex = new RegExp(`(const|let|var)\\s+${functionName}\\s*=\\s*\\([^{]*\\)\\s*=>\\s*\\{([^}]*)\\}`, 'g');
    
    // Matches class methods: foo(...) { ... }
    const methodRegex = new RegExp(`(\\b${functionName}\\s*\\([^{]*\\)\\s*\\{)[^}]*(\\})`, 'g');

    let updatedContent = fileContent;

    if (functionRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(functionRegex, `$1\n${newImplementation}\n$2`);
    } else if (arrowRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(arrowRegex, `$1 ${functionName} = () => {\n${newImplementation}\n}`);
    } else if (methodRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(methodRegex, `$1\n${newImplementation}\n$2`);
    } else {
      throw new Error(`Function '${functionName}' not found or could not be reliably parsed.`);
    }

    return updatedContent;
  }
}
