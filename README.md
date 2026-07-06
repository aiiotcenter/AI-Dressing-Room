# AI Virtual Dressing Room

A full-stack internship project that lets users upload or capture a photograph,
choose a built-in garment or upload a shirt, and generate an AI-assisted virtual
try-on preview.

## Features

- Camera capture and conventional photo upload
- Built-in clothing collection
- Direct shirt upload from the Try-On Studio
- AI-generated virtual try-on previews
- Downloadable results and try-on history
- Local image storage with optional Cloudinary support
- Responsive desktop and mobile interface
- Backend-managed provider credentials

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | FastAPI, Pydantic, HTTPX |
| Database | SQLite, SQLAlchemy |
| Storage | Local static files or Cloudinary |
| AI | Google Gemini or an OpenRouter-compatible endpoint |

## Project Structure

```text
AI-Dressing-Room/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |   |-- TryOnStudio.jsx
|   |   |   |-- ClothesCollection.jsx
|   |   |   |-- History.jsx
|   |   |   `-- Home.jsx
|   |   `-- App.jsx
|   `-- package.json
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- models.py
|   |-- schemas.py
|   |-- services/
|   |   |-- ai_tryon_service.py
|   |   `-- cloudinary_service.py
|   `-- requirements.txt
|-- assets/
`-- README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`. Interactive API documentation is
available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## AI Provider Configuration

The public interface does not request an API key. Add one supported provider
credential to `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
# or
OPENROUTER_API_KEY=your_key_here
```

Credentials remain on the backend and are not stored in try-on history. Never
commit the real `.env` file or expose a key in frontend code, screenshots, or
chat messages.

## Usage

1. Start the backend and frontend servers.
2. Open the Try-On Studio.
3. Capture a photograph or upload one.
4. Select a built-in garment or upload a shirt.
5. Choose **Try This Shirt**.
6. Review and download the generated result.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/upload-user-photo` | Store a person image |
| POST | `/clothes` | Upload a garment and create its record |
| GET | `/clothes` | List all garments |
| GET | `/clothes/today` | List currently available garments |
| POST | `/try-on` | Generate and save a virtual try-on result |
| GET | `/try-on/history` | List completed results newest first |

## Demo Storage

When Cloudinary is not configured, uploads and generated results are saved in
`backend/uploads` and served by FastAPI. This keeps local demonstrations usable
without a separate storage account.

## Current Limitations

- Generated images are visual approximations, not physical sizing predictions.
- Personal images are stored locally for demonstration and need production
  retention and access controls before public deployment.
- Provider availability, quota, and output consistency affect generation.

## Planned Improvements

- Specialized virtual try-on and garment-segmentation models
- Private user accounts and protected personal history
- Background job processing for long-running generation
- Private object storage, signed URLs, and automatic image deletion
- Outfit comparison and e-commerce catalogue integration

## Author

**Amin Jimoh**

Built with React and FastAPI.
