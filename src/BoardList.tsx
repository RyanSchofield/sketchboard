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
        <div className="board-list">
            {records.map((record: any) => (
                <div 
                    key={record.jam_id} 
                    className="list-entry" 
                    onClick={() => handler(record.jam_id)}
                >
                    <span>
                        {record.title}
                    </span>
                </div> 
            ))}
        </div>
	  );
}