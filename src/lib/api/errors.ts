export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
    public title?: string
  ) {
    super(message)
    this.name = "ApiError"
  }

  static fromResponse(error: any, status: number): ApiError {
    return new ApiError(
      error.detail || error.title || error.message || "Unknown error",
      status,
      error.detail,
      error.title
    )
  }
}
