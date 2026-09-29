import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import {
  User,
  Trophy,
  Clock,
  Target,
  FileCode2,
  CheckCircle2,
  ArrowLeft,
  Link2,
} from 'lucide-react';
import './Profile.css';

function ProfileView({ userId }) {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const myId = authUser?._id || authUser?.user?._id;

  const [profileUser, setProfileUser] = useState(null);
  const [allProblem, setAllProblem] = useState([]);
  const [solveProblem, setSolveProblem] = useState([]);
  const [submission, setSubmission] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('Invalid profile');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/user/profile/${userId}`);
        const data = res.data?.data;
        if (!data) throw new Error('No profile data');

        setProfileUser(data.user);
        setSolveProblem(Array.isArray(data.solvedProblems) ? data.solvedProblems : []);
        setSubmission(Array.isArray(data.submissions) ? data.submissions : []);
        setTotalProblems(data.totalProblems || 0);
        setIsOwnProfile(!!data.isOwnProfile);

        const probs = await axiosClient.get('/problem/getallproblem');
        const list = Array.isArray(probs.data?.data)
          ? probs.data.data
          : Array.isArray(probs.data)
            ? probs.data
            : [];
        setAllProblem(list);
      } catch (err) {
        console.error('Profile load failed:', err);
        setError(err.response?.data?.error || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const getProblemId = (sub) => {
    const p = sub.problemId;
    return (p?._id || p)?.toString?.() || p;
  };

  const getProblemTitle = (sub) => {
    if (sub.problemId && typeof sub.problemId === 'object' && sub.problemId.title) {
      return sub.problemId.title;
    }
    const id = getProblemId(sub);
    const fromAll = allProblem.find((p) => p._id?.toString() === id);
    return fromAll?.title || 'Unknown Problem';
  };

  const getProblemDifficulty = (sub) => {
    if (sub.problemId && typeof sub.problemId === 'object' && sub.problemId.difficulty) {
      return sub.problemId.difficulty;
    }
    const id = getProblemId(sub);
    const fromAll = allProblem.find((p) => p._id?.toString() === id);
    return fromAll?.difficulty;
  };

  const solveLevel = useMemo(() => {
    let easy = 0,
      medium = 0,
      hard = 0,
      easyT = 0,
      mediumT = 0,
      hardT = 0;
    for (const p of allProblem) {
      if (p.difficulty === 'easy') easyT++;
      else if (p.difficulty === 'medium') mediumT++;
      else hardT++;
    }
    for (const p of solveProblem) {
      if (p.difficulty === 'easy') easy++;
      else if (p.difficulty === 'medium') medium++;
      else hard++;
    }
    return { easyT, mediumT, hardT, easy, medium, hard };
  }, [allProblem, solveProblem]);

  const {
    easy: easySolved,
    medium: mediumSolved,
    hard: hardSolved,
    easyT: easyTotal,
    mediumT: mediumTotal,
    hardT: hardTotal,
  } = solveLevel;

  const totalSolved = solveProblem.length;
  const problemTotal = totalProblems || allProblem.length;

  const acceptanceRate = useMemo(() => {
    if (!submission.length) return 0;
    const accepted = submission.filter((s) => s.status === 'accepted').length;
    return Math.round((accepted / submission.length) * 100);
  }, [submission]);

  const progressGradient = useMemo(() => {
    const solvedSum = easySolved + mediumSolved + hardSolved;
    if (!solvedSum) return 'conic-gradient(var(--cp-border) 0deg 360deg)';
    const segments = [
      { color: '#00b8a3', value: easySolved / solvedSum },
      { color: '#ffc01e', value: mediumSolved / solvedSum },
      { color: '#ff375f', value: hardSolved / solvedSum },
    ];
    let startAngle = 0;
    const parts = [];
    segments.forEach(({ color, value }) => {
      if (value <= 0) return;
      const sweep = Math.min(value, 1) * 360;
      parts.push(`${color} ${startAngle}deg ${startAngle + sweep}deg`);
      startAngle += sweep;
    });
    if (startAngle < 360) {
      parts.push(`var(--cp-bg-card) ${startAngle}deg 360deg`);
    }
    return `conic-gradient(${parts.join(', ')})`;
  }, [easySolved, mediumSolved, hardSolved]);

  const difficultyBars = [
    { label: 'Easy', solved: easySolved, total: easyTotal, className: 'easy' },
    { label: 'Medium', solved: mediumSolved, total: mediumTotal, className: 'medium' },
    { label: 'Hard', solved: hardSolved, total: hardTotal, className: 'hard' },
  ];

  const sortedSubmissions = [...submission].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const displayName = profileUser
    ? [profileUser.firstName, profileUser.lastName].filter(Boolean).join(' ')
    : 'User';

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/user/${userId}`
      : `/user/${userId}`;

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="lc-profile">
        <div className="lc-profile-loading">Loading profile…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lc-profile">
        <div className="lc-profile-error">
          <p>{error}</p>
          <button type="button" className="lc-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lc-profile">
      <div className="lc-profile-inner">
        {!isOwnProfile && (
          <div className="lc-profile-banner">
            <button type="button" className="lc-back-btn" onClick={() => navigate('/friends')}>
              <ArrowLeft size={16} /> Friends
            </button>
            <span className="lc-banner-text">
              Viewing <strong>{displayName}</strong>&apos;s profile
            </span>
            <button type="button" className="lc-copy-link-btn" onClick={copyProfileLink}>
              {copied ? (
                <>Copied!</>
              ) : (
                <>
                  <Link2 size={14} /> Copy profile link
                </>
              )}
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div className="lc-profile-banner lc-profile-banner-own">
            <span className="lc-banner-text">Your profile</span>
            <button type="button" className="lc-copy-link-btn" onClick={copyProfileLink}>
              {copied ? <>Copied!</> : <><Link2 size={14} /> Share profile link</>}
            </button>
          </div>
        )}

        <header className="lc-profile-header">
          <div className="lc-user-card">
            <div className="lc-avatar">
              {profileUser?.firstName ? (
                profileUser.firstName[0].toUpperCase()
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="lc-user-meta">
              <h1 className="lc-username">{displayName}</h1>
              {profileUser?.emailId && (
                <p className="lc-email">{profileUser.emailId}</p>
              )}
              {!profileUser?.emailId && !isOwnProfile && (
                <p className="lc-email lc-email-muted">CodePrep member</p>
              )}
              <div className="lc-quick-stats">
                <span>
                  <Trophy size={14} /> {totalSolved} solved
                </span>
                <span>
                  <FileCode2 size={14} /> {submission.length} submissions
                </span>
              </div>
            </div>
          </div>

          <div className="lc-stats-card">
            <div className="lc-stats-ring-wrap">
              <div className="lc-ring" style={{ background: progressGradient }}>
                <div className="lc-ring-inner">
                  <span className="lc-ring-num">{totalSolved}</span>
                  <span className="lc-ring-label">Solved</span>
                </div>
              </div>
              <div className="lc-ring-caption">
                <strong>{totalSolved}</strong>
                <span> / {problemTotal} problems</span>
              </div>
            </div>

            <div className="lc-difficulty-bars">
              <h3 className="lc-difficulty-title">
                <Target size={16} /> Progress by difficulty
              </h3>
              {difficultyBars.map((d) => {
                const pct = d.total ? Math.min(100, (d.solved / d.total) * 100) : 0;
                return (
                  <div key={d.label} className={`lc-bar-row lc-bar-${d.className}`}>
                    <div className="lc-bar-header">
                      <span>{d.label}</span>
                      <span className="lc-bar-count">
                        {d.solved}/{d.total}
                      </span>
                    </div>
                    <div className="lc-bar-track">
                      <div className="lc-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lc-stat-pills">
              <div className="lc-stat-pill">
                <span className="lc-stat-pill-value">{acceptanceRate}%</span>
                <span className="lc-stat-pill-label">Acceptance</span>
              </div>
              <div className="lc-stat-pill">
                <span className="lc-stat-pill-value">{submission.length}</span>
                <span className="lc-stat-pill-label">Submissions</span>
              </div>
            </div>
          </div>
        </header>

        <section className="lc-profile-lists">
          <div className="lc-panel">
            <div className="lc-panel-head">
              <h2>
                <Clock size={18} /> Recent Submissions
              </h2>
              <span className="lc-panel-count">{submission.length}</span>
            </div>
            <div className="lc-panel-scroll">
              {submission.length === 0 ? (
                <p className="lc-panel-empty">No submissions yet.</p>
              ) : (
                <ul className="lc-submission-list">
                  {sortedSubmissions.map((sub) => {
                    const difficulty = getProblemDifficulty(sub);
                    const pid = getProblemId(sub);
                    return (
                      <li key={sub._id} className="lc-submission-row">
                        <div className="lc-submission-main">
                          {pid ? (
                            <NavLink to={`/problem/${pid}`} className="lc-problem-link">
                              {getProblemTitle(sub)}
                            </NavLink>
                          ) : (
                            <span className="lc-problem-link-static">
                              {getProblemTitle(sub)}
                            </span>
                          )}
                          {difficulty && (
                            <span className={`lc-diff-badge lc-diff-${difficulty}`}>
                              {difficulty}
                            </span>
                          )}
                        </div>
                        <div className="lc-submission-meta">
                          <span className={`lc-status lc-status-${sub.status}`}>
                            {sub.status === 'accepted' && <CheckCircle2 size={12} />}
                            {sub.status}
                          </span>
                          <span className="lc-time">
                            {sub.updatedAt
                              ? formatDistanceToNow(new Date(sub.updatedAt), {
                                  addSuffix: true,
                                })
                              : '—'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="lc-panel">
            <div className="lc-panel-head">
              <h2>
                <CheckCircle2 size={18} /> Solved Problems
              </h2>
              <span className="lc-panel-count">{solveProblem.length}</span>
            </div>
            <div className="lc-panel-scroll">
              {solveProblem.length === 0 ? (
                <p className="lc-panel-empty">No accepted solutions yet.</p>
              ) : (
                <ul className="lc-solved-list">
                  {solveProblem.map((solve) => (
                    <li key={solve._id} className="lc-solved-row">
                      <NavLink to={`/problem/${solve._id}`} className="lc-problem-link">
                        {solve.title}
                      </NavLink>
                      <span className={`lc-diff-badge lc-diff-${solve.difficulty}`}>
                        {solve.difficulty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProfileView;
