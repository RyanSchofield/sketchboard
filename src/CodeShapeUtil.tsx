import {
	HTMLContainer,
	Rectangle2d,
	ShapeUtil,
	TLResizeInfo,
	resizeBox
} from 'tldraw'
import { codeShapeProps } from './code-shape-props'
import { ICodeShape } from './code-shape-types'
import Codecell from './Codecell'
import { getClientID } from "@codemirror/collab";


export class CodeShapeUtil extends ShapeUtil<ICodeShape> {
	static override type = 'code' as const
	static override props = codeShapeProps

    override canEdit = () => true
	override canResize = () => true
	override isAspectRatioLocked = () => false

	getDefaultProps(): ICodeShape['props'] {
        return {
			w: 600,
			h: 200,
            text: 'print("hello world")',
            version: ''
		}
	}

	getGeometry(shape: ICodeShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

    component(shape: ICodeShape) {
		const isEditing = this.editor.getEditingShapeId() === shape.id
        console.log('code shape component call', shape)

        const updateHandler = (update) => {
            console.log('updateHandler called')
            if (update.docChanged) {
                this.editor.updateShape({
                    id: shape.id,
                    type: shape.type,
                    props: {
                        text: update.state.doc.toString(),
                        version: getClientID(update.state)
                    }
                })
            }
        } 

        return (
            <HTMLContainer 
                id={shape.id} 
                style={{
					pointerEvents: 'all',
				}}
            >
                <Codecell 
                    code={shape.props.text}
                    editing={isEditing}
                    version={shape.props.version}
                    onUpdate={updateHandler}
                ></Codecell>
            </HTMLContainer>
        )
	}

	indicator(shape: ICodeShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}

	override onResize = (shape: ICodeShape, info: TLResizeInfo<ICodeShape>) => {
		return resizeBox(shape, info)
	}
}