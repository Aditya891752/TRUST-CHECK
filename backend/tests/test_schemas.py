from app.api.schemas import CheckRequest, CheckResponse

def test_check_request_valid():
    req = CheckRequest(answer="Test answer")
    assert req.answer == "Test answer"
