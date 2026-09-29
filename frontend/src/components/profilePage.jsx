import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ProfileView from './ProfileView';

function Profile() {
  const authUser = useSelector((state) => state.auth.user);
  const myId = authUser?._id || authUser?.user?._id;

  if (!myId) {
    return <Navigate to="/login" replace />;
  }

  return <ProfileView userId={myId} />;
}

export default Profile;
