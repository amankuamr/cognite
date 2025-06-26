// All-in-one App.js for browser (no JSX, no imports)
const { useState } = React;

function SignIn({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return React.createElement(
    'form',
    {
      className: 'signin-form',
      onSubmit: async e => {
        e.preventDefault();
        setError("");
        try {
          const user = await window.signInWithEmail(email, password);
          onSignIn({ id: user.email, name: user.displayName || user.email.split('@')[0] });
        } catch (err) {
          setError(err.message || "Sign in failed");
        }
      }
    },
    React.createElement('h2', null, 'Sign In'),
    React.createElement('input', {
      type: 'email', placeholder: 'Email', value: email, required: true,
      onChange: e => setEmail(e.target.value)
    }),
    React.createElement('input', {
      type: 'password', placeholder: 'Password', value: password, required: true,
      onChange: e => setPassword(e.target.value)
    }),
    error && React.createElement('div', { style: { color: '#fc5c7d', fontSize: '0.97rem', marginTop: '-0.7rem' } }, error),
    React.createElement('button', { type: 'submit' }, 'Sign In')
  );
}

function SignUp({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return React.createElement(
    'form',
    {
      className: 'signup-form',
      onSubmit: async e => {
        e.preventDefault();
        setError("");
        try {
          const user = await window.signUpWithEmail(email, password, name);
          onSignIn({ id: user.email, name: user.displayName || name });
        } catch (err) {
          setError(err.message || "Sign up failed");
        }
      }
    },
    React.createElement('h2', null, 'Sign Up'),
    React.createElement('input', {
      type: 'text', placeholder: 'Name', value: name, required: true,
      onChange: e => setName(e.target.value)
    }),
    React.createElement('input', {
      type: 'email', placeholder: 'Email', value: email, required: true,
      onChange: e => setEmail(e.target.value)
    }),
    React.createElement('input', {
      type: 'password', placeholder: 'Password', value: password, required: true,
      onChange: e => setPassword(e.target.value)
    }),
    error && React.createElement('div', { style: { color: '#fc5c7d', fontSize: '0.97rem', marginTop: '-0.7rem' } }, error),
    React.createElement('button', { type: 'submit' }, 'Sign Up')
  );
}

function Auth({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  return React.createElement(
    'div', { className: 'auth-container' },
    mode === 'signin'
      ? [
          React.createElement(SignIn, { onSignIn, key: 'signin' }),
          React.createElement('p', { key: 'switch' },
            "Don't have an account? ",
            React.createElement('button', { onClick: () => setMode('signup') }, 'Sign Up')
          )
        ]
      : [
          React.createElement(SignUp, { onSignIn, key: 'signup' }),
          React.createElement('p', { key: 'switch' },
            'Already have an account? ',
            React.createElement('button', { onClick: () => setMode('signin') }, 'Sign In')
          )
        ]
  );
}

function FriendRequests({ user, onAccept }) {
  const [requests, setRequests] = useState([]);
  React.useEffect(() => {
    if (user && user.id) {
      window.getFriendRequestsForUser(user.id).then(setRequests);
    }
  }, [user]);
  return React.createElement(
    'div', { className: 'friend-requests' },
    React.createElement('h3', null, 'Friend Requests'),
    requests.length === 0
      ? React.createElement('p', null, 'No pending requests.')
      : React.createElement('ul', null,
          requests.map(req =>
            React.createElement('li', { key: req.id },
              req.from,
              React.createElement('button', {
                onClick: async () => {
                  await window.acceptFriendRequest(req.id, req.from, user.id);
                  setRequests(requests.filter(r => r.id !== req.id));
                  onAccept({ id: req.from, name: req.from });
                }
              }, 'Accept')
            )
          )
        )
  );
}

function FriendsList({ friends, onOpenChat }) {
  const [menuOpen, setMenuOpen] = React.useState(null); // email of open menu
  const [recentMessages, setRecentMessages] = React.useState({});
  const defaultAvatar = "https://ui-avatars.com/api/?background=25d366&color=fff&name=User";

  // Fetch recent message for each friend
  React.useEffect(() => {
    let unsubscribes = [];
    if (window.firebaseAuth.currentUser && friends.length > 0) {
      const userEmail = window.firebaseAuth.currentUser.email;
      friends.forEach(friend => {
        const chatId = [userEmail, friend.id].sort().join('_');
        const unsub = window.firebaseDB.collection('chats').doc(chatId)
          .collection('messages').orderBy('ts', 'desc').limit(1)
          .onSnapshot(async snap => {
            if (!snap.empty) {
              const doc = snap.docs[0];
              const data = doc.data();
              // Decrypt message
              const key = await deriveKey(userEmail, friend.id);
              const text = await decryptMsg(key, data.encrypted);
              setRecentMessages(prev => ({ ...prev, [friend.id]: text }));
            } else {
              setRecentMessages(prev => ({ ...prev, [friend.id]: "No messages yet." }));
            }
          });
        unsubscribes.push(unsub);
      });
    }
    return () => { unsubscribes.forEach(u => u && u()); };
  }, [friends]);

  // Remove friend handler
  async function removeFriend(email) {
    const user = window.firebaseAuth.currentUser;
    if (!user) return;
    try {
      await window.firebaseDB.collection('users').doc(user.email).update({
        friends: firebase.firestore.FieldValue.arrayRemove(email)
      });
    } catch (err) {
      alert('Failed to delete friend: ' + (err.message || err));
    }
    setMenuOpen(null);
  }

  return React.createElement(
    'div', { className: 'friends-list' },
    React.createElement('h3', null, 'Your Friends'),
    friends.length === 0
      ? React.createElement('p', null, 'No friends yet.')
      : React.createElement('ul', { className: 'friend-cards' },
          friends.map(friend =>
            React.createElement('li', { key: friend.id, className: 'friend-card' },
              React.createElement('button', {
                className: 'friend-info',
                onClick: () => onOpenChat(friend)
              },
                React.createElement('img', {
                  src: defaultAvatar,
                  alt: 'Profile',
                  className: 'friend-avatar friend-avatar-inline'
                }),
                React.createElement('span', { className: 'friend-name' }, friend.name),
                React.createElement('span', { className: 'friend-message-inline' }, recentMessages[friend.id] || "No messages yet.")
              ),
              React.createElement('button', {
                className: 'friend-menu-btn',
                onClick: e => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === friend.id ? null : friend.id);
                }
              }, '⋮'),
              menuOpen === friend.id && React.createElement('div', { className: 'friend-menu' },
                React.createElement('button', {
                  className: 'friend-menu-delete',
                  onClick: () => removeFriend(friend.id)
                }, 'Delete'),
                React.createElement('button', {
                  className: 'friend-menu-delete-chats',
                  onClick: async () => {
                    // Delete all chats with this friend
                    const userEmail = window.firebaseAuth.currentUser.email;
                    const chatId = [userEmail, friend.id].sort().join('_');
                    const snap = await window.firebaseDB.collection('chats').doc(chatId).collection('messages').get();
                    const batch = window.firebaseDB.batch();
                    snap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    setMenuOpen(null);
                  }
                }, 'Delete all chats')
              )
            )
          )
        )
  );
}

function FindFriends({ user, friends, pendingRequests, onSendRequest }) {
  const [allUsers, setAllUsers] = useState([]);
  const [sent, setSent] = useState([]);
  React.useEffect(() => {
    if (user && user.id) {
      window.getAllUsersExceptCurrent(user.id).then(users => {
        console.log('FindFriends: users from Firestore:', users);
        setAllUsers(Array.isArray(users) ? users : []);
      });
    }
  }, [user]);
  const friendIds = (friends || []).map(f => (typeof f === 'string' ? f : f.id || f.email)).filter(Boolean);
  const pendingIds = (pendingRequests || []).map(r => (typeof r === 'string' ? r : r.id || r.email)).filter(Boolean);
  // Remove users who are already friends or have a pending request (sent or received)
  const candidates = (allUsers || []).filter(u => {
    const email = u.email;
    if (!email || email === user.id) return false;
    if (friendIds.includes(email)) return false;
    if (pendingIds.includes(email)) return false;
    // Also check if the user has sent a request to the current user
    if ((pendingRequests || []).some(r => (r.from === email && r.to === user.id) || (r.from === user.id && r.to === email))) return false;
    return true;
  });

  return React.createElement(
    'div', { className: 'friends-list' },
    React.createElement('h3', null, 'Find Friends'),
    candidates.length === 0
      ? React.createElement('p', null, 'No users to add.')
      : React.createElement('ul', null,
          candidates.map(candidate =>
            React.createElement('li', { key: candidate.email },
              (typeof candidate.name === 'string' && /[a-zA-Z]/.test(candidate.name) && candidate.name.trim() !== '' ? candidate.name : candidate.email), ' (', candidate.email, ') ',
              sent.includes(candidate.email)
                ? React.createElement('span', { style: { color: '#25d366', fontWeight: 600, marginLeft: 8, transition: 'color 0.3s' } }, 'Request Sent!')
                : React.createElement('button', {
                    onClick: async () => {
                      setSent([...sent, candidate.email]);
                      await window.sendFriendRequest(user.id, candidate.email);
                      onSendRequest(candidate);
                    },
                    style: { transition: 'background 0.2s, color 0.2s' }
                  }, 'Send Request')
            )
          )
        )
  );
}

// --- AES ENCRYPTION HELPERS (demo, not production secure) ---
async function deriveKey(email1, email2) {
  // Sort emails to get a consistent key for both users
  const sorted = [email1, email2].sort().join(':');
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', enc.encode(sorted), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('cognite-chat'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
async function encryptMsg(key, text) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(text)
  );
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext))
  };
}
async function decryptMsg(key, encMsg) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const iv = new Uint8Array(encMsg.iv);
  const data = new Uint8Array(encMsg.data);
  try {
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data
    );
    return dec.decode(plaintext);
  } catch {
    return '[decryption failed]';
  }
}

