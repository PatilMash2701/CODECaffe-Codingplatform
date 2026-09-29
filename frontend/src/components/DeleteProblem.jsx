import "./DeleteProblem.css"
import {useState, useEffect} from 'react';
import axiosClient from '../utils/axiosClient';

const DeleteProblem = () => {
    const [allProblem, setAllProblem] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
        const fetchAllProblem = async () => {
            try {
                console.log('Fetching problems for deletion...');
                const response = await axiosClient.get(`/problem/getallproblem`);
                console.log('Delete API Response:', response);
                
                // Handle different response structures
                let problems = [];
                if (Array.isArray(response?.data)) {
                    problems = response.data;
                } else if (Array.isArray(response?.data?.data)) {
                    problems = response.data.data;
                } else if (response?.data?.problems) {
                    problems = response.data.problems;
                }
                
                console.log('Extracted problems for deletion:', problems);
                setAllProblem(Array.isArray(problems) ? problems : []);
                
                if (!problems || problems.length === 0) {
                    console.warn('No problems found in the response');
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch problems';
                console.error("Error fetching problems:", errorMsg, err);
                setError(errorMsg);
                setAllProblem([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllProblem();
    }, []);
  
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this problem?")) return;
        try {
            await axiosClient.delete(`/problem/delete/${id}`);
            setAllProblem(prev => {
                if (!Array.isArray(prev)) return [];
                return prev.filter(p => p?._id !== id);
            });
            alert("Problem deleted successfully");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to delete problem';
            console.error("Error deleting problem:", errorMsg, err);
            alert(`Error: ${errorMsg}`);
        }
    };

    if (loading) {
        return <div className="loading">Loading problems...</div>;
    }

    if (error) {
        return (
            <div className="error-message">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }
  
    return (
        <div className="delete-problem-container">
            <h2 className="heading">Manage Problems</h2>
            {allProblem.length > 0 ? (
                <table className="problem-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Delete</th>
                            <th>Difficulty</th>
                            <th>Tag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allProblem.map((prob, index) => (
                            <tr key={prob?._id || index}>
                                <td>{index + 1}</td>
                                <td className="title">{prob?.title || 'Untitled'}</td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(prob?._id)}
                                        disabled={!prob?._id}
                                    >
                                        Delete
                                    </button>
                                </td>
                                <td className={`difficulty ${prob?.difficulty?.toLowerCase() || ''}`}>
                                    {prob?.difficulty || 'N/A'}
                                </td>
                                <td>{prob?.tags || 'No tags'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-problems">No problems found to delete.</div>
            )}
        </div>
    );
};

export default DeleteProblem;
