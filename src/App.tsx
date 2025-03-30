import { uniqueId } from "tldraw";
import Board from "./Board";
import BoardList from "./BoardList";
import React, { useState } from "react";

type RoomSwitcherProps = {handler: (number) => void}

const HOST = location.origin;

class RoomSwitcher extends React.Component<RoomSwitcherProps> {
	public state: {inputValue: string}
	public handler: (id: number) => void

	constructor(props) {
		super(props)
		this.state = {inputValue: ""}
		this.handler = props.handler
	}

	reset() { this.state = {inputValue: ""} }

	updateValue(event) {
		this.setState({inputValue: event.target.value})
	}

	handleClick() {
		this.handler(Number(this.state.inputValue))
	}


	render() {
		return (
			<div>
				<div> Room ID: </div>
				<input value={this.state.inputValue} onChange={this.updateValue.bind(this)}></input>
				<button onClick={this.handleClick.bind(this)}>confirm</button>
			</div> 
		)
	}
}

function NewBoard(props) {
	const [title, setTitle] = useState("");

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!title) return;
		alert(`Creating new board: ${title}`)
		props.handler(title)
		setTitle("")
	}

	return (
		<form onSubmit={handleSubmit}>
		<div>Enter title for new board:</div>
		<br/>
		<input 
			type="text" 
			value={title}
			onChange={(e) => setTitle(e.target.value)}
		/>
		<input type="submit" />
		</form>
	)
}

class App extends React.Component {

	public state: {currentRoom: number, updateKey: string}

	constructor(props) {
		super(props)
		this.state = {currentRoom: 0, updateKey: uniqueId()}
	}

	async newRoom(title: string) {
		if (!title) return;

		const url = `${HOST}/new`;
		try {
			const requestOpts = { 
				method: "PUT", 
				body: JSON.stringify({title})
			};
			const response = await fetch(url, requestOpts);
			if (!response.ok) {
				throw new Error(`new room HTTP error! status: ${response.status}`);
			}

			setTimeout(() => this.refresh(), 100);
		} catch (e) {
			console.log('new room error', e)
		}
	}

	refresh() {
		// change key prop to trigger board list reload. 
		const newState = {
			currentRoom: this.state.currentRoom, 
			updateKey: uniqueId()
		};

		this.setState(newState);
	}

	changeRoom(id: number) {
		this.setState({currentRoom: id})
	}

	reset() {
		this.state = {currentRoom: 0, updateKey: uniqueId()}
	}

	render() {
		if (this.state.currentRoom < 1) 
			return (
				<div>
					<NewBoard handler={this.newRoom.bind(this)}/>
					{/* @todo: implement debug mode */}
					{/* <RoomSwitcher handler={this.changeRoom.bind(this)} /> */}
					<BoardList 
						handler={this.changeRoom.bind(this)}  
						host={HOST}
						key={this.state.updateKey} 
					/>
				</div>
			);
		
		return (
			<Board 
				handler={this.changeRoom.bind(this)} 
				roomId={this.state.currentRoom} 
			/>
		);
	}
}


export default App;
