import { useParams, Navigate } from 'react-router-dom';
import ProfileView from './ProfileView';

function UserProfilePage() {
  const { userId } = useParams();

  if (!userId) {
    return <Navigate to="/friends" replace />;
  }

  return <ProfileView userId={userId} />;
}

export default UserProfilePage;
