import { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { Users, Search, Trophy, ChevronRight, User } from 'lucide-react';
import './Friends.css';

function FriendsPage() {
  const authUser = useSelector((state) => state.auth.user);
  const myId = authUser?._id || authUser?.user?._id;
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosClient.get('/user/all');
        setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.firstName} ${u.lastName || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [users, search]);

  return (
    <div className="friends-page">
      <div className="friends-inner">
        <header className="friends-header">
          <div className="friends-header-text">
            <h1>
              <Users size={28} className="friends-header-icon" />
              Friends
            </h1>
            <p>Browse coders and open their public profile — like LeetCode profile links.</p>
          </div>
          <div className="friends-search-wrap">
            <Search size={18} className="friends-search-icon" />
            <input
              type="text"
              className="friends-search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <p className="friends-loading">Loading users…</p>
        ) : filtered.length === 0 ? (
          <p className="friends-empty">No users found.</p>
        ) : (
          <ul className="friends-list">
            {filtered.map((u) => {
              const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
              const isSelf = u.isSelf || u._id === myId;
              return (
                <li key={u._id}>
                  <NavLink
                    to={isSelf ? '/profile' : `/user/${u._id}`}
                    className="friends-card"
                  >
                    <div className="friends-avatar">
                      {u.firstName ? u.firstName[0].toUpperCase() : <User size={22} />}
                    </div>
                    <div className="friends-card-body">
                      <span className="friends-name">
                        {name}
                        {isSelf && <span className="friends-you-badge">You</span>}
                      </span>
                      <span className="friends-meta">
                        <Trophy size={14} />
                        {u.solvedCount ?? 0} problems solved
                      </span>
                    </div>
                    <ChevronRight size={20} className="friends-chevron" />
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
