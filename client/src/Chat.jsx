import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import uniqBy from "lodash/uniqBy";

export default function Chat() {
    const [ws,setWs] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const {username,id} = useContext(UserContext);
    const [newMessageText, setnewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMessages = useRef();

    useEffect(() => { 
        const socket = new WebSocket('ws://localhost:4030');
        setWs(socket);
        socket.handleMessageWrapper = (ev) => handleMessage(ev);
        socket.addEventListener('message', handleMessage);

        axios.get('/people').then(res => {
            showOnlinePeople(res.data);
        });
    }, []);

    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({userid, username}) => {
            people[userid] = username;
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
            id: Date.now(),
        }]));
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({behavior: 'smooth', block: 'end'});
        }
    }, [messages]);

    const onlinePeopleExclMe = {...onlinePeople};
    delete onlinePeopleExclMe[id];

    const messagesWithoutDupes = uniqBy (messages, 'id');

    return(
        <div className= "flex h-screen">
            <div className="bg-white w-1/3">
                <Logo />
                {Object.keys(onlinePeopleExclMe).map(userId => (
            <div onClick={() => setSelectedUserId(userId)} key={userId}
                className={
                    "border-b border-gray-200 py-2 flex items-stretch cursor-pointer" +
                    (userId === selectedUserId ? " bg-gray-100" : "")
                }>
                {userId === selectedUserId && (
                    <div className="w-1 bg-blue-500 h-10 rounded-r-lg"></div>
                )}
                <div className="flex items-center gap-2 pl-4">
                    <Avatar username={onlinePeople[userId]} userId={userId} />
                    <span className="text-gray-800">{onlinePeople[userId]}</span>
                </div>
            </div>
        ))}
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
                                <div className ={(message.sender === id ? 'text-right':'text-left')}>
                                    <div className={"inline-block p-2 my-2 " + (message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                                        sender: {message.sender}<br />
                                        my id: {id}<br />
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
                    className = "bg-white flex-grow border p-2"></input>
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