const createTaskTool = require("./tools/createTask");
const updateTaskTool = require("./tools/updateTask");
const createRiskTool = require("./tools/createRisk");


const toolRegistry = {
    CREATE_TASK: createTaskTool,
    UPDATE_TASK: updateTaskTool,
    CREATE_RISK: createRiskTool
};

module.exports = toolRegistry;