MyHomePlate – Project README
Project Info

URL: https://myhomeplate.in
(once deployed with your hosting / Render / Vercel)

This repository contains the full source code for the MyHomePlate web application — a home-cooked meal marketplace built with modern frontend tools and connected to a custom Supabase backend.

How can I edit this code?

You can develop and maintain this project entirely using your own VS Code environment.
All changes you make locally can be pushed to GitHub for version control and deployment.

1. Use VS Code (recommended)

If you want to work locally using your own IDE, follow these steps:

# Step 1: Clone the repository using your Git URL.

git clone https://github.com/sumankaundinya/MyHomePlate.git

# Step 2: Navigate into the project folder.

cd myhomeplate

# Step 3: Install dependencies.

npm i

# Step 4: Run the development server.

npm run dev

The app will start on the port defined in vite.config.js (default: http://localhost:8080).

2. Edit directly on GitHub

Open the repository on GitHub

Navigate to any file

Click the Edit button

Commit changes

3. Use GitHub Codespaces (optional)

Go to your repository

Click the green Code button

Open the Codespaces tab

Click New codespace

You’ll get a full cloud-based VS Code environment.

Technology Stack

This project is built using:

Vite

React

JavaScript (or TypeScript if you enable later)

Tailwind CSS

shadcn/ui

Supabase (Auth + Database)

Deployment

You can deploy the project using:

Vercel

Netlify

Render

Any static hosting platform

Once deployed, you can point your domain myhomeplate.in to it.

Custom Domain Setup

To connect your domain:

Deploy your frontend (Vercel / Netlify / Render)

Go to your domain provider (Hostinger / GoDaddy)

Add DNS records:

A Record → Hosting IP

OR CNAME → Your hosting target domain

Wait for DNS propagation (few minutes to a few hours)

Once done, your project will be live on https://myhomeplate.in
