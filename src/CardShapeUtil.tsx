import {
	HTMLContainer,
	Rectangle2d,
	ShapeUtil,
	TLResizeInfo,
	resizeBox,
    stopEventPropagation
} from 'tldraw'
import { cardShapeProps } from './card-shape-props'
import { ICardShape } from './card-shape-types'
import katex from 'katex'


export class CardShapeUtil extends ShapeUtil<ICardShape> {
	static override type = 'card' as const
	static override props = cardShapeProps

    override canEdit = () => true
	override canResize = () => true
	override isAspectRatioLocked = () => true

	getDefaultProps(): ICardShape['props'] {
        return {
			w: 200,
			h: 45,
			text: "\\sin^2\\theta+\\cos^2\\theta=1",
		}
	}

	getGeometry(shape: ICardShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

    component(shape: ICardShape) {
		const isEditing = this.editor.getEditingShapeId() === shape.id

        let renderedHtml = {__html: katex.renderToString(shape.props.text, {
            throwOnError: false,
            output: "mathml",
            displayMode: true
        })}

		const parentPadding = 5

		return (
			<HTMLContainer
				id={shape.id}
				onPointerDown={isEditing ? stopEventPropagation : undefined}
				style={{
					pointerEvents: isEditing ? 'all' : 'none',
					paddingTop: parentPadding + "px",
				}}
			>
                <div style={{containerType: 'size'}}>
                    <div
                        style={{
                            margin: 0,
                            padding: "5px",
                            fontSize: "10cqw",
                            textAlign: "center"
                        }}
                        dangerouslySetInnerHTML={renderedHtml}/>
                    {isEditing &&
                        <textarea 
                            style={{
                                margin: 0,
                                marginTop: "8%",
                                padding: "5px",
                                paddingTop: "10px",
                                position: "absolute",
                                backgroundColor: "rgba(82, 78, 183, 0.2)",
                                color: "currentColor",
                                width: "120%",
                                height: "100%",
                                fontSize: "6cqw",
                                border: "none",
                                fontFamily: "monospace"
                            }}
                            onChange={(event)=>{
                                const text = event.target.value;
                                const parent = event.target.parentNode! as HTMLElement;
                                const formula = parent.children[0] as HTMLElement;
                                const h = formula.scrollHeight + parentPadding;
                                const w = formula.scrollWidth;
                                this.editor.updateShape({
                                    id: shape.id,
                                    type: shape.type,
                                    props: {
                                        ...shape.props,
                                        text: text,
                                        h: h,
                                        w: w
                                    },
                                })
                            }}
                            value={shape.props.text}
                        />
                    }
                </div>
			</HTMLContainer>
		)
	}

	indicator(shape: ICardShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}

	override onResize = (shape: ICardShape, info: TLResizeInfo<ICardShape>) => {
		return resizeBox(shape, info)
	}
}