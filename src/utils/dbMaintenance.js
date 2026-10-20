/**
 * Database Maintenance & Clean State Migration Utilities for Spinnight-V3
 * Provides safe functions to reset old monolithic documents and clean up stale rooms.
 */
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Delete all sub-collections and documents inside a room
 * @param {string} roomCode 
 */
export const deleteRoomCompletely = async (roomCode) => {
  if (!roomCode) return;
  try {
    const batch = writeBatch(db);

    // 1. Delete all players in subcollection
    const playersSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));
    playersSnap.forEach((pDoc) => {
      batch.delete(pDoc.ref);
    });

    // 2. Delete all gameStates in subcollection
    const gameStatesSnap = await getDocs(collection(db, 'rooms', roomCode, 'gameStates'));
    gameStatesSnap.forEach((gDoc) => {
      batch.delete(gDoc.ref);
    });

    // 3. Delete room metadata document
    const roomRef = doc(db, 'rooms', roomCode);
    batch.delete(roomRef);

    await batch.commit();
    console.log(`[dbMaintenance] Room ${roomCode} completely deleted with all sub-collections.`);
  } catch (error) {
    console.error(`[dbMaintenance] Failed to delete room ${roomCode}:`, error);
  }
};

/**
 * Clean up stale rooms older than maxAgeHours
 * @param {number} maxAgeHours (default: 12 hours)
 */
export const cleanupStaleRooms = async (maxAgeHours = 12) => {
  try {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    
    let cleanedCount = 0;
    for (const roomDoc of roomsSnap.docs) {
      const data = roomDoc.data();
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || 0);

      // Clean rooms that are older than cutoff or have finished status
      if (createdAt < cutoffTime || data.status === 'finished') {
        await deleteRoomCompletely(roomDoc.id);
        cleanedCount++;
      }
    }

    console.log(`[dbMaintenance] Cleaned up ${cleanedCount} stale rooms.`);
    return cleanedCount;
  } catch (error) {
    console.error('[dbMaintenance] Error cleaning up stale rooms:', error);
    return 0;
  }
};

/**
 * Reset local test session data
 */
export const resetLocalSessionData = () => {
  sessionStorage.removeItem('spinnight_room_code');
  sessionStorage.removeItem('spinnight_player_id');
  sessionStorage.removeItem('spinnight_guest_uid');
  console.log('[dbMaintenance] Local session state reset.');
};
