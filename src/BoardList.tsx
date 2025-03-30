import { useState, useEffect } from "react";

export default function BoardList(props) {
	const url = `${props.host}/list`;

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
		  <h1>Boards:</h1>
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