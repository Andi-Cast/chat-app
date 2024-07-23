# Chat Application

## Overview
This chat application is a real-time messaging platform designed for easy and fun communication between users. With this app, you can send and recieve mesesages instantly, see who's online, and share files with your friends.

## Application Details
This application allows users to send and recieve messages in real-time. Users can see who is online, send text messages, and share files wiht other users.

## Features
- Real-time messaging
- User authentication
- Display online and offline users
- File sharing
- Automatic reconnection on WebSocket disconnection

## Technologies Used
- Visula Studio Code
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Token (JWT) for authenticaion
- WebSocket for real-time communication
- Axios for HTTP requests
- React.js for the front end
- Tailwind CSS for styling
 
## Example Images
- Login/Register Screen:
    - Switching between these two pages is as simple as clicking the 'Register Here' or 'Login Here' under the button.
    - <img src="https://github.com/Andi-Cast/chat-app/blob/main/example-images/login-form.png" height="auto" width="75%">
    - <img src="https://github.com/Andi-Cast/chat-app/blob/main/example-images/register-form.png" height="auto" width="75%">
- Chat Page:
    - Upon logging in or registering, this page will show up displaying all the users and indicating if they are online or not. 
    - <img src="https://github.com/Andi-Cast/chat-app/blob/main/example-images/chat-homepage.png" height="auto" width="75%">
- Messages between users:
    - The blue bubbles and gray text bubbles are used to differentiate which messages belong to who. This example also shows how files are send between the users. 
    - <img src="https://github.com/Andi-Cast/chat-app/blob/main/example-images/chat-conversation.png" height="auto" width="75%">

## Getting Started
### Prerequisites
- Node.js
- MongoDB

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd job-board

2. Install the dependencies:

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

3. Start the server:
    ```bash
    cd api/
    node index.js

4. Open [http://localhost:4000](http://localhost:3000) with your browser to see the result.
