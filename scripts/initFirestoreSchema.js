import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_ZFlvregRYQxeT-tiG-x2niZIrs8pBFQ",
  authDomain: "spinnight-project-webapp.firebaseapp.com",
  projectId: "spinnight-project-webapp",
  storageBucket: "spinnight-project-webapp.firebasestorage.app",
  messagingSenderId: "971093363923",
  appId: "1:971093363923:web:c045fb4d97102ed1ce9826",
  measurementId: "G-T35BQ21ZKN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runMigration() {
  console.log("🚀 Starting Firestore Migration & Clean State initialization...");

  try {
    // 1. Check existing rooms
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    console.log(`📁 Found ${roomsSnap.size} existing room document(s) in 'rooms' collection.`);

    // 2. Clean up old monolithic rooms that don't have subcollections or are stale
    for (const rDoc of roomsSnap.docs) {
      const data = rDoc.data();
      // If room has old monolithic structure (e.g. data.players is an array), clean it up
      if (Array.isArray(data.players) || rDoc.id !== 'SPIN99') {
        console.log(`🧹 Deleting old room document: ${rDoc.id}`);
        await deleteDoc(rDoc.ref);
      }
    }

    // 3. Initialize Global Collection: 'leaderboard'
    console.log("🏆 Initializing Global Collection: 'leaderboard'...");
    const sampleChampions = [
      {
        id: 'champ_1',
        playerName: 'NANA (CHAMP)',
        avatar: '1',
        score: 120,
        gameType: 'QUIZ',
        roomName: 'FRIDAY NIGHT VIP',
        roomCode: 'SPIN99',
        achievedAt: serverTimestamp()
      },
      {
        id: 'champ_2',
        playerName: 'POND SPEED',
        avatar: '2',
        score: 105,
        gameType: 'CAR_DODGE',
        roomName: 'CHAOS CLUB',
        roomCode: 'SPIN88',
        achievedAt: serverTimestamp()
      },
      {
        id: 'champ_3',
        playerName: 'MINT MEMORY',
        avatar: '3',
        score: 95,
        gameType: 'MEMORY',
        roomName: 'WINE NIGHT',
        roomCode: 'SPIN77',
        achievedAt: serverTimestamp()
      }
    ];

    for (const champ of sampleChampions) {
      await setDoc(doc(db, 'leaderboard', champ.id), champ);
    }
    console.log("✅ 'leaderboard' collection created with 3 Hall of Fame champions!");

    // 4. Initialize Global Collection: 'punishments'
    console.log("🎲 Initializing Global Collection: 'punishments'...");
    await setDoc(doc(db, 'punishments', 'sample_punishment_1'), {
      roomId: 'SPIN99',
      targetUserId: 'player_loser',
      punishmentText: 'ดื่มเพียว 1 ช็อตในครั้งเดียว!',
      assignedBy: 'host-1',
      assignedAt: serverTimestamp()
    });
    console.log("✅ 'punishments' collection created with sample entry!");

    // 5. Initialize clean 'rooms/SPIN99' with Sub-collections: 'players' and 'gameStates'
    console.log("🏠 Creating new Architecture room: 'rooms/SPIN99'...");
    
    // 5.1 Room Metadata
    await setDoc(doc(db, 'rooms', 'SPIN99'), {
      roomCode: 'SPIN99',
      roomName: 'Friday Night Party',
      hostId: 'host-1',
      mode: 'CLASSIC',
      rounds: 5,
      status: 'waiting',
      gameType: 'SPIN',
      gameStatus: 'LOBBY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 5.2 Sub-collection: rooms/SPIN99/players/host-1
    await setDoc(doc(db, 'rooms', 'SPIN99', 'players', 'host-1'), {
      id: 'host-1',
      name: 'NANA (HOST)',
      avatar: '1',
      avatarId: '1',
      isHost: true,
      isReady: true,
      score: 0,
      joinedAt: serverTimestamp()
    });

    // 5.3 Sub-collection: rooms/SPIN99/gameStates/SPIN
    await setDoc(doc(db, 'rooms', 'SPIN99', 'gameStates', 'SPIN'), {
      gameType: 'SPIN',
      currentRound: 1,
      spinRotation: 0,
      spinStartedAt: null,
      selectedPlayer: null,
      selectedPlayerId: null,
      currentChallenge: null,
      challengeRevealed: false,
      challengeStartedAt: null,
      scores: {},
      punishment: null,
      usedChallengeIds: []
    });

    // 5.4 Sub-collection: rooms/SPIN99/gameStates/QUIZ
    await setDoc(doc(db, 'rooms', 'SPIN99', 'gameStates', 'QUIZ'), {
      gameType: 'QUIZ',
      quizQuestionIds: null,
      quizQuestionIndex: 0,
      quizQuestionStartedAt: null,
      quizStartedAt: null,
      quizDurationSec: 120,
      quizAnswers: {},
      quizStatus: 'PLAYING',
      scores: {},
      punishment: null
    });

    console.log("✅ 'rooms/SPIN99' created with subcollections: 'players' and 'gameStates'!");
    console.log("\n🎉 ALL DONE! Now refresh your Firebase Console in the browser to see:");
    console.log("   - Collection: leaderboard");
    console.log("   - Collection: punishments");
    console.log("   - Collection: rooms");
    console.log("     └─ Document: SPIN99");
    console.log("        ├─ Sub-collection: players (host-1)");
        console.log("        └─ Sub-collection: gameStates (SPIN, QUIZ)");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
}

runMigration();
