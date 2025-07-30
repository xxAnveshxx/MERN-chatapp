import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import uniqBy from "lodash/uniqBy";
import Contact from "./Contact";

export default function Chat() {
    const [ws,setWs] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const {username,id,setId,setUsername} = useContext(UserContext);
    const [newMessageText, setnewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMessages = useRef();
    const [allMessages, setAllMessages] = useState([]);
    const [offlinePeople, setOfflinePeople] = useState([]);

    useEffect(() => { 
        connectToWebSocket();
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id);

            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p;
            });
            setOfflinePeople(offlinePeople);
        });
    }, []);

    function connectToWebSocket() {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4030';
        const socket = new WebSocket(wsUrl);
        setWs(socket);
        socket.handleMessageWrapper = (ev) => handleMessage(ev);
        socket.addEventListener('message', handleMessage);
        socket.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Reconnecting to WebSocket...');
                connectToWebSocket();
            },1000);
        });
    }

    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({userId, username}) => {
            people[userId] = {username};
        });
        setOnlinePeople(people);
    }   

    function handleMessage(ev) {
        console.log({ev,messageData : ev.data});
        const messageData = JSON.parse(ev.data);
        if('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            setAllMessages(prev => [...prev, messageData]);
        }
    }

    function sendMessage(ev, file = null) {
        if (ev) ev.preventDefault();
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                text: newMessageText,
                recipient: selectedUserId,
                file,
            }));
            setnewMessageText('');
        } else {
            console.log('WebSocket not connected');
        }
    }

    function sendFile(ev) {
        const reader = new FileReader();
        reader.readAsDataURL(ev.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,
            });
        };
    }

    function logout(){
        axios.post('/logout').then(() => {
            setId(null);
            setUsername(null);
            setWs(null);
            setSelectedUserId(null);
        });
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({behavior: 'smooth', block: 'end'});
        }
    }, [messages]);

    useEffect(() => {
        if(selectedUserId){
            axios.get('/messages/' + selectedUserId).then(res => {
                const apiMessages = res.data;
                const relevantRealTimeMessages = allMessages.filter(msg => 
                    (msg.sender === id && msg.recipient === selectedUserId) ||
                    (msg.sender === selectedUserId && msg.recipient === id)
                );
                const allRelevantMessages = [...apiMessages, ...relevantRealTimeMessages];
                const uniqueMessages = uniqBy(allRelevantMessages, '_id');
                setMessages(uniqueMessages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));
            });
        }
    }, [selectedUserId, allMessages])

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id) 
                .filter(p => !Object.keys(onlinePeople).includes(p._id)); 

            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p;
            });

            setOfflinePeople(offlinePeople);
        });
    }, [onlinePeople, id]);

    const onlinePeopleExclMe = {...onlinePeople};
    delete onlinePeopleExclMe[id];

    const messagesWithoutDupes = uniqBy(messages, '_id');

    return(
        <div className= "flex h-screen">
            <div className="bg-slate-100 w-1/3 flex flex-col border-r border-emerald-400">
            <div className="flex-grow">
                <Logo />
                {Object.keys(onlinePeopleExclMe).map(userId => (
                    <Contact 
                    key={userId}
                    id={userId}
                    online={true}
                    username={onlinePeopleExclMe[userId].username}
                    selected={userId === selectedUserId}
                    onClick={() => setSelectedUserId(userId)} 
                    />  
                ))}
                {Object.keys(offlinePeople).map(userId => (
                    <Contact 
                    key={userId}
                    id={userId}
                    online={false}
                    username={offlinePeople[userId].username}
                    selected={userId === selectedUserId}
                    onClick={() => setSelectedUserId(userId)} 
                    />
                ))}
            </div>
            <div className= "p-2 text-center flex items-center justify-between border-t border-emerald-400">
                <span className="mr-2 text-md flex items-center text-slate-800 font-serif">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    {username}
                    </span>
                <button
                    onClick={() => {
                        logout();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-md p-2 flex items-center gap-2 mx-auto transition-colors duration-200 font-semibold font-serif">
                    Logout
                </button>
            </div>
            </div>
            <div className="flex flex-col bg-slate-200 w-2/3 p-4">
            <div className="flex-grow">
                {!selectedUserId && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-slate-700 text-lg font-serif">Select a user to start chatting</div>
                    </div>
                )}
                {!!selectedUserId && (
                    <div className="relative h-full">
                        <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-16 px-2">
                            {messagesWithoutDupes.map(message => (
                                <div key={message._id} className ={(message.sender === id ? 'text-right':'text-left')}>
                                    <div className={"inline-block p-2 my-2 rounded-lg font-serif " + (message.sender === id ? 'bg-emerald-600 text-white':'bg-white text-slate-800 border border-emerald-200')}>
                                        {message.text}
                                        {message.file && (
                                            <div className="">
                                                <a target="_blank" className="flex items-center gap-1 border-b border-emerald-300" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                                                    </svg>
                                                    {message.file}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={divUnderMessages}></div>
                        </div>
                    </div>
                )} 
            </div>
            {!!selectedUserId && (
                <form className="flex gap-2" onSubmit={sendMessage}>
                <input type= "text"
                       value={newMessageText}
                       onChange ={ev => setnewMessageText(ev.target.value)} 
                    placeholder="Type your message here" 
                    className = "bg-white flex-grow border border-emerald-400 rounded p-2 text-slate-800 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-serif"></input>
                    <label className="bg-emerald-500 hover:bg-emerald-400 p-2 text-slate-900 cursor-pointer rounded-sm border border-emerald-400 transition-colors duration-200">
                        <input type="file" className="hidden" onChange={sendFile} />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                        </svg>
                    </label>
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 rounded-md text-slate-900 p-2 ml-2 transition-colors duration-200 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
            )}
            
            </div>
        </div>
    );
}