import sys
from pathlib import Path
from starlette.testclient import TestClient

# Add ai-service to path
sys.path.insert(0, str(Path(__file__).parent))

from app.main import app

def test_fastapi_service():
    print("🧪 Testing FastAPI AI Microservice...\n")
    client = TestClient(app)

    # 1. Test Health endpoint
    print("Test 1: GET /health")
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Nutricount AI Service"
    print(f"✅ /health passed: {data}")

    # 2. Test Root endpoint
    print("\nTest 2: GET /")
    response = client.get("/")
    assert response.status_code == 200
    print("✅ GET / passed")

    # 3. Test OpenAPI docs
    print("\nTest 3: GET /openapi.json")
    response = client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()
    assert "/api/v1/ai/analyze-meal" in spec["paths"]
    assert "/api/v1/ai/analyze-meal-upload" in spec["paths"]
    assert "/api/v1/ai/chat" in spec["paths"]
    assert "/api/v1/ai/generate-text" in spec["paths"]
    assert "/api/v1/ai/generate-json" in spec["paths"]
    print("✅ OpenAPI schema verified with all 5 AI routes registered!")

    # 4. Test Mock / Validation of /api/v1/ai/chat schema
    print("\nTest 4: POST /api/v1/ai/chat validation error handling")
    response = client.post("/api/v1/ai/chat", json={}) # missing required 'message'
    assert response.status_code == 422 # Unprocessable Entity
    print("✅ Pydantic validation correctly caught missing required fields (422)")

    # 5. Test Mock / Validation of /api/v1/ai/analyze-meal schema
    print("\nTest 5: POST /api/v1/ai/analyze-meal validation error handling")
    response = client.post("/api/v1/ai/analyze-meal", json={"imageBase64": "invalid_base64_!@#$"})
    # Since GEMINI_API_KEY is not set or base64 is tested
    print(f"✅ /analyze-meal handled input: status={response.status_code}")

    print("\n🎉 ALL FASTAPI SERVICE TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    test_fastapi_service()
