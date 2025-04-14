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
import React from 'react';


export class CodeShapeUtil extends ShapeUtil<ICodeShape> {
	static override type = 'code' as const
	static override props = codeShapeProps

    override canEdit = () => true
	override canResize = () => false
	override isAspectRatioLocked = () => false

	getDefaultProps(): ICodeShape['props'] {
        return {
			w: 700,
			h: 80,
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

        let outerDiv: React.RefObject<HTMLDivElement> = React.createRef();

        const updateHandler = (update) => {
            console.log('updateHandler called')
            if (update.docChanged) {
                // we could have a ref to a div containing the shape here,
                // and on update check the client height/width of the div 
                // pass these as props to the shape
                console.log('update', update)
                console.log('outerDiv', outerDiv.current)
                console.log('height', update.view.dom?.clientHeight)
                this.editor.updateShape({
                    id: shape.id,
                    type: shape.type,
                    props: {
                        text: update.state.doc.toString(),
                        version: getClientID(update.state),
                        w: update.view.dom?.clientWidth,
                        h: update.view.dom?.clientHeight + 40
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
                <div className={isEditing ? 'editing-codeblock' : ''}>
                    <Codecell 
                        code={shape.props.text}
                        editing={isEditing}
                        version={shape.props.version}
                        onUpdate={updateHandler}
                    ></Codecell>
                </div>
            </HTMLContainer>
        )
	}

	indicator(shape: ICodeShape) {
        const isEditing = this.editor.getEditingShapeId() === shape.id;
        const color = isEditing ? "#ED9C31" : ""
		return <rect width={shape.props.w} height={shape.props.h} stroke={color} />
	}

	override onResize = (shape: ICodeShape, info: TLResizeInfo<ICodeShape>) => {
		return resizeBox(shape, info)
	}
}