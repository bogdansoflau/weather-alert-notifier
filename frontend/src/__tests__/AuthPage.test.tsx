import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import AuthPage from "../components/AuthPage";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Helper to render with router
const renderWithRouter = (initialRoute = "/login") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<div>Register Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("AuthPage", () => {
  let userInstance: UserEvent;

  beforeEach(() => {
    userInstance = userEvent.setup();
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(async () => {
    // Clean up any pending timers or promises
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    jest.clearAllTimers();
  });

  it("renders login form with email and password fields", async () => {
    await act(async () => {
      renderWithRouter();
    });

    expect(screen.getByText(/welcome to weather alerts/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();

    // Simply check that the sign up link exists - this confirms the text is rendered
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });

  it("displays link to register page", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute("href", "/register");
  });

  it("updates input values when user types", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(
      /email/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      /password/i
    ) as HTMLInputElement;

    await userInstance.type(emailInput, "test@example.com");
    await userInstance.type(passwordInput, "password123");

    await waitFor(() => {
      expect(emailInput.value).toBe("test@example.com");
      expect(passwordInput.value).toBe("password123");
    });
  });

  it("successfully logs in user and navigates to dashboard", async () => {
    const mockResponse = {
      data: {
        token: "fake-jwt-token",
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "test@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/auth/login",
        {
          email: "test@example.com",
          password: "password123",
        }
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        state: { user: mockResponse.data.user },
      });
    });
  });

  it("displays error message when login fails with server error", async () => {
    const errorMessage = "Invalid credentials";
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "wrong@example.com");
    await userInstance.type(passwordInput, "wrongpassword");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify token was not stored
    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("displays generic error message when login fails without specific error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "test@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/login failed. please try again./i)
      ).toBeInTheDocument();
    });
  });

  it("clears error message when user submits form again", async () => {
    // First, make login fail
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // First attempt - should fail
    await userInstance.type(emailInput, "wrong@example.com");
    await userInstance.type(passwordInput, "wrongpassword");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Second attempt - error should be cleared before new submission
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: "fake-jwt-token",
        user: { id: "123", name: "Test User", email: "test@example.com" },
      },
    });

    await userInstance.clear(emailInput);
    await userInstance.clear(passwordInput);
    await userInstance.type(emailInput, "correct@example.com");
    await userInstance.type(passwordInput, "correctpassword");
    await userInstance.click(submitButton);

    // Error should be cleared immediately on new submission
    await waitFor(() => {
      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });
  });

  it("prevents form submission when fields are empty", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Try to submit without filling fields
    await userInstance.click(submitButton);

    // Axios should not be called
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(
      /email/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/password/i);

    // Type invalid email
    await userInstance.type(emailInput, "invalidemail");
    await userInstance.type(passwordInput, "password123");

    // Check HTML5 validation
    expect(emailInput.validity.valid).toBe(false);
  });

  it("renders sign up section correctly", async () => {
    const { container } = await act(async () => {
      return renderWithRouter();
    });

    // Check that the sign up link exists
    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute("href", "/register");

    // Verify it's inside a paragraph with the correct class
    const paragraph = container.querySelector("p.text-center.text-gray-400");
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toContainElement(signUpLink);
  });
});
