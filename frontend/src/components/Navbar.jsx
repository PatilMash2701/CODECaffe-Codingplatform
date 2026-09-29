import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Code2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import './Navbar.css';

const navItems = [
  { label: 'Problems', to: '/' },
  { label: 'Friends', to: '/friends' },
];

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await axiosClient.get('/user/role');
        setRole(response.data.role);
      } catch (error) {
        console.error('Failed to fetch role', error);
      }
    };

    if (isAuthenticated) {
      fetchRole();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const displayName = user?.firstName || user?.user?.firstName || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleProblemsClick = () => {
    navigate('/');
    setTimeout(() => {
      const problemSection = document.getElementById('problem-section');
      if (problemSection) {
        problemSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const currentPath = location.pathname;

  const renderNavItem = (item) => {
    if (item.to) {
      return (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `cp-nav-link ${isActive ? 'cp-nav-link-active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={handleProblemsClick}
        className={`cp-nav-link ${currentPath === '/' ? 'cp-nav-link-active' : ''}`}
      >
        {item.label}
      </button>
    );
  };

  return (
    <nav className="cp-navbar">
      <div className="cp-navbar-inner">
        <div className="cp-navbar-left">
          <NavLink to="/" className="cp-brand">
            <Code2 size={22} className="cp-brand-icon" />
            <span>
              Code<span className="cp-brand-accent">Prep</span>
            </span>
          </NavLink>
          <div className="cp-nav-links">{navItems.map(renderNavItem)}</div>
        </div>

        <div className="cp-navbar-right">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="cp-user-btn">
              <div className="cp-avatar">{avatarInitial}</div>
              <span className="cp-user-name">{displayName}</span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content cp-dropdown-menu z-[100]"
            >
              <li>
                <NavLink to="/profile">Profile</NavLink>
              </li>
              {role === 'admin' && (
                <li>
                  <NavLink to="/admin">Admin</NavLink>
                </li>
              )}
              <li>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
