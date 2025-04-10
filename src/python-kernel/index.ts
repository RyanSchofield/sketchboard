// @ts-ignore - Load worker source code.
// import WORKER_SRC from "!raw-loader!ts-loader!./worker.ts";
// import WORKER_SRC from "!raw-loader!ts-loader!./worker.ts";

// const blob = new Blob([WORKER_SRC], { type: "application/javascript" });

import { python } from "@codemirror/lang-python";
import { Kernel, OutputLine } from "../codeblock-kernel";

export class PythonKernel extends Kernel {
    // worker: Worker = new Worker(URL.createObjectURL(blob));
    worker = new Worker(new URL("./worker.ts", import.meta.url))

    run(code: string, onOutput: (line: OutputLine) => void) {
        // Generate a unique ID to track this execution request.
        const requestID = this.getRequestID();


        return new Promise<void>((resolve) => {
            const messageHandler = (e: MessageEvent) => {
                if (e.data.requestID != requestID) return;
    
                if (e.data.kind === "run-code-output") {
                    onOutput(e.data.output);
                } else if (e.data.kind === "run-code-done") {
                    this.worker.removeEventListener("message", messageHandler);
                    resolve();
                }
            };
    
            this.worker.addEventListener("message", messageHandler);
    
            // Post the code to the worker.
            this.worker.postMessage({
                kind: "run-code",
                code: code,
                requestID: requestID,
            });
            // console.log('run')
        });
    }


    getSyntaxHighlighter() {
        return python();
    }
}