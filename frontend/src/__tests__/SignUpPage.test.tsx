import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import SignUpPage from "../components/SignUpPage";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (initialRoute = "/register") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/auth" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("SignUpPage", () => {
  let userInstance: UserEvent;

  beforeEach(() => {
    userInstance = userEvent.setup();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    jest.clearAllTimers();
  });

  it("renders sign up form with all fields", async () => {
    await act(async () => {
      renderWithRouter();
    });

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/confirm password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("displays link to login page", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/auth");
  });

  it("updates input values when user types", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const nameInput = screen.getByPlaceholderText(
      /^name$/i
    ) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(
      /email/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      /^password$/i
    ) as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText(
      /confirm password/i
    ) as HTMLInputElement;

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "john@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "password123");

    await waitFor(() => {
      expect(nameInput.value).toBe("John Doe");
      expect(emailInput.value).toBe("john@example.com");
      expect(passwordInput.value).toBe("password123");
      expect(confirmInput.value).toBe("password123");
    });
  });

  it("shows error when passwords don't match", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const nameInput = screen.getByPlaceholderText(/^name$/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "john@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "differentpassword");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("successfully registers user and navigates to dashboard", async () => {
    const mockResponse = {
      data: {
        token: "fake-jwt-token",
        user: {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
        },
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    await act(async () => {
      renderWithRouter();
    });

    const nameInput = screen.getByPlaceholderText(/^name$/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "john@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/auth/register",
        {
          name: "John Doe",
          email: "john@example.com",
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

  it("displays error message when registration fails with server error", async () => {
    const errorMessage = "Email already exists";
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

    const nameInput = screen.getByPlaceholderText(/^name$/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "existing@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("displays generic error message when registration fails without specific error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      renderWithRouter();
    });

    const nameInput = screen.getByPlaceholderText(/^name$/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "john@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("clears error message when user submits form again", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const nameInput = screen.getByPlaceholderText(/^name$/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.type(nameInput, "John Doe");
    await userInstance.type(emailInput, "john@example.com");
    await userInstance.type(passwordInput, "password123");
    await userInstance.type(confirmInput, "differentpassword");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: "fake-jwt-token",
        user: { id: "123", name: "John Doe", email: "john@example.com" },
      },
    });

    await userInstance.clear(confirmInput);
    await userInstance.type(confirmInput, "password123");
    await userInstance.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/passwords do not match/i)
      ).not.toBeInTheDocument();
    });
  });

  it("prevents form submission when fields are empty", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await userInstance.click(submitButton);

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const emailInput = screen.getByPlaceholderText(
      /email/i
    ) as HTMLInputElement;

    await userInstance.type(emailInput, "invalidemail");

    expect(emailInput.validity.valid).toBe(false);
  });

  it("renders sign in section correctly", async () => {
    const { container } = await act(async () => {
      return renderWithRouter();
    });

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/auth");

    const paragraph = container.querySelector("p.text-center.text-gray-400");
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toContainElement(signInLink);
  });

  it("all password fields have correct type attribute", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const passwordInput = screen.getByPlaceholderText(
      /^password$/i
    ) as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText(
      /confirm password/i
    ) as HTMLInputElement;

    expect(passwordInput.type).toBe("password");
    expect(confirmInput.type).toBe("password");
  });
});
