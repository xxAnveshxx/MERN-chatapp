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
        const url = isLoginOrRegister === 'register' ? '/register' : '/login';
        const {data} = await axios.post(url, {username, password});
            setLoggedInUsername(username);
            setId(data.id);
        }

    return (
        <div className="h-screen bg-gradient-to-r from-purple-900 via-pink-700 to-yellow-500 flex items-center justify-center">
            <form className="w-64 mx-auto mb-10" onSubmit={handlesubmit}>
                <input
                    value={username}
                    onChange={ev => setUsername(ev.target.value)}
                    type="text"
                    placeholder="username"
                    className="block w-full rounded-md p-2 mb-2 border"
                />
                <input
                    value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    type="password"
                    placeholder="password"
                    className="block w-full rounded-md p-2 mb-2 border"
                />
                <button className="bg-purple-500 text-white block w-full rounded-md p-2">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                <div className="text-center mt-2 text-white">
                    {isLoginOrRegister === 'register' ? (
                        <div>
                            Already a member?{' '}
                            <button type="button" onClick={() => setIsLoginOrRegister('login')}>
                                Login Here
                            </button>
                        </div>
                    ) : (
                        <div>
                            Not a member yet?{' '}
                            <button type="button" onClick={() => setIsLoginOrRegister('register')}>
                                Register Here
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
