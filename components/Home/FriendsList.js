import React, { useState } from "react";

// Placeholder data for friends
const initialFriends = [
  { id: "charlie@example.com", name: "Charlie" },
  { id: "dana@example.com", name: "Dana" },
];

export default function FriendsList({ user, onOpenChat }) {
  const [friends] = useState(initialFriends);

  return (
    <div className="friends-list">
      <h3>Your Friends</h3>
      {friends.length === 0 ? (
        <p>No friends yet.</p>
      ) : (
        <ul>
          {friends.map(friend => (
            <li key={friend.id}>
              <button onClick={() => onOpenChat(friend)}>{friend.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
