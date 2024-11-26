"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { socket } from "@/socket";

export default function Home() {
  const router = useRouter();

  const [, setIsConnected] = useState(false);
  const [, setTransport] = useState("N/A");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
      console.log("Connected to the server");
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
}
