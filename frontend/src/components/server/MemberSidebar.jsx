import { useEffect } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { SERVER_ROUTES } from "@/utils/constants";
import { Crown, Shield, ShieldCheck } from "lucide-react";

const ROLE_ORDER = ["owner", "admin", "moderator", "member"];
const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  member: "Members",
};
const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  moderator: Shield,
};

export default function MemberSidebar() {
  const { currentServer, members, setMembers, onlineUsers, showMemberSidebar } =
    useAppStore();

  useEffect(() => {
    if (!currentServer) return;
    (async () => {
      try {
        const res = await apiClient.get(
          `${SERVER_ROUTES}/${currentServer._id}/members`
        );
        setMembers(res.data.members);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    })();
  }, [currentServer?._id]);

  if (!showMemberSidebar || !currentServer) return null;

  // Group members by role
  const grouped = {};
  ROLE_ORDER.forEach((role) => (grouped[role] = []));

  members.forEach((m) => {
    const user = m.user || m;
    const role = m.role || "member";
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push({ ...user, role });
  });

  return (
    <div className="w-60 min-w-[240px] bg-[var(--bg-dark)] border-l border-[var(--border)] flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        {ROLE_ORDER.map((role) => {
          const group = grouped[role];
          if (!group || group.length === 0) return null;

          const online = group.filter((u) =>
            onlineUsers.has(u._id)
          );
          const offline = group.filter(
            (u) => !onlineUsers.has(u._id)
          );

          return (
            <div key={role} className="mb-4">
              <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)] px-2 mb-1 flex items-center gap-1">
                {ROLE_LABELS[role]} — {group.length}
              </h3>

              {[...online, ...offline].map((user) => {
                const isOnline = onlineUsers.has(user._id);
                const RoleIcon = ROLE_ICONS[role];

                return (
                  <div
                    key={user._id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-surface)] cursor-pointer transition-colors ${
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
                        {RoleIcon && (
                          <RoleIcon
                            size={12}
                            className={
                              role === "owner"
                                ? "text-yellow-400"
                                : role === "admin"
                                ? "text-red-400"
                                : "text-blue-400"
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
