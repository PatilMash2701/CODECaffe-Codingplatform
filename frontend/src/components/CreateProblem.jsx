import "./CreateProblem.css";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import axiosClient from "../utils/axiosClient";
import { useNavigate } from "react-router";
import { NavLink } from "react-router-dom";
import {useState,useEffect} from 'react';

function CreateProblem() {
  const navigate = useNavigate();
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      startCode: [
        { language: "C++", initialCode: " " },
        { language: "Java", initialCode: " " },
        { language: "JavaScript", initialCode: " " },
      ],
      referenceSolution: [
        { language: "C++", completeCode: " " },
        { language: "Java", completeCode: " " },
        { language: "JavaScript", completeCode: " " },
      ]
    }
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({
    control,
    name: "visibleTestCases"
  });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({
    control,
    name: "hiddenTestCases"
  });

  const onSubmit = async (data) => {
    try {
      // Validate that essential fields are present
      if (!data.title || !data.description || !data.difficulty) {
        alert("Please fill in all required fields");
        return;
      }

      // Validate startCode and referenceSolution
      if (!data.startCode || data.startCode.length === 0) {
        alert("Please provide start code for at least one language");
        return;
      }

      if (!data.referenceSolution || data.referenceSolution.length === 0) {
        alert("Please provide reference solution for at least one language");
        return;
      }

      // Validate test cases
      if (!data.visibleTestCases || data.visibleTestCases.length === 0) {
        alert("Please add at least one visible test case");
        return;
      }

      // Clean data - remove empty test cases
      const cleanData = {
        ...data,
        visibleTestCases: data.visibleTestCases.filter(tc => tc.input && tc.output),
        hiddenTestCases: data.hiddenTestCases ? data.hiddenTestCases.filter(tc => tc.input && tc.output) : []
      };

      const response = await axiosClient.post("/problem/create", cleanData);
      alert("Problem Created Successfully");
      navigate("/");
    } catch (error) {
      console.error("Error details:", error);
      alert(`Error: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Create New Problem</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="admin-card">
          <h2 className="admin-section-title">Basic Information</h2>

          <div className="admin-form-control">
            <label className="admin-label">Title</label>
            <input {...register("title")} className="admin-input" />
            {errors.title && <span className="admin-error">{errors.title.message}</span>}
          </div>

          <div className="admin-form-control">
            <label className="admin-label">Description</label>
            <textarea {...register("description")} className="admin-textarea" />
            {errors.description && <span className="admin-error">{errors.description.message}</span>}
          </div>

          <div className="admin-form-control">
            <label className="admin-label">Difficulty</label>
            <select {...register("difficulty")} className="admin-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="admin-form-control">
            <label className="admin-label">Tag</label>
            <select {...register("tags")} className="admin-select">
              <option value="array">Array</option>
              <option value="linkedlist">Linked List</option>
              <option value="graph">Graph</option>
              <option value="dp">DP</option>
            </select>
          </div>
        </div>

        {/* Test Cases */}
        <div className="admin-card">
          <h2 className="admin-section-title">Test Cases</h2>

          {/* Visible Test Cases */}
          <div>
            <h3>Visible Test Cases</h3>
            <button type="button" onClick={() => appendVisible({ input: "", output: "", explanation: "" })} className="admin-btn">
              Add Visible Case
            </button>

            {visibleFields.map((field, index) => (
              <div key={field.id} className="admin-testcase">
                <button type="button" onClick={() => removeVisible(index)} className="admin-btn admin-btn-error">Remove</button>
                <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="admin-input" />
                <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="admin-input" />
                <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="admin-textarea" />
              </div>
            ))}
          </div>

          {/* Hidden Test Cases */}
          <div>
            <h3>Hidden Test Cases</h3>
            <button type="button" onClick={() => appendHidden({ input: "", output: "" })} className="admin-btn">
              Add Hidden Case
            </button>

            {hiddenFields.map((field, index) => (
              <div key={field.id} className="admin-testcase">
                <button type="button" onClick={() => removeHidden(index)} className="admin-btn admin-btn-error">Remove</button>
                <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="admin-input" />
                <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="admin-input" />
              </div>
            ))}
          </div>
        </div>

        {/* Code Templates */}
        <div className="admin-card">
          <h2 className="admin-section-title">Code Templates</h2>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <h3>{index === 0 ? "C++" : index === 1 ? "Java" : "JavaScript"}</h3>

              <div className="admin-form-control">
                <label className="admin-label">Initial Code</label>
                <div className="admin-code">
                  <textarea {...register(`startCode.${index}.initialCode`)} rows={6} />
                </div>
              </div>

              <div className="admin-form-control">
                <label className="admin-label">Reference Solution</label>
                <div className="admin-code">
                  <textarea {...register(`referenceSolution.${index}.completeCode`)} rows={6} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="admin-btn admin-btn-full">Create Problem</button>
      </form>
    </div>
  );
}

export default CreateProblem;
