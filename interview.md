# Project Interview Guide: DSA Preparation Platform with LoRA Fine-Tuned AI Assistant

This document contains a comprehensive set of general, architectural, technical, and situational interview questions with expert-level answers tailored to this project. Review these questions to prepare for your college placements and technical interviews.

---

## 📌 Table of Contents
1. [Project Overview & Core Value Proposition](#1-project-overview--core-value-proposition)
2. [Tech Stack & Technical Choices](#2-tech-stack--technical-choices)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Sandbox Code Execution (Judge0 Integration)](#4-sandbox-code-execution-judge0-integration)
5. [AI Assistant, Fine-Tuning & LLM Serving (DeepSeek + LoRA)](#5-ai-assistant-fine-tuning--llm-serving-deepseek--lora)
6. [Challenges Faced & Problem Solving](#6-challenges-faced--problem-solving)
7. [Database Design & Authentication](#7-database-design-&-authentication)
8. [Scalability & Future Scope](#8-scalability--future-scope)
9. [Web Development & Backend Architecture Core Concepts (Highest Priority)](#9-web-development--backend-architecture-core-concepts-highest-priority)

---

## 1. Project Overview & Core Value Proposition

### Q1. Can you explain your project in brief?
**Answer:**
"I built an **end-to-end clone of LeetCode** that correctly implements all of its core, essential functionalities, with a major differentiator: an **integrated, context-aware AI debugging companion (iSmart AI)**. 

The system supports **Role-Based Access Control (RBAC)** with two distinct roles:
- **User (Student) Role:** Standard users can browse a wide array of DSA problems, write solutions in an interactive code editor (Monaco Editor) supporting C++, Java, and JavaScript, run/submit their code against test cases in a secure sandbox, view their statistics, and interact with the AI assistant.
- **Admin Role:** Admins have administrative rights to manage the platform's content. They can create new coding challenges, set up starter code templates, manage test cases (both visible and hidden), update existing problems, and delete them through a dedicated Admin Panel.

To enhance the learning experience, I built **iSmart AI**. When a user encounters a logical or compiler error, they can ask the AI companion. The application automatically packages the current Monaco editor code, programming language, problem description, and failing test cases as context. It routes this data to a local Python FastAPI service running a custom fine-tuned DeepSeek Coder 1.3B model, providing instant, precise guidance without the user leaving the IDE."

### Q2. What was the inspiration behind building this project?
**Answer:**
"When practicing coding on platforms like LeetCode or HackerRank, beginners often face a major roadblock: they get stuck on a compiler or logic error and spend hours googling the issue or pasting it into generic AI tools. Paging back and forth between ChatGPT and the editor ruins focus, and generic LLMs frequently hallucinate because they lack the specific problem description or the student's starter code context. I wanted to build a unified environment where the AI has complete, real-time context of the coding task, acting like an on-demand teaching assistant."

---

## 2. Tech Stack & Technical Choices

### Q3. What is the tech stack of this project, and why did you choose it?
**Answer:**
"The project is built on a hybrid architecture combining a **MERN Stack** for the web application and a **Python AI Service** for LLM inference:
1. **Frontend (React 19, Vite, TailwindCSS, DaisyUI):** 
   - *React 19* provides a component-driven declarative UI.
   - *Vite* is used as the build tool for near-instant hot module replacement (HMR) and fast build times compared to Webpack.
   - *Monaco Editor* delivers a VS Code-like editing experience with syntax highlighting and autocompletion.
   - *Redux Toolkit* handles global client states (like user authentication, profile data, and UI state).
2. **Backend Server (Express.js, Node.js):** 
   - Handles API routes (user login/registration, problem listings, submissions).
   - Node's non-blocking I/O model makes it highly efficient for proxying chat requests to the AI server and polling code execution statuses.
3. **Database & Caching (MongoDB + Mongoose, Redis):** 
   - *MongoDB* is a document database ideal for storing flexible data like problem descriptions, test cases, and code templates in multiple languages.
   - *Redis* acts as an in-memory database used for token management, caching frequent API calls, or rate-limiting heavy endpoints like the AI chat.
4. **AI Inference Service (FastAPI, Python, PyTorch, Hugging Face, PEFT):** 
   - *FastAPI* is a high-performance Python web framework used to serve the ML model.
   - *Hugging Face Transformers & PEFT (LoRA)* are used to load a base model (`deepseek-coder-1.3b-base`) and overlay the custom fine-tuned LoRA weights, enabling efficient inference on consumer hardware."

### Q4. Why did you choose FastAPI for the AI service instead of integrating it directly in Node.js?
**Answer:**
"Machine learning and LLM frameworks (like PyTorch, Hugging Face Transformers, and PEFT) are natively developed and optimized in Python. Writing inference code in Python allows us to directly utilize libraries like `torch` for tensor math, GPU acceleration (CUDA), and low-memory operations (like `float16` precision). By separating this into a FastAPI microservice, we separate concerns: Node.js handles user interactions, database reads, and rapid networking, while Python handles CPU/GPU-heavy LLM inference without blocking the main web server."

---

## 3. System Architecture & Data Flow

### Q5. How does the complete request-response flow work when a user chats with the AI?
**Answer:**
"1. **Frontend Trigger:** When the student types a question in the `iSmart` AI sidebar, the frontend captures the prompt. It programmatically fetches the current code inside the Monaco Editor, the coding language, the problem title, description, and test cases.
2. **Express Proxy:** This data is sent as a POST request to the Express backend (authenticated via JWT). The Express backend validates the request and proxies it to the FastAPI inference server running on port `8000`.
3. **FastAPI Inference:** The FastAPI service receives the payload and formats it into a structured prompt using a template (e.g., `### Problem Title... ### Student Code... ### Question... ### Answer:`). It tokenizes the prompt, runs it through the fine-tuned DeepSeek model, decodes the model's output tokens, and extracts the response.
4. **Response Delivery:** FastAPI sends the response back to Express, which forwards it to the React frontend to display in the chat bubble."

```
+------------------+           +------------------+           +----------------------+
|  React Frontend  | <=======> | Express Backend  | <=======> | FastAPI AI Inference |
| (Monaco Editor)  |   HTTP    |   (Port 3000)    |   HTTP    |     (Port 8000)      |
+------------------+           +------------------+           +----------------------+
                                        ^
                                        | (Mongoose ODM)
                                        v
                               +------------------+
                               |     MongoDB      |
                               +------------------+
```

---

## 4. Sandbox Code Execution (Judge0 Integration)

### Q6. How is code compiled and executed when a student clicks 'Submit' or 'Run Code'? Do you run it directly on your server?
**Answer:**
"No, executing user-submitted code directly on our application server is a major security vulnerability (Remote Code Execution / RCE). A malicious user could write code like `fs.unlinkSync()` in JavaScript or `system("rm -rf /")` in C++ to compromise the server.
To solve this, I integrated **Judge0**, which is a highly secure, sandboxed remote code execution engine. 
- The backend takes the student's code, encodes it in **base64** (to preserve formatting and prevent character escape errors), and makes an asynchronous batch request to the Judge0 API.
- Judge0 compiles and executes the code inside isolated sandboxes (typically Docker containers) with strict CPU, memory, and execution time limits.
- The backend receives execution tokens and performs adaptive polling (with exponential backoff) until Judge0 returns the results (e.g., *Accepted*, *Wrong Answer*, *Runtime Error*, *Time Limit Exceeded*). The backend decodes the base64 output and returns it to the client."

---

## 5. AI Assistant, Fine-Tuning & LLM Serving (DeepSeek + LoRA)

### Q7. Tell me about the AI model you used. Why DeepSeek Coder 1.3B?
**Answer:**
"I used `deepseek-coder-1.3b-base` as the foundation model. I chose it for three main reasons:
1. **Coding Specialization:** It is pre-trained on high-quality programming repositories, making it perform significantly better on syntax, algorithmic code, and logic than general-purpose small models.
2. **Compact Size:** With 1.3 billion parameters, the model is lightweight. In FP16 precision, it takes up only ~2.7 GB of memory, allowing it to be served easily on a standard consumer laptop or an affordable server instance.
3. **Open-Source & Fine-tunable:** It supports Parameter-Efficient Fine-Tuning (PEFT) and is fully open-source, giving us complete privacy and control over our data."

### Q8. What is LoRA, and why did you use it?
**Answer:**
"**LoRA (Low-Rank Adaptation)** is a parameter-efficient fine-tuning (PEFT) technique. 
- Traditional full fine-tuning updates all weights of a massive neural network, which is computationally expensive and requires multiple high-end GPUs.
- LoRA freezes the pre-trained model weights and injects trainable rank decomposition matrices (A and B) into the attention layers.
- This reduces the number of trainable parameters by over 99% (e.g., from 1.3 billion down to just a few million). 
- It saves significant training time, uses far less VRAM (allowing training on free Kaggle/Colab GPUs), and produces a small 'adapter' file (usually just 10–50 MB) that we load dynamically on top of the base model."

---

## 6. Challenges Faced & Problem Solving

### Q9. What was the biggest challenge you faced while building this project, and how did you resolve it?
**Answer:**
"**Challenge: Server Out-Of-Memory (OOM) Errors during Local Inference**
When loading the base 1.3B parameter model on a developer machine with limited system RAM (8GB/16GB) and no dedicated GPU, the server would run out of memory and crash, or execution would be extremely slow on the CPU.

**How I resolved it:**
1. **Precision Reduction (FP16):** I configured Hugging Face's `AutoModelForCausalLM` to load weights in `float16` precision rather than `float32`. This cut the model's memory footprint in half (from ~5GB down to ~2.7GB).
2. **Low-Memory Configurations:** I enabled the `low_cpu_mem_usage=True` flag in the Transformers library, which prevents loading the model weights into CPU RAM twice during loading.
3. **Garbage Collection & Inference Mode:** In `inference.py`, I explicitly triggered python's garbage collector (`gc.collect()`) before and after loading the weights. I also wrapped the text generation in PyTorch's `with torch.inference_mode():` context block to disable gradient tracking, reducing peak memory usage during generation.
4. **Quantization Ready:** I added hooks for optional 8-bit quantization (`load_in_8bit`) via `BitsAndBytesConfig` if running on CUDA-compatible systems, allowing the model to fit in under 1.5 GB of VRAM."

### Q10. What is another technical challenge you encountered?
**Answer:**
"**Challenge: Real-time Context Overhead and Chat Latency**
Because we attach the entire problem description, starter code, test cases, and student code to every single AI query, the prompt length can grow up to 1,000+ tokens. Feeding this large context to a model running on a CPU resulted in high response latency (15–30 seconds).

**How I resolved it:**
1. **Context Truncation & Capping:** I restricted the max input sequence length to `1024` tokens during tokenization (`truncation=True`) and set the generation limit `max_new_tokens` to `384` to ensure the model responds quickly without looping indefinitely.
2. **Deterministic Search:** I set `do_sample=False` and `temperature=0.0` for generation parameters. Because programming questions require precise, deterministic explanations rather than creative writing, this greedy decoding strategy is faster and reduces hallucinations."

---

## 7. Database Design & Authentication

### Q11. Why did you use MongoDB (NoSQL) instead of a Relational Database like PostgreSQL/MySQL?
**Answer:**
"A NoSQL database like MongoDB is a perfect fit for this project due to the flexible, nested nature of coding problems and submissions:
- **Nested Documents:** A coding problem includes multiple test cases (each with inputs, outputs, and explanations) and starter code templates for different languages (C++, Java, JS). In SQL, this would require complex multi-table joins (`problems`, `test_cases`, `language_templates`). In MongoDB, we can store all of this as a single nested JSON document, enabling highly efficient read operations.
- **Dynamic Schemas:** As the project grows (e.g., adding support for new languages or new types of test cases like visual plots), we can update schemas on the fly without having to run database migrations or alter fixed table structures."

### Q12. How does the authentication system work? How do you secure route endpoints?
**Answer:**
"1. **Password Security:** When a user registers, we hash their password using **bcrypt** with a salt round of 10. We never store plain-text passwords in MongoDB.
2. **Session Token (JWT):** During login, the server verifies the password. If correct, it generates a JSON Web Token (JWT) signed with a secret key. This token contains user metadata (User ID, Role, etc.).
3. **Stateless Middleware:** The JWT is sent back to the client and stored in a secure cookie. For protected routes (like `/ai/chat` or submitting a problem), the Express backend uses a custom middleware (`userMiddleware`) that extracts the token, verifies the signature, and attaches the authenticated user object to the request context. If the token is expired or altered, it returns a `401 Unauthorized` error immediately."

---

## 8. Scalability & Future Scope

### Q13. If this platform suddenly scales to 10,000 daily active users, what bottlenecks do you expect, and how would you resolve them?
**Answer:**
"There are two primary bottlenecks we would encounter:
1. **AI Inference Overhead:** LLM inference is highly compute-intensive. A single GPU machine running FastAPI would get bottlenecked instantly by concurrent chat requests.
   - *Solution:* I would move the AI service to dedicated GPU instances (e.g., AWS EC2 with NVIDIA T4/A10G cards) and place a load balancer in front. I would also integrate an inference optimization library like **vLLM** or **TGI (Text Generation Inference)** to support continuous batching and PagedAttention, which increases throughput by up to 10x.
2. **Code Execution Queuing:** Making synchronous API calls to Judge0 for every submission will slow down the backend.
   - *Solution:* I would implement a message broker like **RabbitMQ** or **Redis Pub/Sub** to queue compilation requests. When a user submits code, it gets queued immediately and the user receives a 'Pending' status. Worker servers pop tasks from the queue, execute them in a pool of Judge0 sandboxes, and push results back to the user via **WebSockets** for real-time updates."

### Q14. What are some features you would like to add to this project in the future?
**Answer:**
"1. **AI-driven Dry Run Visualization:** Generating step-by-step visual trace diagrams of the code execution to show how variables change in memory over time (e.g., explaining recursion stacks or pointer changes).
2. **Code Similarity Detection:** A system using AST (Abstract Syntax Tree) comparison to identify plagiarism among student submissions.
3. **Gamification & Daily Challenges:** Adding user leaderboards, daily coding problems, and streak tracking to increase user engagement."

---

## 9. Web Development & Backend Architecture Core Concepts (Highest Priority)

### Q15. What is a JWT (JSON Web Token)? How is it structured and how did you use it?
**Answer:**
"JWT is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.
It has three parts separated by dots (`.`):
1. **Header:** Contains the metadata, typically the signing algorithm (like HMAC SHA256) and the token type (`JWT`).
2. **Payload:** Contains the claims or statements about the user (e.g., `userId`, `email`, `role`). We should never store sensitive data like passwords here because this section is only Base64Url encoded, not encrypted.
3. **Signature:** Generated by taking the encoded header, encoded payload, and signing them using a secret key known only to the backend. This ensures the token cannot be tampered with.

**In my project:** I generated JWTs upon login, sent them via HTTP cookies, and parsed them on subsequent requests using a custom middleware. This allows for stateless authentication, removing the need to check the database on every route access."

### Q16. How did you secure your REST APIs using Express Middlewares? Explain what `next()` does.
**Answer:**
"Middlewares in Express are functions that execute during the lifecycle of a request to a server. They have access to the Request (`req`) object, Response (`res`) object, and the next middleware function in the application’s request-response cycle, typically denoted by `next`.

**How my middleware works:**
- I created `userMiddleware` which checks the incoming request for authorization cookies.
- If the token is found and successfully verified using the JWT secret key, the middleware attaches the user payload to `req.user` and calls `next()`. This signals Express to proceed to the controller (e.g., `solveDoubt` or `submitProblem`).
- If verification fails or no token is found, the middleware terminates the request immediately by returning `res.status(401).json({ message: "Unauthorized" })`, without calling `next()`. This effectively locks down private routes."

### Q17. What is CORS (Cross-Origin Resource Sharing)? Why does it occur, and how did you solve it in this project?
**Answer:**
"CORS is a browser-enforced security mechanism (Same-Origin Policy) that blocks a web application running on one origin (domain/port) from accessing resources on a different origin. 

In development:
- My React frontend ran on Vite's default dev port (e.g., `http://localhost:5173`).
- My Express backend ran on `http://localhost:3000`.
- The FastAPI server ran on `http://localhost:8000`.

Because the domain/port differed, the browser blocked requests. I resolved this by importing the `cors` package in Express and FastAPI and enabling it as middleware. I configured it to allow specific origins, headers, and request methods, as well as credentials (cookies) transmission."

### Q18. What is Database Indexing in MongoDB? Why did you use a Compound Index on `{ userId: 1, problemId: 1 }`?
**Answer:**
"Without an index, MongoDB must perform a *collection scan* (inspecting every single document in the collection) to satisfy a query, which is extremely slow as the database grows ($O(N)$ time complexity). Indexing creates a B-tree data structure that allows the database to locate matching documents rapidly ($O(\log N)$).

In my `submission.js` schema, I created a **Compound Index** combining two fields:
```javascript
submissionSchema.index({ userId: 1, problemId: 1 });
```
In a DSA platform, students repeatedly view their personal submissions for a *specific problem* to check history or improvements. This triggers queries like `Submission.find({ userId: req.user._id, problemId: req.params.id })`. By indexing `userId` and `problemId` together, MongoDB can pinpoint the matching records in milliseconds, even if there are millions of submissions in the collection."

### Q19. What is a "Multikey Index" in MongoDB, and what issue did you face with the `unique` constraint on the `problemSolved` array (explaining `dropIndex.js`)?
**Answer:**
"In MongoDB, if you index a field that holds an array (such as the `problemSolved` array in my User schema which contains `ObjectId` references to solved problems), MongoDB automatically creates an index key for *each individual element* in the array. This is called a **Multikey Index**.

**The Issue:**
- Initially, there was a `unique: true` constraint on the `problemSolved` field.
- In MongoDB, a unique multikey index enforces uniqueness across the individual items *across different documents*.
- This meant if User A solved Problem 1, MongoDB inserted 'Problem 1' into the index. When User B attempted to solve Problem 1, MongoDB rejected User B's update because 'Problem 1' was already registered in the unique index! In effect, only one user could solve any given problem.
- **The Solution:** I created `dropIndex.js` to programmatically connect to the database and drop the unique constraint/index on `problemSolved_1` from the users collection, allowing multiple users to solve the same problems."

### Q20. What are Mongoose pre/post hooks/middlewares? How did you use them in the User model?
**Answer:**
"Mongoose pre and post hooks (also known as database middleware) are functions that are passed control during execution of asynchronous schema methods (like save, validate, findOne, or delete).
- **Pre hooks** execute *before* the action (e.g., hashing a password before saving).
- **Post hooks** execute *after* the action (e.g., logging or cascading deletes).

In my `user.js` model, I used a post hook for `findOneAndDelete`:
```javascript
userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
      await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});
```
This is a database trigger that enforces referential integrity. When an admin deletes a user, this hook automatically fires to delete all submissions associated with that user's ID, avoiding 'orphan' submissions from consuming database space."

### Q21. What is Redux Toolkit and how does it work? Explain the difference between `useSelector` and `useDispatch`.
**Answer:**
"Redux Toolkit (RTK) is the modern, recommended standard for global state management in React. It simplifies Redux by providing `createSlice` which automatically generates action creators and action types based on reducers.

- **Store:** The global 'single source of truth' that holds the application state (e.g., user profiles, login tokens).
- **useSelector:** A hook that allows React components to extract/read data from the Redux store state. It subscribes to the store, meaning if the selected state changes, the component automatically re-renders. (e.g., `const user = useSelector((state) => state.auth.user)`).
- **useDispatch:** A hook that returns a reference to the Redux dispatch function. We use it to dispatch actions to trigger state modifications in the store. (e.g., `dispatch(loginSuccess(data))` after a successful API login request)."

### Q22. What is the difference between Axios and Fetch API? Why did you use Axios?
**Answer:**
"While both are used to make HTTP requests, **Axios** has several out-of-the-box advantages over the native **Fetch API**:
1. **Automatic JSON Transformation:** Axios automatically stringifies request bodies to JSON and parses response bodies, whereas with Fetch, you must manually run `JSON.stringify(data)` and chain `res.json()`.
2. **Request/Response Interceptors:** Axios allows us to define interceptors. This is extremely useful for automatically injecting JWT tokens into request headers before they go out, or globally checking for 401 errors to redirect users to login.
3. **Timeout Support:** Axios allows setting a simple timeout value (e.g., `timeout: 30000`). Implementing timeouts in Fetch requires using `AbortController`, which is verbose.
4. **Better Error Handling:** Axios automatically rejects the promise (throws an error) for status codes outside the 2xx range, while Fetch considers a 404 or 500 response successful and requires you to manually check `response.ok`."

### Q23. What are HTTP status codes? Explain which status codes you used in your API responses.
**Answer:**
"HTTP response status codes indicate whether a specific HTTP request has been successfully completed. I utilized standard semantic status codes:
- **`200 OK`**: Returned for successful reads/updates (like fetching problems or getting chatbot responses).
- **`201 Created`**: Used when a user successfully signs up or an admin creates a new problem.
- **`400 Bad Request`**: Returned when the request body lacks required fields (e.g., user attempts to chat without typing a question).
- **`401 Unauthorized`**: Returned when a request to a protected route lacks a JWT cookie or has an expired token.
- **`502 Bad Gateway`**: Returned by Express if it successfully routes the request but the downstream FastAPI server crashes or returns an invalid payload.
- **`503 Service Unavailable`**: Returned if the Express backend cannot establish a connection to the FastAPI server (e.g., AI microservice is offline)."
