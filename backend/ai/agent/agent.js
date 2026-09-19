const { parseIntent } = require("./intentParser");
const toolRegistry = require("./toolRegistry");

const runAgent = async ({
    command,
    userId,
    eventId
}) => {

    // 1. Parse the user's natural language command
    const parsedIntent = await parseIntent(command);

    const {
        intent,
        parameters
    } = parsedIntent;


    // 2. Check whether the intent is supported
    const tool = toolRegistry[intent];

    if (!tool) {
        throw new Error(
            `No tool available for intent: ${intent}`
        );
    }


    // 3. Prepare parameters for the tool
    const toolParameters = {
        ...parameters,
        userId,
        eventId
    };


    // 4. Execute the tool
    const result = await tool(toolParameters);


    // 5. Return the result
    return {
        intent,
        parameters,
        result
    };
};


module.exports = {
    runAgent
};