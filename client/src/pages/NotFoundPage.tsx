import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="empty-state animate-fade-in my-16">
      <div className="empty-state-icon">4️⃣0️⃣4️⃣</div>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      <button className="btn btn-primary mt-4" onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </button>
    </div>
  );
}
