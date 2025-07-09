import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { apiClient } from "../lib/api-client.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", { withCredentials: true });

const MainFrame = () => {
  const { currentGroup, messages, setMessages, userInfo } = useAppStore();
  const [tempmessages,setTempMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [inCall, setInCall] = useState(false);
const groupRef = useRef(currentGroup);
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};
useEffect(() => {
  scrollToBottom();
}, [tempmessages]);
useEffect(() => {
  groupRef.current = currentGroup;
}, [currentGroup]);
  // Join the Socket.IO room for this group
  useEffect(() => {
  console.log("✅ tempmessages updated:", tempmessages);
}, [tempmessages]);
 useEffect(() => {
  if (!currentGroup?._id) return;

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get(`/api/messages/getAllMessages/${currentGroup._id}`);
      
      setTempMessages(res.data.data);
      console.log(res.data.data);
      console.log("this is the messages after setting",tempmessages);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  fetchMessages();
  socket.emit("join-room", currentGroup._id);

  return () => {
    socket.emit("leave-room", currentGroup._id);
  };
}, [currentGroup]);

useEffect(() => {
  const handleNewMessage = async(messageData) => {
    console.log("📩 Incoming socket message:", messageData);
    console.log("this is the messsagtes",tempmessages)
    setTempMessages((prevMessages) => {
      const updated = [...prevMessages, messageData];
      console.log("🔃 Updated messages:", updated);
      return updated;
    });
    
  };

  socket.on("new-message", handleNewMessage);

  return () => {
    socket.off("new-message", handleNewMessage);
  };
}, []);
const sendMessage = () => {
  if (!text && !image) return;

  const reader = new FileReader();

  const emitMessage = (imageDataUrl = null) => {
    const messagePayload = {
      text,
      image: imageDataUrl,
      sender: userInfo?._id,
      groupId: currentGroup._id,
    };

    socket.emit("send-message", messagePayload);

    setText("");
    setImage(null);
  };

  if (image) {
    reader.onloadend = () => emitMessage(reader.result);
    reader.readAsDataURL(image);
  } else {
    emitMessage();
  }
};


  // ──────────────── Video Call Logic ────────────────

  const startCall = async () => {
    setInCall(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    socket.emit("join-call", currentGroup._id);

    socket.on("new-peer", async ({ from }) => {
      if (peerConnections.current[from]) return;
      const pc = createPeerConnection(from, stream);
      peerConnections.current[from] = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: from, sdp: offer });
    });

    socket.on("offer", async ({ from, sdp }) => {
      if (peerConnections.current[from]) return;
      const pc = createPeerConnection(from, stream);
      peerConnections.current[from] = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });
    });

    socket.on("answer", async ({ from, sdp }) => {
      await peerConnections.current[from]?.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("candidate", async ({ from, candidate }) => {
      await peerConnections.current[from]?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("peer-disconnected", (id) => {
      peerConnections.current[id]?.close();
      delete peerConnections.current[id];
      document.getElementById(`remote-${id}`)?.remove();
    });
  };

  const createPeerConnection = (peerId, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("candidate", { to: peerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      let remoteVideo = document.getElementById(`remote-${peerId}`);
      if (!remoteVideo) {
        remoteVideo = document.createElement("video");
        remoteVideo.id = `remote-${peerId}`;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.className = "w-48 h-36 rounded shadow";
        remoteVideo.srcObject = e.streams[0];
        document.getElementById("remoteVideos").appendChild(remoteVideo);
      }
    };

    return pc;
  };

  // ──────────────── UI ────────────────

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white shadow-md flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {currentGroup?.name || "Select a Group"}
        </h2>
        {!inCall && currentGroup && (
          <button
            className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
            onClick={startCall}
          >
            Join Call
          </button>
        )}
      </div>

      {/* Video Section */}
      {/* Video Section – Only visible in call */}
{inCall && (
  <div className="flex flex-wrap gap-4 bg-black p-2 justify-center items-center">
    <video
      ref={localVideoRef}
      autoPlay
      muted
      className="w-48 h-36 rounded shadow border-2 border-green-500"
    />
    <div id="remoteVideos" className="flex flex-wrap gap-4" />
  </div>
)}

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-100 space-y-2">
        {Array.isArray(tempmessages) && tempmessages.length > 0 ? (
          tempmessages.map((message, idx) => {
            const senderId =
              typeof message.sender === "string"
                ? message.sender
                : message.sender?._id;
            const isOwn = senderId === userInfo?._id;
            return (
              <div
                key={idx}
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg text-sm space-y-2 ${
                  isOwn
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white text-gray-800 mr-auto"
                } shadow`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="uploaded"
                    className="rounded-lg max-w-full h-auto"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No messages yet.</p>
        )}
        <div ref={messagesEndRef} />
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
          type="button"
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
