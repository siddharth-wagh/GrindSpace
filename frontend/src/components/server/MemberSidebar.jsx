import { useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { SERVER_ROUTES } from "@/utils/constants";
import { Crown, UserMinus } from "lucide-react";
import RankBadge from "@/components/cp/RankBadge";

const ROLE_ORDER = ["owner", "member"];

export default function MembersList() {
  const { currentServer, members, setMembers, onlineUsers, userInfo } =
    useAppStore();

  const fetchMembers = async () => {
    if (!currentServer) return;
    try {
      const res = await apiClient.get(
        `${SERVER_ROUTES}/${currentServer._id}/members`
      );
      setMembers(res.data.members);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentServer?._id]);

  if (!currentServer) return null;

  const grouped = {};
  ROLE_ORDER.forEach((role) => (grouped[role] = []));

  members.forEach((m) => {
    const user = m.user || m;
    let role = m.role;
    if (role !== "owner") {
      role = "member";
    }
    grouped[role].push({ ...user, role });
  });

  const amOwner = grouped.owner.some((u) => u._id === userInfo?._id);

  const handleKick = async (user) => {
    if (!window.confirm(`Kick ${user.username} from the squad?`)) return;
    try {
      await apiClient.delete(
        `${SERVER_ROUTES}/${currentServer._id}/members/${user._id}`
      );
      setMembers(
        members.filter((m) => {
          const memberId = m.user?._id || m.user || m._id;
          return memberId !== user._id;
        })
      );
    } catch (err) {
      console.error("Failed to kick member:", err);
    }
  };

  const handlePromote = async (user) => {
    if (!window.confirm(`Transfer squad ownership to ${user.username}?`)) return;
    try {
      await apiClient.put(
        `${SERVER_ROUTES}/${currentServer._id}/members/${user._id}/role`,
        { role: "owner" }
      );
      fetchMembers();
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
      {ROLE_ORDER.map((role) => {
        const group = grouped[role];
        if (!group || group.length === 0) return null;

        let label = "Members";
        if (role === "owner") {
          label = "Owner";
        }

        const online = group.filter((u) => onlineUsers.has(u._id));
        const offline = group.filter((u) => !onlineUsers.has(u._id));

        return (
          <div key={role} className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)] px-2 mb-1 flex items-center gap-1">
              {label} — {group.length}
            </h3>

            {[...online, ...offline].map((user) => {
              const isOnline = onlineUsers.has(user._id);
              const isMe = user._id === userInfo?._id;

              return (
                <div
                  key={user._id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-surface)] cursor-pointer transition-colors ${
                    !isOnline ? "opacity-40" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.profilePic}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-dark)] ${
                        isOnline ? "bg-emerald-500" : "bg-gray-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm truncate">{user.username}</span>
                      {role === "owner" && (
                        <Crown size={12} className="text-yellow-400" />
                      )}
                    </div>
                    {user.codeforcesHandle && (
                      <RankBadge
                        rating={user.cfRating}
                        handle={user.codeforcesHandle}
                        size="sm"
                      />
                    )}
                  </div>

                  {amOwner && !isMe && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {role !== "owner" && (
                        <button
                          onClick={() => handlePromote(user)}
                          title="Transfer ownership"
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-yellow-400 transition-colors"
                        >
                          <Crown size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleKick(user)}
                        title="Kick member"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
