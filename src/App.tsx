import Board from "./Board";
import React, {useState, useEffect} from "react";

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

function BoardList(props) {
	const url = `${HOST}/list`;

	const [records, setRecords] = useState([]);
  	const [loading, setLoading] = useState(true);
  	const [error, setError] = useState(null as any);

	const handler: (id: number) => void = props.handler;

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
			  		throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				setRecords(data.records);
		  	} catch (e) {
				setError(e);
		  	} finally {
				setLoading(false);
		  	}
		};
	
		fetchData();
	  }, []);
	
	  if (loading) {
		return <p>Loading records...</p>;
	  }
	
	  if (error) {
		return <p>Error: {error.message}</p>;
	  }
	
	  return (
		<div>
		  <h1>Sessions</h1>
		  <ul>
			{records.map((record: any) => (
			  	<li key={record.jam_id}>
					<a href="javascript:;" onClick={() => handler(record.jam_id)}>
						{record.title}
					</a>
				</li> 
			))}
		  </ul>
		</div>
	  );
}

class App extends React.Component {

	public state: {currentRoom: number}

	constructor(props) {
		super(props)
		this.state = {currentRoom: 0}
	}

	changeRoom(id: number) {
		this.setState({currentRoom: id})
	}

	reset() {
		this.state = {currentRoom: 0}
	}

	render() {
		if (this.state.currentRoom < 1) 
			return (
				<div>
					<RoomSwitcher handler={this.changeRoom.bind(this)} />
					<BoardList handler={this.changeRoom.bind(this)} />
				</div>
			);
		
		return <Board roomId={this.state.currentRoom} handler={this.changeRoom.bind(this)} />
	}
}


export default App;
