document.addEventListener("DOMContentLoaded", () => {
    const introSection = document.getElementById("intro-section");
    const chatContainer = document.getElementById("chat-container");
    const chatBox = document.getElementById("chat-box");
    const searchButton = document.getElementById("search-button");
    const sendMessageButton = document.getElementById("send-message");
    const userQueryInput = document.getElementById("user-query");
    const userMessageInput = document.getElementById("user-message");

    /**
     * Sends a query to the server and handles the response.
     * @param {string} query - The user's query or message.
     */
    const sendQueryToServer = (query) => {
        fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        })
            .then((response) => response.json())
            .then((data) => {
                const message = data.response || "No response available.";
                addMessageToChat(message, "bot");
            })
            .catch((error) => {
                console.error("Error:", error);
                addMessageToChat("Unable to process your query. Please try again.", "bot");
            });
    };

    /**
     * Adds a message to the chat box.
     * @param {string} message - The message to display.
     * @param {string} sender - The sender of the message ("user" or "bot").
     */
    const addMessageToChat = (message, sender) => {
        if (!message) return;

        const messageElement = document.createElement("div");
        messageElement.className = `message ${sender}`;
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);

        // Scroll to the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    /**
     * Processes user input and displays it in the chat, then sends it to the server.
     * @param {HTMLTextAreaElement} inputElement - The input element containing the user's query or message.
     */
    const processQuery = (inputElement) => {
        const query = inputElement.value.trim();
        if (!query) {
            alert("Please enter a query.");
            return;
        }

        // Show chat container and hide intro section
        introSection.style.display = "none";
        chatContainer.style.display = "flex";

        // Display user message and clear input
        addMessageToChat(query, "user");
        inputElement.value = "";

        // Send query to the server
        sendQueryToServer(query);
    };

    /**
     * Handles predefined quick queries.
     * @param {string} query - The predefined query.
     */
    const handleQuickQuery = (query) => {
        if (!query) return;
        userQueryInput.value = query;
        processQuery(userQueryInput);
    };
// Add this to your script.js file
function predefinedQuery(query) {
    if (!query) return;
    
    const userQueryInput = document.getElementById("user-query");
    userQueryInput.value = query;
    
    // Show chat container and hide intro section
    document.getElementById("intro-section").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";
    
    // Add user message to chat
    const chatBox = document.getElementById("chat-box");
    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.textContent = query;
    chatBox.appendChild(userMessage);
    
    // Send query to server
    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const botMessage = document.createElement("div");
        botMessage.className = "message bot";
        botMessage.textContent = data.response;
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(error => {
        console.error("Error:", error);
        const errorMessage = document.createElement("div");
        errorMessage.className = "message bot";
        errorMessage.textContent = "Sorry, there was an error processing your request.";
        chatBox.appendChild(errorMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
    
    // Clear input
    userQueryInput.value = "";
}
    /**
     * Submits user feedback.
     */
    const rateExperience = () => {
        const username = prompt("Enter your username:");
        if (!username) return;

        const rating = parseInt(prompt("Rate your experience (1-5):"), 10);
        if (!rating || rating < 1 || rating > 5) {
            alert("Please enter a valid rating between 1 and 5.");
            return;
        }

        const feedback = prompt("Any additional feedback? (Optional)");

        fetch("/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, rating, feedback: feedback || "" }),
        })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message || "Thank you for your feedback!");
            })
            .catch((error) => {
                console.error("Feedback Error:", error);
                alert("Failed to submit feedback.");
            });
    };

    /**
     * Handles the "Enter" key for submitting a query or message.
     * @param {KeyboardEvent} event - The keypress event.
     */
    const handleEnterKey = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (event.target.id === "user-query") {
                processQuery(userQueryInput);
            } else if (event.target.id === "user-message") {
                processQuery(userMessageInput);
            }
        }
    };

    // Event listeners for buttons
    searchButton.addEventListener("click", () => processQuery(userQueryInput));
    sendMessageButton.addEventListener("click", () => processQuery(userMessageInput));

    // Event listeners for the "Enter" key
    [userQueryInput, userMessageInput].forEach((input) => {
        input.addEventListener("keypress", handleEnterKey);
    });

    // Expose global functions for quick queries and rating
    window.predefinedQuery = handleQuickQuery;
    window.rateExperience = rateExperience;
});
