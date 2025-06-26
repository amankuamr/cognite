import React, { useState } from "react";

// Placeholder for chat messages
const initialMessages = [
  { from: "me", text: "Hi!" },
  { from: "friend", text: "Hello!" },
];

export default function Chat({ user, friend, onBack }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: "me", text: input }]);
    setInput("");
    // In real app, send message to backend (e.g., Firebase)
  };

  return (
    <div className="chat-container">
      <header>
        <button onClick={onBack}>Back</button>
        <h3>Chat with {friend.name}</h3>
      </header>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.from === "me" ? "my-msg" : "their-msg"}>
            {msg.text}
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
