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
    const {username,id} = useContext(UserContext);
    const [newMessageText, setnewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMessages = useRef();
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
        const socket = new WebSocket('ws://localhost:4030');
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
        } else if('text' in messageData) {
            setMessages(prev => ([...prev, {...messageData}]));
        }
    }

    function sendMessage(ev) {
        ev.preventDefault();
        ws.send(JSON.stringify({
                text: newMessageText,
                recipient: selectedUserId,
        }));
        setnewMessageText('');
        setMessages(prev => ([...prev, {
            sender: id,
            text: newMessageText, 
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
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
                const {data} = res;
                setMessages(data);
            });
        }
    }, [selectedUserId])

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
            <div className="bg-white w-1/3 flex flex-col">
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
            <div>links</div>
            </div>
            <div className="flex flex-col bg-blue-200 w-2/3 p-4">
            <div className="flex-grow">
                {!selectedUserId && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 text-lg">Select a user to start chatting</div>
                    </div>
                )}
                {!!selectedUserId && (
                    <div className="relative h-full">
                        <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-16">
                            {messagesWithoutDupes.map(message => (
                                <div key={message._id} className ={(message.sender === id ? 'text-right':'text-left')}>
                                    <div className={"inline-block p-2 my-2 rounded-lg " + (message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                                        {message.text}
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
                    className = "bg-white flex-grow border p-2 rounded"></input>
                    <button type="submit" className="bg-blue-500 rounded-md text-white p-2 ml-2">
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