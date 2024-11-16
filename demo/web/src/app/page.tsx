"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { socket } from "@/socket";
import { CommandDetail, CommandLog, CommandStatusUpdate } from '@/lib';

export default function Home() {
  const router = useRouter(); 

  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }
  
    // function onStatusEvent(c: CommandStatusUpdate) {
    //   console.log('onStatusEvent: ' + JSON.stringify(c, null, 4));
    // }

    // function onLogEvent(v: CommandLog) {
    //   console.log('onLogEvent: ' + JSON.stringify(v, null, 4));
    // }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
      console.log("Connected to the server");

      // socket.on("status", onStatusEvent);
      // socket.emit("status", 3);

      // socket.on("log", onLogEvent);
      // socket.emit("log", 3);
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
      console.log("Disconnected from the server");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
   router.push('/repos');
  }, [router]);

  return null;
  // return <div>
  //   <p>Status: { isConnected ? "connected" : "disconnected" }</p>
  //   <p>Transport: { transport }</p>
  // </div>
}