function Chat({ user, friend, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatId = [user.id, friend.id].sort().join('_');
  const [key, setKey] = useState(null);
  const messagesEndRef = React.useRef(null);

  // Derive key on mount
  React.useEffect(() => {
    deriveKey(user.id, friend.id).then(setKey);
  }, [user, friend]);

  // Listen for messages in Firestore
  React.useEffect(() => {
    if (!key) return;
    const unsub = window.firebaseDB.collection('chats').doc(chatId)
      .collection('messages').orderBy('ts')
      .onSnapshot(async snap => {
        const msgs = [];
        for (const doc of snap.docs) {
          const data = doc.data();
          const text = await decryptMsg(key, data.encrypted);
          msgs.push({ from: data.from, text });
        }
        setMessages(msgs);
      });
    return () => unsub();
  }, [key, chatId]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send encrypted message
  async function sendMsg(e) {
    e.preventDefault();
    if (!input.trim() || !key) return;
    const encrypted = await encryptMsg(key, input);
    await window.firebaseDB.collection('chats').doc(chatId)
      .collection('messages').add({
        from: user.id,
        encrypted,
        ts: Date.now()
      });
    setInput("");
  }

  return React.createElement(
    'div', { className: 'chat-container' },
    React.createElement('header', { className: 'home-header' },
      React.createElement('button', { onClick: onBack, className: 'back-btn' }, '←'),
      React.createElement('span', { className: 'chat-friend-header' },
        React.createElement('span', { className: 'chat-friend-name chat-friend-name-right' }, friend.name),
        React.createElement('span', { className: 'chat-friend-username' }, friend.id.split('@')[0])
      )
    ),
    React.createElement('div', { className: 'chat-messages' },
      messages.map((msg, idx) =>
        React.createElement('div', {
          key: idx,
          className: msg.from === user.id ? "my-msg" : "their-msg"
        }, msg.text)
      ),
      React.createElement('div', { ref: messagesEndRef })
    ),
    React.createElement('form', {
      className: 'chat-input',
      onSubmit: sendMsg
    },
      React.createElement('input', {
        type: 'text', value: input, placeholder: 'Type a message...',
        onChange: e => setInput(e.target.value)
      }),
      React.createElement('button', { type: 'submit' }, 'Send')
    )
  );
}

function Home({ user, onSignOut, onOpenChat, friends, setFriends, pendingRequests, setPendingRequests }) {
  const [tab, setTab] = useState('chats'); // chats, requests, find
  return React.createElement(
    'div', { className: 'home-container' },
    React.createElement('header', { className: 'home-header' },
      React.createElement('div', { className: 'header-left' },
        React.createElement('span', { className: 'brand' }, 'Cognit')
      ),
      React.createElement('div', { className: 'header-right' },
        React.createElement('span', { className: 'user-name' }, user.name),
        React.createElement('span', { className: 'user-username' }, user.id.split('@')[0]),
        React.createElement('button', { onClick: onSignOut }, 'Sign Out')
      )
    ),
    tab === 'requests'
      ? React.createElement(FriendRequests, {
          user,
          onAccept: req => setFriends([...friends, req])
        })
      : tab === 'find'
        ? React.createElement(FindFriends, {
            user,
            friends,
            pendingRequests,
            onSendRequest: candidate => setPendingRequests([...pendingRequests, candidate])
          })
        : React.createElement(FriendsList, {
            friends,
            onOpenChat
          }),
    React.createElement('footer', { className: 'bottom-nav' },
      React.createElement('button', {
        className: tab === 'chats' ? 'active' : '',
        onClick: () => setTab('chats')
      }, 'Chats'),
      React.createElement('button', {
        className: tab === 'requests' ? 'active' : '',
        onClick: () => setTab('requests')
      }, 'Requests'),
      React.createElement('button', {
        className: tab === 'find' ? 'active' : '',
        onClick: () => setTab('find')
      }, 'Add')
    )
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("auth");
  const [chatWith, setChatWith] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Listen for Firebase auth state changes
  React.useEffect(() => {
    const unsubscribe = window.firebaseAuth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.email, name: firebaseUser.displayName || firebaseUser.email.split('@')[0] });
        setCurrentScreen("home");
      } else {
        setUser(null);
        setCurrentScreen("auth");
      }
    });
    return () => unsubscribe();
  }, []);

  // Always fetch friends from Firestore for the current user
  React.useEffect(() => {
    if (user && user.id) {
      window.getFriends(user.id).then(friendEmails => {
        if (!Array.isArray(friendEmails) || friendEmails.length === 0) {
          setFriends([]);
          return;
        }
        // Remove duplicate emails
        const uniqueEmails = Array.from(new Set(friendEmails));
        Promise.all(uniqueEmails.map(email =>
          window.firebaseDB.collection('users').doc(email).get()
        )).then(snaps => {
          setFriends(snaps.filter(doc => doc.exists).map(doc => ({ id: doc.id, ...doc.data() })));
        });
      });
    } else {
      setFriends([]);
    }
  }, [user, currentScreen]);

  return React.createElement(
    'div', null,
    currentScreen === "auth" && React.createElement(Auth, {
      onSignIn: userData => {
        setUser(userData);
        setCurrentScreen("home");
      }
    }),
    currentScreen === "home" && user && React.createElement(Home, {
      user,
      onSignOut: () => {
        window.signOutFirebase();
        setUser(null);
        setCurrentScreen("auth");
      },
      onOpenChat: friend => {
        setChatWith(friend);
        setCurrentScreen("chat");
      },
      friends,
      setFriends,
      pendingRequests,
      setPendingRequests
    }),
    currentScreen === "chat" && user && chatWith && React.createElement(Chat, {
      user,
      friend: chatWith,
      onBack: () => {
        setCurrentScreen("home");
        setChatWith(null);
      }
    })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
