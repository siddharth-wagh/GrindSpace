import React, { useEffect, useState } from 'react';
import { useAppStore } from "../store/index.js";
import { apiClient } from "../lib/api-client.js";

const Sidebar = () => {
const setUserInfo = useAppStore((state) => state.setUserInfo); 
  const [search, setSearch] = useState("");
  const userInfo = useAppStore((state) => state.userInfo);
  const setCurrentGroup = useAppStore((state) => state.setCurrentGroup);
  const setMessages = useAppStore((state) => state.setMessages);
  const [groupCreated, setGroupCreated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showingSearchSidebar, setShowingSearchSidebar] = useState(false); // new
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    isPrivate: false,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  function openGroup(group) {
    setCurrentGroup(group);
    setMessages([]);
    console.log("Opening group:", group.name);
  }

  const handleCreateGroup = async () => {
    try {
      const grp = await apiClient.post("/api/group/create", newGroup);
  
      console.log("Group created:", grp);
     
            setShowModal(false);
             setGroupCreated(true);
    } catch (error) {
      console.error("Error creating group", error);
    }
  };
 useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const res = await apiClient.get("/api/auth/check", { withCredentials: true });
      setUserInfo(res.data);
    } catch (err) {
      console.error("Error fetching user info", err);
    } finally {
      setGroupCreated(false); // reset the flag
    }
  };

  if (groupCreated) {
    fetchUserInfo();
  }
}, [groupCreated]);

useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (search.trim() !== "") {
      fetchGroupSuggestions(search);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, 300); // debounce

  return () => clearTimeout(delayDebounce);
}, [search]);

const fetchGroupSuggestions = async (query) => {
  try {
    const res = await apiClient.get(`/api/group/search?query=${query}&full=false`);
    setSearchResults(res.data);
    setShowSuggestions(true);
  } catch (err) {
    console.error("Search failed", err);
    setSearchResults([]);
    setShowSuggestions(false);
  }
};

const displaygroups = async(e)=>{
    if (e.key === "Enter" && search.trim() !== "") {
    e.preventDefault();
    try {
      const res = await apiClient.get(`/api/group/search?query=${search}&full=true`);
      setSearchResults(res.data);
      setShowSuggestions(false);
      setShowingSearchSidebar(true);
    } catch (err) {
      console.error("Search failed", err);
    }
  }

}
  return (
    <>
      {/* Sidebar */}
      <div className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4 space-y-4 shadow-md">
        {/* Search */}
          <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={displaygroups}
            placeholder="Search groups"
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white rounded shadow-md max-h-60 overflow-y-auto">
              {searchResults.map((group) => (
                <div
                  key={group._id}
                  onClick={() => {
                    openGroup(group);
                    setSearch("");
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-black"
                >
                  {group.name}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Group List */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Your Groups</h2>
          <div className="space-y-2">
            {userInfo?.groups?.length > 0 ? (
              userInfo.groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => openGroup(group)}
                  className="w-full text-left px-4 py-2 rounded-lg bg-gray-800 hover:bg-blue-600 transition-colors"
                >
                  {group.name}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">You are not in any groups.</p>
            )}
          </div>
        </div>

        {/* Create Group Button */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition"
        >
          + Create Group
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <textarea
              placeholder="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <div className="flex items-center mb-3 space-x-2">
              <input
                type="checkbox"
                checked={newGroup.isPrivate}
                onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
              />
              <label className="text-sm text-gray-700">Private Group</label>
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (tagInput.trim() !== "") {
                      setNewGroup({ ...newGroup, tags: [...newGroup.tags, tagInput.trim()] });
                      setTagInput("");
                    }
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {/* Show Tags */}
              <div className="mt-2 flex flex-wrap gap-2">
                {newGroup.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
