import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { scoreSignature } from "./services/api";

vi.mock("./services/api", () => ({
  scoreSignature: vi.fn(),
}));

const mockedScoreSignature = vi.mocked(scoreSignature);
type ScoreResponse = Awaited<ReturnType<typeof scoreSignature>>;

describe("App", () => {
  beforeEach(() => {
    mockedScoreSignature.mockReset();
  });

  it("moves through upload to result state", async () => {
    let resolveScore: (value: ScoreResponse) => void = () => undefined;
    mockedScoreSignature.mockImplementation(
      () =>
        new Promise<ScoreResponse>((resolve) => {
          resolveScore = resolve;
        }),
    );

    render(<App />);
    const user = userEvent.setup();

    const input = screen.getByLabelText(/upload signature image/i);
    const file = new File(["signature"], "signature.png", { type: "image/png" });

    await user.upload(input, file);

    expect(await screen.findByText(/analyzing your signature/i)).toBeInTheDocument();

    resolveScore({
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

  it("shows validation messaging for oversized uploads", async () => {
    render(<App />);
    const user = userEvent.setup();

    const input = screen.getByLabelText(/upload signature image/i);
    const oversizedFile = new File(
      [new Uint8Array(11 * 1024 * 1024)],
      "signature.png",
      { type: "image/png" },
    );

    await user.upload(input, oversizedFile);

    expect(
      await screen.findByText(/please keep uploads under 10 mb/i),
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
