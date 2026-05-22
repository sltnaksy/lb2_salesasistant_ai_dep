const API_BASE_URL = "http://localhost:5000";

export async function generateAiAnswer(requestText: string) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestText }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate AI answer");
  }

  return response.json();
}

export async function updateAiResponseStatus(
  aiResponseId: number,
  status: string
) {
  const response = await fetch(
    `${API_BASE_URL}/ai-responses/${aiResponseId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update AI response status");
  }

  return response.json();
}

export async function updateAiResponseText(
  aiResponseId: number,
  generatedText: string
) {
  const response = await fetch(
    `${API_BASE_URL}/ai-responses/${aiResponseId}/text`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generatedText }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update AI response text");
  }

  return response.json();
}
export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);

  if (!response.ok) {
    throw new Error("Failed to load history");
  }

  return response.json();
}
export async function getAiResponseById(aiResponseId: number) {
  const response = await fetch(`${API_BASE_URL}/ai-responses/${aiResponseId}`);

  if (!response.ok) {
    throw new Error("Failed to load AI response");
  }

  return response.json();
}
export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard stats");
  }

  return response.json();
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Login failed",
    };
  }

  return {
    success: true,
    user: data.user,
  };
}

export async function getKnowledgeEntries() {
  const response = await fetch(
    `${API_BASE_URL}/knowledge`
  );

  if (!response.ok) {
    throw new Error("Failed to load knowledge entries");
  }

  return response.json();
}

