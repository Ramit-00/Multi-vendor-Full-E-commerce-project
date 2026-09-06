const ChatbotService = require("../services/ChatbotService.js");

class ChatboatController {
  async simpleChat(req, res) {
    try {
      const message = req.body.message || req.body.prompt || req.body.question;

      const contents = [
        {
          role: "user",
          parts: [{ text: message || "Hello" }],
        },
      ];

      const data = await ChatbotService.chatService(contents);
      return res.status(200).json({ answer: data, message: data });
    } catch (error) {
      console.error("[ChatboatController] simpleChat error:", error);
      return res.status(500).json({ error: error.message, message: error.message });
    }
  }

  async askProductQuestionController(req, res) {
    try {
      const { productId } = req.params;
      const question = req.body.question || req.body.message || req.body.prompt;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      if (!productId || productId === "undefined" || productId === "null") {
        const answer = await ChatbotService.chatService(question);
        return res.status(200).json({ answer, message: answer });
      }

      const answer = await ChatbotService.askProductQuestion(
        productId,
        question
      );

      return res.status(200).json({ answer, message: answer });
    } catch (error) {
      console.error("[ChatboatController] Controller Error:", error);
      return res
        .status(500)
        .json({
          message: "Something went wrong while processing the question",
          error: error.message,
        });
    }
  }
}

module.exports = new ChatboatController();
