import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, CheckCircle2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import './Homepage.css';

function Homepage() {
  const user = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: 'all',
    status: 'all',
    tag: 'all',
  });

  const problemsArray = Array.isArray(problems) ? problems : [];
  const solvedArray = Array.isArray(solvedProblems) ? solvedProblems : [];

  const filteredProblems = problemsArray.filter((problem) => {
    const statusMatch =
      filters.status === 'all' ||
      solvedArray.some((sp) => sp._id === problem._id);
    return statusMatch;
  });

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'pill badge-easy';
      case 'medium':
        return 'pill badge-medium';
      case 'hard':
        return 'pill badge-hard';
      default:
        return 'pill badge-tag';
    }
  };

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search.trim()) params.append('search', filters.search.trim());
        if (filters.difficulty && filters.difficulty !== 'all')
          params.append('difficulty', filters.difficulty);
        if (filters.tag && filters.tag !== 'all') params.append('tags', filters.tag);

        const queryString = params.toString();
        const url = `/problem/getallproblem${queryString ? '?' + queryString : ''}`;
        const response = await axiosClient.get(url);
        const list = Array.isArray(response.data)
          ? response.data
          : response.data?.data;
        setProblems(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const data = await axiosClient.get('/problem/allproblemsolvedbyuser');
        const maybeArray = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : Array.isArray(data?.data?.data)
              ? data.data.data
              : null;
        setSolvedProblems(Array.isArray(maybeArray) ? maybeArray : []);
      } catch (error) {
        console.error('Error in fetching solved problems', error);
      }
    };

    fetchProblems();
    if (user?.isAuthenticated) {
      fetchSolvedProblems();
    }
  }, [user, filters.search, filters.difficulty, filters.tag]);

  const firstName = user?.user?.firstName || user?.firstName || 'Coder';

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>
          Hey <span>{firstName}</span>, ready to solve?
        </h1>
        <p>Pick a problem below and sharpen your DSA skills.</p>
      </div>

      <div className="home-filters">
        <div className="home-search" style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }}
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="cp-input"
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>

        <select
          className="cp-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All problems</option>
          <option value="solved">Solved only</option>
        </select>

        <select
          className="cp-select"
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          className="cp-select"
          value={filters.tag}
          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
        >
          <option value="all">All tags</option>
          <option value="array">Array</option>
          <option value="Linkedlist">Linked List</option>
          <option value="graph">Graph</option>
          <option value="dp">DP</option>
        </select>
      </div>

      <div className="problem-list" id="problem-section">
        {filteredProblems.length === 0 ? (
          <div className="home-empty">No problems match your filters.</div>
        ) : (
          filteredProblems.map((problem) => {
            const isSolved = solvedProblems.some((sp) => sp._id === problem._id);
            return (
              <NavLink
                key={problem._id}
                to={`/problem/${problem._id}`}
                className="problem-card"
              >
                <div className="problem-card-inner">
                  <h2 className="problem-card-title">{problem.title}</h2>
                  <div className="problem-card-badges">
                    {isSolved && (
                      <span className="pill badge-solved">
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        Solved
                      </span>
                    )}
                    <span className={getDifficultyClass(problem.difficulty)}>
                      {problem.difficulty}
                    </span>
                    {problem.tags && (
                      <span className="pill badge-tag">{problem.tags}</span>
                    )}
                  </div>
                </div>
              </NavLink>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Homepage;
