import { useEffect, useRef, useState } from "react";


export default function Chat() {
    const [ws,setWs] = useState(null);
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:4030');
        setWs(socket);
        socket.addEventListener('message', handleMessage);
    }, []);

    function handleMessage(e) {
        console.log('New message:', e);
    }

    return(
        <div className= "flex h-screen">
            <div className="bg-white w-1/3">
            contacts
            </div>
            <div className="flex flex-col bg-blue-200 w-2/3 p-4">
            <div className="flex-grow">
                messages with person p 
            </div>
            <div className="flex ">
                <input type= "text" 
                    placeholder="Type your message here" 
                    className = "bg-white flex-grow border p-2"></input>
                    <button className="bg-blue-500 rounded-md text-white p-2 ml-2">Send</button>
                </div>
            </div>
        </div>
    );
}