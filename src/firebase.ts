import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC3rc29SQoO0Vx36SppNBUcD4aCp5fUwAg',
  authDomain: 'team-10-sg250815064105.firebaseapp.com',
  projectId: 'team-10-sg250815064105',
  storageBucket: 'team-10-sg250815064105.firebasestorage.app',
  messagingSenderId: '202422768680',
  appId: '1:202422768680:web:0ee0de6de02a27c704511d',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { auth }
