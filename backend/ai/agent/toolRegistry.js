const createTaskTool = require("./tools/createTask");
const updateTaskTool = require("./tools/updateTask");
const createRiskTool = require("./tools/createRisk");
const sendNotificationTool = require("./tools/sendNotification");


const toolRegistry = {
    CREATE_TASK: createTaskTool,
    UPDATE_TASK: updateTaskTool,
    CREATE_RISK: createRiskTool,
    SEND_NOTIFICATION: sendNotificationTool
};

module.exports = toolRegistry;