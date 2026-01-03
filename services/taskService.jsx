import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from './firebaseConfig';

export const TaskService = {
    subscribeTasks: (userId, listId, callback) => {
        const q = query(
            collection(db, "users", userId, "tasks"),
            where("listId", "==", listId)
        );
        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(tasks);
        });
    },
    addTask: async (userId, taskObj) => {
        const taskRef = doc(db, "users", userId, "tasks", taskObj.id);
        return await setDoc(taskRef, taskObj);
    },
    updateTask: async (userId, taskId, updates) => {
        const taskRef = doc(db, "users", userId, "tasks", taskId);
        const cleanData = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        console.log("🔥 FINAL UPDATE:", cleanData);
        return await setDoc(taskRef, cleanData, { merge: true });
    },

    deleteTask: async (userId, taskId) => {
        const taskRef = doc(db, "users", userId, "tasks", taskId);
        return await deleteDoc(taskRef);
    }
};