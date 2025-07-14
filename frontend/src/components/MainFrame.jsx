import React, { use, useEffect, useRef, useState } from "react";
import { Users, Video, Phone, Send, Image, Mic, MicOff, VideoOff, X, PhoneOff } from "lucide-react";
import { useAppStore } from "../store/index.js";
import { apiClient } from "../lib/api-client.js";
import { io } from "socket.io-client";
import GroupDesc from "./GroupDesc.jsx";
import { useLocation } from "react-router-dom";
const socket = io( import.meta.env.MODE==="development"? "http://localhost:8000":"https://grindspace.onrender.com", { withCredentials: true });

const MainFrame = () => {
  const { currentGroup, messages, setMessages, userInfo ,groupUsers,setGroupUsers,showGroupDesc,setshowGroupDesc,addlistener} = useAppStore();
  const [tempmessages, setTempMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [inCall, setInCall] = useState(false);
  const groupRef = useRef(currentGroup);
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const fileInputRef = useRef(null);

    const location = useLocation();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [tempmessages]);

  useEffect(() => {
    return () => {
      if (inCall) {
        // Notify backend
        socket.emit("leave-call", groupRef.current._id);

        // Close all peer connections
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};

        // Stop local media stream
        localStreamRef.current?.getTracks().forEach(track => track.stop());

        // Remove remote video elements
        const remoteContainer = document.getElementById("remoteVideos");
        if (remoteContainer) remoteContainer.innerHTML = "";

        console.log("🧹 Cleanup done on component unmount");
      }
    };
  }, [inCall]);

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
        console.log("this is the messages after setting", tempmessages);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
    socket.emit("join-room", currentGroup._id);

    return () => {
      socket.emit("leave-room", currentGroup._id);
    };
  }, [currentGroup,]);

  useEffect(() => {
    const handleNewMessage = async (messageData) => {
      console.log("📩 Incoming socket message:", messageData);
      console.log("this is the messages", tempmessages);
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
    try {
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
    } catch (error) {
      console.error("Error starting call:", error);
      setInCall(false);
    }
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
        remoteVideo.className = "w-1/3 min-w-[300px] aspect-video rounded-2xl border-4 border-blue-500 shadow-2xl";
        remoteVideo.srcObject = e.streams[0];
        document.getElementById("remoteVideos").appendChild(remoteVideo);
      }
    };

    return pc;
  };

  const endCall = () => {
    // Notify backend first
    socket.emit("leave-call", currentGroup._id);

    // Cleanup peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Stop all local media tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());

    // Clear remote video container
    const remoteContainer = document.getElementById("remoteVideos");
    if (remoteContainer) remoteContainer.innerHTML = "";

    setInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    localStreamRef.current?.getAudioTracks().forEach(track => track.enabled = isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    localStreamRef.current?.getVideoTracks().forEach(track => track.enabled = isVideoOff);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  useEffect(()=>{
    const divHeader = document.getElementById("header");
    if (divHeader) {
    const handleClick = () => {
      setshowGroupDesc(prev => !prev);
      console.log("Header clicked, toggling group description visibility");
    };
      divHeader.addEventListener("click", handleClick);

    return () => {
      divHeader.removeEventListener("click", handleClick);
    };
  }}, [currentGroup,addlistener]);

  useEffect(() => {
    if(showGroupDesc){
      const fetchGroupUsers = async () => {
        try {
          const res = await apiClient.get(`/api/group/getAllUsersInGroup/${currentGroup._id}`);
          console.log("Fetched group users:", res.data.data);
          setGroupUsers(res.data.data);
          console.log("Fetched group users:", res.data.data);
        } catch (error) {
          console.error("Failed to fetch group users", error);
        }
      };
      fetchGroupUsers();
    }
  },[showGroupDesc])
  useEffect(() => {
    setshowGroupDesc(false);
  }, [location.pathname]); 
  if(showGroupDesc){
    return (
      <GroupDesc />
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
   {/* header */}
      <div className="p-4 bg-white shadow-lg border-b border-slate-200 flex justify-between items-center" id="header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {currentGroup?.name || "Select a Group"}
          </h2>
        </div>
        
        {!inCall && currentGroup && (
          <div className="flex space-x-2">
            <button
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-white font-medium transition-all flex items-center space-x-2 shadow-lg"
              onClick={startCall}
            >
              <Video className="w-4 h-4" />
              <span>Join Call</span>
            </button>
          </div>
        )}
      </div>

      {/* Video Section – Only visible in call */}
      {inCall && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 flex flex-wrap items-center justify-center gap-6 p-6 overflow-auto">
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-1/3 min-w-[300px] aspect-video rounded-2xl border-4 border-green-500 shadow-2xl"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                You
              </div>
            </div>
            <div id="remoteVideos" className="flex flex-wrap gap-6 justify-center items-center" />
          </div>

          {/* Call Controls */}
          <div className="bg-gray-900/90 backdrop-blur-sm p-6 flex justify-center gap-4 items-center border-t border-gray-700">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white shadow-lg`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white shadow-lg`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>

            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all shadow-lg"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {Array.isArray(tempmessages) && tempmessages.length > 0 ? (
          tempmessages.map((message, idx) => {
            const senderId =
              typeof message.sender === "string"
                ? message.sender
                : message.sender?._id;
            const isOwn = senderId === userInfo?._id;
            const senderName = typeof message.sender === "object" 
              ? message.sender?.username || "Unknown" 
              : isOwn ? "You" : "Unknown";
            
            return (
              <div
                key={idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm space-y-2 ${
                    isOwn
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  } shadow-lg`}
                >
                  {!isOwn && (
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {senderName}
                    </div>
                  )}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="uploaded"
                      className="rounded-xl max-w-full h-auto shadow-md"
                    />
                  )}
                  {message.text && <p className="leading-relaxed">{message.text}</p>}
                  <div className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"} mt-2`}>
                    {formatTime(message.createdAt || Date.now())}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 bg-white shadow-lg border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Image className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          {image && (
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-sm text-blue-600">Image selected</span>
              <button
                onClick={() => setImage(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <button
            onClick={sendMessage}
            disabled={!text && !image}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all shadow-lg disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainFrame;