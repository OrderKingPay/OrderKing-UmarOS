import vm from 'node:vm';

export function runSandboxedCode(code: string): any {
    const script = new vm.Script(code);
    const context = vm.createContext({});
    return script.runInNewContext(context, { timeout: 5000 });
}
