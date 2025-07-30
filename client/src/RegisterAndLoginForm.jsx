import axios from "axios";
import { useState, useContext } from "react";
import { UserContext } from "./UserContext";

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

    async function handlesubmit(ev) {
        ev.preventDefault();
        try {
            const url = isLoginOrRegister === 'register' ? '/register' : '/login';
            const {data} = await axios.post(url, {username, password});
            
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            
            setLoggedInUsername(username);
            setId(data.id);
        } catch (error) {
            console.error('Login/Register error:', error);
        }
}

    return (
        <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-900 flex items-center justify-center">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-10 px-4">
                <h2 className="text-emerald-300 text-2xl sm:text-3xl md:text-4xl font-medium mb-3 text-center font-serif">Welcome User!</h2>
                <input
                    value={username}
                    onChange={ev => setUsername(ev.target.value)}
                    type="text"
                    placeholder="Username"
                    className="block w-full rounded-md p-2 mb-2 border border-emerald-400 bg-slate-800 text-emerald-100 placeholder-emerald-200 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 focus:outline-none font-serif"
                />
                <input
                    value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    type="password"
                    placeholder="Password"
                    className="block w-full rounded-md p-2 mb-2 border border-emerald-400 bg-slate-800 text-emerald-100 placeholder-emerald-200 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 focus:outline-none font-serif"
                />
                <button 
                    onClick={handlesubmit}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 block w-full rounded-md p-2 transition-colors duration-200 font-semibold font-serif text-lg">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                <div className="text-white hover:text-white p-2 text-center font-serif">
                    {isLoginOrRegister === 'register' ? (
                        <div>
                            Already a member?{' '}
                            <button type="button" className="underline" onClick={() => setIsLoginOrRegister('login')}>
                                Login Here
                            </button>
                        </div>
                    ) : (
                        <div>
                            Not a member yet?{' '}
                            <button type="button" className="underline" onClick={() => setIsLoginOrRegister('register')}>
                                Register Here
                            </button>
                        </div>
                    )}
                </div>
                </div>
        </div>
    );
}
