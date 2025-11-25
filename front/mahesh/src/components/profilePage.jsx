import { useParams } from "react-router";
import React, { useState, useEffect } from "react";
import axiosClient from "../utils/axiosClient";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import "./Profile.css"; // import CSS file

function Profile() {
  const user = useSelector((state) => state.auth.user);
  const [allProblem, setAllProblem] = useState([]);
  const [solveProblem, setSolveProblem] = useState([]);
  const [submission, setSubmission] = useState([]);
  const [solveLevel, setSolveLevel] = useState({});

  useEffect(() => {
    const fetchdata = async () => {
      const allprob = await axiosClient.get("/problem/getallproblem");
      setAllProblem(allprob.data);

      const solveprob = await axiosClient.get("/problem/allproblemsolvedbyuser");
      setSolveProblem(solveprob.data);

      const allsub = await axiosClient.get("/problem/submissionbyuser");
      setSubmission(allsub.data);
    };
    fetchdata();
  }, []);

  useEffect(() => {
    let easy = 0,
      medium = 0,
      hard = 0,
      easyT = 0,
      mediumT = 0,
      hardT = 0;

    for (let i = 0; i < allProblem.length; i++) {
      if (allProblem[i].difficulty === "easy") easyT++;
      else if (allProblem[i].difficulty === "medium") mediumT++;
      else hardT++;
    }

    for (let i = 0; i < solveProblem.length; i++) {
      if (solveProblem[i].difficulty === "easy") easy++;
      else if (solveProblem[i].difficulty === "medium") medium++;
      else hard++;
    }

    setSolveLevel({
      easyT,
      mediumT,
      hardT,
      easy,
      medium,
      hard,
    });
  }, [allProblem, solveProblem]);

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-photo">Photo</div>
        <div className="profile-info">
          <h2>{user.firstName}</h2>
          <p>{user.emailId}</p>
        </div>
      </div>

      {/* Score Section */}
      <div className="score-section">
        <div className="score-overall">
          {solveProblem.length}/{allProblem.length}
        </div>
        <div className="score-difficulty">
          <div className="score-box easy">
            <p>Easy</p>
            <p>
              {solveLevel.easy}/{solveLevel.easyT}
            </p>
          </div>
          <div className="score-box medium">
            <p>Medium</p>
            <p>
              {solveLevel.medium}/{solveLevel.mediumT}
            </p>
          </div>
          <div className="score-box hard">
            <p>Hard</p>
            <p>
              {solveLevel.hard}/{solveLevel.hardT}
            </p>
          </div>
        </div>
      </div>

      {/* Submissions & Solved Problems */}
      <div className="content-section">
        {/* Submissions */}
        <div className="submissions-box">
          <h3>Submissions</h3>
          {submission.map((sub, index) => {
            const problem = solveProblem.find((p) => p._id === sub.problemId);
            return (
              <div key={index} className="submission-item">
                <p className="submission-title">
                  {problem ? problem.title : "Unknown Problem"}
                </p>
                <p className="submission-time">
                  {formatDistanceToNow(new Date(sub.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            );
          })}
        </div>

        {/* Solved Problems */}
        <div className="solved-box">
          <h3>Solved Problems</h3>
          {solveProblem.map((solve, index) => (
            <div key={index} className="solved-item">
              <p className="solved-title">{solve.title}</p>
              <span className={`difficulty-tag ${solve.difficulty}`}>
                {solve.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
