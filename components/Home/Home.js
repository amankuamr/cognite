import React, { useState } from "react";
import FriendRequests from "./FriendRequests.js";
import FriendsList from "./FriendsList.js";

export default function Home({ user, onSignOut, onOpenChat }) {
  const [showRequests, setShowRequests] = useState(false);

  return (
    <div className="home-container">
      <header>
        <h2>Welcome, {user.name}</h2>
        <button onClick={onSignOut}>Sign Out</button>
      </header>
      <nav>
        <button onClick={() => setShowRequests(false)}>Chats</button>
        <button onClick={() => setShowRequests(true)}>Friend Requests</button>
      </nav>
      {showRequests ? (
        <FriendRequests user={user} />
      ) : (
        <FriendsList user={user} onOpenChat={onOpenChat} />
      )}
    </div>
  );
}
