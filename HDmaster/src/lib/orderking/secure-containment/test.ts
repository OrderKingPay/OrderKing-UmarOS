import { SecureContainment } from './index';
import { EventEmitter } from 'events';

class SimulatedStream extends EventEmitter {
    constructor() {
        super();
    }
}

class SimulatedDocker {
    modem = {
        demuxStream: (stream: any, stdout: any, stderr: any) => {
            stdout.write(Buffer.from("Hello from inside Docker!\n"));
            stderr.write(Buffer.from("Error stream test\n"));
        }
    };

    async createContainer(options: any) {
        return {
            start: async () => {},
            logs: async () => {
                const stream = new SimulatedStream();
                setTimeout(() => stream.emit('end'), 50);
                return stream;
            },
            wait: async () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({ StatusCode: 0 }), 50);
                });
            },
            remove: async () => {}
        };
    }
}

class SimulatedDockerTimeout {
    modem = {
        demuxStream: (stream: any, stdout: any, stderr: any) => {}
    };

    async createContainer(options: any) {
        return {
            start: async () => {},
            logs: async () => {
                const stream = new SimulatedStream();
                return stream; // never ends
            },
            wait: async () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve({ StatusCode: 0 }), 5000); // Wait 5s
                });
            },
            remove: async () => {}
        };
    }
}

async function runTest() {
    console.log('Testing normal execution (mocked Docker)...');
    let containment = new SecureContainment(new SimulatedDocker());
    const result = await containment.runInContainer({
        code: `console.log("Hello from inside Docker!"); console.error("Error stream test");`,
        timeoutMs: 10000
    });
    console.log('Normal Execution Result:', result);

    console.log('\\nTesting timeout (mocked Docker)...');
    let timeoutContainment = new SecureContainment(new SimulatedDockerTimeout());
    try {
        await timeoutContainment.runInContainer({
            code: `setTimeout(() => console.log('This should not print'), 10000);`,
            timeoutMs: 100 // 100ms timeout
        });
        console.log('Timeout test failed: expected an error.');
    } catch (e: any) {
        console.log('Timeout test caught expected error:', e.message);
    }
}

runTest().catch(console.error);
