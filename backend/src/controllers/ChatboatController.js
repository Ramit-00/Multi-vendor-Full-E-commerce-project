const ChatbotService = require("../services/ChatbotService.js");

class ChatboatController {
  async simpleChat(req, res) {
    try {
      let message = String(req.body.message || req.body.prompt || req.body.question || "Hello").trim();
      if (message.length > 1000) {
        message = message.substring(0, 1000);
      }

      const contents = [
        {
          role: "user",
          parts: [{ text: message }],
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
      let question = String(req.body.question || req.body.message || req.body.prompt || "").trim();

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      if (question.length > 1000) {
        question = question.substring(0, 1000);
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
