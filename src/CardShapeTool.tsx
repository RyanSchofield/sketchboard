import { BaseBoxShapeTool } from 'tldraw'
export class CardShapeTool extends BaseBoxShapeTool {
	static override id = 'card'
	static override initial = 'idle'
	override shapeType = 'card'

	//@todo: enter key should quit editing
}