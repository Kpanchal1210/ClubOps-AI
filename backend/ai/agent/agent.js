const { parseIntent } = require("./intentParser");
const toolRegistry = require("./toolRegistry");
const AgentAction = require("../../models/AgentAction");

const runAgent = async ({
    command,
    userId,
    eventId
}) => {

    let action;

    try {

        // 1. Parse the command
        const parsedIntent = await parseIntent(command);

        const {
            intent,
            parameters
        } = parsedIntent;


        // 2. Find the tool
        const tool = toolRegistry[intent];

        if (!tool) {
            throw new Error(
                `No tool available for intent: ${intent}`
            );
        }


        // 3. Create AgentAction
        action = await AgentAction.create({
            userId,
            eventId,
            command,
            intent,
            tool: intent,
            parameters,
            status: "running"
        });


        // 4. Prepare tool parameters
        const toolParameters = {
            ...parameters,
            userId,
            eventId
        };


        // 5. Execute tool
        const result = await tool(toolParameters);


        // 6. Mark action as completed
        action.status = "completed";
        action.result = result;

        await action.save();


        // 7. Return result
        return {
            actionId: action._id,
            intent,
            parameters,
            result
        };

    } catch (error) {

        // If AgentAction was already created,
        // mark it as failed
        if (action) {

            action.status = "failed";

            action.result = {
                error: error.message
            };

            await action.save();
        }

        throw error;
    }
};


module.exports = {
    runAgent
};