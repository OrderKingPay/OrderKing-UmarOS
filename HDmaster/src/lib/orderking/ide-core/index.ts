export * from './file-manager';
export * from './terminal-executor';
export * from './ast-parser';

import { FileManager } from './file-manager';
import { TerminalExecutor } from './terminal-executor';
import { AstParser } from './ast-parser';

export const ideCore = {
  file: new FileManager(),
  terminal: new TerminalExecutor(),
  parser: new AstParser(),
};
