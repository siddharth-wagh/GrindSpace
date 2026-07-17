import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store";
import CpDashboardContent from "@/components/cp/CpDashboardContent";

function CpDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const { userInfo } = useAppStore();

  let userId = params.userId;
  if (!userId && userInfo) {
    userId = userInfo._id;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deepest)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--violet-lite)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <CpDashboardContent userId={userId} />
      </div>
    </div>
  );
}

export default CpDashboard;
