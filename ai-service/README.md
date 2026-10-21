# Nutricount AI Microservice (FastAPI)

A dedicated, scalable Python FastAPI service providing AI capabilities for Nutricount:
- 🥗 **Multimodal Meal Analysis**: Recognizes food images and estimates calories, macronutrients (protein, carbs, fat, fiber, sugar), and health score.
- 🏋️ **Fitness & Nutrition Chat**: Multi-turn AI coaching with user health profile persona.
- 🤖 **Generative AI Tasks**: JSON extraction and text generation via Google Gemini.

By running this service independently, you can scale your Express backend and AI microservice separately based on CPU, memory, or GPU demands.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Nutricount Express BE     |
                      |   (Auth, DB, Users, API)    |
                      +--------------+--------------+
                                     | HTTP / REST
                                     v
                      +-----------------------------+
                      |    FastAPI AI Microservice  |
                      |  (Multimodal Meal & Chat)   |
                      +--------------+--------------+
                                     | Google GenAI SDK
                                     v
                      +-----------------------------+
                      |      Google Gemini API      |
                      +-----------------------------+
```

---

## Quickstart

### 1. Prerequisites
- Python 3.10+
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup Virtual Environment & Install Dependencies
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env` (or configure in the root `.env`):
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is set:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
ENV=development
```

### 4. Run the Service
Using the convenience script:
```bash
./run.sh
```
Or directly with uvicorn:
```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

---

## API Endpoints

### 1. Meal Analysis
- **`POST /api/v1/ai/analyze-meal`** (JSON)
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "mimeType": "image/jpeg",
    "notes": "Bowl of oatmeal with blueberries",
    "mealType": "breakfast"
  }
  ```
- **`POST /api/v1/ai/analyze-meal-upload`** (Multipart Form)
  - `image`: Upload file
  - `notes`: String
  - `mealType`: String

### 2. Fitness Chat
- **`POST /api/v1/ai/chat`**
  ```json
  {
    "systemInstruction": "You are a fitness coach...",
    "history": [
      { "role": "user", "content": "How much protein should I eat?" },
      { "role": "assistant", "content": "Aim for 1.6-2.2g per kg..." }
    ],
    "message": "Can I get that from plant sources?"
  }
  ```

### 3. General AI
- **`POST /api/v1/ai/generate-text`**
- **`POST /api/v1/ai/generate-json`**

---

## Docker Deployment
```bash
docker build -t nutricount-ai-service .
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key nutricount-ai-service
```
