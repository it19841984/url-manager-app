import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyAC-45YEmb5IkOA9ZpfCjSPS2boMAGiJHg",
  authDomain: "watchlister2.firebaseapp.com",
  projectId: "watchlister2",
  storageBucket: "watchlister2.firebasestorage.app",
  messagingSenderId: "274869780912",
  appId: "1:274869780912:web:fc718659731e1715695675",
  measurementId: "G-GRNLXCW39Z"
};// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 匿名認証
export const initAuth = async () => {
  try {
    await signInAnonymously(auth);
    console.log('匿名認証成功');
  } catch (error) {
    console.error('認証エラー:', error);
  }
};

// URL アイテム関連の関数
export const urlItemsService = {
  // 全アイテム取得
  async getAll() {
    const q = query(collection(db, 'urlItems'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // アイテム追加
  async add(urlItem) {
    const docRef = await addDoc(collection(db, 'urlItems'), {
      ...urlItem,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: docRef.id,
      ...urlItem
    };
  },

  // アイテム更新
  async update(id, updates) {
    const docRef = doc(db, 'urlItems', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    return { id, ...updates };
  },

  // アイテム削除
  async delete(id) {
    await deleteDoc(doc(db, 'urlItems', id));
    return id;
  }
};
