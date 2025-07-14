import React, { useEffect, useState } from "react";
import { Users, Search, Plus, Settings } from "lucide-react";
import { useAppStore } from "../store/index.js";
import { apiClient } from "../lib/api-client.js";

const Sidebar = () => {
  const { 
    userInfo, 
    setUserInfo, 
    currentGroup, 
    setCurrentGroup, 
    setMessages ,
    
    setshowGroupDesc,
  } = useAppStore();

  const [groupCreated, setGroupCreated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    isPrivate: false,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  function openGroup(group) {
    setCurrentGroup(group);
    setshowGroupDesc(false)
    setMessages([]);
    console.log("Opening group:", group.name);
  }

  const handleCreateGroup = async () => {
    try {
      const grp = await apiClient.post("/api/group/create", newGroup);
      console.log("Group created:", grp);
      setShowModal(false);
      setGroupCreated(true);
      // Reset form
      setNewGroup({
        name: "",
        description: "",
        isPrivate: false,
        tags: [],
      });
      setTagInput("");
    } catch (error) {
      console.error("Error creating group", error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await apiClient.get("/api/auth/check", {
        withCredentials: true,
      });
      setUserInfo(res.data);
    } catch (err) {
      console.error("Error fetching user info", err);
    } finally {
      setGroupCreated(false);
    }
  };

  useEffect(() => {
    if (groupCreated) {
      fetchUserInfo();
    }
  }, [groupCreated]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    async function fetchSearch() {
      try {
        const res = await apiClient.get(`/api/group/search?query=${search}&full=false`);
        setSearchResults(res.data);
        setShowSuggestions(true);
      } catch (error) {
        console.log(error);
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }

    const delayDebounce = setTimeout(() => {
      if (search.trim() !== "") {
        fetchSearch();
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const closeGroupModal = () => {
    setSelectedGroup(null);
    setShowGroupModal(false);
    setJoinToken("");
  };

  const handleJoinGroup = async () => {
    if (!selectedGroup) return;
    try {
      await apiClient.post(`/api/group/join/${selectedGroup._id}`, {
        joinToken: joinToken,
      });

      const userRes = await apiClient.get("/api/auth/check", {
        withCredentials: true,
      });
      setUserInfo(userRes.data);

      closeGroupModal();
      setShowingSearchResults(false);
    } catch (err) {
      console.error("Join group failed:", err);
      alert("Failed to join group. Check token or try again.");
    }
  };

  const handleSearchEnter = async (e) => {
    if (e.key === "Enter" && search.trim() !== "") {
      try {
        const res = await apiClient.get(`/api/group/search?query=${search}&full=true`);
        setSearchResults(res.data);
        setShowSuggestions(false);
        setShowingSearchResults(true);
      } catch (err) {
        console.error("Failed to fetch full search results:", err);
      }
    }
  };

  return (
    <>
      <div className="w-80 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ChatHub
            </h1>
            <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Search with Dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-md max-h-60 overflow-y-auto">
                {searchResults.map((group) => (
                  <div
                    key={group._id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowSuggestions(false);
                      setSearch("");
                      setShowGroupModal(true);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-black border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-500">{group.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Groups Button */}
        {showingSearchResults && (
          <div className="p-4 border-b border-slate-700/50">
            <button
              onClick={() => {
                setShowingSearchResults(false);
                setSearch("");
                setSearchResults([]);
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to My Groups
            </button>
          </div>
        )}

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              {showingSearchResults ? "Search Results" : "Your Groups"}
            </h2>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
              {showingSearchResults 
                ? searchResults.length 
                : userInfo?.groups?.length || 0}
            </span>
          </div>

          {showingSearchResults ? (
            searchResults.length > 0 ? (
              searchResults.map((group) => (
                <button
                  key={group._id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowGroupModal(true);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {group.description}
                      </p>
                    </div>
                    {group.isPrivate && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                No matching groups found.
              </p>
            )
          ) : (
            userInfo?.groups?.length > 0 ? (
              userInfo.groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => openGroup(group)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border group ${
                    currentGroup?._id === group._id
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {group.description}
                      </p>
                    </div>
                    {group.isPrivate && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                You are not in any groups.
              </p>
            )
          )}
        </div>

        {/* Create Group Button */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Group</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                
                <textarea
                  placeholder="Description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  rows="3"
                />
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="text-gray-700 font-medium">
                    Private Group
                  </label>
                </div>
                
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        setNewGroup({
                          ...newGroup,
                          tags: [...newGroup.tags, tagInput.trim()]
                        });
                        setTagInput("");
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                
                {newGroup.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newGroup.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => {
                          setNewGroup({
                            ...newGroup,
                            tags: newGroup.tags.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        {tag} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewGroup({
                      name: "",
                      description: "",
                      isPrivate: false,
                      tags: [],
                    });
                    setTagInput("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedGroup.name}
              </h2>
              <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Visibility:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedGroup.isPrivate 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedGroup.isPrivate ? "Private" : "Public"}
                </span>
              </div>

              {selectedGroup.isPrivate && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder="Enter join token"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeGroupModal}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;