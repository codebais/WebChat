
import { useEffect, useRef, useState } from "react";

function DesktopChat({ chat }) {
  const {
    navigate,
    myProfile,
    groups,
    createGroup,
    requestCount,
    selectedFriend,
    setSelectedFriend,
    selectedGroup,
    setSelectedGroup,
    openGroup,
    groupMessages,
    groupMessage,
    setGroupMessage,
    groupLoading,
    sendGroupMessage,
    groupSelectedFile,
    setGroupSelectedFile,
    groupUploading,
    groupMediaUrls,
    sendGroupMedia,
    search,
    setSearch,
    messages,
    mediaUrls,
    messageStatuses,
    newMessage,
    loading,
    chatError,
    friendTyping,
    onlineUsers,
    messagesContainerRef,
    getPhoto,
    filteredConnections,
    handleTyping,
    sendMessage,
    selectedFile,
    setSelectedFile,
    uploading,
    handleFileSelect,
    sendMedia,
  } = chat;

  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const chatContainerRef = useRef(null);

  const displayedMessages = selectedGroup ? groupMessages : messages;
  const currentFile = selectedGroup ? groupSelectedFile : selectedFile;
  const currentUploading = selectedGroup ? groupUploading : uploading;

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (selectedGroup) {
      setGroupSelectedFile(file);
    } else {
      handleFileSelect({ target: { files: file ? [file] : [] } });
    }

    e.target.value = "";
  };

  const handleMediaSend = () => {
    if (selectedGroup) {
      sendGroupMedia();
    } else {
      sendMedia();
    }
  };

  const handleMediaCancel = () => {
    if (selectedGroup) {
      setGroupSelectedFile(null);
    } else {
      setSelectedFile(null);
    }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      alert("Desktop notifications enabled!");
    } else {
      alert("Please allow notifications in your browser settings.");
    }
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging || !chatContainerRef.current) return;

      const container = chatContainerRef.current;
      const containerRect = container.getBoundingClientRect();

      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 20 && newWidth <= 50) {
        setSidebarWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#111B21] text-[#E9EDEF]">
      <aside className="flex w-[85px] shrink-0 flex-col items-center border-r border-[#2A3942] bg-[#172229] px-2 py-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A884] text-2xl font-bold text-white shadow-lg">
          W
        </div>

        <div className="mt-10 flex w-full flex-col items-center gap-3">
          <button
            onClick={() => {
              setSelectedFriend(null);
              setSelectedGroup(null);
            }}
            title="Chats"
            className="flex w-full flex-col items-center gap-2 rounded-xl bg-[#075E54]/30 py-3 text-[#00A884] transition-colors hover:bg-[#075E54]/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
            </svg>
            <span className="text-[11px] font-semibold">Chats</span>
          </button>

          <button
            onClick={() => navigate("/find-people")}
            title="Explore"
            className="flex w-full flex-col items-center gap-2 rounded-xl py-3 text-[#8696A0] transition-colors hover:bg-[#2A3942] hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
            <span className="text-[11px] font-medium">Explore</span>
          </button>

          <button
            onClick={() => navigate("/connection-requests")}
            title="Requests"
            className="relative flex w-full flex-col items-center gap-2 rounded-xl py-3 text-[#8696A0] transition-colors hover:bg-[#2A3942] hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>

            <span className="text-[11px] font-medium">Requests</span>

            {requestCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00A884] px-1 text-[10px] font-bold text-white">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-auto flex w-full flex-col items-center gap-2">
          <div className="h-px w-10 bg-[#2A3942]"></div>

          <button
            onClick={() => navigate("/my-profile")}
            title="My Profile"
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#00A884]/50 bg-[#075E54] font-semibold text-white transition-all hover:border-[#00A884]"
          >
            {myProfile?.profilePicture ? (
              <img
                src={getPhoto(myProfile.profilePicture)}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              myProfile?.username?.charAt(0).toUpperCase() || "U"
            )}
          </button>

          <span className="max-w-full truncate text-[10px] text-[#8696A0]">
            {myProfile?.username || "Profile"}
          </span>
        </div>
      </aside>

      <div
        ref={chatContainerRef}
        className={`flex min-w-0 flex-1 overflow-hidden ${
          isDragging ? "select-none cursor-col-resize" : ""
        }`}
      >
        <section
          className="relative flex shrink-0 flex-col overflow-hidden border-r border-[#2A3942] bg-[#202C33]"
          style={{ width: `${sidebarWidth}%` }}
        >
          <header className="flex h-[72px] shrink-0 items-center px-5">
            <h1 className="text-2xl font-semibold">Chats</h1>
          </header>

          <div className="shrink-0 px-4 pb-3">
            <input
              type="text"
              placeholder="Search friends and groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-[#2A3942] px-4 py-3 text-sm outline-none"
            />
          </div>

          {/* <div className="px-4 pb-3">
            <button
              onClick={enableNotifications}
              className="w-full rounded-lg bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#008F72]"
            >
              Enable Desktop Notifications
            </button>
          </div> */}

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-[#202C33] [&::-webkit-scrollbar-thumb]:bg-[#2A3942] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#00A884] [scrollbar-width:thin] [scrollbar-color:#2A3942_#202C33]">
            {loading ? (
              <p className="p-6 text-center text-sm text-[#8696A0]">
                Loading chats...
              </p>
            ) : (
              <>
                {groups
                  .filter((group) =>
                    group.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((group) => (
                    <button
                      key={group._id}
                      type="button"
                      onClick={() => openGroup(group)}
                      className={`flex w-full items-center gap-3 border-b border-[#2A3942] px-4 py-4 text-left hover:bg-[#2A3942] ${
                        selectedGroup?._id === group._id ? "bg-[#2A3942]" : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#075E54] text-xl text-white">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="10" cy="7" r="4" />
                          <path d="M20 8a4 4 0 0 1 0 8" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">{group.name}</h3>
                        <p className="mt-1 text-xs text-[#8696A0]">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </button>
                  ))}

                {filteredConnections
                  .filter((item) => {
                    const friend = item.user;
                    const searchText = search.toLowerCase();

                    return (
                      friend.name?.toLowerCase().includes(searchText) ||
                      friend.username?.toLowerCase().includes(searchText)
                    );
                  })
                  .map((item) => {
                    const friend = item.user;

                    return (
                      <button
                        key={item.requestId}
                        onClick={() => {
                          setSelectedGroup(null);
                          setSelectedFriend(friend);
                        }}
                        className={`flex w-full items-center gap-3 border-b border-[#2A3942] px-4 py-4 text-left hover:bg-[#2A3942] ${
                          selectedFriend?._id === friend._id
                            ? "bg-[#2A3942]"
                            : ""
                        }`}
                      >
                        <div
                          className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${
                            onlineUsers.includes(friend._id)
                              ? "border-[#00A884]"
                              : "border-[#8696A0]"
                          } bg-[#075E54] font-semibold`}
                        >
                          {friend.profilePicture ? (
                            <img
                              src={getPhoto(friend.profilePicture)}
                              alt={friend.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            friend.username?.charAt(0).toUpperCase() ||
                            friend.name?.charAt(0).toUpperCase() ||
                            "U"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-medium">
                            {friend.name}
                          </h3>

                          <p className="mt-1 truncate text-xs text-[#8696A0]">
                            @{friend.username || "user"}
                          </p>
                        </div>

                        <span className="hidden text-xs text-[#00A884] lg:inline">
                          Connected
                        </span>
                      </button>
                    );
                  })}

                {filteredConnections.length === 0 && groups.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <h3 className="font-semibold">No chats yet</h3>

                    <p className="mt-2 text-sm text-[#8696A0]">
                      Find people and connect with them.
                    </p>

                    <button
                      onClick={() => navigate("/find-people")}
                      className="mt-5 rounded-lg bg-[#00A884] px-5 py-2 text-sm font-semibold text-white"
                    >
                      Find People
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGroupModal(true)}
            title="Create Group"
            className="absolute bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#00A884] text-3xl text-white shadow-xl transition hover:bg-[#008F72]"
          >
            +
          </button>
        </section>

        <div
          onPointerDown={() => setIsDragging(true)}
          className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-[#2A3942] hover:bg-[#00A884]"
          style={{ touchAction: "none" }}
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1"></div>
        </div>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#111B21]">
          {selectedFriend || selectedGroup ? (
            <>
              <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#2A3942] bg-[#202C33] px-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${
                    selectedGroup
                      ? "border-[#00A884] bg-[#075E54]"
                      : onlineUsers.includes(selectedFriend?._id)
                        ? "border-[#00A884] bg-[#075E54]"
                        : "border-[#8696A0] bg-[#075E54]"
                  }`}
                >
                  {selectedGroup ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="10" cy="7" r="4" />
                      <path d="M20 8a4 4 0 0 1 0 8" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                  ) : selectedFriend?.profilePicture ? (
                    <img
                      src={getPhoto(selectedFriend.profilePicture)}
                      alt={selectedFriend.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedFriend?.username?.charAt(0).toUpperCase() ||
                    selectedFriend?.name?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    {selectedGroup ? selectedGroup.name : selectedFriend.name}
                  </h2>

                  <p
                    className={`text-xs ${
                      selectedGroup || onlineUsers.includes(selectedFriend?._id)
                        ? "text-[#00A884]"
                        : "text-[#8696A0]"
                    }`}
                  >
                    {selectedGroup
                      ? `${selectedGroup.members?.length || 0} members`
                      : onlineUsers.includes(selectedFriend?._id)
                        ? "Online"
                        : "Offline"}
                  </p>
                </div>
              </header>

              <div
                ref={messagesContainerRef}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-[#111B21] [&::-webkit-scrollbar-thumb]:bg-[#2A3942] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#00A884] [scrollbar-width:thin] [scrollbar-color:#2A3942_#111B21]"
              >
                {selectedGroup && groupLoading ? (
                  <p className="m-auto text-sm text-[#8696A0]">
                    Loading group messages...
                  </p>
                ) : displayedMessages.length === 0 ? (
                  <div className="m-auto text-center">
                    <h2 className="text-xl font-semibold">
                      Start a conversation
                    </h2>

                    <p className="mt-2 text-sm text-[#8696A0]">
                      Send your first message to{" "}
                      {selectedGroup ? selectedGroup.name : selectedFriend.name}
                      .
                    </p>
                  </div>
                ) : (
                  displayedMessages.map((message) => {
                    const senderId = message.sender?._id || message.sender;
                    const isMine = senderId === myProfile?._id;

                    const status = message.isRead
                      ? "read"
                      : messageStatuses[message._id] || "sent";

                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] break-words rounded-xl px-4 py-2 ${
                            isMine ? "bg-[#005C4B]" : "bg-[#202C33]"
                          }`}
                        >
                          {selectedGroup && !isMine && (
                            <p className="mb-1 text-xs font-semibold text-[#00A884]">
                              {message.sender?.username ||
                                message.sender?.name ||
                                "User"}
                            </p>
                          )}

                          {!selectedGroup &&
                            message.mediaType &&
                            (mediaUrls?.[message._id] ? (
                              message.mediaType === "image" ? (
                                <img
                                  src={mediaUrls[message._id]}
                                  alt="Shared photo"
                                  className="max-h-72 max-w-full rounded-lg object-contain"
                                />
                              ) : (
                                <video
                                  src={mediaUrls[message._id]}
                                  controls
                                  preload="metadata"
                                  className="max-h-72 max-w-full rounded-lg"
                                />
                              )
                            ) : (
                              <p className="text-xs text-[#8696A0]">
                                Loading media...
                              </p>
                            ))}

                          {selectedGroup &&
                            message.mediaType &&
                            (groupMediaUrls?.[message._id] ? (
                              message.mediaType === "image" ? (
                                <img
                                  src={groupMediaUrls[message._id]}
                                  alt={message.mediaName || "Group image"}
                                  className="mt-2 max-h-64 max-w-xs rounded-lg object-contain"
                                />
                              ) : (
                                <video
                                  src={groupMediaUrls[message._id]}
                                  controls
                                  preload="metadata"
                                  className="mt-2 max-h-64 max-w-xs rounded-lg"
                                />
                              )
                            ) : (
                              <p className="mt-2 text-sm text-gray-400">
                                Loading media...
                              </p>
                            ))}

                          {message.text && (
                            <p className="whitespace-pre-wrap text-sm">
                              {message.text}
                            </p>
                          )}

                          {!selectedGroup && isMine && (
                            <div className="mt-1 flex justify-end">
                              <span
                                className={`text-xs font-semibold ${
                                  status === "read"
                                    ? "text-[#53BDEB]"
                                    : "text-[#AEBAC1]"
                                }`}
                              >
                                {status === "sent" ? "✓" : "✓✓"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {chatError && (
                  <p className="text-center text-sm text-red-400">
                    {chatError}
                  </p>
                )}

                {!selectedGroup && friendTyping && (
                  <div className="flex animate-in fade-in duration-200 justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-[#2A3942] bg-[#202C33] px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:0ms]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:150ms]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#8696A0] [animation-delay:300ms]"></span>
                      </div>

                      <span className="text-xs text-[#8696A0]">
                        {selectedFriend?.username || selectedFriend?.name} is
                        typing
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={selectedGroup ? sendGroupMessage : sendMessage}
                className="flex shrink-0 flex-col gap-2 border-t border-[#2A3942] bg-[#202C33] p-4"
              >
                {currentFile && (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-[#2A3942] p-3">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {currentFile.name}
                    </span>

                    <button
                      type="button"
                      onClick={handleMediaCancel}
                      disabled={currentUploading}
                      className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-[#354650] disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleMediaSend}
                      disabled={currentUploading}
                      className="rounded-lg bg-[#00A884] px-4 py-2 text-sm font-medium text-white hover:bg-[#008F72] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {currentUploading ? "Uploading..." : "Send"}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#2A3942] text-[#00A884] hover:bg-[#354650]">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleAttachmentChange}
                    />

                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </label>

                  <input
                    type="text"
                    value={selectedGroup ? groupMessage : newMessage}
                    onChange={
                      selectedGroup
                        ? (e) => setGroupMessage(e.target.value)
                        : handleTyping
                    }
                    placeholder={
                      selectedGroup
                        ? "Message to group..."
                        : "Type a message..."
                    }
                    className="min-w-0 flex-1 rounded-full bg-[#2A3942] px-5 py-3 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    disabled={
                      selectedGroup
                        ? !groupMessage.trim()
                        : !newMessage.trim()
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white hover:bg-[#008F72] disabled:opacity-50"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-md px-6 text-center">
                <h2 className="text-2xl font-semibold">Welcome to WebChat</h2>

                <p className="mt-3 text-sm text-[#8696A0]">
                  Select a friend or group from your chat list to open a
                  conversation.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2A3942] bg-[#202C33] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Create New Group
              </h2>

              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="text-2xl text-[#8696A0]"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              maxLength={50}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-4 w-full rounded-lg bg-[#2A3942] px-4 py-3 text-white outline-none"
            />

            <h3 className="mb-3 text-sm font-semibold text-[#AEBAC1]">
              Select group members
            </h3>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {filteredConnections.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#8696A0]">
                  No connected friends available.
                </p>
              ) : (
                filteredConnections.map((item) => {
                  const friend = item.user;
                  const isSelected = selectedMembers.includes(friend._id);

                  return (
                    <label
                      key={item.requestId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-[#2A3942]"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedMembers((previous) =>
                            isSelected
                              ? previous.filter((id) => id !== friend._id)
                              : [...previous, friend._id]
                          );
                        }}
                        className="h-4 w-4 accent-[#00A884]"
                      />

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#075E54] font-semibold text-white">
                        {friend.username?.charAt(0).toUpperCase() || "U"}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          {friend.name}
                        </p>
                        <p className="text-xs text-[#8696A0]">
                          @{friend.username}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <button
              type="button"
              disabled={!groupName.trim() || selectedMembers.length === 0}
              onClick={async () => {
                const success = await createGroup(groupName, selectedMembers);

                if (success) {
                  setGroupName("");
                  setSelectedMembers([]);
                  setShowGroupModal(false);
                }
              }}
              className="mt-5 w-full rounded-lg bg-[#00A884] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesktopChat;
