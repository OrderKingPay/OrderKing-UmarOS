import { Project } from 'ts-morph';

export function renameVariable(filePath: string, oldName: string, newName: string): void {
  const project = new Project();
  project.addSourceFileAtPath(filePath);
  const sourceFile = project.getSourceFileOrThrow(filePath);
  
  const varDecl = sourceFile.getVariableDeclaration(oldName);
  if (varDecl) {
    varDecl.rename(newName);
  }
  
  sourceFile.saveSync();
}

export function addImport(filePath: string, moduleSpecifier: string, namedExport: string): void {
  const project = new Project();
  project.addSourceFileAtPath(filePath);
  const sourceFile = project.getSourceFileOrThrow(filePath);
  
  const importDecl = sourceFile.getImportDeclaration(moduleSpecifier);
  if (importDecl) {
    const hasNamed = importDecl.getNamedImports().some(n => n.getName() === namedExport);
    if (!hasNamed) {
      importDecl.addNamedImport(namedExport);
    }
  } else {
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: [{ name: namedExport }]
    });
  }
  
  sourceFile.saveSync();
}
