import { RecordProps, T } from 'tldraw'
import { ICardShape } from './card-shape-types'

// Validation for our KaTeX shape's props
export const cardShapeProps: RecordProps<ICardShape> = {
	w: T.number,
	h: T.number,
    text: T.string
}