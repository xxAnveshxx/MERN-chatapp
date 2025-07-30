import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4030';
  axios.defaults.withCredentials = true;

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}

export default App