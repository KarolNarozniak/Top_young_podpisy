import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { scoreSignature } from "./services/api";

vi.mock("./services/api", () => ({
  scoreSignature: vi.fn(),
}));

const mockedScoreSignature = vi.mocked(scoreSignature);

describe("App", () => {
  beforeEach(() => {
    mockedScoreSignature.mockReset();
  });

  it("moves through upload to result state", async () => {
    let resolveScore: ((value: { score: number; filename: string; mimeType: string }) => void) | null =
      null;
    mockedScoreSignature.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveScore = resolve;
        }),
    );

    render(<App />);
    const user = userEvent.setup();

    const input = screen.getByLabelText(/upload signature image/i);
    const file = new File(["signature"], "signature.png", { type: "image/png" });

    await user.upload(input, file);

    expect(await screen.findByText(/analyzing your signature/i)).toBeInTheDocument();

    resolveScore?.({
      score: 82,
      filename: "signature.png",
      mimeType: "image/png",
    });

    await waitFor(() => {
      expect(screen.getByText(/clear signature/i)).toBeInTheDocument();
    });

    expect(screen.getByText("82")).toBeInTheDocument();
    expect(mockedScoreSignature).toHaveBeenCalledWith(file);
  });

  it("shows validation messaging for unsupported file types", async () => {
    render(<App />);
    const user = userEvent.setup();

    const input = screen.getByLabelText(/upload signature image/i);
    const invalidFile = new File(["gif"], "signature.gif", { type: "image/gif" });

    await user.upload(input, invalidFile);

    expect(
      await screen.findByText(/please upload a png, jpg, jpeg, or webp image/i),
    ).toBeInTheDocument();
    expect(mockedScoreSignature).not.toHaveBeenCalled();
  });

  it("shows backend failures in a friendly retry state", async () => {
    mockedScoreSignature.mockRejectedValue({
      message: "Temporary scoring error.",
    });

    render(<App />);
    const user = userEvent.setup();

    const input = screen.getByLabelText(/upload signature image/i);
    const file = new File(["signature"], "signature.png", { type: "image/png" });

    await user.upload(input, file);

    expect(await screen.findByText(/temporary scoring error/i)).toBeInTheDocument();
  });
});
