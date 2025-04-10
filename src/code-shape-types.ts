import { TLBaseShape } from 'tldraw'

// A type for our custom KaTeX shape
export type ICodeShape = TLBaseShape<
	'code',
	{
		w: number
		h: number
        text: string,
        version: string
	}
>