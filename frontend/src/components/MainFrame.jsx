import React, { useEffect, useState } from "react";
import { useAppStore } from "../store";
import { apiClient } from "../lib/api-client.js";

const MainFrame = () => {
  const { currentGroup, messages, setMessages, userInfo } = useAppStore();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  async function getAllMessages() {
    if (!currentGroup?._id) return;
    try {
      const msg = await apiClient.get(`/api/messages/getAllMessages/${currentGroup._id}`);
      setMessages(msg.data.data);
      console.log("this is the messages", msg.data.data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  }

  useEffect(() => {
    getAllMessages();
  }, [currentGroup]);

  const sendMessage = () => {
    // your send logic here
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white shadow-md">
        <h2 className="text-lg font-semibold">
          {currentGroup?.name || "Select a Group"}
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-100 space-y-2">
        {messages && messages.length > 0 ? (
          messages.map((message, idx) => {
            const isOwn = message.sender._id === userInfo?._id;
            return (
              <div
                key={idx}
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg text-sm ${
                  isOwn
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white text-gray-800 mr-auto"
                } shadow`}
              >
                {message.text}
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No messages yet.</p>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 bg-white shadow-inner border-t border-gray-200 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MainFrame;
