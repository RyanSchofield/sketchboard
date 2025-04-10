import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { getClientID, collab } from "@codemirror/collab";
import { oneDark } from "@codemirror/theme-one-dark";

import * as React from "react";

import { PythonKernel } from "./python-kernel";
import { EditorState, StateEffect, StateEffectType, StateField } from "@codemirror/state";

export default class Codecell extends React.Component<
  {
    code: string;
    version: string;
    editing: boolean;
    onMount?: () => void;
    onUpdate?: (obj: any) => void;
  },
  {
    kind: "ready" | "running" | "re-runnable";
    output: { type: string; line: string }[];
  }
> {
  codeMirror: EditorView | null = null;
  editor: React.RefObject<HTMLDivElement> = React.createRef();
  outputRef: React.RefObject<HTMLPreElement> = React.createRef();

  running: boolean;
  mounted: boolean;
  editing: boolean;

  kernel: PythonKernel;

  events = new EventTarget();

  toggleReadOnly: StateEffectType<boolean>;
  readOnlyField: StateField<boolean>;

  constructor(props) {
    super(props);
    this.kernel = new PythonKernel;
    this.state = {
      kind: "ready",
      output: [],
    };

    this.running = false;
    this.mounted = false;
    this.editing = !!props.editing;
    console.log('editing?', this.editing)

    this.events.addEventListener("worker-restarted", () => {
      this.setState({ kind: "ready", output: [] });
    });

    this.toggleReadOnly = StateEffect.define<boolean>();

    // Define a field that tracks read-only state
    this.readOnlyField = StateField.define({
      create() {
        return true;
      },
      update: (value, tr) => {
        console.log('returning passed in value for update', value)
        return !this.props.editing;
      },
      provide: f => EditorState.readOnly.from(f, v => v)
    });
  }

  render() {
    return (
      <div className="cell-editor">

        <div
          style={{
            height: "auto",
            overflowY: "hidden",
            opacity: "1",
            transition: "opacity 0.2s ease 0s",
          }}
        >
          <div ref={this.editor}></div>
          {this.state.output.length > 0 ? (
            <div>
              <pre ref={this.outputRef} className="snippet-output">
                {this.state.output.map((output, i) => (
                  <div className={"output-" + output.type} key={i}>
                    {output.line}
                  </div>
                ))}
              </pre>
            </div>
          ) : null}

          <div
            className={
              "run-bar run-bar-" +
              (this.state.kind === "running" ? "running" : "ready")
            }
            onClick={() => this.run(this.codeMirror!.state.doc.toString())}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {this.state.kind === "ready" ? (
              <div>
                <i className="fa-solid fa-play"></i> RUN
              </div>
            ) : null}
            {this.state.kind === "re-runnable" ? (
              <div>
                <i className="fa-solid fa-arrows-rotate"></i> RE-RUN
              </div>
            ) : null}
            {this.state.kind === "running" ? (
              <img
                style={{
                  height: "0.8em",
                  margin: "0px",
                }}
                src={`three-dots.svg`}
              ></img>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.mounted = true;
    
    // console.log('didMount')
    

    const extensions = [
      history(),
      lineNumbers(),
      oneDark,
      collab(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      this.readOnlyField
    ];

    const syntaxHighlighter = this.kernel.getSyntaxHighlighter();
    if (syntaxHighlighter) {
      extensions.push(syntaxHighlighter);
    }


    if (this.props.onUpdate) {
        let updateListener = EditorView.updateListener.of(this.props.onUpdate)
        extensions.push(updateListener)
    }
    
    this.codeMirror = new EditorView({
      parent: this.editor.current!,
      doc: this.props.code,
      extensions: extensions,
    });

    if (this.props.onMount) {
      this.props.onMount();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.output.length > prevState.output.length) {
      this.outputRef.current!.scrollTop = this.outputRef.current!.scrollHeight;
    }

    if (this.props.editing != prevProps.editing) {
        console.log('toggle editing, readonly?', !this.props.editing)
        this.codeMirror?.dispatch({
            effects: [this.toggleReadOnly.of(!this.props.editing)]
        })
    }

    if (!this.codeMirror) return;

    let myId = getClientID(this.codeMirror.state);
    if (myId != this.props.version) {
        this.codeMirror.dispatch({changes: {
            from: 0,
            to: this.codeMirror.state.doc.length,
            insert: this.props.code
          }})
    }
  }

  async run(code) {
    console.log('code already running?', !!this.running)
    if (this.running) return;

    console.log("Running snippet...");
    this.running = true;

    if (this.mounted) {
      this.setState({ kind: "running", output: [] });
    } else {
      // @ts-ignore
      this.state.kind = "running";
      // @ts-ignore
      this.state.output = [];
    }

    const minimumWait = new Promise<void>((resolve, reject) => {
      setTimeout(() => resolve(), 500);
    });

    // Run the code.
    await this.kernel.run(code, (line) => {
      this.setState((state) => {
        return {
          output: [...state.output, line],
        };
      });
    });

    // Wait the minimum amount of run-time.
    await minimumWait;

    // Mark as not running.
    this.running = false;

    this.setState({ kind: "re-runnable" });
    if (this.state.output.length === 0) {
      this.setState({ output: [{ type: "log", line: "Done." }] });
    }
  }
}