import "./UpdateProblem.css";
import { useForm, useFieldArray } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { useNavigate, useParams } from "react-router";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

const UpdateProblem = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({});

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await axiosClient.get(`/problem/problembyid/${id}`);
        reset(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Problem fetch failed", err);
      }
    };
    fetchProblem();
  }, [id, reset]);

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post(`/problem/update/${id}`, data);
      alert("Problem updated successfully");
      navigate("/");
    } catch (error) {
      alert(`Error :${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="update-container">
      <h1 className="update-title">Update Problem</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="update-card">
          <h2 className="update-section-title">Basic Information</h2>

          <div className="update-form-control">
            <label className="update-label">Title</label>
            <input {...register("title")} className="update-input" />
            {errors.title && <span className="update-error">{errors.title.message}</span>}
          </div>

          <div className="update-form-control">
            <label className="update-label">Description</label>
            <textarea {...register("description")} className="update-textarea" />
            {errors.description && <span className="update-error">{errors.description.message}</span>}
          </div>

          <div className="update-form-control">
            <label className="update-label">Difficulty</label>
            <select {...register("difficulty")} className="update-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="update-form-control">
            <label className="update-label">Tags</label>
            <select {...register("tags")} className="update-select">
              <option value="array">Array</option>
              <option value="linkedlist">Linked List</option>
              <option value="graph">Graph</option>
              <option value="dp">DP</option>
            </select>
          </div>
        </div>

        {/* Test Cases */}
        <div className="update-card">
          <h2 className="update-section-title">Test Cases</h2>

          {/* Visible Test Cases */}
          <h3>Visible Test Cases</h3>
          <button type="button" onClick={() => appendVisible({ input: "", output: "", explanation: "" })} className="update-btn">
            Add Visible Case
          </button>

          {visibleFields.map((field, index) => (
            <div key={field.id} className="update-testcase">
              <button type="button" onClick={() => removeVisible(index)} className="update-btn update-btn-error">
                Remove
              </button>
              <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="update-input" />
              <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="update-input" />
              <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="update-textarea" />
            </div>
          ))}

          {/* Hidden Test Cases */}
          <h3>Hidden Test Cases</h3>
          <button type="button" onClick={() => appendHidden({ input: "", output: "" })} className="update-btn">
            Add Hidden Case
          </button>

          {hiddenFields.map((field, index) => (
            <div key={field.id} className="update-testcase">
              <button type="button" onClick={() => removeHidden(index)} className="update-btn update-btn-error">
                Remove
              </button>
              <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="update-input" />
              <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="update-input" />
            </div>
          ))}
        </div>

        {/* Code Templates */}
        <div className="update-card">
          <h2 className="update-section-title">Code Templates</h2>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <h3>{index === 0 ? "C++" : index === 1 ? "Java" : "JavaScript"}</h3>

              <div className="update-form-control">
                <label className="update-label">Initial Code</label>
                <div className="update-code">
                  <textarea {...register(`startCode.${index}.initialCode`)} rows={6} />
                </div>
              </div>

              <div className="update-form-control">
                <label className="update-label">Reference Solution</label>
                <div className="update-code">
                  <textarea {...register(`referenceSolution.${index}.completeCode`)} rows={6} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="update-btn update-btn-full">
          Update Problem
        </button>
      </form>
    </div>
  );
};



const UpdatePage = () => {
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

  return (
    <div className="updatepage-container">
      <table className="updatepage-table">
        <thead>
          <tr>
            <th className="updatepage-header">#</th>
            <th className="updatepage-header">Title</th>
            <th className="updatepage-header">Difficulty</th>
            <th className="updatepage-header">Tag</th>
          </tr>
        </thead>
        <tbody>
          {allProblem.map((prob, index) => (
            <tr key={prob._id} className="updatepage-row">
              <td className="updatepage-cell">{index + 1}</td>
              <td className="updatepage-cell">
                <NavLink to={`/admin/updateproblem/${prob._id}`} className="updatepage-title">
                  {prob.title}
                </NavLink>
              </td>
              <td className="updatepage-cell">
                <span className={`updatepage-difficulty ${prob.difficulty.toLowerCase()}`}>
                  {prob.difficulty}
                </span>
              </td>
              <td className="updatepage-cell">
                <span className="updatepage-tag">{prob.tags}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export {UpdateProblem,UpdatePage};
