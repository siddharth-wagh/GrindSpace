import React from 'react';
import { useAppStore } from '../store/index.js';

const GroupDesc = () => {
  const { currentGroup, groupUsers,setshowGroupDesc,setAddListener } = useAppStore();

  return (
    
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6 mt-6">
      {/* back button */}
        <button
            onClick={() => {
                setshowGroupDesc(false)
                setAddListener((prev)=> !prev);
            }
            }
        />
      {/* Group Image */}
      <div className="flex justify-center">
        <img
          src={currentGroup?.img || 'https://via.placeholder.com/150'}
          alt="Group profile"
          className="w-32 h-32 rounded-full object-cover shadow-md"
        />
      </div>

      {/* Group Name */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">{currentGroup?.name}</h1>
      </div>

      {/* Group Description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Description</h2>
        <p className="text-gray-600 text-sm">{currentGroup?.description || "No description provided."}</p>
      </div>

      {/* Group Tags */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {currentGroup?.tags?.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Group Members */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Members</h2>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {groupUsers?.map((member, index) => (
            <div key={index} className="flex items-center gap-3">
              <img
                src={member.profilePic}
                alt={member.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-gray-700 text-sm">{member.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDesc;
