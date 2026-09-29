import { useNavigate } from "react-router";
import "./AdminPanel.css"; // external CSS

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-container app-page">
      <h2 className="admin-heading">Admin Panel</h2>
      <p>Manage problems for the platform</p>

      <div className="admin-cards">
        <div className="admin-card">
          <h3>Create New Problem</h3>
          <button onClick={() => navigate("/admin/createproblem")}>
            Create
          </button>
        </div>

        <div className="admin-card">
          <h3>Update Problem</h3>
          <button onClick={() => navigate("/admin/updateproblem")}>
            Update
          </button>
        </div>

        <div className="admin-card">
          <h3>Delete Problem</h3>
          <button onClick={() => navigate("/admin/deleteproblem")}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
