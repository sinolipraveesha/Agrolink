# AgroLink 🌾🚜
> Live Deployment: [AgroLink Web Application](https://agrolink-ocerfx0vf-sinolis-projects.vercel.app/)  
> Backend API Instance: `https://agrolink-production-ddab.up.railway.app`

AgroLink is an advanced, full-stack enterprise digital platform designed to eliminate supply chain inefficiencies in agricultural trade across Sri Lanka. By combining real-time communication, predictive machine learning models, and generative AI features, AgroLink empowers local farming communities while streamlining complex B2B and B2C operational workflows.

---

## 🛠️ System Architecture & Tech Stack

AgroLink is engineered using a decoupled, multi-tier architecture built for high availability, transactional security, and low-latency data streams.

[Browser Client] ──(HTTPS/Vercel)──> [React Frontend Engine (Vite)]
│
(REST APIs / WebSockets)
│
▼
[Supabase Storage] <────(JDBC)───── [Spring Boot Backend API (Railway)]
│
(HTTP REST Client)
│
┌──────────────────────┴──────────────────────┐
▼                                             ▼
[Google Gemini AI API]                      [Python ML Microservice]
(RAG Chatbot / Reviews)                     (Price Prediction Engine)


* **Frontend:** React.js, Vite, Tailwind CSS, Axios
* **Core Backend API:** Java, Spring Boot 3.x, Spring Data JPA, Hibernate, Apache Tomcat
* **Database & BaaS Layer:** PostgreSQL hosted via Supabase (utilizing connection pooling and session routing via port `5432`)
* **AI & Intelligence Services:** Python (Scikit-learn, Flask API) & Google Gemini 1.5 Flash API
* **Real-Time Layer:** WebSockets using STOMP protocol messaging over SockJS transport
* **Payment Gateway:** PayHere Sandbox API Integration
* **DevOps & Infrastructure:** Dockerized backend service containerized on **Railway**, frontend deployment delivery via **Vercel**, and unified version control on GitHub.

---

## ✨ Core Engineering Modules & Advanced Features

### 👥 1. Multi-Role Enterprise Ecosystem
Implemented strict role-based access control (RBAC) and customized client-side state profiles for **five distinct user classes**:
* **Farmers:** Publish crop inventories, view automated predictive market prices, list marketplace packages, and handle direct client incoming bids.
* **Buyers:** Scan regional item arrays, manage persistent shopping carts, execute secure online checkout, and negotiate pricing scales with producers.
* **Suppliers:** Advertise wholesale fertilizers, heavy machinery, farming seeds, and agricultural equipment directly to registered networks.
* **Drivers:** Monitor open transit fulfillment pools, claim local delivery freights, update shipping checkpoint states, and map optimized coordinate routes.
* **Admins:** Audit operational logs, verify identity documentation parameters, moderate system warning flags, and monitor overall transaction volume metrics.

### 💬 2. Asynchronous WebSocket Negotiation Engine
Engineered an instantaneous, bidirectional negotiation chat framework that enables buyers and farmers to agree on flexible transaction rates:
* Utilizes **STOMP over WebSockets** to broadcast message states and read-receipt indicators across connected nodes instantly.
* Injects active payload components allowing users to programmatically accept, counter, or reject contract bids inside the message bubble window.
* Leverages optimistic client-side synchronization structures to avoid interface UI stutter during network spikes.

### 🤖 3. Intelligent Agro Assistant & Automated AI Review Replies
Integrated state-of-the-art Large Language Models directly into operational system business workflows using the **Google Gemini API**:
* **Agro Chatbot (`Sinoli_RAG`):** An intelligent, contextual assistant optimized to provide hyper-localized soil diagnosis, agricultural disease troubleshooting, and real-time navigation support.
* **Automated Review Worker:** An asynchronous processing service that automatically intercepts newly posted marketplace ratings, reads customer sentiment, and feeds text context to Gemini to instantly draft tailored, professional replies for farmers.

### 📈 4. Predictive Machine Learning Crop Pricing Model
Developed an isolated predictive intelligence microservice utilizing **Scikit-learn** to insulate small farmers against market exploitation. The custom ML regression matrix cross-references historical regional data trends, commodity classifications, and harvest seasons to generate accurate future pricing trajectories.

### 🚛 5. Logistical Supply Chain & Coordinate Tracking
Designed an end-to-end transport fulfillment module. Drivers claim transit requirements from automated job queues, changing database state properties through strict lifecycle boundaries (`Pending` ➡️ `Shipped` ➡️ `Delivered`). The engine handles geospatial coordinates and utilizes mapping geolocation tools for tracking delivery routes.

### 💳 6. Transactional Payment Pipeline
Configured a reliable e-commerce transaction gateway utilizing the **PayHere API**. The backend implements secure webhook handling and callback route authorization checks to maintain strict database isolation, modifying available inventory tables across PostgreSQL schemas immediately upon verification of payment.

---

## 🚀 Local Development Setup

### Backend (Spring Boot)
1. Clone the repository and navigate to the backend subdirectory:
   ```bash
   git clone [https://github.com/sinolipraveesha/Agrolink.git](https://github.com/sinolipraveesha/Agrolink.git)
   cd Agrolink/agrolink-backend
Configure your environment properties inside src/main/resources/application.properties:

Properties
spring.datasource.url=jdbc:postgresql://[aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require](https://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require)
spring.datasource.username=postgres.wwcymxpjeqshbkllwkfj
spring.datasource.password=#Sinolli199
Compile and boot the application:

Bash
./mvnw spring-boot:run
Frontend (React + Vite)
Navigate to the frontend directory:

Bash
cd ../agrolink-web
Create a .env file in the root of the folder and apply your API keys:

Code snippet
VITE_API_BASE_URL=http://localhost:8082
VITE_SUPABASE_URL=[https://wwcymxpjeqshbkllwkfj.supabase.co](https://wwcymxpjeqshbkllwkfj.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
Install the dependencies and spin up the development engine:

Bash
npm install
npm run dev
