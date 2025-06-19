import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import AuthPage from "../components/AuthPage";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

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
    localStorage.clear();
  });

  it("renders login form with email and password fields", () => {
    renderWithRouter();
    expect(screen.getByText(/welcome to weather alerts/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("updates input values when user types", async () => {
    renderWithRouter();
    const emailInput = screen.getByPlaceholderText(
      /email/i
    ) as HTMLInputElement;
    await userInstance.type(emailInput, "test@example.com");
    expect(emailInput.value).toBe("test@example.com");
  });

  it("successfully logs in user and navigates to dashboard", async () => {
    const mockResponse = {
      data: {
        token: "fake-jwt-token",
        user: { id: "123", name: "Test User", email: "test@example.com" },
      },
    };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    renderWithRouter();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "test@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        state: { user: mockResponse.data.user },
      });
    });

    expect(localStorage.getItem("token")).toBe("fake-jwt-token");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("displays error message when login fails with server error", async () => {
    const errorMessage = "Invalid credentials";
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    renderWithRouter();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "wrong@example.com");
    await userInstance.type(passwordInput, "wrongpassword");
    await userInstance.click(submitButton);

    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("displays generic error message when login fails without specific error", async () => {
    const networkErrorMessage = "Network error";
    mockedAxios.post.mockRejectedValueOnce(new Error(networkErrorMessage));

    renderWithRouter();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "test@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.click(submitButton);

    const errorElement = await screen.findByText(networkErrorMessage);
    expect(errorElement).toBeInTheDocument();

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("clears error message when user submits form again", async () => {
    const initialErrorMessage = "Invalid credentials";
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { message: initialErrorMessage } },
    });

    renderWithRouter();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await userInstance.type(emailInput, "wrong@example.com");
    await userInstance.type(passwordInput, "wrongpassword");
    await userInstance.click(submitButton);

    expect(await screen.findByText(initialErrorMessage)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();

    const mockSuccessResponse = {
      data: {
        token: "new-token",
        user: { id: "456", name: "Fixed User", email: "correct@example.com" },
      },
    };
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    await userInstance.clear(emailInput);
    await userInstance.clear(passwordInput);
    await userInstance.type(emailInput, "correct@example.com");
    await userInstance.type(passwordInput, "correctpassword");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        state: { user: mockSuccessResponse.data.user },
      });
    });

    expect(screen.queryByText(initialErrorMessage)).not.toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it("prevents form submission when fields are empty", async () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await userInstance.click(submitButton);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
