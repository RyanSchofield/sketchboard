import { TLBaseShape } from 'tldraw'

// A type for our custom KaTeX shape
export type ICardShape = TLBaseShape<
	'card',
	{
		w: number
		h: number
        text: string
	}
>