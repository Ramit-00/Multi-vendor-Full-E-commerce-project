const ChatbotService = require("../services/ChatbotService.js");

class ChatbotController {
  async simpleChat(req, res) {
    try {
      let message = String(req.body.message || req.body.prompt || req.body.question || "Hello").trim();
      if (message.length > 1000) {
        message = message.substring(0, 1000);
      }

      const sessionId = req.body.sessionId || req.headers['x-session-id'] || null;
      const userId = req.user?.id || req.body.userId || null;

      const data = await ChatbotService.chatService(message, { sessionId, userId });
      const answer = typeof data === 'object' ? data.answer : data;
      const activeSessionId = typeof data === 'object' ? data.sessionId : sessionId;

      return res.status(200).json({ answer, message: answer, sessionId: activeSessionId });
    } catch (error) {
      console.error("[ChatbotController] simpleChat error:", error);
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

      const sessionId = req.body.sessionId || req.headers['x-session-id'] || null;
      const userId = req.user?.id || req.body.userId || null;

      if (!productId || productId === "undefined" || productId === "null") {
        const data = await ChatbotService.chatService(question, { sessionId, userId });
        const answer = typeof data === 'object' ? data.answer : data;
        const activeSessionId = typeof data === 'object' ? data.sessionId : sessionId;
        return res.status(200).json({ answer, message: answer, sessionId: activeSessionId });
      }

      const data = await ChatbotService.askProductQuestion(
        productId,
        question,
        { sessionId, userId }
      );

      const answer = typeof data === 'object' ? data.answer : data;
      const activeSessionId = typeof data === 'object' ? data.sessionId : sessionId;

      return res.status(200).json({ answer, message: answer, sessionId: activeSessionId });
    } catch (error) {
      console.error("[ChatbotController] Controller Error:", error);
      return res
        .status(500)
        .json({
          message: "Something went wrong while processing the question",
          error: error.message,
        });
    }
  }
}

module.exports = new ChatbotController();
