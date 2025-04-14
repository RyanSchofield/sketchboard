import {
	DefaultKeyboardShortcutsDialog,
	DefaultKeyboardShortcutsDialogContent,
	DefaultToolbar,
	DefaultToolbarContent,
	TLComponents,
	TLUiOverrides,
	TldrawUiMenuItem,
	useIsToolSelected,
	useTools,
} from 'tldraw'

export const uiOverrides: TLUiOverrides = {
	tools(editor, tools) {
		// Create a tool item in the ui's context.
		tools.card = {
			id: 'card',
			icon: 'sigma-icon',
			label: 'Card',
			kbd: 'c',
			onSelect: () => {
				editor.setCurrentTool('card')
			},
		}

        tools.code = {
			id: 'code',
			icon: 'python-icon',
			label: 'Python',
			kbd: 'p',
			onSelect: () => {
				editor.setCurrentTool('code')
			},
		}

		return tools
	},
}

export const components: TLComponents = {
	Toolbar: (props) => {
		const tools = useTools()
		const isCardSelected = useIsToolSelected(tools['card'])
        const isCodeSelected = useIsToolSelected(tools['code'])
		return (
			<DefaultToolbar {...props}>
				<DefaultToolbarContent />
				<TldrawUiMenuItem {...tools['card']} isSelected={isCardSelected} />
                <TldrawUiMenuItem {...tools['code']} isSelected={isCodeSelected} />
			</DefaultToolbar>
		)
	},
	KeyboardShortcutsDialog: (props) => {
		const tools = useTools()
		return (
			<DefaultKeyboardShortcutsDialog {...props}>
				<DefaultKeyboardShortcutsDialogContent />
				<TldrawUiMenuItem {...tools['card']} />
                <TldrawUiMenuItem {...tools['code']} />
			</DefaultKeyboardShortcutsDialog>
		)
	},
}
