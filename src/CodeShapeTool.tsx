import { BaseBoxShapeTool, TLPointerEventInfo } from 'tldraw'
export class CodeShapeTool extends BaseBoxShapeTool {
	static override id = 'code'
	static override initial = 'idle'
	override shapeType = 'code'

	//@todo: enter key should quit editing
    onPointerDown = (info: TLPointerEventInfo) => {
		console.log('tool pointerdown event info', info)
	}
}