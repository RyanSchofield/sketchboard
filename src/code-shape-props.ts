import { RecordProps, T } from 'tldraw'
import { ICodeShape } from './code-shape-types'

export const codeShapeProps: RecordProps<ICodeShape> = {
	w: T.number,
	h: T.number,
    text: T.string,
    version: T.string,
}