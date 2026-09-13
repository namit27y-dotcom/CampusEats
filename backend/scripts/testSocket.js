import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    socket.emit("joinOrder", 1);

    console.log("Joined order_1");
});

socket.on("orderStatusUpdated", (data) => {
    console.log("Order status updated:", data);
});

socket.on("disconnect", () => {
    console.log("Socket disconnected");
});
