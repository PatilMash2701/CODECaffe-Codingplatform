import "./DeleteProblem.css"
import {useState,useEffect} from 'react';
import axiosClient from '../utils/axiosClient';


const DeleteProblem = () => {
    const [allProblem, setAllProblem] = useState([]);
  
    useEffect(() => {
      const fetchAllProblem = async () => {
        try {
          const allprob = await axiosClient.get(`/problem/getallproblem`);
          setAllProblem(allprob.data);
        } catch (err) {
          console.error("Error fetching problems", err);
        }
      };
      fetchAllProblem();
    }, []);
  
    const submit = async (id) => {
      if (!window.confirm("Are you sure you want to delete this problem?")) return;
      try {
        await axiosClient.delete(`/problem/delete/${id}`);
        setAllProblem((prev) => prev.filter((p) => p._id !== id));
        alert("Problem deleted successfully");
      } catch (err) {
        console.error("Problem related to deletion", err);
      }
    };
  
    return (
      <div className="delete-problem-container">
        <h2 className="heading">Manage Problems</h2>
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
              <tr key={prob._id}>
                <td>{index + 1}</td>
                <td className="title">{prob.title}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => submit(prob._id)}
                  >
                    Delete
                  </button>
                </td>
                <td className={`difficulty ${prob.difficulty.toLowerCase()}`}>
                  {prob.difficulty}
                </td>
                <td>{prob.tags}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
export default DeleteProblem;
