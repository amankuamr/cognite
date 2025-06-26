import React, { useState } from "react";

// Placeholder data for friend requests
const initialRequests = [
  { id: "alice@example.com", name: "Alice" },
  { id: "bob@example.com", name: "Bob" },
];

export default function FriendRequests({ user }) {
  const [requests, setRequests] = useState(initialRequests);
  const [friends, setFriends] = useState([]);

  const acceptRequest = (req) => {
    setFriends([...friends, req]);
    setRequests(requests.filter(r => r.id !== req.id));
    // In real app, update both users' friend lists in backend (e.g., Firebase)
  };

  return (
    <div className="friend-requests">
      <h3>Friend Requests</h3>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul>
          {requests.map(req => (
            <li key={req.id}>
              {req.name} ({req.id})
              <button onClick={() => acceptRequest(req)}>Accept</button>
            </li>
          ))}
        </ul>
      )}
      <h4>Friends (accepted):</h4>
      <ul>
        {friends.map(f => (
          <li key={f.id}>{f.name} ({f.id})</li>
        ))}
      </ul>
    </div>
  );
}
