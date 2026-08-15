class UnsupportedFileTypeError(Exception):
    """Exception raised for unsupported audio file types."""

    def __init__(self, message: str = "Unsupported file type"):
        self.message = message
        super().__init__(self.message)