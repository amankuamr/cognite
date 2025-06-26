// Firebase initialization and authentication helpers

const firebaseConfig = {
  apiKey: "AIzaSyBxVKw-wOHARODadHvAU8W2a6HsVoY4GrY",
  authDomain: "androidstudioauth.firebaseapp.com",
  projectId: "androidstudioauth",
  storageBucket: "androidstudioauth.firebasestorage.app",
  messagingSenderId: "540775550758",
  appId: "1:540775550758:web:225001de327fd0bd82bbe7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Sign up with email and password
async function signUpWithEmail(email, password, displayName) {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await userCredential.user.updateProfile({ displayName });
  }
  // Add user to Firestore users collection
  await db.collection('users').doc(userCredential.user.email).set({
    email: userCredential.user.email,
    name: displayName,
    friends: []
  });
  return userCredential.user;
}

// Sign in with email and password
async function signInWithEmail(email, password) {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  return userCredential.user;
}

// Sign out
function signOut() {
  return auth.signOut();
}

// --- Firestore Friend System ---

// Get all users except current
async function getAllUsersExceptCurrent(currentEmail) {
  const users = [];
  const snap = await db.collection('users').get();
  snap.forEach(doc => {
    if (doc.id !== currentEmail) {
      const data = doc.data();
      users.push({
        email: doc.id,
        name: data.name || doc.id.split('@')[0],
        ...data
      });
    }
  });
  return users;
}

// Send friend request
async function sendFriendRequest(fromEmail, toEmail) {
  await db.collection('friend_requests').add({ from: fromEmail, to: toEmail });
}

// Get friend requests for current user
async function getFriendRequestsForUser(email) {
  const reqs = [];
  const snap = await db.collection('friend_requests').where('to', '==', email).get();
  snap.forEach(doc => reqs.push({ id: doc.id, ...doc.data() }));
  return reqs;
}

// Accept friend request
async function acceptFriendRequest(requestId, fromEmail, toEmail) {
  // Only update the current user's (receiver's) friends array
  await db.collection('users').doc(toEmail).update({
    friends: firebase.firestore.FieldValue.arrayUnion(fromEmail)
  });
  // Remove the request
  await db.collection('friend_requests').doc(requestId).delete();

  // Ensure mutual friendship: if sender does not have receiver as friend, send and auto-accept a request back
  const senderDoc = await db.collection('users').doc(fromEmail).get();
  const senderFriends = senderDoc.exists && senderDoc.data().friends ? senderDoc.data().friends : [];
  if (!senderFriends.includes(toEmail)) {
    // Send a friend request from receiver to sender and auto-accept
    const req = await db.collection('friend_requests').add({ from: toEmail, to: fromEmail });
    await db.collection('users').doc(fromEmail).update({
      friends: firebase.firestore.FieldValue.arrayUnion(toEmail)
    });
    await db.collection('friend_requests').doc(req.id).delete();
  }
}

// Get friends for user
async function getFriends(email) {
  const userDoc = await db.collection('users').doc(email).get();
  return userDoc.exists && userDoc.data().friends ? userDoc.data().friends : [];
}

// Export for use in app
window.firebaseApp = firebase.app();
window.firebaseAuth = auth;
window.firebaseDB = db;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signOutFirebase = signOut;
window.getAllUsersExceptCurrent = getAllUsersExceptCurrent;
window.sendFriendRequest = sendFriendRequest;
window.getFriendRequestsForUser = getFriendRequestsForUser;
window.acceptFriendRequest = acceptFriendRequest;
window.getFriends = getFriends;
