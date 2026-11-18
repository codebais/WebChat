# WebChat Application

Welcome to **WebChat**! This is a real-time chat application where users
can connect with friends and exchange messages, photos, and videos.

This README explains what the project does, which technologies it uses,
and how to run it on your computer.

## 1. What can you do with WebChat?

-   Create an account and log in.
-   Verify your email using an OTP.
-   Set up your profile with a username, bio, date of birth, and profile
    picture.
-   Find other users and send connection requests.
-   Accept connection requests and start chatting.
-   Send and receive messages instantly.
-   See when a friend is online or offline.
-   See when someone is typing.
-   See read receipts for messages.
-   Share photos and videos in a chat.
-   View shared videos in the chat.

## 2. Technologies used

Here is a simple explanation of the main technologies used in this
project.

  Technology     What it is used for
  -------------- ----------------------------------------------------
  React          Builds the screens and buttons users interact with
  Vite           Runs the React frontend during development
  Tailwind CSS   Styles the application
  Node.js        Runs the backend JavaScript code
  Express.js     Creates backend API routes
  MongoDB        Stores users, connections, and messages
  Mongoose       Helps the backend work with MongoDB
  Socket.IO      Sends messages and updates instantly
  JWT            Helps protect routes and identify logged-in users
  Nodemailer     Sends OTP emails
  Multer         Receives uploaded files
  Sharp          Compresses images
  FFmpeg         Compresses videos
  Wasabi         Stores compressed photos and videos online

## 3. How the project is organised

The project has two main folders:

``` text
webChatApplication/
│
├── backend/       # Server, APIs, database and media handling
│
├── frontend/      # React pages and user interface
│
└── README.md      # Project information and setup guide
```

Some important backend files and folders:

``` text
backend/
├── config/        # Database and Wasabi configuration
├── middleware/    # Authentication checks
├── models/        # MongoDB data models
├── routes/        # API routes
├── utils/         # Image and video compression code
├── server.js      # Starts the backend server
└── package.json   # Backend packages and commands
```

Some important frontend folders:

``` text
frontend/
└── src/
    ├── components/  # Reusable interface components
    ├── hooks/       # Shared React logic
    ├── pages/       # Application pages
    └── ...
```

Your project may contain additional files and folders.

## 4. What you need before starting

Install or prepare these:

1.  **Node.js and npm** -- to run the frontend and backend.
2.  **MongoDB** -- to store application data. You can use MongoDB Atlas
    or a local MongoDB database.
3.  **Wasabi account and bucket** -- to store compressed media files.
4.  **Email account with SMTP/app-password settings** -- to send OTP
    emails.

## 5. How to run the project

You need two terminals: one for the backend and one for the frontend.

### Step 1: Open the project

Open the `webChatApplication` folder in VS Code.

### Step 2: Install backend packages

Open a terminal and run:

``` bash
cd backend
npm install
```

### Step 3: Add your backend settings

Inside the `backend` folder, create a file named `.env`.

Add your own configuration values. For example:

``` env
PORT=5000

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email_address
EMAIL_APP_PASSWORD=your_email_app_password

WASABI_ACCESS_KEY=your_wasabi_access_key
WASABI_SECRET_KEY=your_wasabi_secret_key
WASABI_BUCKET=your_bucket_name
WASABI_REGION=your_wasabi_region
WASABI_ENDPOINT=https://s3.your-wasabi-region.wasabisys.com
```

**Important:** These are example values. Use the exact variable names
your backend code expects. Never share your real passwords or keys, and
never upload your `.env` file to GitHub.

### Step 4: Start the backend

From the `backend` folder, run:

``` bash
npm run dev
```

If your project does not have a `dev` command, check the scripts in
`backend/package.json`. You can also start the server with:

``` bash
node server.js
```

The backend should run at:

``` text
http://localhost:5000
```

### Step 5: Open a second terminal

Keep the backend terminal running. Open a new terminal in VS Code.

Install the frontend packages:

``` bash
cd frontend
npm install
```

### Step 6: Start the frontend

From the `frontend` folder, run:

``` bash
npm run dev
```

Open the local address shown in your terminal. It is usually:

``` text
http://localhost:5173
```

You should now see the WebChat application in your browser.

## 6. How photo and video sharing works

WebChat reduces media file sizes before saving them online.

The process is:

1.  A user selects a photo or video in the chat.
2.  The frontend sends the file to the backend.
3.  The backend temporarily receives the file.
4.  **Sharp** compresses images and converts them to WebP format.
5.  **FFmpeg** compresses videos and converts them to MP4 format.
6.  The backend uploads the compressed file to the Wasabi bucket.
7.  MongoDB saves the message information and the file's Wasabi key.
8.  The other chat participant receives the new message.
9.  The backend creates a temporary secure link when an authorised
    participant wants to view the media.

In short:

``` text
Select photo/video
       |
       v
Backend receives file
       |
       v
Compress image or video
       |
       v
Upload compressed file to Wasabi
       |
       v
Save message details in MongoDB
       |
       v
Receiver views the media
```

## 7. Image and video compression results

These are the results from the sample files tested during development.

  File      Before compression   After compression   Size reduced
  ------- -------------------- ------------------- --------------
  Image              359.91 KB           124.46 KB         65.42%
  Video               92.01 MB             3.43 MB         96.27%

Your results may be different for other photos and videos because
compression depends on the original file.

### How to run the compression tests

If you have added the sample files and test scripts in the backend
folder, run:

``` bash
cd backend
node test-compression.js
```

For video:

``` bash
node test-video-compression.js
```

## 8. A few useful things to remember

-   Start the backend before testing API requests.
-   Keep both backend and frontend terminals running while using the
    application.
-   Keep the Wasabi bucket private.
-   Do not put Wasabi secret keys in frontend code.
-   Do not upload `.env` to GitHub.
-   Temporary media links expire. The application needs to request a new
    link when an old one expires.

## 9. Common problems

### The website cannot connect to the backend

-   Check that the backend is running.
-   Check that it is using port `5000`.
-   Look for errors in the backend terminal.

### Login is not working

-   Check the email and password.
-   Check whether the login request is returning an error.
-   Make sure the backend is connected to MongoDB.

### Messages are not appearing instantly

-   Check that the backend is running.
-   Check the browser console for Socket.IO errors.
-   Make sure the user is logged in.

### A photo or video is not loading

-   Check that the media was uploaded to Wasabi.
-   Check that the message has the correct Wasabi key in MongoDB.
-   Check the media request in the browser's Network tab.
-   Remember that temporary viewing links expire.

## 10. Future improvements

Some features that can be added later:

-   Better upload progress display.
-   Automatic refresh of expired media links.
-   More file validation and upload protection.
-   Improved photo and video preview.
-   More testing for chat and media features.

------------------------------------------------------------------------

**WebChat Application**\
A full-stack real-time messaging project built with React, Node.js,
Express, MongoDB, and Socket.IO.
