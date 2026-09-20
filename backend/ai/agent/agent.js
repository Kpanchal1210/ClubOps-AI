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
        let tool = toolRegistry[intent];
        let effectiveIntent = intent;

        if (!tool) {
            tool = toolRegistry.UNKNOWN || toolRegistry.CONVERSATION;
            effectiveIntent = "CONVERSATION";
        }

        // 3. Create AgentAction
        action = await AgentAction.create({
            userId,
            eventId,
            command,
            intent: effectiveIntent,
            tool: effectiveIntent,
            parameters,
            status: "running"
        });


        // 4. Prepare tool parameters
        const toolParameters = {
            ...parameters,
            command,
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
            _id: action._id,
            actionId: action._id,
            userId: action.userId,
            eventId: action.eventId,
            command: action.command,
            intent,
            tool: intent,
            parameters,
            status: action.status,
            result,
            createdAt: action.createdAt
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